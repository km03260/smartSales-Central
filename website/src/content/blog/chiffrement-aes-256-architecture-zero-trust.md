---
title: "Chiffrement AES-256 et architecture zero-trust : comment on sécurise vos données chez customApps"
description: "Décryptage technique de notre sécurité de bout en bout : SQLCipher local, TLS 1.3 en transit, JWT RSA signés, SyncService on-premise, et révocation instantanée d'appareil. Zéro compromis."
publishedAt: 2026-03-02
author: "Équipe customApps"
category: "sous-le-capot"
tags: ["sécurité", "chiffrement", "AES-256", "zero-trust", "JWT", "SQLCipher"]
---

Vos équipes terrain transportent, sur leurs smartphones, certaines de vos données les plus sensibles : **catalogue tarifaire, liste de clients, historique des commandes, conditions de paiement**. Si l'un de ces appareils est volé ou compromis, que se passe-t-il ?

Chez customApps, on a construit notre architecture autour d'un principe simple : **l'appareil mobile est considéré comme hostile**. Voici les 5 couches de sécurité qui en découlent, et pourquoi elles protègent réellement vos données.

## Le contexte : pourquoi le mobile est vulnérable

Un smartphone, contrairement à un serveur :

- Est **physiquement hors de votre périmètre** (dans la poche d'un commercial)
- Peut être **perdu ou volé** (~2 % par an d'appareils pros perdus, statistiques sectorielles)
- Peut être **compromis** par un malware (sideloading, apps non officielles)
- Est **partagé** parfois, volontairement ou non (enfants qui jouent avec)
- Peut être **rooté** ou "jailbreaké" par un utilisateur curieux

Une architecture qui fait confiance par défaut à l'appareil est une faille. Nous partons du principe inverse : **l'appareil est hostile jusqu'à preuve du contraire**.

## Couche 1 : chiffrement au repos (AES-256 + SQLCipher)

### Le problème résolu

Même si quelqu'un arrache la carte SD ou extrait les fichiers internes de l'app par rooting, les données doivent être **illisibles** sans la bonne clé.

### Notre implémentation

La base de données locale est une SQLite chiffrée via [SQLCipher](https://www.zetetic.net/sqlcipher/), qui applique **AES-256 en mode CBC avec HMAC-SHA512** sur tout le fichier de base.

**Caractéristiques concrètes** :

- Chaque page de la base est chiffrée indépendamment
- Clé dérivée par **PBKDF2** avec 256 000 itérations (résistance à la force brute)
- Pas de fichier journal en clair
- Performance dégradée de seulement ~5-15 % par rapport à SQLite non chiffrée (tolérable sur mobile)

### La clé : stockée comment ?

La clé principale est **dérivée du JWT de licence**, lui-même stocké dans le Keystore Android (enclave sécurisée matérielle). Concrètement :

- **Android 8+** : Keystore matériel (TEE), clé non extractible même en rooting
- **Android 12+** : StrongBox (élément sécurisé dédié sur flagships)

Sans le JWT valide + l'accès au Keystore, impossible de reconstituer la clé.

## Couche 2 : chiffrement en transit (TLS 1.3 + certificat client)

### Le problème résolu

Quand l'app envoie une commande au SyncService, cette donnée transite sur internet (4G, wifi public, parfois wifi restaurant). Il faut que **personne ne puisse la lire ni la modifier** en chemin.

### Notre implémentation

- **TLS 1.3** obligatoire (pas de fallback vers TLS 1.0/1.1)
- **Certificat serveur** validé strictement (certificate pinning côté app pour les URLs du SyncService client)
- **Certificat client** optionnel pour les déploiements hautement sécurisés : l'app présente un certificat que le SyncService vérifie — authentification mutuelle

En pratique : même sur le wifi public d'un McDonald's, vos données sont en sécurité.

## Couche 3 : authentification par JWT signé RSA-2048

### Le problème résolu

Comment l'app prouve-t-elle qu'elle est **autorisée** à interroger votre SyncService ? Et comment le SyncService peut-il vérifier ça sans appeler un serveur central à chaque requête ?

### Notre implémentation

**JWT (JSON Web Token)** signé par notre serveur central avec une clé **RSA-2048** :

- **Au moment de l'activation** (premier login, obligatoirement en ligne), l'app reçoit un JWT contenant :
  - ID de licence
  - Client autorisé
  - Features activées
  - URL du SyncService à contacter
  - Date d'expiration (généralement 30 jours)
  - Signature RSA
- **À chaque requête** depuis l'app, le JWT est envoyé en header `Authorization: Bearer ...`
- Le **SyncService local** vérifie la signature avec la clé publique (livrée avec lui)
- Si JWT valide, la requête est traitée ; sinon, rejet immédiat

**Avantage** : aucun aller-retour vers notre serveur central nécessaire pendant la vie du JWT. Le SyncService fonctionne même si notre infra est down.

### Rafraîchissement et révocation

Chaque nuit (si réseau disponible), l'app rafraîchit son JWT auprès de notre serveur central. Si la licence a été révoquée entre-temps, le JWT n'est pas renouvelé. **Au bout de 30 jours**, l'app cesse de fonctionner.

Pour les révocations urgentes (appareil volé), la révocation immédiate est effective **dès que le SyncService a été prévenu** (via webhook ou à la prochaine vérification horaire de la liste de révocation).

## Couche 4 : SyncService on-premise = moindre surface d'attaque

### Le problème résolu

Avec un cloud public, vos données métier transitent et sont stockées chez un tiers. En cas de compromission de leurs serveurs, **toutes leurs clients sont affectés simultanément** (scénarios comme SolarWinds en 2020).

### Notre implémentation

Le **SyncService** tourne **chez vous** — à côté de votre ERP WaveSoft. C'est un service Windows .NET 8 qui :

- Écoute en HTTPS sur le port 443
- Vérifie le JWT à chaque requête
- Interroge directement votre base SQL Server
- Renvoie les données demandées

**Aucune donnée métier ne quitte votre infra**. Notre cloud central ne voit que :

- Quelles licences sont actives
- Quelles URL SyncService pointent nos JWT (pour que l'app sache où taper)
- Heures de dernière activation par appareil

Si nous sommes piratés demain, **vos données clients, commandes, tarifs** restent inaccessibles chez vous. C'est l'inverse du modèle SaaS classique.

→ Plus de détails dans notre article [Architecture sync : cloud, on-premise, ou hybride ?](/blog/architecture-sync-cloud-onpremise-hybride).

## Couche 5 : révocation immédiate et gestion des appareils

### Le problème résolu

Un commercial quitte l'entreprise. Son smartphone pro a customSales installé. Comment **désactiver instantanément** son accès ?

### Notre implémentation

Dans votre dashboard admin customApps, chaque activation d'appareil est visible :

- Nom / modèle de l'appareil
- Propriétaire
- Date dernier heartbeat
- Bouton **"Révoquer"**

Un clic sur Révoquer :

1. Invalide le JWT de l'appareil côté serveur
2. Ajoute l'appareil à la liste de révocation reçue par votre SyncService
3. Au prochain heartbeat (< 2 minutes), l'app reçoit une réponse 401 et se désactive : toutes les données locales chiffrées sont purgées

En pratique : **moins de 2 minutes** entre le clic "Révoquer" et l'impossibilité d'utiliser l'app.

## Ce que nous ne faisons *pas*

Par transparence, voici ce que **nous ne prétendons pas faire** :

- **Pas de MDM** (Mobile Device Management) intégré : nous ne contrôlons pas l'appareil au niveau OS. Si vous voulez forcer un verrouillage PIN ou un wipe à distance, utilisez Intune/Knox en complément
- **Pas de DLP** (Data Loss Prevention) : un utilisateur légitime qui fait des screenshots de l'app pour exfiltrer n'est pas bloqué par notre système
- **Pas de détection de rooting** obligatoire : l'app peut tourner sur un téléphone rooté, c'est un choix explicite (option activable si vous voulez bloquer). Le chiffrement protège quand même les données.
- **Pas de blockchain / zero-knowledge** : nous utilisons de la crypto éprouvée et standard, pas de choses exotiques

La sécurité est un équilibre. Nous avons choisi **robuste, audité, prouvé** — pas *tape-à-l'œil*.

## Les certifications et audits

- **ISO 27001** : en cours (audit final 2026-Q3)
- **Pentest annuel** par un cabinet externe français
- **Audit code source** de notre SyncService par un cabinet de sécurité sur demande de grands comptes
- **Assurance cyber** : 1 M€ de couverture

Documents disponibles sur demande motivée (NDA requis).

## Comment auditer par vous-même

Si vous êtes DSI, RSSI, ou DPO, vous pouvez :

- Lire les CGU et le DPA signable ([demandez-les](/contact))
- Demander un **audit architecture** de 2h en visio avec notre CTO
- Faire faire un **pentest de la surface d'attaque** de votre propre SyncService (l'IP exposée sur votre infra) avec votre propre prestataire
- Consulter notre registre RGPD public

## Conclusion

La sécurité d'une app métier n'est pas une fonctionnalité qu'on coche. C'est **une architecture intégrée** avec :

1. Chiffrement local fort (AES-256)
2. Chiffrement en transit (TLS 1.3)
3. Authentification cryptographique (JWT RSA)
4. Surface d'attaque minimale (SyncService on-premise, vos données chez vous)
5. Révocation immédiate et auditable

Chez customApps, ce sont les 5 couches que vous obtenez par défaut. Pas de "Premium Security Add-on" facturé en plus.

[Demandez l'audit architecture](/contact) — 2h de visio avec notre équipe technique pour vérifier que tout ça correspond à vos exigences.

À lire aussi :

- [RGPD et apps métier : les garanties à exiger](/blog/rgpd-app-metier-garanties-editeur)
- [Architecture sync : cloud vs on-premise](/blog/architecture-sync-cloud-onpremise-hybride)
- [Mode hors-ligne : comment ça marche vraiment](/blog/mode-hors-ligne-comment-ca-marche)
