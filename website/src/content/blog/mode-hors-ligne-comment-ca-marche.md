---
title: "Mode hors-ligne : comment ça marche vraiment ? (SQLite, sync différé, résolution de conflits)"
description: "Comment une app mobile peut fonctionner sans réseau puis se resynchroniser automatiquement ? Décryptage technique du mode offline-first : stockage local, bundle de sync, gestion des conflits."
publishedAt: 2026-03-19
author: "Équipe customApps"
category: "sous-le-capot"
tags: ["hors-ligne", "offline-first", "SQLite", "sync", "architecture"]
---

*"L'app fonctionne hors-ligne."* C'est la promesse de tous les éditeurs. Mais **qu'est-ce qui se passe techniquement** quand votre commercial est en zone blanche, crée 3 commandes, puis se re-connecte 2 heures plus tard ? Comment l'app évite-t-elle les doublons ? Les conflits ? La perte de données ? Voici le décryptage.

## "Offline-first" : une architecture, pas une option

Dans une app mal conçue, le hors-ligne est un **patch** : l'app fonctionne normalement en ligne, et quand elle perd le réseau, elle tombe en mode dégradé ou plante. C'est le modèle des apps web mobiles.

Une vraie app **offline-first** inverse le paradigme : elle **fonctionne toujours hors-ligne par défaut**. Le réseau n'est qu'un canal de synchronisation en arrière-plan. L'utilisateur ne voit jamais de "chargement" ni d'erreur réseau pendant qu'il travaille.

C'est l'architecture que nous avons adoptée pour [customSales](/apps/custom-sales) et les autres apps de la suite.

## Composant 1 : la base locale SQLite

Chaque appareil contient une **réplique partielle** de votre base ERP, stockée dans une base SQLite chiffrée sur l'appareil.

Contenu typique pour une app commerciale :

- **Catalogue produits** (5 000 à 50 000 références, ~20 Mo)
- **Clients** du secteur de ce commercial (50 à 500 clients, ~5 Mo)
- **Tarifs et conditions** spécifiques à ces clients (~10 Mo)
- **Historique** des commandes récentes (~5 Mo)
- **Commandes nouvellement créées** en attente de sync (~200 Ko)

Total : **~40 Mo** d'espace disque. Négligeable sur un smartphone moderne (128-512 Go).

**Pourquoi SQLite ?** Parce que c'est :

- **Embarqué** dans Android (pas de serveur à installer)
- **Transactionnel** (ACID) — critique pour éviter les corruptions
- **Rapide** (lectures en microsecondes, écritures en millisecondes)
- **Universel** (mêmes API sur Android, iOS, desktop) — facilite les évolutions futures

## Composant 2 : le chiffrement local

Stocker des données clients et tarifs sur un smartphone, c'est stocker des **données sensibles**. En cas de vol, on ne veut pas que le voleur puisse lire le catalogue, les clients ou l'historique commercial.

