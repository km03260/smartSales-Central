import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import { createReadStream, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';
import { generateSelfSignedPfx } from '../../services/certificateService.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const router = Router();
const prisma = new PrismaClient();

// ─── Champs autorisés sur SyncServiceDeployment ────────────────────────────

const DEPLOYMENT_FIELDS = [
  'name', 'publicUrl', 'localUrl', 'apiKey',
  'sqlHost', 'sqlUser', 'sqlPassword', 'trustServerCertificate',
  'kestrelUrl', 'certPath', 'certPassword',
  'ediOutputFolder', 'ediSeparator',
  'batchSize', 'timeoutSeconds', 'retryAttempts', 'histoPiece',
  'mobileAdminPassword',
];

function pickDeployment(body) {
  return Object.fromEntries(
    Object.entries(body).filter(([k]) => DEPLOYMENT_FIELDS.includes(k))
  );
}

/**
 * Génère une clé API aléatoire (64 caractères hex = 256 bits d'entropie).
 */
function generateApiKey() {
  return randomBytes(32).toString('hex');
}

// ─── Construction de la connection string SQL Server ───────────────────────

function buildConnectionString({ host, database, user, password, trust }) {
  const parts = [
    `Server=${host || ''}`,
    ...(database ? [`Database=${database}`] : []),
    `User Id=${user || ''}`,
    `Password=${password || ''}`,
    `TrustServerCertificate=${trust === false ? 'False' : 'True'}`,
  ];
  return parts.join(';') + ';';
}

// ─── Génération du JSON appsettings.json pour un déploiement ──────────────

function buildAppsettings(deployment) {
  // Connexion SQL par défaut (sans Database — résolue via X-Database ou Databases:xxx)
  const defaultConn = buildConnectionString({
    host: deployment.sqlHost,
    user: deployment.sqlUser,
    password: deployment.sqlPassword,
    trust: deployment.trustServerCertificate,
  });

  // Map par base. Une entrée par base avec la ConnectionString complète.
  // Clé = nom de la base (X-Database). Si 2 bases portent le même nom dans 2
  // instances différentes, la clé composée "INSTANCE/BASE" est utilisée.
  const Databases = {};
  const seenNames = {};
  for (const license of deployment.licenses || []) {
    for (const instance of license.instances || []) {
      for (const db of instance.databases || []) {
        if (!instance.key || !db.name) continue;
        const connString = buildConnectionString({
          host: instance.sqlHost || deployment.sqlHost,
          database: db.name,
          user: instance.sqlUser || deployment.sqlUser,
          password: instance.sqlPassword || deployment.sqlPassword,
          trust: deployment.trustServerCertificate,
        });

        const entry = { ConnectionString: connString };
        if (db.clientsDiversTircode) {
          entry.ClientsDiversTircode = db.clientsDiversTircode;
        }

        if (seenNames[db.name]) {
          // Collision : 2 bases ont le même nom → utiliser la clé composée pour les deux
          // Renommer la première si elle était en clé plate
          if (Databases[db.name]) {
            const firstKey = seenNames[db.name];
            Databases[firstKey] = Databases[db.name];
            delete Databases[db.name];
          }
          Databases[`${instance.key}/${db.name}`] = entry;
        } else {
          // Pas de collision → clé plate
          seenNames[db.name] = `${instance.key}/${db.name}`;
          Databases[db.name] = entry;
        }
      }
    }
  }

  return {
    Logging: {
      LogLevel: {
        Default: 'Information',
        'Microsoft.AspNetCore': 'Warning',
      },
    },
    AllowedHosts: '*',
    ConnectionStrings: {
      WaveSoftConnection: defaultConn,
    },
    ApiKey: {
      Key: deployment.apiKey,
    },
    Kestrel: {
      Endpoints: {
        Https: {
          Url: deployment.kestrelUrl || 'https://*:443',
          Certificate: {
            Path: deployment.certPath || 'certificate.pfx',
            Password: deployment.certPassword || '',
          },
        },
      },
    },
    SyncSettings: {
      BatchSize: deployment.batchSize ?? 1000,
      TimeoutSeconds: deployment.timeoutSeconds ?? 300,
      RetryAttempts: deployment.retryAttempts ?? 3,
      HistoPiece: deployment.histoPiece ?? -1,
    },
    WaveSoft: {
      OutputFolder: deployment.ediOutputFolder || 'C:\\DATA_Wavesoft\\AutomateIE',
      Separator: deployment.ediSeparator || ';',
    },
    Databases,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Routes
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/deployments?companyId=xxx
 * Liste les déploiements (filtrables par entreprise).
 */
router.get('/', async (req, res) => {
  try {
    const { companyId } = req.query;
    const deployments = await prisma.syncServiceDeployment.findMany({
      where: companyId ? { companyId } : undefined,
      include: {
        company: { select: { id: true, name: true } },
        _count: { select: { licenses: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(deployments.map(d => ({
      ...d,
      licensesCount: d._count.licenses,
      _count: undefined,
    })));
  } catch (error) {
    console.error('[DEPLOYMENTS:LIST]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/admin/deployments/:id
 * Détail d'un déploiement avec ses licences et leurs overrides.
 */
router.get('/:id', async (req, res) => {
  try {
    const deployment = await prisma.syncServiceDeployment.findUnique({
      where: { id: req.params.id },
      include: {
        company: { select: { id: true, name: true } },
        licenses: {
          include: {
            app: { select: { code: true, name: true } },
            instances: {
              include: { databases: { orderBy: { createdAt: 'asc' } } },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!deployment) return res.status(404).json({ error: 'Déploiement non trouvé' });
    // Ne pas transporter le PFX (plusieurs Ko) dans le GET classique — le download a sa propre route
    delete deployment.certPfxBase64;
    res.json(deployment);
  } catch (error) {
    console.error('[DEPLOYMENTS:GET]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/admin/deployments
 * Body: { companyId, name, publicUrl, apiKey?, ... }
 * Si apiKey est omis/vide, une clé est générée automatiquement.
 */
router.post('/', async (req, res) => {
  try {
    const { companyId } = req.body;
    if (!companyId) return res.status(400).json({ error: 'companyId requis' });

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) return res.status(404).json({ error: 'Entreprise non trouvée' });

    const data = pickDeployment(req.body);
    if (!data.name || !data.publicUrl) {
      return res.status(400).json({ error: 'name et publicUrl requis' });
    }
    if (!data.apiKey) data.apiKey = generateApiKey();

    const deployment = await prisma.syncServiceDeployment.create({
      data: { companyId, ...data },
    });
    res.status(201).json(deployment);
  } catch (error) {
    console.error('[DEPLOYMENTS:CREATE]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/admin/deployments/:id/regenerate-api-key
 * Regénère la clé API du déploiement.
 * ⚠ Nécessite ensuite de retélécharger appsettings.json et de redémarrer le SyncService.
 */
router.post('/:id/regenerate-api-key', async (req, res) => {
  try {
    const apiKey = generateApiKey();
    const deployment = await prisma.syncServiceDeployment.update({
      where: { id: req.params.id },
      data: { apiKey },
    });
    res.json({ apiKey: deployment.apiKey });
  } catch (error) {
    console.error('[DEPLOYMENTS:REGENERATE_API_KEY]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/admin/deployments/:id/generate-certificate
 * Body: { hostnames: string[], validityYears?: number }
 * Génère un certificat auto-signé stocké en DB + met à jour certPath/certPassword.
 */
router.post('/:id/generate-certificate', async (req, res) => {
  try {
    const { hostnames, validityYears } = req.body;
    if (!Array.isArray(hostnames) || hostnames.length === 0) {
      return res.status(400).json({ error: 'hostnames (array non vide) requis' });
    }

    const cert = generateSelfSignedPfx({
      hostnames,
      validityYears: validityYears || 10,
    });

    const deployment = await prisma.syncServiceDeployment.update({
      where: { id: req.params.id },
      data: {
        certPfxBase64: cert.pfxBase64,
        certPassword: cert.password,
        certPath: 'certificate.pfx',
        certHostnames: cert.hostnames.join(','),
        certValidFrom: cert.validFrom,
        certValidUntil: cert.validUntil,
      },
      select: {
        id: true,
        certPath: true,
        certHostnames: true,
        certValidFrom: true,
        certValidUntil: true,
      },
    });

    res.json(deployment);
  } catch (error) {
    console.error('[DEPLOYMENTS:GENERATE_CERTIFICATE]', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

/**
 * GET /api/admin/deployments/:id/certificate
 * Télécharge le fichier .pfx du déploiement.
 */
router.get('/:id/certificate', async (req, res) => {
  try {
    const deployment = await prisma.syncServiceDeployment.findUnique({
      where: { id: req.params.id },
      select: { certPfxBase64: true, certPath: true },
    });
    if (!deployment) return res.status(404).json({ error: 'Déploiement non trouvé' });
    if (!deployment.certPfxBase64) {
      return res.status(404).json({ error: 'Aucun certificat généré pour ce déploiement' });
    }

    const pfxBuffer = Buffer.from(deployment.certPfxBase64, 'base64');
    const filename = deployment.certPath || 'certificate.pfx';

    res.setHeader('Content-Type', 'application/x-pkcs12');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pfxBuffer);
  } catch (error) {
    console.error('[DEPLOYMENTS:DOWNLOAD_CERTIFICATE]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * PUT /api/admin/deployments/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const data = pickDeployment(req.body);
    const deployment = await prisma.syncServiceDeployment.update({
      where: { id: req.params.id },
      data,
    });
    res.json(deployment);
  } catch (error) {
    console.error('[DEPLOYMENTS:UPDATE]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * DELETE /api/admin/deployments/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    await prisma.syncServiceDeployment.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('[DEPLOYMENTS:DELETE]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/admin/deployments/:id/appsettings
 * Génère et télécharge le fichier appsettings.json pour le SyncService.
 */
router.get('/:id/appsettings', async (req, res) => {
  try {
    const deployment = await prisma.syncServiceDeployment.findUnique({
      where: { id: req.params.id },
      include: {
        licenses: {
          include: {
            instances: { include: { databases: true } },
          },
        },
      },
    });
    if (!deployment) return res.status(404).json({ error: 'Déploiement non trouvé' });

    const appsettings = buildAppsettings(deployment);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="appsettings.json"');
    res.send(JSON.stringify(appsettings, null, 2));
  } catch (error) {
    console.error('[DEPLOYMENTS:APPSETTINGS]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/admin/deployments/:id/install-script
 */
router.get('/:id/install-script', async (req, res) => {
  try {
    const deployment = await prisma.syncServiceDeployment.findUnique({
      where: { id: req.params.id },
      include: { company: { select: { name: true } } },
    });
    if (!deployment) return res.status(404).json({ error: 'Déploiement non trouvé' });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="Install.ps1"');
    res.send(buildInstallScript(deployment));
  } catch (error) {
    console.error('[DEPLOYMENTS:INSTALL_SCRIPT]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/admin/deployments/:id/bundle
 * Génère et télécharge un ZIP complet contenant :
 *  - Les binaires du SyncService (depuis le service-bundle de l'App de la 1ère licence)
 *  - appsettings.json (généré)
 *  - certificate.pfx (si généré)
 *  - Install.ps1 (généré)
 *  - Uninstall.ps1 (généré)
 */
router.get('/:id/bundle', async (req, res) => {
  try {
    const deployment = await prisma.syncServiceDeployment.findUnique({
      where: { id: req.params.id },
      include: {
        company: { select: { name: true } },
        licenses: {
          include: {
            app: true,
            instances: { include: { databases: true } },
          },
        },
      },
    });
    if (!deployment) return res.status(404).json({ error: 'Déploiement non trouvé' });

    // Trouver le service bundle depuis la première app qui en a un
    const appWithBundle = deployment.licenses
      .map(l => l.app)
      .find(a => a?.serviceBundlePath);

    if (!appWithBundle) {
      return res.status(400).json({
        error: 'Aucun service bundle uploadé sur les applications liées à ce déploiement. ' +
          'Va dans Applications → Upload le ZIP du SyncService.',
      });
    }

    const bundlePath = join(__dirname, '../../../', appWithBundle.serviceBundlePath);
    if (!existsSync(bundlePath)) {
      return res.status(404).json({ error: 'Le fichier du service bundle est introuvable sur le serveur.' });
    }

    // Préparer le ZIP final
    const slug = deployment.name.replace(/[^a-zA-Z0-9]+/g, '_');
    const zipName = `SyncService_${slug}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);

    const archive = archiver('zip', { zlib: { level: 5 } });
    archive.on('error', (err) => { throw err; });
    archive.pipe(res);

    // Binaires du service (ZIP à extraire par l'admin dans le même dossier)
    archive.append(createReadStream(bundlePath), { name: 'service-bundle.zip' });

    // appsettings.json (généré)
    const appsettings = buildAppsettings(deployment);
    archive.append(JSON.stringify(appsettings, null, 2), { name: 'appsettings.json' });

    // certificate.pfx (si généré)
    if (deployment.certPfxBase64) {
      archive.append(Buffer.from(deployment.certPfxBase64, 'base64'), {
        name: deployment.certPath || 'certificate.pfx',
      });
    }

    // Scripts PowerShell
    archive.append(buildInstallScript(deployment), { name: 'Install.ps1' });
    archive.append(buildUninstallScript(deployment), { name: 'Uninstall.ps1' });

    // Guide d'installation
    archive.append(buildReadme(deployment), { name: 'LISEZ-MOI.txt' });

    await archive.finalize();
  } catch (error) {
    console.error('[DEPLOYMENTS:BUNDLE]', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
  }
});

// ─── Helpers pour le bundle ───────────────────────────────────────────────

function buildInstallScript(deployment) {
  const portMatch = (deployment.kestrelUrl || 'https://*:443').match(/:(\d+)/);
  const port = portMatch ? portMatch[1] : '443';
  const slug = deployment.name.replace(/[^a-zA-Z0-9]+/g, '') || 'SmartSalesSyncService';
  const serviceName = `SmartSalesSync_${slug}`;
  const displayName = `SmartSales Sync - ${deployment.company?.name || 'Client'} (${deployment.name})`;
  const certFile = deployment.certPath || 'certificate.pfx';

  return `# ============================================
# Installation SmartSales Sync Service
# ${deployment.company?.name || ''} - ${deployment.name}
# Genere le ${new Date().toLocaleDateString('fr-FR')}
# ============================================
# Executez en tant qu'Administrateur
# ============================================

$ServiceName = "${serviceName}"
$ServiceDisplayName = "${displayName}"
$ServiceDescription = "Synchronisation SmartSales Mobile <-> WaveSoft SQL Server - ${deployment.company?.name || ''}"
$BinPath = "$PSScriptRoot\\SmartSalesSyncService.exe"
$Port = ${port}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installation $ServiceDisplayName" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Privileges administrateur
$isAdmin = (New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERREUR: Executez en tant qu'Administrateur!" -ForegroundColor Red
    pause; exit 1
}

# Verifier les fichiers
Write-Host "1. Verification des fichiers..." -ForegroundColor Yellow
$missing = @()
if (-not (Test-Path $BinPath)) { $missing += "SmartSalesSyncService.exe" }
if (-not (Test-Path "$PSScriptRoot\\appsettings.json")) { $missing += "appsettings.json" }
if (-not (Test-Path "$PSScriptRoot\\${certFile}")) { $missing += "${certFile}" }
if ($missing.Count -gt 0) {
    Write-Host "ERREUR: Fichiers manquants:" -ForegroundColor Red
    $missing | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host ""
    Write-Host "Si vous avez telecharge le bundle ZIP, extrayez d'abord service-bundle.zip" -ForegroundColor Yellow
    Write-Host "dans ce meme dossier, puis relancez Install.ps1." -ForegroundColor Yellow
    pause; exit 1
}
Write-Host "   OK - Tous les fichiers presents" -ForegroundColor Green

# Service existant
Write-Host ""
Write-Host "2. Verification du service existant..." -ForegroundColor Yellow
$existing = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "   ! Le service existe deja (statut: $($existing.Status))" -ForegroundColor Yellow
    $r = Read-Host "   Reinstaller? (O/N)"
    if ($r -eq 'O' -or $r -eq 'o') {
        Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        sc.exe delete $ServiceName | Out-Null
        Start-Sleep -Seconds 2
        Write-Host "   OK - Ancien service supprime" -ForegroundColor Green
    } else { Write-Host "Annule."; pause; exit 0 }
} else {
    Write-Host "   OK - Pas de service existant" -ForegroundColor Green
}

# Creer le service
Write-Host ""
Write-Host "3. Creation du service Windows..." -ForegroundColor Yellow
try {
    New-Service -Name $ServiceName -BinaryPathName $BinPath \`
        -DisplayName $ServiceDisplayName -Description $ServiceDescription \`
        -StartupType Automatic -ErrorAction Stop
    Write-Host "   OK - Service cree" -ForegroundColor Green
} catch { Write-Host "   ERREUR: $_" -ForegroundColor Red; pause; exit 1 }

# Pare-feu
Write-Host ""
Write-Host "4. Pare-feu (port $Port)..." -ForegroundColor Yellow
$r = Read-Host "   Creer la regle? (O/N)"
if ($r -eq 'O' -or $r -eq 'o') {
    try {
        Remove-NetFirewallRule -DisplayName "SmartSales Sync ($ServiceName)" -ErrorAction SilentlyContinue
        New-NetFirewallRule -DisplayName "SmartSales Sync ($ServiceName)" \`
            -Direction Inbound -LocalPort $Port -Protocol TCP -Action Allow -ErrorAction Stop
        Write-Host "   OK" -ForegroundColor Green
    } catch { Write-Host "   ! $_ (configurez manuellement)" -ForegroundColor Yellow }
}

# Demarrer
Write-Host ""
Write-Host "5. Demarrage..." -ForegroundColor Yellow
$r = Read-Host "   Demarrer maintenant? (O/N)"
if ($r -eq 'O' -or $r -eq 'o') {
    try {
        Start-Service -Name $ServiceName -ErrorAction Stop
        Start-Sleep -Seconds 3
        $s = (Get-Service -Name $ServiceName).Status
        if ($s -eq 'Running') { Write-Host "   OK - Service demarre" -ForegroundColor Green }
        else { Write-Host "   ! Statut: $s" -ForegroundColor Yellow }
    } catch { Write-Host "   ERREUR: $_ (verifiez les logs)" -ForegroundColor Red }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installation terminee!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Commandes utiles:" -ForegroundColor White
Write-Host "  Start-Service $ServiceName" -ForegroundColor Gray
Write-Host "  Stop-Service $ServiceName" -ForegroundColor Gray
Write-Host "  Restart-Service $ServiceName" -ForegroundColor Gray
Write-Host "  Get-Content logs\\smartsales-sync-*.txt -Tail 50" -ForegroundColor Gray
Write-Host ""
pause
`;
}

function buildUninstallScript(deployment) {
  const slug = deployment.name.replace(/[^a-zA-Z0-9]+/g, '') || 'SmartSalesSyncService';
  const serviceName = `SmartSalesSync_${slug}`;
  const portMatch = (deployment.kestrelUrl || 'https://*:443').match(/:(\d+)/);
  const port = portMatch ? portMatch[1] : '443';

  return `# ============================================
# Desinstallation SmartSales Sync Service
# ${deployment.company?.name || ''} - ${deployment.name}
# ============================================
# Executez en tant qu'Administrateur
# ============================================

$ServiceName = "${serviceName}"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Desinstallation $ServiceName" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$isAdmin = (New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERREUR: Executez en tant qu'Administrateur!" -ForegroundColor Red
    pause; exit 1
}

$existing = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if (-not $existing) {
    Write-Host "Le service '$ServiceName' n'existe pas." -ForegroundColor Yellow
    pause; exit 0
}

Write-Host "Arret du service..." -ForegroundColor Yellow
Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "Suppression du service..." -ForegroundColor Yellow
sc.exe delete $ServiceName | Out-Null
Start-Sleep -Seconds 2
Write-Host "OK - Service supprime" -ForegroundColor Green

# Supprimer la regle pare-feu
Write-Host ""
$r = Read-Host "Supprimer la regle de pare-feu associee? (O/N)"
if ($r -eq 'O' -or $r -eq 'o') {
    Remove-NetFirewallRule -DisplayName "SmartSales Sync ($ServiceName)" -ErrorAction SilentlyContinue
    Write-Host "OK - Regle supprimee" -ForegroundColor Green
}

Write-Host ""
Write-Host "Desinstallation terminee." -ForegroundColor Cyan
Write-Host "Les fichiers du service n'ont pas ete supprimes." -ForegroundColor Yellow
Write-Host "Vous pouvez supprimer manuellement le dossier si necessaire." -ForegroundColor Yellow
Write-Host ""
pause
`;
}

function buildReadme(deployment) {
  const slug = deployment.name.replace(/[^a-zA-Z0-9]+/g, '') || 'SmartSalesSyncService';
  const serviceName = `SmartSalesSync_${slug}`;

  return `================================================================
  SmartSales Sync Service - Guide d'installation
  ${deployment.company?.name || ''} - ${deployment.name}
  Genere le ${new Date().toLocaleDateString('fr-FR')}
================================================================

CONTENU DU BUNDLE
-----------------
  service-bundle.zip   Binaires du service Windows (.exe + DLLs)
  appsettings.json     Configuration generee (connexions SQL, API key, etc.)
  ${deployment.certPath || 'certificate.pfx'}       Certificat SSL auto-signe
  Install.ps1          Script d'installation (PowerShell, en admin)
  Uninstall.ps1        Script de desinstallation (PowerShell, en admin)
  LISEZ-MOI.txt        Ce fichier


INSTALLATION
------------
1. Extraire ce ZIP dans un dossier definitif
   (ex: C:\\SmartSales\\SyncService)

2. Extraire le contenu de service-bundle.zip dans CE MEME dossier.
   Vous devez obtenir SmartSalesSyncService.exe + DLLs a cote de
   appsettings.json, ${deployment.certPath || 'certificate.pfx'} et Install.ps1.

3. Clic droit sur Install.ps1 → "Executer avec PowerShell"
   (ou clic droit → "Executer en tant qu'administrateur")

4. Suivre les instructions a l'ecran :
   - Le script verifie que tous les fichiers sont presents
   - Il installe le service Windows "${serviceName}"
   - Il propose de creer une regle de pare-feu
   - Il propose de demarrer le service

5. Verifier dans les logs :
   Get-Content logs\\smartsales-sync-*.txt -Tail 20


DESINSTALLATION
---------------
1. Clic droit sur Uninstall.ps1 → "Executer en tant qu'administrateur"
2. Le service est arrete puis supprime
3. Optionnel : supprimer le dossier manuellement


COMMANDES UTILES (PowerShell en admin)
--------------------------------------
  Start-Service ${serviceName}
  Stop-Service ${serviceName}
  Restart-Service ${serviceName}
  Get-Service ${serviceName}
  Get-Content logs\\smartsales-sync-*.txt -Tail 50 -Wait


MISE A JOUR DU SERVICE
----------------------
1. Arreter le service :  Stop-Service ${serviceName}
2. Remplacer les fichiers (appsettings.json, binaires si nouvelle version)
3. Redemarrer :          Start-Service ${serviceName}


MISE A JOUR DE LA CONFIGURATION
--------------------------------
Si vous modifiez les parametres dans le dashboard admin
(bases, instances SQL, certificat, etc.) :

1. Retelecharger le bundle ou juste appsettings.json
2. Remplacer le fichier dans le dossier du service
3. Redemarrer :  Restart-Service ${serviceName}


SUPPORT
-------
Consultez les logs dans le dossier logs/ en cas de probleme.
`;
}

export default router;
