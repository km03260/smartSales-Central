---
title: "Checklist avant de signer : les 12 questions à poser à votre éditeur d'app métier"
description: "RGPD, sortie, sécurité, maintenance, SLA… avant de signer un contrat d'app mobile d'entreprise, posez ces 12 questions précises. Les bonnes réponses révèlent un éditeur fiable. Les mauvaises, un piège."
publishedAt: 2026-04-16
author: "Équipe customApps"
category: "guide"
tags: ["checklist", "achat", "contrat", "éditeur", "vendor"]
---

Vous êtes sur le point de signer avec un éditeur pour votre app mobile métier. Les démos sont bonnes, les tarifs acceptables. **Avant de parapher**, posez ces 12 questions précises. Elles protègent votre PME et révèlent la vraie qualité de votre futur fournisseur.

Pour chaque question, on indique **la bonne réponse** attendue.

## Contractuel et sortie

### 1. "Que se passe-t-il si je résilie mon contrat ? Combien de temps pour récupérer toutes mes données ?"

**Bonne réponse** : *"Vous récupérez vos données sous format ouvert (CSV, Excel, JSON) dans un délai inférieur à 30 jours, sans frais supplémentaires. L'export est disponible en self-service dans votre espace admin à tout moment."*

**Mauvaise réponse** : *"Ça se fait sur devis"* ou *"Nous n'avons pas encore de procédure documentée"*.

→ Un éditeur qui ne sait pas répondre ne s'attend pas à ce que vous partiez. Mauvais signe.

### 2. "Où sont physiquement stockées les données de mes clients, mes commandes, mes tarifs ?"

**Bonne réponse claire** : *"Vos données métier restent sur votre propre serveur (on-premise) via notre SyncService. Notre cloud ne stocke que les métadonnées de licence."* OU *"Nos serveurs sont chez OVH/Scaleway en France, région X. Voici notre registre RGPD."*

**Mauvaise réponse** : *"Dans le cloud"* (vague) ou *"Chez AWS US-East"* (problématique Cloud Act).

### 3. "Quelle est votre politique en cas d'évolution défavorable des tarifs ?"

**Bonne réponse** : *"Nos tarifs sont garantis pour la durée de votre engagement (généralement 1 an). Toute hausse au renouvellement est notifiée 90 jours à l'avance avec possibilité de résiliation sans pénalité."*

**Mauvaise réponse** : pas de clause anti-spike dans le contrat, ou *"nous nous réservons le droit de modifier les tarifs à tout moment"*.

### 4. "Quelle est votre clause d'engagement minimum ?"

**Bonne réponse** : *"1 an renouvelable par tacite reconduction, résiliable en fin de période avec préavis de 60 jours. Ou sans engagement, mensuel, avec un tarif légèrement plus élevé."*

**Mauvaise réponse** : engagement 3 ans obligatoire sans possibilité de sortir anticipée.

## Sécurité et RGPD

### 5. "Vos serveurs sont-ils certifiés ISO 27001 ? Avez-vous une assurance cyber ?"

**Bonne réponse** : *"Oui — voici le certificat. Notre assurance couvre jusqu'à X M€ en cas de fuite de données vous concernant."*

**Mauvaise réponse** : *"On travaille dessus"* (acceptable chez un éditeur naissant) ou *"Ce n'est pas utile pour des PME"* (inacceptable).

### 6. "Comment sont chiffrées les données sur l'appareil mobile et en transit ?"

**Bonne réponse précise** : *"AES-256 au repos dans la base SQLite locale via SQLCipher. TLS 1.3 en transit. Authentification par JWT signé RSA-2048. Chaque appareil a sa propre clé dérivée."*

**Mauvaise réponse** : *"C'est chiffré"* sans détails, ou *"HTTPS"* tout court (le minimum vital, pas un argument).

### 7. "Qui a accès à mes données côté de vos équipes ? Avez-vous une politique de moindre privilège ?"

**Bonne réponse** : *"Accès restreint à 2-3 personnes pour le support, avec traçabilité des accès. Nous ne consultons jamais vos données métier sauf demande explicite de votre part pour dépannage, sur ticket signé."*

**Mauvaise réponse** : *"Tous nos ingénieurs ont accès"* ou pas de réponse claire.

### 8. "Fournissez-vous un DPA (accord de traitement des données RGPD) signable ?"

**Bonne réponse** : *"Oui, voici notre modèle. Nous l'adaptons à vos clauses spécifiques si besoin."*

**Mauvaise réponse** : *"C'est dans nos CGV"* (insuffisant juridiquement pour le DPO).

