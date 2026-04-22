import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

const FROM = () => process.env.SMTP_FROM || 'noreply@customapps.fr';

/**
 * Envoie un email d'alerte d'expiration de licence.
 */
export async function sendExpirationAlert({ to, companyName, appName, licenseKey, expiresAt, daysLeft }) {
  const dateStr = new Date(expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  const subject = daysLeft > 0
    ? `[SmartSales] Votre licence ${appName} expire dans ${daysLeft} jours`
    : `[SmartSales] Votre licence ${appName} a expiré`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #1E40AF; padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: #FFFFFF; margin: 0; font-size: 20px;">SmartSales</h1>
      </div>
      <div style="padding: 24px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Bonjour,</p>
        ${daysLeft > 0 ? `
          <p>Nous vous informons que la licence <strong>${appName}</strong> de
          <strong>${companyName}</strong> expire le <strong>${dateStr}</strong>,
          soit dans <strong>${daysLeft} jours</strong>.</p>
          <p>Pour assurer la continuité du service, nous vous invitons à contacter
          votre administrateur pour le renouvellement de votre licence.</p>
        ` : `
          <p>Nous vous informons que la licence <strong>${appName}</strong> de
          <strong>${companyName}</strong> a expiré le <strong>${dateStr}</strong>.</p>
          <p>Votre application reste fonctionnelle mais votre licence nécessite un renouvellement.
          Contactez votre administrateur pour renouveler votre accès.</p>
        `}
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #F9FAFB;">
            <td style="padding: 8px 12px; border: 1px solid #E5E7EB; font-weight: 600;">Licence</td>
            <td style="padding: 8px 12px; border: 1px solid #E5E7EB; font-family: monospace;">${licenseKey}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #E5E7EB; font-weight: 600;">Application</td>
            <td style="padding: 8px 12px; border: 1px solid #E5E7EB;">${appName}</td>
          </tr>
          <tr style="background-color: #F9FAFB;">
            <td style="padding: 8px 12px; border: 1px solid #E5E7EB; font-weight: 600;">Entreprise</td>
            <td style="padding: 8px 12px; border: 1px solid #E5E7EB;">${companyName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #E5E7EB; font-weight: 600;">Date d'expiration</td>
            <td style="padding: 8px 12px; border: 1px solid #E5E7EB; ${daysLeft <= 7 ? 'color: #DC2626; font-weight: 600;' : ''}">${dateStr}</td>
          </tr>
        </table>
        <p style="color: #6B7280; font-size: 13px;">
          Cet email a été envoyé automatiquement. Merci de ne pas y répondre.
        </p>
      </div>
    </div>
  `;

  await getTransporter().sendMail({
    from: FROM(),
    to,
    subject,
    html,
  });

  console.log(`[EMAIL] Alert sent to ${to} — ${appName} expires in ${daysLeft} days`);
}

/**
 * Notifie les admins qu'une nouvelle demande de contact a été reçue via le site vitrine.
 */
export async function sendContactNotification({ name, email, company, phone, message, type }) {
  const to = process.env.CONTACT_NOTIFY_EMAIL;
  if (!to) {
    console.warn('[EMAIL] CONTACT_NOTIFY_EMAIL non défini — notification non envoyée');
    return;
  }

  const typeLabel = { info: 'Informations', demo: 'Démonstration', support: 'Support', other: 'Autre' }[type] || type || 'info';
  const subject = `[SmartSales] Nouvelle demande de contact — ${name}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #1E40AF; padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: #FFFFFF; margin: 0; font-size: 20px;">Nouvelle demande de contact</h1>
      </div>
      <div style="padding: 24px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Une nouvelle demande a été reçue via le site vitrine SmartSales.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #F9FAFB;">
            <td style="padding: 8px 12px; border: 1px solid #E5E7EB; font-weight: 600; width: 140px;">Type</td>
            <td style="padding: 8px 12px; border: 1px solid #E5E7EB;">${typeLabel}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #E5E7EB; font-weight: 600;">Nom</td>
            <td style="padding: 8px 12px; border: 1px solid #E5E7EB;">${name}</td>
          </tr>
          <tr style="background-color: #F9FAFB;">
            <td style="padding: 8px 12px; border: 1px solid #E5E7EB; font-weight: 600;">Email</td>
            <td style="padding: 8px 12px; border: 1px solid #E5E7EB;"><a href="mailto:${email}">${email}</a></td>
          </tr>
          ${phone ? `
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #E5E7EB; font-weight: 600;">Téléphone</td>
            <td style="padding: 8px 12px; border: 1px solid #E5E7EB;">${phone}</td>
          </tr>` : ''}
          ${company ? `
          <tr style="background-color: #F9FAFB;">
            <td style="padding: 8px 12px; border: 1px solid #E5E7EB; font-weight: 600;">Entreprise</td>
            <td style="padding: 8px 12px; border: 1px solid #E5E7EB;">${company}</td>
          </tr>` : ''}
        </table>
        <div style="background-color: #F9FAFB; padding: 16px; border-radius: 6px; margin-top: 20px;">
          <div style="font-weight: 600; margin-bottom: 8px;">Message</div>
          <div style="white-space: pre-wrap; color: #374151;">${message.replace(/</g, '&lt;')}</div>
        </div>
        <p style="color: #6B7280; font-size: 13px; margin-top: 20px;">
          Retrouvez cette demande dans le dashboard admin.
        </p>
      </div>
    </div>
  `;

  try {
    await getTransporter().sendMail({
      from: FROM(),
      to,
      replyTo: email,
      subject,
      html,
    });
    console.log(`[EMAIL] Contact notification sent to ${to} — from ${email}`);
  } catch (err) {
    console.error('[EMAIL] Contact notification failed:', err.message);
  }
}
