---
title: "RGPD et apps métier : ce que l'éditeur doit vous garantir (et comment le vérifier)"
description: "Cloud Act, DPA, sous-traitance, transfert hors UE, durée de conservation… le RGPD impose 12 garanties à votre éditeur d'app mobile. Voici la checklist DPO complète avec les clauses à exiger."
publishedAt: 2026-03-17
author: "Équipe customApps"
category: "sous-le-capot"
tags: ["RGPD", "DPO", "compliance", "données", "juridique"]
---

En 2026, le RGPD n'est plus une abstraction juridique — c'est un **facteur de sélection d'éditeur** que votre DSI, DPO, ou RSSI vérifie systématiquement. Un éditeur qui ne maîtrise pas ses obligations RGPD est disqualifiable d'office, particulièrement pour les PME qui traitent des données clients professionnels.

Voici **12 garanties** à exiger de votre éditeur d'app métier, avec les questions précises et les clauses contractuelles à demander.

## 1. DPA (Data Processing Agreement) signé et à jour

### Ce que c'est

Le DPA est le **contrat RGPD annexe** aux CGU/CGV qui décrit précisément la relation entre vous (responsable de traitement) et l'éditeur (sous-traitant). Il est **obligatoire** en vertu de l'article 28 du RGPD.

### La bonne pratique

Votre éditeur doit vous fournir un DPA standard **sans avoir à le demander**, consultable en amont du contrat. Il doit être adapté aux clauses types européennes publiées en 2021.

### Red flag

*"C'est dans nos CGV"* → insuffisant juridiquement. Un juge sanctionnera.

## 2. Localisation des données — UE ou pas

### Ce que c'est

Le RGPD restreint fortement les **transferts de données personnelles hors UE**, en particulier vers les USA depuis l'arrêt Schrems II (2020) et les incertitudes sur le Data Privacy Framework.

### La bonne pratique

Votre éditeur doit **nommer précisément** l'emplacement physique de vos données :

- Si on-premise (chez vous) : aucun transfert, cas le plus simple
- Si cloud : nom du fournisseur (OVH, Scaleway, Azure EU, AWS Frankfurt) + région précise + engagement de non-transfert hors UE

### Red flag

- Réponse vague type *"dans le cloud"* ou *"chez AWS"* sans précision régionale
- Serveurs aux USA : nécessite des clauses contractuelles types + audit du contrat de sous-traitance (difficile)

## 3. Protection contre le Cloud Act américain

### Ce que c'est

Le **Cloud Act** (2018) permet aux autorités US de demander à tout éditeur américain d'accéder aux données de ses clients, **même si ces données sont stockées en UE**. C'est le gros point noir des fournisseurs cloud US.

### La bonne pratique

- Éditeur 100 % européen (pas de maison mère américaine)
- Ou clauses contractuelles garantissant le refus de communication sauf décision de justice française/UE
- Ou architecture on-premise qui rend le Cloud Act inapplicable (les données ne sont pas chez l'éditeur)

### Red flag

Éditeur européen **mais racheté** par une boîte américaine (cas fréquent des startups EU acquises). Vérifiez le cap table et les clauses de groupe.

## 4. Sous-traitants ultérieurs identifiés

### Ce que c'est

Votre éditeur utilise probablement des **sous-traitants** : hébergeur, service d'email transactionnel, SMS, analytics. Chacun de ces sous-traitants a aussi accès à vos données.

Le RGPD exige que vous **connaissiez** et **approuviez** chaque sous-traitant.

### La bonne pratique

Liste exhaustive des sous-traitants fournie dans le DPA, avec :

- Nom de l'entreprise
- Pays
- Nature du traitement
- Mesures de sécurité appliquées

Et engagement de **notification préalable** (30 j) si nouveau sous-traitant ajouté.

### Red flag

Pas de liste fournie, ou liste vague type *"divers sous-traitants techniques"*.

## 5. Durée de conservation et suppression

### Ce que c'est

Les données ne peuvent être conservées **indéfiniment**. Le RGPD impose une durée liée à la finalité du traitement.

### La bonne pratique

Règles documentées et techniquement implémentées :

- Données clients actives : durée du contrat + 3 ans (pour litiges)
- Données de prospects : 3 ans max sans interaction
- Logs techniques : 1 an max
- Backup : 6 mois de conservation, suppression automatique ensuite

Et une fonction **"Export + Purge"** que vous pouvez déclencher à tout moment.

### Red flag

*"Nous gardons tout au cas où"* → violation directe.

## 6. Droits des personnes (accès, rectification, effacement, portabilité)

### Ce que c'est

Vos clients (les clients de vos clients) ont des droits sur leurs données personnelles. Vous, en tant que responsable de traitement, devez pouvoir les exercer rapidement.

### La bonne pratique

L'éditeur fournit des **outils self-service** dans le dashboard admin :

- Export d'un client spécifique en CSV/JSON (droit de portabilité)
- Suppression totale d'un client sur demande (droit à l'oubli)
- Rectification de données erronées
- Anonymisation (pour les stats gardées sans lien nominatif)

### Red flag

Impossible d'exporter ou supprimer un seul client : l'éditeur exporte tout ou rien. Non conforme.

## 7. Journal des accès aux données

### Ce que c'est

En cas de contrôle CNIL ou d'incident, vous devez pouvoir **prouver qui a accédé à quoi et quand**.

### La bonne pratique

Audit trail complet :

