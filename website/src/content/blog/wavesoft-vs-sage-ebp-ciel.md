---
title: "WaveSoft vs Sage, EBP, Ciel : quel ERP pour mobiliser ses équipes terrain ?"
description: "Comparatif des 4 ERP les plus utilisés dans les PME industrielles françaises sous l'angle mobilité : ouverture API, compatibilité mobile, coût total, écosystème partenaires."
publishedAt: 2026-03-05
author: "Équipe customApps"
category: "guide"
tags: ["WaveSoft", "Sage", "EBP", "Ciel", "ERP", "comparatif"]
---

Vous dirigez une PME et vous êtes à un moment charnière : faut-il garder votre ERP actuel, en changer, ou l'étendre avec des apps mobiles ? Pour répondre, il faut comparer les 4 ERP les plus utilisés dans les PME industrielles françaises **sous l'angle de la mobilité**, pas seulement des fonctions comptables.

*Note de transparence : customApps est éditeur d'apps mobiles compatibles WaveSoft. Ce comparatif est factuel sur les autres ERP, mais notre expérience pratique est la plus profonde côté WaveSoft.*

## Les 4 ERP en lice

| ERP | Éditeur | Positionnement | Part de marché PME FR |
|---|---|---|---|
| **WaveSoft** | WaveSoft SAS | PME industrielles, négoce | ~15 % |
| **Sage 100** | Sage Group | PME multi-secteurs, leader historique | ~30 % |
| **EBP Gestion Commerciale** | EBP | TPE et petites PME | ~20 % |
| **Ciel** | Sage (racheté) | Micro-entreprises, TPE | ~15 % |

## Critère 1 : ouverture de l'API pour le mobile

**La question clé** : peut-on lire et écrire dans la base depuis une app tierce ?

### WaveSoft

Accès SQL Server direct (base SQL Server standard). Lecture/écriture programmatique possible via **ADO.NET, ODBC, ou tout outil compatible SQL**. C'est **l'ERP le plus ouvert** du panel — ce qui explique sa popularité auprès des éditeurs d'apps métier et des intégrateurs.

**Verdict** : ✅ Excellent. C'est ce qui rend possible les apps customApps.

### Sage 100

API Objets Métiers (COM), moderne avec Sage Data Link ou l'API REST (payant, licence séparée). **Syntaxe fermée**, documentation inégale, nécessite parfois un partenaire certifié Sage.

**Verdict** : 🟡 Possible mais coûteux. Ajoutez 3-8 K€ de licences API + temps intégrateur.

### EBP

**API limitée** en version standard. EBP propose EBPi (connecteur web) en option payante, mais les cas d'usage restent contraints.

**Verdict** : 🟡 Possible en théorie, compliqué en pratique.

### Ciel

