---
title: "Lancement de customShipping : pourquoi on l'a construit et pour qui"
description: "Après customSales, on complète la suite avec customShipping : l'app mobile pour les équipes de préparation et de livraison. Picking guidé, étiquettes, tournées GPS, émargement client. Retour sur la genèse du produit."
publishedAt: 2026-04-18
author: "Équipe customApps"
category: "produit"
tags: ["customShipping", "lancement", "livraison", "logistique"]
---

Après 3 ans à développer [customSales](/apps/custom-sales) (prise de commandes mobile) et [customSupply](/apps/custom-supply) (achats), on lance la **troisième app de la suite** : [customShipping](/apps/custom-shipping). Voici pourquoi, pour qui, et comment elle complète l'écosystème.

## Le besoin : un chaînon manquant

customSales et customSupply couvraient **le début** et **l'amont** du flux commercial. Mais entre le moment où une commande était validée et le moment où elle arrivait physiquement chez le client, il restait une grosse zone de process **encore largement papier** dans les PME :

- **Picking** en entrepôt
- **Colisage** et étiquetage
- **Tournées** de livraison
- **Émargement** client
- **Retour** des bons de livraison signés

Depuis 18 mois, chaque déploiement de customSales nous amenait à la même question : *"Vous avez quelque chose aussi pour la logistique aval ?"*. Après avoir répondu "non" trop de fois, on a cédé.

## Pour qui ?

customShipping est pensée pour les PME qui :

- Livrent en **direct** à leurs clients (pas uniquement via transporteur tiers)
- Ont entre **1 et 20 véhicules** de livraison
- Ont un **entrepôt** (même petit) avec des opérations de picking
- Utilisent **WaveSoft** pour la gestion logistique

C'est-à-dire : la majorité des PME industrielles et de négoce professionnel français. Pas les géants Amazon-like, pas les micro-entreprises qui expédient 5 colis/semaine en Mondial Relay.

## Les cas d'usage type

### Le magasinier — picking guidé

À l'impression du bon de préparation, le magasinier voit sur son smartphone/tablette :

- La liste des articles à prélever, **triés par emplacement** (optimisation du parcours)
- Scanner du code-barres à chaque prise → validation, évite les erreurs
- Photo du colis fermé pour traçabilité
- Étiquette transporteur imprimée automatiquement (si vous avez un compte Colissimo, Chronopost, DPD, TNT)

**Temps gagné** : 20 à 30 % par préparation vs process papier, avec 95 % d'erreurs de pick en moins.

### Le livreur — tournée et émargement

Le matin, le livreur démarre son camion et ouvre l'app :