- Connexions admin (date, IP, user)
- Modifications des données (avant/après)
- Exports massifs
- Suppressions

Conservation : 1 an minimum. Export à la demande.

### Red flag

Pas d'audit trail disponible, ou uniquement les 30 derniers jours.

## 8. Chiffrement et mesures de sécurité

### Ce que c'est

Le RGPD n'impose pas explicitement le chiffrement, mais il demande **des mesures de sécurité adaptées au risque**. En pratique, pour des données clients, le chiffrement est quasi obligatoire.

### La bonne pratique

- **En transit** : TLS 1.3
- **Au repos** : AES-256 (ou équivalent)
- **Clés** : HSM ou enclave sécurisée, rotation régulière
- **Authentification** : MFA obligatoire pour les admins

→ Détail complet : [Chiffrement AES-256 chez customApps](/blog/chiffrement-aes-256-architecture-zero-trust)

### Red flag

*"C'est chiffré"* sans détails, ou TLS 1.0/1.1 accepté.

## 9. Notification en cas de fuite

### Ce que c'est

Si l'éditeur subit une **fuite de données**, il doit vous notifier **dans les 24h** (engagement standard des DPAs). Vous avez ensuite 72h pour notifier la CNIL, le cas échéant.

### La bonne pratique

Clause DPA explicite avec :

- Canal de notification (email DPO + téléphone)
- Contenu minimum de la notification (nature, volume, impact potentiel, mesures prises)
- Coopération pour l'enquête

### Red flag

Pas de clause, ou délai flou type *"dans les meilleurs délais"*.

## 10. Assurance cyber

### Ce que c'est

En cas d'incident grave, les pénalités CNIL peuvent atteindre **4 % du CA annuel** ou 20 M€. Un éditeur qui subit une fuite peut se retrouver incapable de vous indemniser.

### La bonne pratique

Attestation d'assurance cyber :

- Montant couvert (1 M€ minimum pour un éditeur sérieux)
- Périmètre (responsabilité vis-à-vis des clients, frais de notification, coûts de remédiation)
- Assureur réputé (Hiscox, AXA, Generali…)

### Red flag

Pas d'assurance, ou assurance "responsabilité civile pro" standard (ne couvre pas les cyber-risques).

## 11. Audit et certifications

### Ce que c'est

Les certifications (ISO 27001, SOC 2, HDS) sont des **preuves externes** que l'éditeur applique réellement ses promesses de sécurité.

### La bonne pratique

- **ISO 27001** idéalement (certification industrielle la plus reconnue)
- Pentest annuel par cabinet externe
- Rapports d'audit consultables sous NDA

### Red flag

Pas de certification ni d'audit externe. Acceptable pour un éditeur en phase de démarrage, mais doit être sur la roadmap.

## 12. Réversibilité et portabilité

### Ce que c'est

Si vous arrêtez le contrat, vous devez pouvoir **récupérer vos données** dans un format exploitable ailleurs, et avoir la garantie que l'éditeur les **supprime bien** de ses systèmes.

### La bonne pratique

Clause de réversibilité :

- Export complet de vos données en format ouvert (CSV, JSON, XML)
- Délai max de mise à disposition (7-30 j)
- Attestation de suppression sous 90 j
- Aucun frais de sortie caché

### Red flag

Frais de migration explicites, format propriétaire, ou flou sur la suppression post-contrat.

## La checklist pratique

Pour chaque éditeur en shortlist :

1. [ ] DPA standard fourni avant signature
2. [ ] Données localisées UE (précisé)
3. [ ] Pas d'exposition Cloud Act
4. [ ] Liste des sous-traitants fournie
5. [ ] Durées de conservation documentées
6. [ ] Fonctions self-service pour les droits utilisateurs
7. [ ] Audit trail disponible 1 an+
8. [ ] TLS 1.3 + AES-256 au minimum
9. [ ] Notification incidents < 24h garantie
10. [ ] Assurance cyber minimum 1 M€
11. [ ] ISO 27001 ou équivalent (ou roadmap claire)
12. [ ] Réversibilité sans frais cachés

**0 mauvais point** → éditeur solide.
**1-2 mauvais points** → négociable si petits sujets.
**3+ mauvais points** → passez votre chemin.

## Et customApps ?

Réponse à la checklist :

1. ✅ DPA signable disponible sur demande
2. ✅ Données **chez vous** (architecture SyncService), métadonnées OVH France
3. ✅ Éditeur 100 % français, Cloud Act inapplicable
4. ✅ 4 sous-traitants, liste fournie
5. ✅ Durées documentées (3 ans max post-contrat)
6. ✅ Export + suppression self-service
7. ✅ Audit trail 1 an
8. ✅ AES-256 SQLCipher + TLS 1.3 + JWT RSA-2048
9. ✅ Clause 24h écrite
10. ✅ Assurance Hiscox 1 M€
11. 🟡 ISO 27001 en cours (certification 2026-Q3)
12. ✅ Export CSV/JSON sans frais, attestation suppression sous 90 j

Documents disponibles [sur demande](/contact). On envoie le pack RGPD complet en 48h pour votre DPO.

À lire aussi :

- [Chiffrement AES-256 et architecture zero-trust](/blog/chiffrement-aes-256-architecture-zero-trust)
- [Architecture de sync : cloud vs on-premise](/blog/architecture-sync-cloud-onpremise-hybride)
- [Checklist des 12 questions à poser à un éditeur](/blog/checklist-12-questions-editeur-app-metier)
