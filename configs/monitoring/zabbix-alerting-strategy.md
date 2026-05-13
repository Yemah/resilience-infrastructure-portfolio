# Stratégie d'Alerte et Notification (Zabbix & SMTP)

Dans un contexte de santé (HDS), le temps de réaction face à un incident (panne matérielle, saturation disque, arrêt de la base de données) est critique. Le système de supervision Zabbix a été configuré pour alerter l'équipe d'astreinte en temps réel.

## 1. Intégration Native SMTP (Media Types)
Plutôt que d'utiliser des scripts externes obsolètes, la remontée d'alerte utilise le moteur SMTP natif de Zabbix. Dans cet environnement de laboratoire, les alertes sont capturées de manière sécurisée par un relais **Mailpit** interne, garantissant qu'aucune donnée sensible sur l'infrastructure ne fuite sur des serveurs de messagerie publics.

**Configuration du Media Type (Zabbix GUI) :**
* **Type :** Email (HTML)
* **SMTP server :** `127.0.0.1` (ou IP du SRV-PROXY selon topologie)
* **SMTP port :** `1025` (Port d'écoute Mailpit)
* **SMTP helo :** `clinique-chatelet.local`
* **Email format :** HTML

## 2. Déclencheurs (Triggers) et Actions
Les alertes ne sont pas envoyées pour chaque micro-événement, mais sont filtrées selon leur sévérité pour éviter la fatigue d'alerte (Alert Fatigue).

**Exemple de flux d'Action (Zabbix Actions) :**
1. **Condition :** Le `Trigger` détecte que le service Windows "UsoSvc" est arrêté sur le serveur Veeam, ou qu'une latence d'E/S disque critique est détectée.
2. **Opération :** Envoi d'un email au groupe `Zabbix Administrators`.
3. **Recovery Operation :** Dès que le service est relancé (manuellement ou via auto-remédiation), Zabbix envoie un email de clôture `[RESOLU]`.

## 3. Modèle de Notification (Template HTML)
Les emails d'alerte ont été structurés pour fournir immédiatement le contexte à l'administrateur, réduisant ainsi le MTTR (Mean Time To Recovery).

**Variables injectées dynamiquement dans l'email :**
* `{EVENT.NAME}` : Description du problème.
* `{HOST.NAME}` : Machine impactée (ex: SRV-VEEAM-BACKUP).
* `{EVENT.SEVERITY}` : Niveau d'urgence (Average, High, Disaster).
* `{ITEM.VALUE}` : Valeur technique ayant déclenché l'alerte.

> **Preuve de concept :** Les tests de simulation de pannes (arrêt forcé de services) ont démontré une remontée d'alerte vers le tableau de bord Mailpit en moins de 3 secondes, suivie d'une notification de résolution automatique dès le redémarrage.