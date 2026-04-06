import { verifyLicenseToken } from '../services/licenseService.js';

/**
 * Middleware d'authentification licence (app mobile).
 * Vérifie le JWT licence dans le header Authorization: Bearer <token>
 */
export default async function licenseAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token licence manquant' });
  }

  const token = authHeader.slice(7);
  try {
    const payload = await verifyLicenseToken(token);
    req.license = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token licence invalide ou expiré' });
  }
}
