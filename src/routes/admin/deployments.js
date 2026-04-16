import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// ─── Champs autorisés sur SyncServiceDeployment ────────────────────────────

const DEPLOYMENT_FIELDS = [
  'name', 'publicUrl', 'localUrl', 'apiKey',
  'sqlHost', 'sqlUser', 'sqlPassword', 'trustServerCertificate',
  'kestrelUrl', 'certPath', 'certPassword',
  'ediOutputFolder', 'ediSeparator',
  'batchSize', 'timeoutSeconds', 'retryAttempts', 'histoPiece',
];

function pickDeployment(body) {
  return Object.fromEntries(
    Object.entries(body).filter(([k]) => DEPLOYMENT_FIELDS.includes(k))
  );
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

  // Map par base : on y met les overrides SQL et le Tircode par licence
  const Databases = {};
  for (const license of deployment.licenses || []) {
    if (!license.databaseName) continue;
    const cfg = license.syncConfig || {};
    const entry = {};

    // Override SQL : si sqlHost override, on reconstruit la connection string complète
    const hasSqlOverride = cfg.sqlHost || cfg.sqlUser || cfg.sqlPassword;
    if (hasSqlOverride) {
      entry.ConnectionString = buildConnectionString({
        host: cfg.sqlHost || deployment.sqlHost,
        database: license.databaseName,
        user: cfg.sqlUser || deployment.sqlUser,
        password: cfg.sqlPassword || deployment.sqlPassword,
        trust: deployment.trustServerCertificate,
      });
    }

    if (cfg.clientsDiversTircode) {
      entry.ClientsDiversTircode = cfg.clientsDiversTircode;
    }

    if (Object.keys(entry).length > 0) {
      Databases[license.databaseName] = entry;
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
            syncConfig: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!deployment) return res.status(404).json({ error: 'Déploiement non trouvé' });
    res.json(deployment);
  } catch (error) {
    console.error('[DEPLOYMENTS:GET]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/admin/deployments
 * Body: { companyId, name, publicUrl, apiKey, ... }
 */
router.post('/', async (req, res) => {
  try {
    const { companyId } = req.body;
    if (!companyId) return res.status(400).json({ error: 'companyId requis' });

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) return res.status(404).json({ error: 'Entreprise non trouvée' });

    const data = pickDeployment(req.body);
    if (!data.name || !data.publicUrl || !data.apiKey) {
      return res.status(400).json({ error: 'name, publicUrl et apiKey requis' });
    }

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
          include: { syncConfig: true },
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
