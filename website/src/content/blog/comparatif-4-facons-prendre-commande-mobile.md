---
title: "Comparatif : 4 façons de prendre une commande sur mobile (Excel partagé, Google Forms, app custom, app ERP-connectée)"
description: "Avant d'investir dans une app métier, passez en revue les 4 options réellement utilisées dans les PME : Excel sur OneDrive, Google Forms, développement custom, ou app mobile professionnelle. Avantages, limites, vrais coûts."
publishedAt: 2026-03-12
author: "Équipe customApps"
category: "guide"
tags: ["comparatif", "app mobile", "Excel", "Google Forms", "custom"]
---

Vous avez décidé de mobiliser votre prise de commandes. Super. Maintenant, **comment le faire concrètement** ? Dans la vraie vie des PME, on voit 4 approches. Elles n'ont pas les mêmes coûts, pas les mêmes limites, et pas les mêmes horizons. Voici les 4 options décortiquées.

## Option A : Excel partagé sur OneDrive / Google Drive

Votre commercial ouvre un fichier `commandes-du-jour.xlsx` depuis son smartphone, remplit une ligne par commande, sauvegarde. Le lendemain matin, l'assistante commerciale consolide et saisit dans l'ERP.

### Avantages

- **Gratuit** (à condition d'avoir déjà les licences Office 365 / Google Workspace)
- Mise en place immédiate : 2 heures de configuration max
- Tout le monde sait utiliser Excel

### Limites

- **Pas de validation métier** : un commercial peut saisir un prix erroné, une quantité en décimal, une référence inexistante
- **Pas de mode hors-ligne** fiable : Excel Mobile fonctionne mal en zone blanche, conflits de version fréquents
- **Double saisie persistante** : quelqu'un doit toujours retaper dans l'ERP
- **Aucun reporting** mobile, pas de vue stock
- **Sécurité RGPD fragile** : un fichier Excel avec données clients sur un smartphone perdu = fuite de données

### Coût réel

- Direct : 0 €
- Caché : le temps de l'assistante (~20 h/mois × 28 €/h = **6 720 €/an**) + les erreurs + la frustration utilisateur

**Verdict** : bonne solution **pour 1 mois**, le temps de valider le besoin. Pas au-delà.

## Option B : Google Forms + Google Sheets

Un pas au-dessus : chaque commande est un formulaire Google Forms avec validation de champs, qui remplit automatiquement une Google Sheet consolidée.

### Avantages

- Formulaires mobile-friendly, validation de base
- Consolidation auto dans Sheet
- Gratuit ou très bon marché
- Mise en place en 1 jour

### Limites

- **Impossible de faire apparaître le catalogue produit** dynamiquement (dropdown limité, pas de recherche, pas d'images)
- **Pas de contrôle de stock en direct**
- **Pas de tarification client** (impossible d'appliquer automatiquement les remises du client X)
- **Saisie lente** — chaque commande = remplir un formulaire, pas toujours pratique en rendez-vous
- **Mode hors-ligne** : inexistant côté Forms (nécessite connexion)
- **Intégration ERP** : toujours manuelle, copier-coller ou macro fragile

### Coût réel

- Direct : 0 € (compte Google Workspace existant)
- Caché : toujours le temps de ressaisie ERP + temps commercial par saisie

**Verdict** : correct pour un **processus simple** avec peu de références et pas de contraintes clients. Inadapté à l'industrie.

## Option C : développement d'une app custom

Votre DSI (ou un développeur freelance / ESN) construit sur mesure une app Android qui parle à votre ERP.

### Avantages

- **100 % adapté** à vos processus spécifiques
- Vous êtes propriétaire du code
- Intégration ERP pointue possible
- Confidentialité maximale

### Limites

- **Coût initial très élevé** : 40 à 120 K€ pour une app sérieuse (design, dev, tests, intégration)
- **Délai** : 6 à 12 mois avant la v1 en production
- **Maintenance** : 10-15 % du coût initial par an en évolutions, corrections, mises à jour Android
- **Dépendance au prestataire / dev** qui a construit l'app
- **Risque d'obsolescence** : Android 15 sort et casse votre app ? 5-10 K€ de patch
- **Features attendues "standard"** (mode hors-ligne, sync robuste, QR activation, gestion de licences) à redévelopper à la main

### Coût réel

- Année 1 : 40-120 K€
- Années suivantes : 5-15 K€/an maintenance
- **TCO 5 ans** : 65-180 K€

**Verdict** : justifié uniquement si vos processus sont **extrêmement spécifiques** et qu'aucune solution marché ne colle. Pour une PME industrielle classique, c'est **un gouffre financier**.

## Option D : app mobile professionnelle ERP-connectée (type customApps)

Une app éditée par un spécialiste, que vous configurez à vos règles métier, qui se connecte nativement à votre ERP (WaveSoft typiquement) via un service de synchronisation.

### Avantages

- **Prêt à l'emploi en 1 à 2 semaines**
- Catalogue produits, tarifs, conditions clients synchronisés automatiquement
- **Mode hors-ligne natif** et robuste (testé sur des centaines de déploiements)
- **Validation métier** complète (prix, remises, stocks, conditions)
- **Maintenance incluse** dans l'abonnement (nouvelle version Android, corrections, sécurité)
- **Écosystème d'apps adjacentes** (customSupply, customShipping, customFileSync sont compatibles avec la même licence infrastructure)
- **Coût prévisible** et amortissable

### Limites

- **Abonnement récurrent** (mais c'est le modèle SaaS standard)
- Moins customisable qu'une app 100 % sur mesure (mais ajustements de config disponibles)
- Dépendance à l'éditeur (mitigée par contrats / SLA / export de données)

### Coût réel

- Abonnement : 200-400 €/mois selon plan (cf. [tarifs customSales](/apps/custom-sales))
- Setup initial : 1-3 K€ (installation SyncService + formation)
- **TCO 5 ans** : 15-25 K€

**Verdict** : **le meilleur rapport qualité/prix/délai** pour 90 % des PME.

## Tableau de synthèse

| Critère | Excel | Google Forms | Custom | App pro (ex. customApps) |
|---|---|---|---|---|
| Temps de mise en place | 2 h | 1 j | 6-12 mois | 1-2 semaines |
| Coût année 1 | 0 € (apparent) | 0 € | 40-120 K€ | 3-6 K€ |
| Intégration ERP | Manuelle | Manuelle | Custom | Native |
| Mode hors-ligne | ❌ | ❌ | À redévelopper | ✅ natif |
| Validation métier | ❌ | Basique | Custom | ✅ complète |
| Scalabilité (20 → 50 users) | 🟡 | 🟡 | ✅ (plus de coût) | ✅ (même tarif/user) |
| Maintenance | 0 € | 0 € | 5-15 K€/an | Inclus |
| Évolutivité (nouveautés) | Manuelle | Manuelle | Cher | Auto (updates éditeur) |
| RGPD / sécurité | 🔴 | 🟡 | Dépend dev | ✅ audité |
| TCO 5 ans | ~34 K€ (cachés) | ~34 K€ (cachés) | 65-180 K€ | 15-25 K€ |

## Le vrai critère de choix : pérennité

Les options A et B semblent gratuites mais coûtent cher **sur la durée** (temps, erreurs, frustration, turnover). Elles conviennent pour **tester** un besoin, pas pour industrialiser.

L'option C est justifiée uniquement pour des cas **très atypiques**. Dans 95 % des PME, c'est surqualifié et ruineux.

L'option D (app pro ERP-connectée) offre le **meilleur rapport délai/coût/qualité** dans la vaste majorité des cas.

## Comment tester sans engagement

Chez customApps, on propose :

1. Un **diagnostic de flux gratuit** (30 min de visio) pour vérifier que l'une de nos apps correspond à votre besoin
2. Un **POC de 30 jours** gratuit sur vos propres données WaveSoft
3. Une **formule Starter** sans engagement pour démarrer petit (5 utilisateurs)

→ [Contactez-nous](/contact) pour réserver.

À lire aussi : [Par où commencer sa digitalisation terrain](/blog/pme-industrielle-par-ou-commencer-digitalisation-terrain) · [Le vrai coût du papier](/blog/vrai-cout-processus-commande-papier)
