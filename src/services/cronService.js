import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { sendExpirationAlert } from './emailService.js';

const prisma = new PrismaClient();
const ALERT_DAYS = [45, 30, 15, 7, 0];

/**
 * Vérifie les licences qui expirent et envoie les alertes email.
 * Appelé quotidiennement par le cron.
 */
async function checkExpiringLicenses() {
  console.log('[CRON] Checking expiring licenses...');

  try {
    const licenses = await prisma.license.findMany({
      where: { isActive: true },
      include: {
        app: { select: { name: true } },
        company: { select: { name: true, contactEmail: true } },
        alerts: { select: { daysTag: true } },
      },
    });

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    let alertsSent = 0;

    for (const license of licenses) {
      const expiresAt = new Date(license.expiresAt);
      expiresAt.setHours(0, 0, 0, 0);

      const diffMs = expiresAt.getTime() - now.getTime();
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      // Vérifier chaque palier d'alerte
      for (const alertDay of ALERT_DAYS) {
        if (daysLeft > alertDay) continue; // pas encore le moment
        if (daysLeft < alertDay - 1 && alertDay > 0) continue; // déjà passé (sauf J0)

        // Pour J0, on envoie le jour même de l'expiration
        if (alertDay === 0 && daysLeft !== 0) continue;
        // Pour les autres, on envoie quand daysLeft <= alertDay
        if (alertDay > 0 && daysLeft > alertDay) continue;

        // Vérifier si l'alerte a déjà été envoyée
        const alreadySent = license.alerts.some(a => a.daysTag === alertDay);
        if (alreadySent) continue;

        const email = license.company.contactEmail;
        if (!email) continue;

        try {
          await sendExpirationAlert({
            to: email,
            companyName: license.company.name,
            appName: license.app?.name || 'SmartSales',
            licenseKey: license.licenseKey,
            expiresAt: license.expiresAt,
            daysLeft: alertDay,
          });

          // Enregistrer l'alerte envoyée
          await prisma.licenseAlert.create({
            data: {
              licenseId: license.id,
              daysTag: alertDay,
              sentTo: email,
            },
          });

          alertsSent++;
        } catch (error) {
          console.error(`[CRON] Failed to send alert for ${license.licenseKey} (J-${alertDay}):`, error.message);
        }
      }
    }

    console.log(`[CRON] Done. ${alertsSent} alert(s) sent.`);
  } catch (error) {
    console.error('[CRON] Error checking licenses:', error);
  }
}

/**
 * Démarre le cron job quotidien (tous les jours à 8h00).
 */
export function startCronJobs() {
  // Tous les jours à 8h00
  cron.schedule('0 8 * * *', () => {
    checkExpiringLicenses();
  });

  console.log('[CRON] License expiration alerts scheduled (daily at 08:00)');
}

/**
 * Exécution manuelle (pour test).
 */
export { checkExpiringLicenses };