Base de données propriétaire (anciennement Jet/Access, aujourd'hui SQL Server Express). **Peu ou pas d'API officielle**. Les lectures de base se font à l'arrache.

**Verdict** : 🔴 À éviter si ambition mobile.

## Critère 2 : écosystème d'apps mobiles existantes

| ERP | Apps mobiles natives éditeur | Apps tierces compatibles |
|---|---|---|
| WaveSoft | 1 app (basique, focus prise de commandes) | **10+ éditeurs** (dont customApps) |
| Sage 100 | Sage Mobile (limitée à la saisie de notes) | ~5 éditeurs (souvent orientés grands comptes) |
| EBP | EBP Mobile (basique) | 1-2 éditeurs |
| Ciel | Aucune app mobile officielle | Quasi aucun |

**À retenir** : l'écosystème WaveSoft est le plus **dynamique côté mobilité PME**. Sage 100 a un écosystème large mais majoritairement grand compte.

## Critère 3 : coût total de possession (TCO) année 1, 10 commerciaux mobiles

Scénario : PME 30 salariés, 10 commerciaux itinérants, installation greenfield.

### WaveSoft + app mobile tierce (ex. customSales)

- Licence WaveSoft ERP : ~4 500 €/an (2 postes fixes, 10 users mobiles en lecture)
- App mobile customSales Pro : 290 €/mois × 12 = **3 480 €/an**
- Mise en place + formation : 3 K€ one-shot
- **Total année 1 : ~11 K€**

### Sage 100 + API REST + app mobile tierce

- Licence Sage 100 : ~8 000 €/an (plus cher de base)
- Module API REST : +2 000 €/an
- App mobile tierce : 3-5 K€/an
- Intégrateur Sage : 4-6 K€ (obligatoire pour API)
- **Total année 1 : ~19-24 K€**

### EBP + développement custom

- Licence EBP : ~3 000 €/an
- Développement d'un connecteur mobile (pas de solution off-the-shelf robuste) : 15-25 K€ one-shot
- App à développer ou adapter : complexe
- **Total année 1 : ~20-30 K€**

### Ciel — non recommandé pour mobilité

- Si vous avez Ciel, la migration vers WaveSoft ou Sage est généralement la meilleure voie. Rester sur Ciel avec une ambition mobile = impasse.

## Critère 4 : fonctionnalités métier spécifiques

| Fonction | WaveSoft | Sage 100 | EBP | Ciel |
|---|---|---|---|---|
| Gestion production industrielle | ✅ robuste | ✅ robuste | 🟡 limité | ❌ |
| Multi-dépôts / multi-sociétés | ✅ | ✅ | 🟡 | ❌ |
| Tarifs particuliers, grilles | ✅ très complet | ✅ | ✅ | 🟡 |
| EDI | ✅ AutomateIE intégré | ✅ via module | 🟡 limité | ❌ |
| Compta analytique avancée | ✅ | ✅ | 🟡 | ❌ |
| Gestion des lots/traçabilité | ✅ | ✅ | 🟡 | ❌ |

Pour une PME **industrielle** ou en **négoce professionnel**, WaveSoft et Sage 100 sont les deux seuls vrais choix. EBP suffit pour un négoce simple, Ciel pour l'ultra-TPE.

## Critère 5 : coût de migration si vous êtes déjà installé

**Quitter WaveSoft** : complexe mais possible (base SQL Server exportable). Comptez 15-40 K€ selon volumétrie.

**Quitter Sage 100** : relativement facile via export XML natif. 10-25 K€.

**Quitter EBP** : les outils d'export sont limités. 15-30 K€ + perte partielle d'historique.

**Quitter Ciel** : très compliqué, données semi-propriétaires, perte d'historique quasi garantie.

**Conclusion** : plus tôt vous sortez de Ciel ou EBP pour une solution mobilisable, moins la migration coûte cher.

## Notre avis (biaisé mais argumenté)

Pour une PME industrielle ou de négoce professionnel **qui veut mobiliser ses équipes terrain** :

- **WaveSoft** reste le meilleur rapport **ouverture / coût** en 2026. C'est pour ça que nous avons construit customApps autour de WaveSoft.
- **Sage 100** convient pour les structures plus grosses (50+ salariés) avec budget API
- **EBP** reste viable si vous restez sur du desktop uniquement
- **Ciel** : planifiez une migration — la mobilité sera impossible

## Si vous êtes en WaveSoft

Bonne nouvelle, vous êtes **au bon endroit**. Nos 4 apps s'y connectent directement :

- [customSales](/apps/custom-sales) — commerciaux itinérants
- [customSupply](/apps/custom-supply) — achats et réceptions
- [customShipping](/apps/custom-shipping) — préparation et livraison
- [customFileSync](/apps/custom-file-sync) — documents techniques

[Contactez-nous](/contact) pour un POC gratuit.

## Si vous êtes ailleurs

Si vous êtes sur Sage 100, EBP, ou Ciel et voulez mobiliser — écrivez-nous quand même. On étudie au cas par cas, et on peut parfois faire du custom sur Sage 100. Pour Ciel, on recommandera probablement une migration préalable vers WaveSoft ou Sage.

---

À lire aussi : [Par où commencer sa digitalisation terrain ?](/blog/pme-industrielle-par-ou-commencer-digitalisation-terrain)
