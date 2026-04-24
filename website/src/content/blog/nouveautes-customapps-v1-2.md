---
title: "Nouveautés customApps v1.2 : scan de code-barres, paiements mobiles, et refonte du catalogue"
description: "Avril 2026 : customSales passe en v1.2. Scan EAN-13 direct dans les commandes, prise de paiement CB mobile (pilot), nouvelle UX catalogue plus rapide, et 20+ améliorations issues des retours clients."
publishedAt: 2026-04-20
author: "Équipe customApps"
category: "produit"
tags: ["release", "v1.2", "scan", "paiement", "catalogue"]
---

Au programme de la **version 1.2** de customSales, publiée en avril 2026 : des fonctionnalités très attendues par la communauté et pas mal de polish sur ce qui existait déjà.

## 🆕 Scan de code-barres EAN-13 dans les commandes

Le top des demandes 2025. Vous pouvez désormais **scanner directement** le code-barres d'un article (sur un étiquette palette, un catalogue papier, un carton) au moment de créer une ligne de commande.

**Comment** : bouton appareil photo à droite du champ "Article" → le scanner s'ouvre → visée 1 seconde → l'article est ajouté.

**Formats supportés** : EAN-13, EAN-8, UPC-A, Code 128, QR (pour les références internes).

**Gain de temps observé** : 30 à 50 % sur les commandes complexes (> 10 lignes) vs saisie manuelle.

## 🆕 Prise de paiement CB mobile (pilote — clients sélectionnés)

Certains clients industriels prennent des paiements **sur place** en fin de livraison (anciens clients en compte, ventes comptant, etc.). customSales v1.2 intègre désormais une **prise de paiement CB directe** via partenaires certifiés (Stripe Terminal + SumUp Solo).

**Comment ça marche** :

1. En validation de commande, option *"Encaisser maintenant"*
2. Un terminal Bluetooth / NFC appairé (SumUp Solo, ~90 €) connecté au smartphone
3. Le client paye, le ticket est envoyé par email automatiquement
4. Le règlement est remonté **directement dans WaveSoft** lié à la commande

**Pilote en cours** : 5 clients sélectionnés testent la fonction depuis mars. GA (General Availability) prévue en juin 2026 si les retours restent bons.

**Intéressé pour rejoindre le pilote** ? [Contactez-nous](/contact).

## 🎨 Nouvelle UX catalogue

Le catalogue produit a été **entièrement repensé** suite aux retours utilisateurs :

- **Recherche instantanée** (debounced 150ms) au lieu du délai de 400ms précédent
- **Filtres multi-critères** combinables : famille × disponibilité × tarif
- **Aperçu rapide** : tap long sur un article pour voir sa fiche complète sans quitter la liste
- **Favoris commerciaux** : chaque commercial peut marquer ses articles "best-sellers" pour accès rapide
- **Dernières commandes** : bandeau en haut de la fiche article *"Vous avez vendu ce produit à ce client 3 fois en 2025"*

**Perf** : le temps de navigation moyen catalogue → article → retour est passé de 3,2 s à 1,4 s.

## ⚡ Améliorations mineures (sélection)

Sans ordre particulier, ce qui a changé :

### Commandes

- Duplication d'une commande en un clic (utile pour les clients avec abonnements / commandes récurrentes)
- Note interne par commande (visible uniquement en back-office)
- Motif d'annulation obligatoire si annulation > 48h après création
- Export PDF refactorisé : plus compact, meilleure tenue en impression A4

### Clients

- Historique filtrable par année / type de document
- Encours en temps réel avec indicateur visuel (vert / orange / rouge)
- Photo de l'enseigne visible dans la fiche (uploadable par le commercial en visite)

### Catalogue

- Image par défaut personnalisable (logo entreprise) quand l'article n'a pas de photo
- Unités alternatives affichées (ex : "au kg / à la palette" pour les matières)
- Alertes stock en cercle rouge sur les articles en rupture

### Dashboard admin

- Nouveau widget "Activité en direct" : dernières 50 actions faites dans les 24h
- Export des reportings en Excel (était CSV seulement)
- Permissions par utilisateur : rôles "Lecture seule" et "Agent support" ajoutés

### Technique

- **Performance générale** : temps de démarrage à froid -35% (2,8s → 1,8s)
- **Batterie** : consommation en usage normal -18%
- **Taille APK** : passée de 24 Mo à 19 Mo (compression images natives)
- **Reconnectivité réseau** : détection du retour en ligne plus rapide (immédiate au lieu de 2-3 secondes)

## 🐛 Bugs corrigés

Une liste non exhaustive des 30+ bugs résolus :

- Crash rare en basculant rapidement entre 2 clients avec historiques énormes
- Prix calculé faux dans 1 cas sur 10 000 avec combinaisons de remises en cascade
- Saut de focus clavier sur certains Samsung (A-series) en mode paysage
- QR code scanner qui "gelait" après lecture sur Android 15 Samsung
- Synchronisation bloquée quand un article du catalogue contenait un caractère special turc (ğ, ş)
- Notifications perdues quand l'app restait en arrière-plan > 48h

## 🔮 Prochaine version (v1.3, été 2026)

Dans la roadmap :

- **Mode tablette optimisé** (split-view catalogue + panier)
- **Intégration signature client** sur bon de livraison (trait d'union avec [customShipping](/apps/custom-shipping))
- **Suggestions IA** : *"Les clients similaires achètent aussi…"*
- **Support iOS** (premier prototype en test interne)

## Comment mettre à jour

- **Mise à jour automatique** : si votre admin a activé les updates auto dans le dashboard, vos commerciaux reçoivent la notification et mettent à jour en un tap
- **Manuel** : depuis la page Applications du [dashboard admin](https://admin.customapps.fr), récupérer le nouveau QR code v1.2 et le diffuser à votre équipe

**Attention** : la v1.2 nécessite Android 8+ (déjà le cas depuis la v1.0). Si des appareils sont en Android 7, ils resteront sur la v1.1 sans mise à jour.

## Feedback bienvenu

Ces évolutions viennent à 80 % de **vos retours** (tickets support, demandes en rendez-vous commercial, sondage trimestriel). Continuez à nous faire remonter vos idées — on les trie chaque mois avec les clients les plus actifs.

Demande / bug / suggestion → [contactez-nous](/contact).

À lire aussi :

- [customSales — page produit](/apps/custom-sales)
- [Architecture sync : comment on livre vite et bien](/blog/architecture-sync-cloud-onpremise-hybride)