- Sa **tournée du jour** avec les 8-15 arrêts du jour
- **Navigation GPS intégrée** (Waze / Google Maps) pour chaque adresse
- À chaque client : photo du point de livraison (preuve que c'est bien arrivé), **signature du client sur l'écran**, envoi immédiat du bon de livraison signé par email
- Scan de codes-barres pour valider "ce colis est bien sorti du camion chez ce client"

**Résultat** : bon de livraison signé disponible dans WaveSoft **à la minute** où la signature est prise. Facturation possible dans la foulée.

### Le dispatcher — vue d'ensemble

Le responsable logistique, depuis son PC :

- Voit la **position en temps réel** de chaque camion (si GPS activé, opt-in)
- Suit les **statuts** de chaque livraison (livré / en cours / non livré + motif)
- Peut **réattribuer** une livraison d'un camion à un autre en cas de problème
- Récupère les **statistiques** : temps moyen par livraison, taux de réussite, km parcourus

## Les choix techniques

### Offline-first comme ses sœurs

Les entrepôts métalliques et les camions sont **souvent en zone blanche**. Hors de question que l'app tombe en panne. Comme customSales, customShipping fonctionne **100 % hors-ligne** et sync quand le réseau revient (cf. [comment marche le mode hors-ligne](/blog/mode-hors-ligne-comment-ca-marche)).

### Intégration WaveSoft native

Le bon de préparation WaveSoft devient le "ticket de picking" dans l'app. La signature de livraison génère le bon de livraison WaveSoft. Pas de silo.

### Partage d'infrastructure

Vous avez déjà customSales déployé ? Alors vous avez déjà :

- Le **SyncService** sur votre serveur (pas besoin d'en installer un autre)
- Le **dashboard admin** (juste des modules supplémentaires qui apparaissent)
- La **facturation** unifiée (1 facture pour toutes les apps)

C'est l'atout de la suite : **chaque nouvelle app coûte moins cher à ajouter** car l'infra est mutualisée.

## Les intégrations partenaires

On a travaillé avec 4 transporteurs partenaires pour l'étiquetage automatique :

- **Colissimo** — pour les envois < 30 kg
- **Chronopost** — pour l'express
- **DPD** — le plus demandé par nos clients industriels
- **TNT/FedEx** — pour le B2B complexe

Si vous avez un compte chez ces transporteurs, customShipping génère les étiquettes en 1 clic, avec le numéro de tracking renvoyé automatiquement dans WaveSoft.

## Tarifs

- **Starter** : 240 €/mois (jusqu'à 5 préparateurs + livreurs) — picking + colisage basique
- **Pro** : 340 €/mois (jusqu'à 15) — + étiquettes transporteurs, tournées GPS, photos preuves
- **Enterprise** : 440 €/mois (illimités) — + suivi temps réel flotte, SLA 99.9%, support dédié

Tarifs détaillés sur la [page customShipping](/apps/custom-shipping). Réduction de 10 % si vous avez déjà customSales ou customSupply (la suite customApps est plus compétitive si vous prenez plusieurs apps).

## Déploiement type

Pour une PME ayant déjà customSales :

- **Semaine 1** : activation des licences customShipping, paramétrage transporteurs
- **Semaine 2** : formation des magasiniers et livreurs (2h × équipe)
- **Semaine 3** : POC sur 1 tournée type, ajustements
- **Semaine 4** : bascule généralisée

**Total** : environ 1 mois du go au running. Plus court que pour customSales en premier déploiement, parce que l'infra et la culture utilisateurs sont déjà en place.

## Les clients pilotes

Avant la GA (General Availability), **3 clients pilotes** ont testé customShipping pendant 6 mois :

- Un négociant de matériaux de construction en Bretagne (6 camions)
- Un distributeur industriel en Alsace (2 camions)
- Notre référence Maurer en Auvergne (1 camion, plus récent)

Leurs retours nous ont fait modifier ~30 choses avant la sortie publique. Merci !

## La suite

customShipping est sorti en **v1.0** en avril 2026. Prochaines évolutions prévues :

- **Retours clients** mobile (gérer les refus / retours pendant la tournée)
- **Paiement en cash ou CB** à la livraison (intégration SumUp comme pour customSales)
- **Mode tablette** pour les bureaux logistiques
- **Intégration Chronopost Track & Sign** pour la réconciliation automatique des preuves

## Vous êtes intéressé ?

Si vous êtes déjà client customApps, on vous contacte dans les prochaines semaines pour vous présenter. Si vous découvrez la suite, commencez par :

- Lire la [page customShipping](/apps/custom-shipping) pour le détail fonctionnel
- Programmer une [démo de 30 min](/contact) adaptée à votre contexte logistique
- Consulter l'[étude de cas Maurer](/blog/etude-cas-maurer-digitalisation-commerciaux) pour un exemple concret

## La vision customApps

On ne vise **pas** à devenir un géant SaaS généraliste. On construit une **suite cohérente**, spécialisée dans les flux terrain des PME industrielles françaises sur WaveSoft. Avec **4 apps** aujourd'hui (Sales, Supply, Shipping, FileSync), on couvre 90 % des cas d'usage mobiles métier.

La cinquième arrivera peut-être en 2027 — on écoute vos retours.

À lire aussi :

- [customShipping — détail produit](/apps/custom-shipping)
- [customSales — prise de commandes](/apps/custom-sales)
- [customSupply — gestion des achats](/apps/custom-supply)
- [customFileSync — documents techniques](/apps/custom-file-sync)
