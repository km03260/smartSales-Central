---
title: "Installer une application Android sans Play Store : le guide complet pour vos équipes terrain"
description: "Installation d'une APK sur Android : autoriser les sources inconnues, scanner le QR code, activer la licence. Guide étape par étape pour déployer une app métier sans passer par le Play Store."
publishedAt: 2026-04-25
author: "Équipe customApps"
category: "guide"
tags: ["Android", "APK", "installation", "déploiement", "IT"]
featured: true
---

Déployer une application métier sur les smartphones de vos équipes terrain ne passe plus forcément par le Google Play Store. Pour les **apps internes, confidentielles ou sur mesure**, l'installation via fichier APK est la solution standard. Voici comment faire, en toute sécurité.

## Pourquoi pas le Play Store ?

Publier une app sur le Play Store implique :

- **Frais annuels** (compte développeur à 25 $ l'inscription)
- **Délais de review** de quelques jours à chaque mise à jour
- **Exposition publique** : votre app métier est visible par n'importe qui
- **Obligations Google** sur la politique de confidentialité, les permissions, le RGPD

Pour une app destinée uniquement à vos commerciaux, magasiniers ou livreurs, **aucun de ces compromis n'est nécessaire**. Une distribution directe via APK est plus rapide, plus privée et totalement sécurisée — à condition de respecter quelques règles.

## Prérequis

- Un **smartphone ou tablette Android 8 ou supérieur** (API 26+)
- Environ 50 Mo d'espace libre
- Une connexion internet (uniquement pour le premier téléchargement ; l'app fonctionne ensuite hors-ligne)

## Étape 1 : Récupérer l'APK et le QR code

Depuis le **dashboard admin customApps**, rendez-vous sur la page de l'application souhaitée ([customSales](/apps/custom-sales), [customSupply](/apps/custom-supply) ou autre). En bas de la page se trouve un **QR code** généré automatiquement pour cette version.

Vos commerciaux n'ont qu'à scanner ce QR code avec leur appareil photo — le téléchargement démarre instantanément.

## Étape 2 : Autoriser l'installation depuis des sources inconnues

Android bloque par défaut l'installation d'APK qui ne viennent pas du Play Store. Au premier lancement du fichier `.apk` téléchargé, le système affichera un message du type :

> *"Pour votre sécurité, votre téléphone n'autorise pas l'installation d'applications inconnues provenant de cette source."*

Pas d'inquiétude — c'est normal. Il suffit de :

1. Toucher **"Paramètres"** dans le message
2. Activer **"Autoriser cette source"** (ou "Autoriser depuis Chrome" selon le navigateur utilisé)
3. Revenir et toucher **"Installer"**

Cette autorisation s'applique uniquement à l'application source (Chrome, Gmail…). Votre appareil reste protégé pour toutes les autres sources.

## Étape 3 : Première activation avec la clé de licence

Au premier lancement, l'app demande une **clé de licence** du type `CS-XXXX-XXXX-XXXX`. Cette clé vous est fournie par votre administrateur depuis le dashboard customApps. Un seul appareil peut être activé par "place" de licence (selon votre formule).

Dès l'activation :

- L'app télécharge le **catalogue**, les **clients**, les **tarifs**, les **conditions de paiement** depuis votre base WaveSoft
- Elle stocke tout en **local chiffré** pour fonctionner hors-ligne
- Le premier sync dure de 30 secondes à 2 minutes selon le volume de données

## Étape 4 : Mise à jour d'une version

Quand une nouvelle version est publiée, vos utilisateurs reçoivent une **notification in-app** : *"Nouvelle version v2.3.0 disponible — Voir les nouveautés"*. Un clic lance le téléchargement de l'APK à jour, puis l'installation remplace l'ancienne version en conservant toutes les données locales.

Pas besoin de réactiver la licence ni de re-synchroniser — la mise à jour est transparente.

## Sécurité : ce qu'il faut savoir

- **Signatures cryptographiques** : chaque APK customApps est signé avec une clé unique. Android vérifie cette signature à l'installation et à chaque mise à jour. Un APK altéré ne peut **pas** remplacer une installation légitime.
- **Permissions minimales** : nos apps demandent strictement les permissions nécessaires (caméra pour le scan code-barres, stockage pour le cache offline, localisation uniquement pour customShipping). Aucune remontée de données vers nos serveurs.
- **Données chiffrées** : le stockage local est protégé par AES-256. La communication avec votre SyncService passe par HTTPS avec authentification par clé API.
- **Révocation instantanée** : un appareil perdu peut être **désactivé en un clic** depuis votre dashboard admin. L'app devient inutilisable au prochain heartbeat.

## Problèmes courants et solutions

### "Impossible d'installer l'APK" / "Erreur 504"

Vérifiez que vous êtes bien sur **Android 8+** (ancienne version incompatible) et qu'il reste au moins 150 Mo de stockage libre.

### "App non autorisée par Play Protect"

Dans certains cas, Google Play Protect peut marquer une APK téléchargée comme suspecte. Sur la notification : touchez **"Installer quand même"** — c'est sécurisé tant que l'APK provient du QR code officiel customApps.

### "Réseau indisponible" au premier lancement

Le **premier sync nécessite internet**. Ensuite l'app fonctionne hors-ligne, mais pour l'activation initiale il faut une connexion (même lente) pour que le backend valide la clé de licence.

## Déploiement sur un parc de 10+ appareils

Pour équiper une équipe complète rapidement, deux approches :

1. **Déploiement supervisé** : un admin passe sur chaque appareil et fait les étapes 1-3 (15 min par appareil)
2. **Déploiement MDM** (Mobile Device Management) : si vous avez déjà un MDM type Microsoft Intune, Samsung Knox ou Google Endpoint Management, on fournit l'APK signée à uploader dans le portail MDM. L'installation se fait alors **en silence** sur tout le parc. On vous accompagne sur demande.

---

Besoin d'aide pour le premier déploiement ? [Contactez-nous](/contact), nous accompagnons gratuitement votre première installation.
