import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateLicenseKey } from '../src/services/licenseService.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ─── Admin user ─────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.adminUser.upsert({
    where: { email: 'admin@smartsales.fr' },
    update: {},
    create: {
      email: 'admin@smartsales.fr',
      passwordHash: adminPassword,
      role: 'superadmin',
    },
  });
  console.log(`Admin user: ${admin.email}`);

  // ─── Applications ──────────────────────────────────────────────────────
  const smartSales = await prisma.app.upsert({
    where: { code: 'SS' },
    update: {},
    create: {
      code: 'SS',
      name: 'SmartSales',
      description: 'Application mobile de prise de commandes pour les commerciaux itinérants',
    },
  });
  console.log(`App: ${smartSales.name} (${smartSales.code})`);

  // ─── Maurer (premier client) ────────────────────────────────────────────
  const maurer = await prisma.company.upsert({
    where: { id: 'maurer-001' },
    update: {},
    create: {
      id: 'maurer-001',
      name: 'Maurer',
      legalName: 'SAS MAURER',
      contactEmail: 'administratif@sarlmaurer.com',
      contactPhone: '04 73 27 10 66',
      address: '301, Petite Rue de l\'Oradou, 63000 Clermont-Ferrand',
      siret: '438702664',
    },
  });
  console.log(`Company: ${maurer.legalName}`);

  // ─── Config Maurer (données de companyInfo.js) ──────────────────────────
  await prisma.companyConfig.upsert({
    where: { companyId: maurer.id },
    update: {},
    create: {
      companyId: maurer.id,
      subtitle: 'Peintures Automobiles et Industrielles',
      email: 'administratif@sarlmaurer.com',
      phone: '04 73 27 10 66',
      addressStreet: '301, Petite Rue de l\'Oradou',
      addressZipCode: '63000',
      addressCity: 'Clermont-Ferrand',
      addressCountry: 'France',
      siret: '438702664',
      tva: 'FR73438702664',
      capital: '8 000 €',
      rcs: '',
      ape: '4532Z',
      paymentTerms: 'LCR-NA à 30 jours fin de mois',
      quotationValidityDays: 30,
      tvaRate: 0.20,
      termsAndConditions: `Clauses de réserve de propriété : le vendeur conserve la propriété pleine et entière des marchandises vendues jusqu'au paiement complet du prix, en application de la loi du 12 mai 1980. Tout différend quel qu'il soit et quelles que soient les conditions de ventes, d'exécution des commandes ou les modes de paiement acceptés est de la compétence exclusive du Tribunal de Commerce du Siège Social de MAURER.\nConformément à l'article L.441-6 du code de commerce, des pénalités de retard sont dues à défaut de règlement le jour suivant la date de paiement qui figure sur la facture: une indemnité forfaitaire pour frais de recouvrement de 40 €, à laquelle il convient d'ajouter des pénalités de retard dont le taux est égal à trois fois le taux d'intérêt légal.`,
    },
  });
  console.log('Company config: Maurer branding created');

  // ─── Licence Maurer (SmartSales) ────────────────────────────────────────
  const license = await prisma.license.upsert({
    where: { licenseKey: 'SS-MAUR-INIT-0001' },
    update: {},
    create: {
      appId: smartSales.id,
      companyId: maurer.id,
      licenseKey: 'SS-MAUR-INIT-0001',
      syncServiceUrl: 'https://213.56.180.33',
      databaseName: 'TESTS_MAURER',
      apiKey: '4FJ33pN5UsvlQGqIw6xnAYKIRtCAmSBR7lewyZmPhpJRskdRk8Q70N/6zw6aWCgN',
      maxDevices: 10,
      features: ['orders', 'quotations', 'invoices', 'delivery_notes', 'stats'],
      plan: 'enterprise',
      expiresAt: new Date('2027-12-31'),
    },
  });
  console.log(`License: ${license.licenseKey} (${license.plan})`);

  console.log('\n--- Seed complete ---');
  console.log(`Admin login: admin@smartsales.fr / admin123`);
  console.log(`Maurer activation code: ${license.licenseKey}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
