\# 📂 Projet Résilience : Infrastructure HDS \& Zero-Trust pour la Clinique Le Châtelet



\## 🏥 1. Contexte \& Enjeux Métiers



La \*\*Clinique Le Châtelet\*\*, établissement de rééducation spécialisé, a dû porter son application médicale monolithique (Oracle + Node.js) sur le Web pour permettre l'accès distant sécurisé aux dossiers patients.



\*\*Le défi :\*\* Exposer des données de santé ultra-critiques (HDS) sur Internet tout en garantissant une disponibilité de 99.99% et une étanchéité totale face aux ransomwares.



\---



\## 🏗️ 2. Architecture Globale (Design Haute Disponibilité)



L'infrastructure est déployée sur un hyperviseur \*\*VMware ESXi 7.0 U2\*\* et repose sur un cluster de pare-feux en haute disponibilité.



\### 🗺️ Topologie Réseau \& Segmentation (802.1Q)



Le SI est micro-segmenté en \*\*6 VLANs hermétiques\*\* pour limiter la surface d'attaque et interdire les mouvements latéraux:



\* 

\*\*VLAN 111 (SRV) :\*\* Cœur du métier (Oracle DB, AD DS, SIEM).





\* 

\*\*VLAN 222 (CLIENT) :\*\* Postes de travail durcis et sécurisés.





\* 

\*\*VLAN 333 (DMZ) :\*\* Zone d'exposition publique (Nginx, Authelia).





\* 

\*\*VLAN 444 (BACKUP) :\*\* Zone sanctuarisée pour la résilience (Veeam).





\* 

\*\*VLAN 555 (GUEST) :\*\* Accès Internet isolé pour les patients.





\* \*\*VLAN 999 (MGMT) :\*\* Flux d'administration Out-of-Band.



> 

> \*\*Visualisation :\*\* 

<p align="center">

&#x20; <img src="architecture/diagrams/clinique\_chatelet\_architecture.png" width="700">

</p> 

> 

> 



\---



\## 🛡️ 3. Stack Sécurité \& Conformité (L'Arsenal SecOps)



\### 🔑 Identité \& Accès (Zero-Trust)



Mise en place d'une passerelle d'accès sécurisée interdisant tout flux direct vers l'application:



\* 

\*\*Nginx Reverse Proxy :\*\* Terminaison TLS 1.3 et filtrage des requêtes.





\* 

\*\*Authelia MFA :\*\* Authentification à deux facteurs obligatoire (TOTP/WebAuthn) couplée à l'Active Directory via LDAPS.







\### 🕵️ SIEM \& Détection (SOC)



Déploiement de \*\*Wazuh\*\* avec une couverture de 100% des agents:



\* 

\*\*Conformité automatisée :\*\* Tagging natif des alertes selon les normes \*\*HIPAA 164.312\*\*, \*\*PCI-DSS\*\* et \*\*HDS\*\*.





\* 

\*\*Active Response (SOAR) :\*\* Bannissement automatique des adresses IP en cas de Brute Force SSH détecté.





\* 

\*\*FIM (File Integrity Monitoring) :\*\* Surveillance en temps réel des configurations critiques (`/etc/nginx`, `C:\\Windows\\System32`).







\---



\## 📊 4. Supervision \& Maintien en Condition Opérationnelle (MCO)



La disponibilité est monitorée par le couple \*\*Zabbix + Grafana\*\*.



\* 

\*\*Monitoring Applicatif :\*\* Surveillance profonde de la base \*\*Oracle 21c\*\* (états des tablespaces, sessions actives via compte de service `C##ZBX\_MONITOR`).





\* 

\*\*Alerting temps réel :\*\* Remontée d'alertes via SMTP local (Mailpit) avec templates HTML structurés pour une remédiation rapide.







\---



\## 💾 5. Résilience \& PRA (Plan de Reprise d'Activité)



La protection des données HDS repose sur \*\*Veeam Backup \& Replication\*\*.



\* 

\*\*Sanctuarisation :\*\* Le serveur Veeam réside dans un VLAN isolé, inaccessible depuis le LAN, pour prévenir le chiffrement des sauvegardes par ransomware.





\* 

\*\*Backup Agentless :\*\* Utilisation des APIs VMware vSphere pour des clichés instantanés (Snapshots) avec Change Block Tracking (CBT).





\* 

\*\*Base de données :\*\* Migration sur PostgreSQL 17 pour des performances de catalogue accrues.







\---



\## 🛠️ 6. Compétences Démontrées



| Domaine | Technologies maîtrisées |

| --- | --- |

| \*\*Réseau\*\* | OPNsense (CARP/pfSync), VLANs 802.1Q, NAT, Routage Statique 



&#x20;|

| \*\*Sécurité\*\* | Wazuh (SIEM), Authelia (MFA), Nginx (Proxy), OpenVPN, Suricata (IDS/IPS) 



&#x20;|

| \*\*Systèmes\*\* | Windows Server 2022 (AD/DNS/GPO), Ubuntu 22.04, Oracle Linux 9 



&#x20;|

| \*\*Data\*\* | Oracle 21c XE (DBA, SQL\*Net, Tablespaces), PostgreSQL 



&#x20;|

| \*\*DevOps\*\* | Node.js (API Backend), Systemd, Bash Scripting, Markdown Documentation 



&#x20;|



\---



\## 📁 7. Structure du Repository



```text

.

├── architecture/      # Schémas techniques (Draw.io, PNG)

├── compliance/        # Matrices de flux et de conformité HDS

├── configs/           # Fichiers de configuration durcis et anonymisés

│   ├── firewall/      # OPNsense HA \& VLANs Setup

│   ├── proxy/         # Nginx \& Authelia Zero-Trust policies

│   ├── monitoring/    # Zabbix Tuning \& Oracle monitoring

│   └── siem/          # Wazuh Rules \& FIM policies

├── screenshots/       # Preuves visuelles (Dashboards, MFA, Alerts)

└── README.md          # Vous êtes ici



```



\---



\## 📬 Contact



\*\*WOMO TCHINDA Steeve\*\*



\* 🎓 Étudiant Master 2 Expert Infrastructure Réseaux \& Sécurité

\* 🔭 En recherche active de stage immédiatement et d'alternance pour Septembre 2026

\* 🔗 \[LinkedIn](https://www.google.com/search?q=https://www.linkedin.com/in/steeve-womo/) | 📧 \[Email](https://www.google.com/search?q=womo.steeven@gmail.com)