## Technique et fonctionnel

### 9. "Quelle est votre disponibilité garantie (SLA) ? Quel crédit en cas d'indisponibilité ?"

**Bonne réponse** : *"99.9 % de disponibilité sur notre infra centrale. En cas de panne prolongée (> 4h), crédit sur la facture suivante au prorata. SLA écrit dans le contrat."*

**Mauvaise réponse** : pas de SLA écrit, ou SLA sans pénalité crédible.

### 10. "Comment fonctionne votre mode hors-ligne ? Pouvez-vous me le démontrer en coupant le wifi en direct ?"

**Bonne réponse** : *"Oui, voyons ça maintenant."* — l'éditeur coupe son wifi, l'app continue à fonctionner, il crée une commande, il rallume le wifi, la commande remonte. 3 minutes.

**Mauvaise réponse** : *"Ça fonctionne hors-ligne"* sans démonstration, ou *"On va planifier une démo dédiée"*.

→ Plus de détails sur [comment marche vraiment le hors-ligne](/blog/mode-hors-ligne-comment-ca-marche).

### 11. "Fournissez-vous des mises à jour gratuites et automatiques ? À quelle fréquence ?"

**Bonne réponse** : *"Correctifs de sécurité dans les 48h si critique. Nouvelles versions fonctionnelles toutes les 4-8 semaines. Tout inclus dans l'abonnement. Vous recevez les release notes par email."*

**Mauvaise réponse** : *"Les mises à jour majeures sont facturées"* ou *"Nous ne publions pas de release notes publiques"*.

### 12. "Puis-je tester la solution avec mes vraies données pendant 30 jours ?"

**Bonne réponse** : *"Oui, on installe chez vous un environnement POC avec import de votre catalogue et quelques commerciaux test. 30 jours gratuits, sans engagement."*

**Mauvaise réponse** : *"On peut faire une démo sur des données fictives"* ou *"Le POC est facturé 3 K€"*.

## Bonus : les 3 red flags supplémentaires

En plus des 12 questions, **fuyez** si vous observez :

- **Pas de contrat écrit standard** (ou un contrat rédigé en 2 pages qui ne mentionne aucune garantie concrète)
- **Pas de support en français** (si vous êtes une PME française qui a besoin de support métier, un support anglais chez un éditeur californien est une catastrophe en devenir)
- **Pas de références clients vérifiables** (un éditeur qui refuse de partager 2-3 contacts clients pour que vous les appeliez directement a des choses à cacher)

## Et chez customApps, les réponses ?

Pour la transparence :

1. **Export** : données exportables en CSV/Excel depuis le dashboard en 1 clic, à tout moment. 30 jours post-résiliation pour récupérer.
2. **Stockage** : vos données métier **ne quittent jamais votre infra** (SyncService on-premise). Métadonnées licence chez OVH France.
3. **Tarifs** : garantis 12 mois, hausse plafonnée à indice INSEE, résiliable sans pénalité en cas de hausse > 5 %.
4. **Engagement** : 12 mois, résiliable avec 60 j de préavis. Option mensuelle disponible.
5. **Sécurité** : ISO 27001 en cours (audit 2026). Assurance cyber 1 M€.
6. **Chiffrement** : AES-256 SQLCipher + TLS 1.3 + JWT RSA-2048.
7. **Accès interne** : 3 personnes max, traçabilité complète.
8. **DPA** : oui, signable, adaptable.
9. **SLA** : 99.9 % avec crédit au prorata.
10. **Démo hors-ligne** : oui, en direct, toujours. [Demandez-la](/contact).
11. **Mises à jour** : toutes les 4-6 semaines, release notes publiées. Inclus.
12. **POC** : 30 jours gratuits sur vos données WaveSoft. Sans engagement.

## Utilisez cette checklist

Imprimez cet article, emportez-le en rendez-vous avec chaque éditeur potentiel. Notez leurs réponses, comparez à froid. Vous éviterez les mauvaises surprises qui coûtent cher — à la fois financièrement et en temps perdu.

[Posez-nous les 12 questions](/contact) : on répond dans l'heure.

À lire aussi :

- [Comparatif : 4 façons de prendre une commande sur mobile](/blog/comparatif-4-facons-prendre-commande-mobile)
- [Combien coûte vraiment une app mobile de prise de commandes](/blog/combien-coute-app-prise-commandes-mobile)
- [Architecture de sync : cloud vs on-premise](/blog/architecture-sync-cloud-onpremise-hybride)
