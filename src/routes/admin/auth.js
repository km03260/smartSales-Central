import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/admin/auth/login
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password, remember } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const user = await prisma.adminUser.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    // Durée du token : 30 jours si "Se souvenir de moi" coché, 24h sinon
    const expiresIn = remember === true ? '30d' : '24h';

    const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET);
    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      role: user.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(secret);

    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
      expiresIn,
    });
  } catch (error) {
    console.error('[AUTH]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
