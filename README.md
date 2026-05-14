# 📂 Projet Résilience : Infrastructure HDS & Zero-Trust pour la Clinique Le Châtelet

[![Security - HDS Compliance](https://img.shields.io/badge/Compliance-HDS%20%7C%20NIS2%20%7C%20GDPR-blue?style=for-the-badge&logo=shield)](#)
[![Infrastructure - VMware ESXi](https://img.shields.io/badge/Infrastructure-VMware%20ESXi-619933?style=for-the-badge&logo=vmware)](#)
[![SOC - Wazuh SIEM](https://img.shields.io/badge/SOC-Wazuh%20SIEM-00A9E0?style=for-the-badge&logo=wazuh)](#)

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

## 📊 4. Supervision & Maintien en Condition Opérationnelle (MCO)
La disponibilité est monitorée par le couple **Zabbix + Grafana**.
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
| **Réseau** | OPNsense (CARP/pfSync), VLANs 802.1Q, NAT, Routage Statique |
| **Sécurité** | Wazuh (SIEM), Authelia (MFA), Nginx (Proxy), OpenVPN, Suricata (IDS/IPS) |
| **Systèmes** | Windows Server 2022 (AD/DNS/GPO), Ubuntu 22.04, Oracle Linux 9 |
| **Data** | Oracle 21c XE (DBA, SQL*Net, Tablespaces), PostgreSQL |
| **DevOps** | Node.js (API Backend), Systemd, Bash Scripting, Markdown Documentation |

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
🎓 Étudiant Mastère Cybersécurité et Cloud / Master Sécurité Informatique
🔭 En recherche d'alternance pour Septembre 2026
🔗 **LinkedIn :** href{https://linkedin.com/in/steeve-womo}{linkedin.com/in/steeve-womo/} | 📧 **Email :** href{mailto:womo.steeven@gmail.com}{womo.steeven@gmail.com}
