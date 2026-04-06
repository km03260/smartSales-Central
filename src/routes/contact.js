import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/contact
 * Formulaire de contact depuis le site vitrine.
 * Body: { name, email, company?, phone?, message, type? }
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, company, phone, message, type } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'name, email et message requis' });
    }

    const contact = await prisma.contactRequest.create({
      data: {
        name,
        email,
        company: company || '',
        phone: phone || '',
        message,
        type: type || 'info',
      },
    });

    res.status(201).json({ success: true, id: contact.id });
  } catch (error) {
    console.error('[CONTACT]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/admin/contacts (réutilisé côté admin)
 */
router.get('/', async (req, res) => {
  try {
    const contacts = await prisma.contactRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(contacts);
  } catch (error) {
    console.error('[CONTACTS:LIST]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * PUT /api/admin/contacts/:id
 * Mettre à jour le statut d'une demande.
 */
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const contact = await prisma.contactRequest.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json(contact);
  } catch (error) {
    console.error('[CONTACTS:UPDATE]', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
