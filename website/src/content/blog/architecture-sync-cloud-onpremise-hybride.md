---
title: "Choisir son architecture de sync : cloud public, SyncService on-premise, ou hybride ?"
description: "Comment faire communiquer une app mobile et votre ERP sur vos serveurs ? Trois architectures possibles, leurs avantages, leurs risques et le choix qu'on a fait chez customApps."
publishedAt: 2026-03-26
author: "Équipe customApps"
category: "sous-le-capot"
tags: ["architecture", "synchronisation", "on-premise", "cloud", "sécurité"]
---

Vous voulez équiper vos commerciaux d'une app mobile. Mais comment cette app parle-t-elle à votre ERP, qui tourne sur un serveur Windows chez vous (ou en hébergé maîtrisé) ? Trois architectures coexistent sur le marché. Chacune a ses avantages, ses coûts, et ses risques juridiques. Décortiquons.

## Architecture A : tout cloud public (SaaS intégral)

**Principe** : vos données migrent de votre ERP on-premise vers le cloud de l'éditeur. L'app mobile tape directement dans ce cloud.

```
[Smartphone] → HTTPS → [Cloud éditeur (AWS/Azure/GCP)] ← → [ERP cloud-hosté ou connecteur]
```

### Quand c'est le cas

C'est le modèle de Salesforce, HubSpot, Monday, et la plupart des solutions américaines. Typique quand l'ERP lui-même est en SaaS (Sage Cloud, par exemple).

### Avantages

- **Zero setup côté client** : vous payez, ça marche
- **Mises à jour automatiques** de l'éditeur
- **Scalabilité infinie** (le cloud du SaaS encaisse la charge)
- **Accessible de partout** sans VPN

### Risques

- **Souveraineté des données** : vos données clients et commandes sont chez un tiers, souvent hors UE. Problème RGPD récurrent (cf. [RGPD et apps métier](/blog/rgpd-app-metier-garanties-editeur))
- **Dépendance forte** à l'éditeur : sa fin de vie = votre fin de service
- **Coût croissant** avec le nombre d'utilisateurs et la volumétrie
- **Intégration ERP** : nécessite soit un ERP cloud natif, soit un connecteur ERP ↔ cloud qui devient un single point of failure
- **Latence** : chaque consultation catalogue en clientèle = aller-retour cloud = parfois 2-5 secondes par requête

**Conclusion** : confortable pour l'éditeur, contraignant pour le client PME qui a son ERP historique on-premise.

## Architecture B : SyncService on-premise (ce qu'on a choisi)

**Principe** : un petit service tourne chez vous (à côté de votre ERP), et fait le pont entre les apps mobiles et votre base ERP. L'éditeur ne stocke jamais vos données métier.

```
[Smartphone] → HTTPS (cert client) → [SyncService chez VOUS] ← SQL → [ERP WaveSoft chez VOUS]
                                                ↑
                                                └─ JWT de licence vérifié localement
```

### Quand c'est le cas

C'est le modèle de customApps, ainsi que de quelques éditeurs français spécialisés dans les PME industrielles (Divalto, Cegid dans certains setups).

### Avantages

- **Vos données ne quittent jamais votre infrastructure**. L'éditeur ne voit que les métadonnées de licence (qui est connecté, depuis quand, activations/désactivations)
- **Performances** : le SyncService est physiquement à côté de l'ERP, latence SQL en millisecondes
- **Compatibilité totale avec votre ERP** existant (WaveSoft SQL Server direct)
- **Indépendance** : si l'éditeur disparaît, votre SyncService continue de tourner tant qu'il n'y a pas de changement de licence
- **Pas de limites de débit imposées** par un tiers
- **RGPD et compliance** : votre DPO valide en 10 minutes, vous restez responsable de traitement
- **Coût prévisible** : pas d'explosion liée à la volumétrie

### Limites

- **Setup initial** : installation du SyncService (service Windows .NET), ~1-2h d'intervention
- **Accès internet entrant** nécessaire (ou VPN) : le smartphone du commercial doit pouvoir joindre le SyncService. En pratique : exposer sur port 443 via HTTPS avec certificat est standard
- **Maintenance** : mises à jour du SyncService à installer (mais simplifiées via package signé)
- **Haute disponibilité** à votre charge : si votre serveur tombe, l'app passe en mode hors-ligne (pas si grave) jusqu'au retour

### Le schéma concret de customApps

Côté customApps central (chez nous) :
- **Gestion des licences** (émission JWT, révocation, billing)
- **Catalogue des apps** (APK, QR codes, notes de version)
- **Dashboard admin** pour que vous gériez vos activations

