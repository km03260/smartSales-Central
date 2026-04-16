import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import { generateSelfSignedPfx } from '../../services/certificateService.js';

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

  // Map par base : une entrée par LicenseDatabase de chaque licence rattachée.
  // On met toujours le Tircode même vide (null) pour que la base apparaisse dans la section,
  // et on override la ConnectionString uniquement si une instance SQL différente est configurée.
  const Databases = {};
  for (const license of deployment.licenses || []) {
    for (const db of license.databases || []) {
      if (!db.name) continue;
      const entry = {};

      const hasSqlOverride = db.sqlHost || db.sqlUser || db.sqlPassword;
      if (hasSqlOverride) {
        entry.ConnectionString = buildConnectionString({
          host: db.sqlHost || deployment.sqlHost,
          database: db.name,
          user: db.sqlUser || deployment.sqlUser,
          password: db.sqlPassword || deployment.sqlPassword,
          trust: deployment.trustServerCertificate,
        });
      }

      if (db.clientsDiversTircode) {
        entry.ClientsDiversTircode = db.clientsDiversTircode;
      }

      if (Object.keys(entry).length > 0) {
        Databases[db.name] = entry;
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
            databases: { orderBy: { createdAt: 'asc' } },
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
          include: { databases: true },
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

export default router;