Solution : **chiffrement AES-256 au repos** de la base SQLite entière via [SQLCipher](https://www.zetetic.net/sqlcipher/). La clé de chiffrement est dérivée du token de licence JWT, lui-même stocké dans l'enclave sécurisée Android.

**Concrètement** : un voleur qui arrache la carte SD ou qui root le téléphone trouve uniquement **des octets aléatoires**. Sans la clé, impossible de déchiffrer.

→ Plus de détails dans notre article [Chiffrement AES-256 et architecture zero-trust](/blog/chiffrement-aes-256-architecture-zero-trust).

## Composant 3 : la file d'attente de synchronisation

Quand le commercial crée une commande hors-ligne, celle-ci est :

1. **Insérée dans SQLite** avec un UUID local (`local_id`) et un timestamp
2. **Ajoutée à une file d'attente** `pending_sync` avec un statut `pending`
3. L'utilisateur voit sa commande immédiatement dans l'app — **tout fonctionne comme en ligne**

Dès qu'une connexion est détectée (évent Android `ConnectivityManager`), un worker en arrière-plan :

1. Récupère les commandes `pending_sync`
2. Les envoie **une par une** au SyncService via HTTPS
3. Reçoit l'ID serveur de chaque commande
4. Met à jour la ligne locale : `local_id` → `server_id`, statut → `synced`
5. Supprime l'entrée de la file

Si une commande échoue (erreur réseau, validation serveur), elle reste en `pending` et sera retentée au prochain cycle (toutes les 2 minutes quand réseau disponible).

## Composant 4 : la synchronisation descendante (serveur → mobile)

À l'inverse, les **données modifiées dans WaveSoft** (nouveau client ajouté, prix mis à jour, commande annulée par un autre canal) doivent redescendre sur le mobile.

Mécanisme "pull" :

1. Chaque table du serveur a une colonne `updated_at` (timestamp)
2. L'app garde en mémoire le `last_sync_at` de chaque table
3. Toutes les 5 minutes (ou sur demande), l'app demande : *"Qu'est-ce qui a changé dans la table `articles` depuis `last_sync_at` ?"*
4. Le serveur renvoie un delta (typiquement 10-500 lignes, ~50 Ko)
5. L'app applique ces changements dans SQLite

**Volumes** : un sync typique fait passer 20-200 Ko par cycle. Sur un forfait mobile 4G, ça ne consomme quasi rien (~10 Mo/mois).

## Composant 5 : gestion des conflits

C'est la partie la plus délicate. Exemple :

- **9h** : Pierre (commercial terrain, hors-ligne) modifie la commande #123 : passe de 10 à 15 unités
- **10h** : Julie (bureau, en ligne dans l'ERP) modifie la même commande : passe de 10 à 8 unités
- **11h** : Pierre retrouve le réseau et son app essaie de sync sa modif

Qu'est-ce qui se passe ? Trois stratégies possibles :

### A. Last write wins (naïve)

La dernière modification reçue par le serveur écrase. ⚠️ Perte silencieuse de données, dangereux.

### B. Server wins (défensive)

Si le serveur a une version plus récente que celle que le mobile avait lue, la modif mobile est **rejetée**. L'app télécharge la nouvelle version serveur et avertit l'utilisateur : *"Cette commande a été modifiée entre-temps par Julie — rafraîchir ?"*

### C. Merge manuel assisté

Le serveur détecte le conflit et renvoie les 2 versions. L'app propose à l'utilisateur de choisir ou de merger. ⚠️ Complexe à implémenter proprement.

**Notre choix** : une variante de **B (server wins) avec notification**. Au retour du réseau :

1. Le mobile envoie : "Je veux passer la commande #123 de `version=5` à `version=6` avec `quantité=15`"
2. Le serveur vérifie : la version actuelle est `7` (Julie a modifié) — **conflit détecté**
3. Le serveur renvoie l'erreur `409 Conflict` + la nouvelle version complète
4. L'app affiche à Pierre : *"Julie a modifié cette commande pendant que vous étiez hors-ligne. Elle est passée à 8 unités. Voulez-vous appliquer votre modification (15) malgré tout ?"*
5. Pierre décide en connaissance de cause

Ce pattern évite **100 % des pertes silencieuses** sans bloquer l'utilisateur.

## Composant 6 : l'authentification offline

Pendant qu'il est hors-ligne, comment l'app sait-elle que le commercial est **toujours autorisé** à utiliser l'application ? La licence n'est peut-être plus valide.

Solution : **JWT signé RSA, avec expiration**.

1. Au moment de l'activation (première connexion, obligatoirement en ligne), l'app reçoit un JWT signé par le serveur de licences
2. Ce JWT contient : ID licence, date d'expiration, features autorisées, URL du SyncService client
3. L'app stocke ce JWT et le renvoie dans chaque requête vers le SyncService
4. Tant que le JWT n'est pas expiré, l'app fonctionne **même sans pouvoir contacter le serveur central**
5. Chaque nuit, si le réseau est disponible, l'app rafraîchit son JWT

En cas de révocation (commercial qui part, licence non renouvelée), le JWT actuel reste valide jusqu'à expiration, mais ne sera pas renouvelé. Protection en profondeur.

## Limites du hors-ligne : ce qui ne marche pas sans réseau

- **Activation initiale** : le premier login nécessite internet (récupération du JWT et du bundle initial)
- **Synchronisation temps réel** : tant qu'aucun réseau, les commandes prises par Pierre ne sont pas visibles par Julie au bureau. C'est le prix de la disponibilité.
- **Vérification de stock à l'instant T** : si Pierre vend 10 unités hors-ligne à 14h pendant que Julie en vend 10 à 14h02, vous risquez une rupture non détectée. L'app peut afficher un avertissement *"Stock vu à 8h ce matin"* pour calibrer l'attente.
- **Modification de l'architecture** (nouveaux champs, nouvelles features) : déploiement d'une nouvelle version nécessite parfois un resync complet, à planifier.

## Conclusion

Un bon hors-ligne n'est **pas** une fonctionnalité ajoutée — c'est **une architecture complète** avec :

- Une base locale SQLite chiffrée
- Des files d'attente de sync montante et descendante
- Une stratégie de résolution de conflits claire
- Une authentification JWT offline-capable

Chez customApps, tout ça tourne chez des dizaines de clients depuis plusieurs années. Nos commerciaux en zones industrielles isolées (sous-sol d'usine, zones rurales, entrepôts métalliques) travaillent parfois **plusieurs jours sans réseau** — et tout est synchronisé impeccablement à leur retour en zone couverte.

Envie de voir ça en action ? [Demandez une démo](/contact) et on vous montrera concrètement le comportement en coupant le wifi en live.

À lire aussi :

- [Architecture de sync : cloud, on-premise, ou hybride ?](/blog/architecture-sync-cloud-onpremise-hybride)
- [Chiffrement et sécurité de nos apps](/blog/chiffrement-aes-256-architecture-zero-trust)
