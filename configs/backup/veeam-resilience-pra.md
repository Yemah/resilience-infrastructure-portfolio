# Plan de Reprise d'Activité (PRA) : Sanctuarisation des Sauvegardes

Le système d'information de la Clinique Le Châtelet repose sur une stratégie de sauvegarde stricte pour garantir l'intégrité des données de santé face aux menaces destructrices (Ransomwares). L'outil retenu est **Veeam Backup & Replication**, interfacé directement avec l'API de l'hyperviseur VMware ESXi.

## 1. Isolation Réseau (Sanctuarisation)
Le serveur de sauvegarde n'est pas joint au domaine Active Directory principal et réside dans un réseau hermétique (VLAN 444). Le pare-feu OPNsense applique une règle de flux unidirectionnelle : le réseau LAN ne peut pas initier de connexion vers le VLAN BACKUP.

```powershell
PS C:\> Get-NetIPAddress -AddressFamily IPv4 | Select-Object InterfaceAlias, IPAddress, PrefixLength

InterfaceAlias              IPAddress    PrefixLength
--------------              ---------    ------------
Ethernet0                   172.16.44.70           24  # VLAN 444 (Isolé)
Loopback Pseudo-Interface 1 127.0.0.1               8
```
## 2. Architecture des Services (Résilience interne)
Pour garantir des performances optimales et une sécurité accrue, l'infrastructure Veeam s'appuie sur une base de données PostgreSQL 17 (abandon de MS SQL Express). Tous les micro-services Veeam (Transport, Catalog, ThreatHunter) sont gérés de manière autonome.

```PowerShell
PS C:\> Get-Service | Where-Object {$_.Name -like "Veeam*" -or $_.Name -like "PostgreSQL*"} | Select-Object Name, Status

Name                            Status
----                            ------
postgresql-x64-17               Running
VeeamBackupSvc                  Running
VeeamBrokerSvc                  Running
VeeamThreatHunterSvc            Running
VeeamTransportSvc               Running
# [28 autres services actifs liés au PRA]
```
## 3. Stratégie de Sauvegarde (VMware vSphere API)
Les jobs de sauvegarde opèrent au niveau de l'hyperviseur (Mode "Agentless"). Ils capturent l'intégralité des machines virtuelles en effectuant des snapshots via le port TCP 902 (NFC) de l'ESXi.

Détails du Job Critique (Base de données HDS) :

Nom du Job : JOB-BACKUP-ORACLE

Type : VMware Backup (Snapshot & Change Block Tracking - CBT)

Cible : REPO-BACKUP (Dépôt de stockage local)

Volume traité : 80 GB (VM SRV-ORACLE-DB-01)

Surveillance : Les échecs de snapshots ou les déconnexions de l'hôte distant sont immédiatement remontés par Zabbix via l'analyse des EventChannels Windows (Règle Wazuh 61061).

---

![Success Job backup](..screenshots/veeam-backup/Success_backup.PNG)
