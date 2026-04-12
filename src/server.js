import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import licensesRouter from './routes/licenses.js';
import contactRouter from './routes/contact.js';
import adminAuthRouter from './routes/admin/auth.js';
import adminCompaniesRouter from './routes/admin/companies.js';
import adminLicensesRouter from './routes/admin/licenses.js';
import adminAnalyticsRouter from './routes/admin/analytics.js';
import adminAppsRouter from './routes/admin/apps.js';
import adminAuth from './middleware/adminAuth.js';
import { startCronJobs, checkExpiringLicenses } from './services/cronService.js';

const app = express();
const PORT = process.env.PORT || 3500;

// ─── Middleware global ──────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Health check ───────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'smartsales-central', timestamp: new Date().toISOString() });
});

// ─── Routes publiques (app mobile) ──────────────────────────────────────────
app.use('/api/licenses', licensesRouter);

// ─── Route publique (site vitrine) ──────────────────────────────────────────
app.use('/api/contact', contactRouter);

// ─── Routes admin (dashboard, protégées par JWT) ────────────────────────────
app.use('/api/admin/auth', adminAuthRouter);
app.use('/api/admin/companies', adminAuth, adminCompaniesRouter);
app.use('/api/admin/licenses', adminAuth, adminLicensesRouter);
app.use('/api/admin/apps', adminAuth, adminAppsRouter);
app.use('/api/admin/analytics', adminAuth, adminAnalyticsRouter);
app.use('/api/admin/contacts', adminAuth, contactRouter);

// ─── Déclenchement manuel des alertes (admin) ──────────────────────────────
app.post('/api/admin/alerts/check', adminAuth, async (req, res) => {
  try {
    await checkExpiringLicenses();
    res.json({ success: true, message: 'Vérification des alertes lancée' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la vérification' });
  }
});

// ─── Démarrage ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`SmartSales Central API running on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);

  // Démarrer les cron jobs
  startCronJobs();
});
