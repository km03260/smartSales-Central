---
title: "Android 14, 15, 16 : comment vos apps métier restent compatibles malgré les restrictions Google"
description: "Sideloading, permissions runtime, background restrictions, Play Integrity… chaque version Android ajoute des garde-fous qui cassent parfois les apps distribuées en APK. Comment on s'adapte chez customApps."
publishedAt: 2026-03-10
author: "Équipe customApps"
category: "sous-le-capot"
tags: ["Android", "APK", "compatibilité", "sideloading", "OS"]
---

Vous distribuez vos apps métier en **APK direct** (sans Play Store) à vos commerciaux et magasiniers. Chaque nouvelle version d'Android — 14, 15, 16 — apporte des évolutions qui peuvent **casser** ces apps ou rendre leur installation plus compliquée. Voici un état des lieux 2026 et comment customApps s'adapte.

## Pourquoi Google durcit les règles

Google ne cherche pas (officiellement) à tuer le sideloading. Mais les objectifs s'accumulent :

- **Protéger les utilisateurs** des malwares distribués hors Play Store
- **Imposer Play Protect** (scan automatique) à tous les APK installés
- **Limiter les abus** de permissions sensibles
- **Réduire la consommation batterie** (background restrictions)

Résultat : de plus en plus de garde-fous que les apps doivent **déjà anticiper** au moment du build.

## Android 14 (2024) — ce qui a déjà changé

### targetSdkVersion obligatoire

Depuis Android 14, une app avec `targetSdkVersion` < 23 (Android 6.0) **ne peut plus être installée** par défaut. Il faut passer par `adb` ou une option développeur.

**Impact sur les apps métier** : toutes les apps customApps sont compilées avec `targetSdkVersion=34` (Android 14). Aucun impact pour vous.

### Photo picker obligatoire

Pour accéder à la galerie, les apps doivent utiliser le **Photo Picker** système, pas une vieille API. Conséquence : l'accès complet au stockage externe n'est plus possible pour les nouvelles apps.

**Impact sur customSales** : on utilise déjà le Photo Picker depuis la v1. Transparent.

### Restrictions de background processes

Les services en arrière-plan doivent être **classifiés** (types : `foregroundServiceType=dataSync`, `location`, `camera`, etc.) sinon ils sont tués rapidement.

**Impact sur customApps** : notre worker de synchronisation est déclaré explicitement en `dataSync`. Sync fiable garantie.

## Android 15 (2025) — les nouveautés

### Restriction des permissions "Fichiers et médias"

L'accès au stockage partagé devient encore plus granulaire. Pour lire **tous** les fichiers, il faut `MANAGE_EXTERNAL_STORAGE` qui n'est accordé qu'à des apps justifiant un besoin clair (gestionnaires de fichiers, backup).

**Impact sur customApps** : nous ne demandons que `READ_MEDIA_IMAGES` (photos) et rien de plus. Pas d'impact.

### Limiter l'accès au presse-papier

Les apps en arrière-plan ne peuvent plus lire le presse-papier utilisateur sans notification visible. Fin des apps qui "écoutent" silencieusement.

**Impact sur customApps** : aucun, nous n'utilisons pas le presse-papier.

### Private Space

Les utilisateurs peuvent désormais créer un "espace privé" dans Android, isolé du reste. Certaines apps peuvent ne pas fonctionner correctement dedans.

**Impact** : customSales fonctionne dans un Private Space, mais nous recommandons l'installation dans le profil standard pour les apps professionnelles partagées.

## Android 16 (2026) — ce qui arrive

### Permission "Installer des packages" renforcée

La permission `REQUEST_INSTALL_PACKAGES` (celle qui permet à Chrome / Gmail de lancer l'install d'un APK téléchargé) devient **limitée dans le temps**. L'utilisateur doit ré-accorder la permission périodiquement.

**Impact pour vos utilisateurs** : la mise à jour d'une app customApps pourra demander une nouvelle confirmation "Autoriser l'installation depuis cette source" plusieurs fois par an. Pas bloquant, juste un click de plus.

### Play Integrity API généralisé

