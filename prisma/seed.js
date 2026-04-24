import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── Contenu des 4 apps de la suite customApps ──────────────────────────────

const APPS = [
  {
    code: 'CS',
    slug: 'custom-sales',
    name: 'customSales',
    description: "Donnez à vos commerciaux le pouvoir de prendre commandes, devis et paiements directement chez le client — même sans réseau.",
    tagline: "La force de vente mobile qui ne s'arrête jamais",
    longDescription:
      "customSales équipe vos équipes itinérantes d'un outil mobile pensé pour le terrain. Vos commerciaux consultent le catalogue produits avec photos et tarifs personnalisés, créent commandes et devis en quelques taps, génèrent un PDF et l'envoient par email en un geste. Toutes les données — clients, articles, prix, historique, encours, conditions de paiement — sont synchronisées en temps réel avec votre ERP WaveSoft. En zone blanche, l'application continue de fonctionner hors-ligne et rattrape la synchronisation dès le retour du réseau. Résultat : plus de double saisie au bureau, plus d'erreurs de tarification, plus de délais avant la livraison.",
    color: 'blue',
    iconSvgPath:
      'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
    order: 1,
    features: [
      { title: 'Catalogue produits', description: "Consultez votre catalogue complet avec photos, prix et disponibilités. Recherche instantanée et filtres par famille.", iconSvgPath: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
      { title: 'Commandes & devis', description: 'Créez commandes et devis en quelques taps. Historique client, tarifs spéciaux et conditions automatiques.', iconSvgPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
      { title: 'Mode hors-ligne', description: 'Travaillez sans connexion internet. Données stockées localement et synchronisées automatiquement.', iconSvgPath: 'M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829' },
      { title: 'Synchronisation ERP', description: 'Connecté directement à votre ERP WaveSoft. Clients, articles, prix et commandes en temps réel.', iconSvgPath: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
      { title: 'PDF & emails', description: 'Générez devis et bons de commande en PDF directement depuis l\'app. Envoyez-les par email en un tap.', iconSvgPath: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
      { title: 'Multi-utilisateurs', description: 'Chaque commercial a son espace, ses clients et ses secteurs. Gestion fine des droits et visibilité.', iconSvgPath: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    ],
    pricingPlans: [
      { name: 'Starter', price: '200 €', period: '/mois', features: ['Jusqu\'à 5 commerciaux', 'Prise de commandes & devis', 'Catalogue produits', 'Mode hors-ligne', 'Support email'], isFeatured: false, ctaLabel: 'Demander une démo', order: 1 },
      { name: 'Pro',     price: '290 €', period: '/mois', features: ['Jusqu\'à 15 commerciaux', 'Toutes les fonctionnalités Starter', 'Factures & bons de livraison', 'Gestion multi-secteurs', 'Support prioritaire'], isFeatured: true, ctaLabel: 'Demander une démo', order: 2 },
      { name: 'Enterprise', price: '380 €', period: '/mois', features: ['Commerciaux illimités', 'Toutes les fonctionnalités Pro', 'Multi-bases WaveSoft', 'SLA 99.9 %', 'Support dédié 24/7'], isFeatured: false, ctaLabel: 'Nous contacter', order: 3 },
    ],
  },
  {
    code: 'SP',
    slug: 'custom-supply',
    name: 'customSupply',
    description: "Digitalisez vos approvisionnements de bout en bout : demandes d'achat, commandes fournisseurs, réceptions scannées — directement depuis le mobile de vos équipes.",
    tagline: 'Achetez mieux, suivez chaque commande',
    longDescription:
      "customSupply transforme votre chaîne d'approvisionnement en un flux fluide et traçable. Les chefs d'équipe saisissent leurs demandes d'achat depuis le mobile, qui partent en validation selon votre workflow et vos seuils. Les acheteurs génèrent les commandes fournisseurs, suivent les accusés de réception et sont alertés des retards. À la réception, le magasinier scanne les codes-barres des colis, pointe les quantités réelles et signale immédiatement les écarts prix ou les manquants. Toutes les données reviennent dans WaveSoft sans ressaisie, avec l'historique fournisseur, les délais moyens et les statistiques de qualité. Visibilité totale, décisions plus rapides, moins de stock mort.",
    color: 'emerald',
    iconSvgPath:
      'M20 7l-8-4-8 4m16 0v10l-8 4m0 0l-8-4V7m8 4v10',
    order: 2,
    features: [
      { title: 'Demandes d\'achat', description: 'Saisie mobile des besoins par les opérationnels, workflow de validation configurable par montant.', iconSvgPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
      { title: 'Commandes fournisseurs', description: 'Générez, envoyez et suivez vos bons de commande. Relances automatiques des retards.', iconSvgPath: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0' },
      { title: 'Réceptions scan', description: 'Scanner les codes-barres à la réception, contrôler les quantités et signaler les écarts.', iconSvgPath: 'M4 4h4v4H4V4zm0 12h4v4H4v-4zM12 4h4v4h-4V4zm0 12h4v4h-4v-4zM20 4h0v4h0V4zm0 12h0v4h0v-4zM8 4v0m0 8h0m8-8h0m0 8v0' },
      { title: 'Catalogue fournisseurs', description: 'Tarifs, délais, minimums de commande et conditions par fournisseur, accessible hors-ligne.', iconSvgPath: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
      { title: 'Alertes de stock', description: 'Notifications sur les ruptures imminentes et les écarts prix à la réception.', iconSvgPath: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
      { title: 'Sync ERP WaveSoft', description: 'Articles, fournisseurs, commandes et stocks synchronisés en temps réel avec WaveSoft.', iconSvgPath: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
    ],
    pricingPlans: [
      { name: 'Starter', price: '220 €', period: '/mois', features: ['Jusqu\'à 5 utilisateurs', 'Demandes d\'achat', 'Commandes fournisseurs', 'Support email'], isFeatured: false, ctaLabel: 'Demander une démo', order: 1 },
      { name: 'Pro',     price: '320 €', period: '/mois', features: ['Jusqu\'à 15 utilisateurs', 'Toutes les fonctionnalités Starter', 'Réceptions scan code-barres', 'Workflow de validation', 'Support prioritaire'], isFeatured: true, ctaLabel: 'Demander une démo', order: 2 },
      { name: 'Enterprise', price: '420 €', period: '/mois', features: ['Utilisateurs illimités', 'Toutes les fonctionnalités Pro', 'Multi-entrepôts', 'SLA 99.9 %', 'Support dédié 24/7'], isFeatured: false, ctaLabel: 'Nous contacter', order: 3 },
    ],
  },
  {
    code: 'SH',
    slug: 'custom-shipping',
    name: 'customShipping',
    description: "Accompagnez vos équipes de la préparation à l'émargement client : picking guidé, étiquettes transporteurs, tournées GPS, signature sur tablette.",
    tagline: 'Chaque colis, chaque livraison, parfaitement orchestrés',
    longDescription:
      "customShipping pilote tout le processus expédition depuis un seul écran mobile. En entrepôt, le préparateur suit un parcours de picking optimisé, scanne les articles et ferme les colis — étiquettes transporteurs et bons de livraison générés automatiquement. Sur la route, les livreurs suivent leur tournée du jour avec navigation GPS intégrée, photographient le point de livraison, recueillent la signature du client sur la tablette et envoient instantanément la preuve de livraison par email. Le back-office voit la position des véhicules, le statut de chaque colis et déclenche les facturations automatiquement. Fini les bordereaux papier, les ressaisies au retour, les réclamations sans preuve.",
    color: 'orange',
    iconSvgPath:
      'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
    order: 3,
    features: [
      { title: 'Picking guidé', description: 'Parcours de prélèvement optimisé dans l\'entrepôt avec scan des emplacements et articles.', iconSvgPath: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
      { title: 'Colisage & étiquettes', description: 'Générez des étiquettes transporteurs et colis, dimensions et poids calculés automatiquement.', iconSvgPath: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
      { title: 'Tournées optimisées', description: 'Planification des tournées avec ordre de livraison et navigation GPS intégrée.', iconSvgPath: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
      { title: 'Émargement client', description: 'Signature électronique du client sur l\'écran, photo preuve de livraison, envoi automatique par email.', iconSvgPath: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
      { title: 'Suivi temps réel', description: 'Position des livreurs et statut des colis visibles en direct depuis le back-office.', iconSvgPath: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z' },
      { title: 'Sync ERP WaveSoft', description: 'Bons de préparation, bons de livraison et factures synchronisés avec WaveSoft.', iconSvgPath: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
    ],
    pricingPlans: [
      { name: 'Starter', price: '240 €', period: '/mois', features: ['Jusqu\'à 5 préparateurs', 'Picking guidé', 'Colisage basique', 'Support email'], isFeatured: false, ctaLabel: 'Demander une démo', order: 1 },
      { name: 'Pro',     price: '340 €', period: '/mois', features: ['Jusqu\'à 15 utilisateurs', 'Toutes les fonctionnalités Starter', 'Étiquettes transporteurs', 'Tournées & navigation GPS', 'Support prioritaire'], isFeatured: true, ctaLabel: 'Demander une démo', order: 2 },
      { name: 'Enterprise', price: '440 €', period: '/mois', features: ['Utilisateurs illimités', 'Toutes les fonctionnalités Pro', 'Suivi tournées temps réel', 'SLA 99.9 %', 'Support dédié 24/7'], isFeatured: false, ctaLabel: 'Nous contacter', order: 3 },
    ],
  },
  {
    code: 'FS',
    slug: 'custom-file-sync',
    name: 'customFileSync',
    description: "Synchronisez fiches techniques, certificats, catalogues PDF et documents contractuels entre votre ERP et chaque appareil mobile — chiffrement bout-en-bout.",
    tagline: 'Vos documents techniques, toujours à portée de main',
    longDescription:
      "customFileSync est le pont sécurisé entre vos documents métier et les équipes qui en ont besoin sur le terrain. Dès qu'un fichier est modifié dans votre ERP ou votre GED, il est automatiquement poussé vers les appareils autorisés — fiches techniques pour les commerciaux, procédures qualité pour les installateurs, contrats pour les négociateurs. Chiffrement AES-256 en transit et au repos, clés hébergées sur vos serveurs, versioning complet avec audit des accès, et mode hors-ligne garanti pour consulter sans réseau. Révocation instantanée d'un appareil perdu, droits fins par dossier et par groupe. Vos documents sensibles ne quittent jamais votre environnement, mais suivent vos équipes partout.",
    color: 'violet',
    iconSvgPath:
      'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
    order: 4,
    features: [
      { title: 'Sync automatique', description: 'Les fichiers de votre ERP sont poussés automatiquement sur les appareils connectés, à chaque modification.', iconSvgPath: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
      { title: 'Chiffrement E2E', description: 'Transit et stockage en AES-256. Les clés restent sur vos serveurs, jamais exposées au cloud.', iconSvgPath: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
      { title: 'Versioning', description: 'Historique complet des versions, restauration en un clic, audit des consultations et téléchargements.', iconSvgPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
      { title: 'Mode hors-ligne', description: 'Les fichiers critiques sont cachés localement pour consultation sans réseau, même sur le terrain.', iconSvgPath: 'M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829' },
      { title: 'Gestion des droits', description: 'Droits fins par dossier, groupe et appareil. Révocation instantanée en cas de perte d\'un appareil.', iconSvgPath: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
      { title: 'Intégration WaveSoft', description: 'Connecteur prêt à l\'emploi pour lire et écrire dans les dossiers de documents WaveSoft.', iconSvgPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    ],
    pricingPlans: [
      { name: 'Starter', price: '150 €', period: '/mois', features: ['Jusqu\'à 20 Go de stockage', 'Jusqu\'à 10 appareils', 'Sync automatique', 'Support email'], isFeatured: false, ctaLabel: 'Demander une démo', order: 1 },
      { name: 'Pro',     price: '250 €', period: '/mois', features: ['Jusqu\'à 100 Go', 'Appareils illimités', 'Versioning & audit', 'Gestion fine des droits', 'Support prioritaire'], isFeatured: true, ctaLabel: 'Demander une démo', order: 2 },
      { name: 'Enterprise', price: 'Sur devis', period: '', features: ['Stockage illimité', 'Chiffrement E2E personnalisé', 'Hébergement dédié', 'SLA 99.9 %', 'Support dédié 24/7'], isFeatured: false, ctaLabel: 'Nous contacter', order: 3 },
    ],
  },
];

async function seedApp(appData) {
  const { features, pricingPlans, ...appFields } = appData;

  // Upsert de l'App principale (par code — garde l'id existant pour SS)
  const app = await prisma.app.upsert({
    where: { code: appFields.code },
    update: {
      slug: appFields.slug,
      name: appFields.name,
      description: appFields.description,
      tagline: appFields.tagline,
      longDescription: appFields.longDescription,
      color: appFields.color,
      iconSvgPath: appFields.iconSvgPath,
      order: appFields.order,
    },
    create: appFields,
  });

  // Remplacer entièrement features et plans (source de vérité = seed)
  await prisma.appFeature.deleteMany({ where: { appId: app.id } });
  await prisma.appPricingPlan.deleteMany({ where: { appId: app.id } });

  for (let i = 0; i < features.length; i++) {
    await prisma.appFeature.create({
      data: { ...features[i], appId: app.id, order: i + 1 },
    });
  }
  for (const plan of pricingPlans) {
    await prisma.appPricingPlan.create({
      data: { ...plan, appId: app.id },
    });
  }

  console.log(`App: ${app.name} (${app.code}) — ${features.length} features, ${pricingPlans.length} plans`);
  return app;
}

async function main() {
  console.log('Seeding database...');

  // ─── Admin user ─────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.adminUser.upsert({
    where: { email: 'admin@customapps.fr' },
    update: {},
    create: {
      email: 'admin@customapps.fr',
      passwordHash: adminPassword,
      role: 'superadmin',
    },
  });
  console.log(`Admin user: ${admin.email}`);

  // ─── Applications (suite customApps) ────────────────────────────────────
  for (const appData of APPS) {
    await seedApp(appData);
  }

  console.log('\n--- Seed complete ---');
  console.log(`Admin login: admin@customapps.fr / admin123`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
