# 📂 Projet Résilience : Infrastructure HDS & Zero-Trust pour la Clinique Le Châtelet


[![OPNsense](https://img.shields.io/badge/Firewall-OPNsense_26.1.3-D94F00?style=for-the-badge&logo=opnsense&logoColor=white)](https://opnsense.org)
[![Wazuh](https://img.shields.io/badge/SIEM-Wazuh_4.14.4-005571?style=for-the-badge&logo=elastic&logoColor=white)](https://wazuh.com)
[![Zabbix](https://img.shields.io/badge/Monitoring-Zabbix_7.4.9-CC0000?style=for-the-badge&logo=zabbix&logoColor=white)](https://zabbix.com)
[![Authelia](https://img.shields.io/badge/MFA-Authelia-4F46E5?style=for-the-badge&logo=authelia&logoColor=white)](https://authelia.com)
[![VMware](https://img.shields.io/badge/Hyperviseur-VMware_ESXi_7.0-607078?style=for-the-badge&logo=vmware&logoColor=white)](https://vmware.com)

[![HDS](https://img.shields.io/badge/Conformité-HDS-00A86B?style=for-the-badge)](https://esante.gouv.fr)
[![HIPAA](https://img.shields.io/badge/Conformité-HIPAA_164.312.x-00A86B?style=for-the-badge)](https://www.hhs.gov/hipaa)
[![NIS2](https://img.shields.io/badge/Conformité-NIS2_Art.21-00A86B?style=for-the-badge)](https://nis2.eu)
[![RGPD](https://img.shields.io/badge/Conformité-RGPD_Art.32-00A86B?style=for-the-badge)](https://gdpr.eu)


## 🏥 1. Contexte & Enjeux Métiers
La **Clinique Le Châtelet**, établissement de rééducation spécialisé, a dû porter son application médicale monolithique (Oracle + Node.js) sur le Web pour permettre l'accès distant sécurisé aux dossiers patients.

**Le défi :** Exposer des données de santé ultra-critiques (HDS) sur Internet tout en garantissant une disponibilité de 99.99% et une étanchéité totale face aux ransomwares.

---

## 🏗️ 2. Architecture Globale (Design Haute Disponibilité)
L'infrastructure est déployée sur un hyperviseur **VMware ESXi 7.0 U2** et repose sur un cluster de pare-feux en haute disponibilité.

### 🗺️ Topologie Réseau & Segmentation (802.1Q)
Le SI est micro-segmenté en **6 VLANs hermétiques** pour limiter la surface d'attaque et interdire les mouvements latéraux :

* **VLAN 111 (SRV) :** Cœur du métier (Oracle DB, AD DS, SIEM).
* **VLAN 222 (CLIENT) :** Postes de travail durcis et sécurisés.
* **VLAN 333 (DMZ) :** Zone d'exposition publique (Nginx, Authelia).
* **VLAN 444 (BACKUP) :** Zone sanctuarisée pour la résilience (Veeam).
* **VLAN 555 (GUEST) :** Accès Internet isolé pour les patients.
* **VLAN 999 (MGMT) :** Flux d'administration Out-of-Band.

> **Visualisation de l'architecture :**

<p align="center">
  <img src="architecture/diagrams/clinique_chatelet_architecture.png" width="800" alt="Schéma de l'architecture">
</p>

---

## 🔐 Flux d'authentification MFA

```
Soignant (distant)
       │
       │ HTTPS 443
       ▼
  Nginx (srv-proxy-01)
       │
       │ auth_request → Authelia
       ▼
  Authelia MFA ──LDAPS 636──► Active Directory
       │                      (DC1 + DC2)
       │ ✅ 2FA validé
       ▼
  App Node.js + index.html (srv-web-01)
       │
       │ TCP 1521
       ▼
  Oracle XE 21c (dossiers patients)
```

**Chaque accès à un dossier patient nécessite :**
1. Identifiant AD (`sAMAccountName`)
2. Mot de passe AD
3. Code TOTP (Google Authenticator / FreeOTP)

---

## 🛡️ 3. Stack Sécurité & Conformité (L'Arsenal SecOps)

### 🔑 Identité & Accès (Zero-Trust)
Mise en place d'une passerelle d'accès sécurisée interdisant tout flux direct vers l'application :
* **Nginx Reverse Proxy :** Terminaison TLS 1.3 et filtrage des requêtes.
* **Authelia MFA :** Authentification à deux facteurs obligatoire (TOTP/WebAuthn) couplée à l'Active Directory via LDAPS.

👉 *[Voir la documentation de la politique Zero-Trust](configs/proxy/authelia-zero-trust-gateway.md)*

### 🕵️ SIEM & Détection (SOC)
Déploiement de **Wazuh** avec une couverture de 100% des agents :
* **Conformité automatisée :** Tagging natif des alertes selon les normes HIPAA 164.312, PCI-DSS et HDS.
* **Active Response (SOAR) :** Bannissement automatique des adresses IP en cas de Brute Force SSH détecté.
* **FIM (File Integrity Monitoring) :** Surveillance en temps réel des configurations critiques (`/etc/nginx`, `C:\Windows\System32`).

👉 *[Voir l'architecture SIEM avancée de Wazuh](configs/siem/wazuh-advanced-architecture.md)*

---

## 📊 4. Supervision, Alerting & Maintien en Condition Opérationnelle (MCO)

**Zabbix 7.4.9** — 5 templates actifs, 150+ métriques :

| Template | Hôtes | Métriques clés |
|----------|-------|----------------|
| Oracle by Zabbix agent 2 | srv-oracle-db-01 | 72 items (SGA, PGA, FRA, sessions) |
| Linux by Zabbix agent | srv-wazuh, srv-web-01 | CPU, RAM, disk, réseau |
| Nginx by Zabbix agent active | srv-proxy-01 | Connexions, requêtes, statuts |
| Network Generic Device SNMP | FW1, FW2 | Interfaces, trafic |
| Windows by Zabbix Agents | DC1, DC2, Veeam backup & Poste-admin_Win10 | CPU, RAM, disk, réseau |

**Pipeline d'alerting :**
```
Zabbix → Postfix (srv-wazuh) → Mailpit (srv-proxy-01:1025)
```
500+ alertes reçues — actions configurées : CRITIQUE, DISASTER, HA CARP, Sécurité Auth.

La disponibilité est monitorée par **Zabbix**.
* **Monitoring Applicatif :** Surveillance profonde de la base **Oracle 21c** (états des tablespaces, sessions actives via compte de service `C##ZBX_MONITOR`).
* **Alerting temps réel :** Remontée d'alertes via SMTP local (Mailpit) avec templates HTML structurés pour une remédiation rapide.

👉 *[Voir la stratégie d'alerte Zabbix SMTP](configs/monitoring/zabbix-alerting-strategy.md)*

---

## 💾 5. Résilience & PRA (Plan de Reprise d'Activité)
La protection des données HDS repose sur **Veeam Backup & Replication**.
* **Sanctuarisation :** Le serveur Veeam réside dans un VLAN isolé, inaccessible depuis le LAN, pour prévenir le chiffrement des sauvegardes par ransomware.
* **Backup Agentless :** Utilisation des APIs VMware vSphere pour des clichés instantanés (Snapshots) avec Change Block Tracking (CBT).
* **Base de données :** Migration sur PostgreSQL 17 pour des performances de catalogue accrues.

---

## 🛠️ 6. Compétences Démontrées

| Domaine | Technologies maîtrisées |
| :--- | :--- |
| **Réseau** | OPNsense (CARP/pfSync), VLANs 802.1Q(Router-on-Stick), NAT, Routage Statique |
| **Sécurité** | Wazuh (SIEM), Authelia (MFA), Nginx (Proxy), OpenVPN, Suricata (IDS/IPS) |
| **Systèmes** | Windows Server 2022 (AD/DNS/GPO), Ubuntu 22.04, Oracle Linux 9 |
| **Data** | Oracle 21c XE (DBA, SQL*Net, Tablespaces), PostgreSQL |
| **DevOps** | Node.js (API Backend), Systemd, Bash Scripting, Markdown Documentation |


## 🚀 Points Forts du Projet

**Ce qui différencie cette infrastructure :**

- **Double firewall CARP** — basculement automatique FW1→FW2, RTO < 10s
- **MFA sur dossiers patients** — aucun accès sans TOTP, tracé dans Wazuh
- **+30 règles SIEM custom HDS** — HIPAA 164.312.x taggé automatiquement
- **Segmentation VLAN stricte** — DMZ isolée, BACKUP inaccessible depuis CLIENT
- **Pipeline d'alerting complet** — 500+ alertes Zabbix traitées en production
- **Matrices de conformité** — HDS · NIS2 · RGPD · HIPAA · PCI-DSS documentés
- **Résilience & PRA** -- Continuité de services en cas d'incident 


---

## 📁 7. Structure du Repository

```text
.
├── app/               # Code source de l'App Node.js et durcissement Oracle
├── architecture/      # Schémas techniques
├── configs/           # Fichiers de configuration durcis et anonymisés
│   ├── firewall/      # OPNsense HA & VLANs Setup
│   ├── monitoring/    # Zabbix Tuning & Alerting
│   ├── proxy/         # Nginx & Authelia Zero-Trust policies
│   └── siem/          # Wazuh Rules & FIM policies
├── screenshots/       # Preuves visuelles (Dashboards, MFA, Alerts)
└── README.md          # Vous êtes ici

📬 Contact
Steeve WOMO TCHINDA
🎓 Étudiant Mastère Cybersécurité et Cloud
🔭 En recherche d'alternance pour Septembre 2026
🔗 **LinkedIn :** [linkedin.com/in/steeve-womo](https://linkedin.com/in/steeve-womo/) | 📧 **Email :** [womo.steeven@gmail.com](mailto:womo.steeven@gmail.com)