Google pousse de plus en plus l'usage de **Play Integrity**, une API qui vérifie que l'appareil n'est ni rooté ni émulé ni compromis. Certains services Google (Maps, Pay) refusent de fonctionner si Play Integrity échoue.

**Impact sur customApps** : nos apps ne dépendent pas de Play Integrity (pas d'APIs Google restreintes), donc zéro impact. Bonus : nous fonctionnons même sur des appareils non certifiés Google (certaines tablettes chinoises industrielles par exemple).

### Restrictions du sideloading par OEM

**À surveiller** : certains OEM Android (Samsung, Xiaomi, Honor) commencent à afficher des écrans d'avertissement agressifs lors du sideload d'APK. Rien de bloquant encore, mais l'UX se dégrade.

**Mitigation possible** : passer par un MDM (Intune, Knox Configure) qui signe et pousse l'APK en mode "approved" — les avertissements disparaissent.

## Ce que nous faisons chez customApps pour rester stable

### 1. Compilation avec la dernière targetSdkVersion

À chaque release Android majeure, nos apps sont recompilées avec le target SDK correspondant dans les 3 mois après sortie. Cela élimine les pénalités d'anciennes versions.

### 2. Support des versions Android N-3

Nous supportons officiellement **Android 8 à 16** (soit 8 versions majeures). Cela couvre 98 % du parc professionnel en circulation.

### 3. Tests automatisés sur émulateurs multi-versions

Chaque release passe dans notre CI/CD sur 5 émulateurs Android (8, 11, 13, 14, 15). Si un test casse sur une version spécifique, la release est bloquée.

### 4. Monitoring de rollouts graduels

Quand une mise à jour sort, elle est pushée par vagues de 10 %, 30 %, 100 %. Si des crashes sont détectés (via notre télémétrie opt-in), on rollback immédiatement.

### 5. Suivi actif des beta Android

Nous avons des devices en beta Android (DP / Release Candidates de Google) pour **anticiper** les changements qui arriveront dans 6-12 mois. Ça nous permet d'avoir un patch prêt le jour J, pas 3 mois après.

## Ce que vous pouvez faire côté IT

### Documentation utilisateur à jour

Préparer une **fiche de déploiement** par version Android, pour les cas courants :

- Comment autoriser l'installation d'APK inconnue (chemin différent selon les OEM)
- Comment répondre à "Play Protect a identifié cette app comme suspecte"
- Comment accorder les permissions (caméra, stockage, localisation)

Chez customApps, nous fournissons ces guides à jour à chaque update Android majeure.

### Préférez les tablettes "pro" quand possible

Pour les déploiements massifs (entrepôts, équipes livraison), utilisez des tablettes robustes type **Samsung Galaxy Tab Active** ou **Honeywell ScanPal** : elles sont mises à jour plus longtemps, résistent aux chocs, et permettent de forcer des profils MDM.

### Renouvelez votre parc tous les 4-5 ans

Un smartphone Android a typiquement **3-5 ans de mises à jour OS** avant que Google arrête de pousser les patches de sécurité. Au-delà, vous roulez sur un OS obsolète, vulnérable, et les apps modernes ne fonctionnent plus correctement.

**Budget à prévoir** : 150 à 400 € par appareil renouvelé, tous les 4 ans.

## Conclusion

La sophistication d'Android est à la fois une **bonne nouvelle** (plus de sécurité pour tout le monde) et un **challenge pour les éditeurs** (faut suivre le rythme). Un bon partenaire technique anticipe ces évolutions plutôt que de subir.

Chez customApps, notre engagement :

- Compatibilité garantie avec **toutes les versions Android officiellement supportées par Google**
- **Aucune régression** sur les versions existantes lors d'une release
- **Communication proactive** à chaque changement Android majeur impactant vos déploiements
- **Support technique** incluant le dépannage spécifique par version OEM

Besoin de déployer sur un parc Android hétérogène ? [Contactez-nous](/contact) : on analyse votre parc et on vous dit exactement quels appareils sont compatibles et combien de temps.

À lire aussi :

- [Installer une APK Android sans Play Store : guide complet](/blog/installer-apk-android-sans-play-store)
- [Chiffrement et sécurité de nos apps](/blog/chiffrement-aes-256-architecture-zero-trust)