Côté SyncService (chez vous) :
- **Pont SQL ↔ API mobile** pour toutes les données métier
- **Génération des fichiers EDI** pour AutomateIE WaveSoft
- **Authentification JWT** (vérification offline de la signature)

Aucune donnée métier ne transite par nos serveurs. Point.

## Architecture C : hybride (cloud + sync descendante)

**Principe** : une base dans le cloud maintient un "cache distribué" du catalogue. Les données métier restent chez vous, mais une projection en lecture seule est poussée dans le cloud pour accélérer les consultations.

```
[Smartphone] → HTTPS → [Cloud catalogue (lecture)]
               ↘
                → [SyncService chez VOUS] → [ERP WaveSoft] (écritures)
```

### Quand c'est le cas

Modèle de certaines offres mid-market (Infor, SAP Business One Mobile avec variantes).

### Avantages / Inconvénients

- ✅ Performances consultation meilleures que B pour des populations dispersées
- ❌ Réplication partielle vers le cloud = données sensibles du catalogue produits exposées
- ❌ Complexité d'architecture × 2 (deux chemins de données)
- ❌ Bugs de cohérence possibles entre les deux canaux

**Conclusion** : compromis qui cumule les contraintes des deux modèles sans en gagner vraiment les avantages, sauf cas très spécifiques (grandes distributions géographiques).

## Comparatif rapide

| Critère | A — Full cloud | B — SyncService on-prem | C — Hybride |
|---|---|---|---|
| Souveraineté des données | 🔴 Chez l'éditeur | ✅ Chez vous | 🟡 Mixte |
| RGPD / compliance | 🟡 Dépend de l'éditeur | ✅ Facile | 🟡 Complexe |
| Setup initial | ✅ Zéro | 🟡 1-2 h | 🟠 2 jours |
| Performance en clientèle | 🟡 Moyenne | ✅ Excellente | ✅ Excellente |
| Maintenance infra client | ✅ Rien | 🟡 Mises à jour SyncService | 🟠 Mises à jour × 2 |
| Scalabilité (100+ users) | ✅ Infinie | ✅ Jusqu'à serveur saturé | ✅ |
| Résilience panne éditeur | 🔴 Service stoppé | ✅ Continue à fonctionner | 🟡 Partiel |
| Coût prévisible | 🟡 Selon usage | ✅ Abonnement fixe | 🟠 Variable |
| Intégration ERP PME (WaveSoft) | 🟠 Complexe | ✅ Native | 🟡 |

## Notre recommandation

Pour une **PME industrielle française** de 10 à 500 salariés qui utilise un ERP **on-premise** (WaveSoft, Sage 100, EBP en local), **l'architecture B — SyncService on-premise est de loin la meilleure**.

- Vos données restent chez vous
- Compatible avec votre conformité RGPD sans effort
- Performances optimales
- Coût prévisible
- Pas de dépendance critique à l'éditeur

C'est pourquoi nous avons investi dans cette architecture pour customApps. Le service est un simple .NET 8 packagé en service Windows, installé via un assistant (Install.ps1) en quelques minutes.

## Si votre ERP est déjà en cloud

Si vous utilisez Sage Cloud, Odoo Online, ou un ERP 100 % SaaS, alors un SyncService on-premise n'a pas de sens — vous n'avez pas de "chez vous" à synchroniser. Dans ce cas, l'architecture A est inévitable. Assurez-vous de choisir un éditeur qui **héberge en UE** et fournit un engagement contractuel clair sur le traitement des données.

## Questions à poser à tout éditeur

Avant de signer, posez ces questions. Les réponses révèlent tout :

1. **Où sont physiquement stockées les données métier de mes clients et commandes ?**
2. **Vos serveurs sont-ils en UE, hors UE, ou chez moi ?**
3. **Quelles garanties avez-vous contre le Cloud Act américain ?**
4. **Si je résilie mon contrat demain, combien de temps pour récupérer mes données, sous quel format ?**
5. **Comment l'app fonctionne-t-elle quand le commercial est hors-ligne pendant 4 heures ?**
6. **Puis-je auditer votre code côté serveur / SyncService ?**

Chez customApps, on répond sans ambiguïté aux 6. [Contactez-nous](/contact) pour en parler sur votre propre environnement.

À lire aussi :

- [Mode hors-ligne : comment ça marche vraiment](/blog/mode-hors-ligne-comment-ca-marche)
- [RGPD et apps métier : les garanties à exiger](/blog/rgpd-app-metier-garanties-editeur)
