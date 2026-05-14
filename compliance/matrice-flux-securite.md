# Matrice de Flux de Sécurité

**Projet :** Résilience — Clinique Le Châtelet  
**Référence :** Dossier d'Architecture Technique (DAT) v1.0  
**Date :** Mai 2026

> Tous les flux non listés sont bloqués par règle **Deny All** en fin de chaîne sur chaque interface.

---

## Flux entrants WAN → Lab

| Source | Destination | Port | Proto | Rôle | Conformité |
|---|---|---|---|---|---|
| any | srv-proxy-01 | 443 | TCP | Portail Authelia MFA — soignants distants | HDS, NIS2 |
| any | FW1 WAN | 1194 | TCP/UDP | OpenVPN soignants — certificat client requis | HDS, NIS2 |

---

## Flux VLAN-DMZ (172.16.33.0/24)

| Source | Destination | Port | Proto | Rôle | Conformité |
|---|---|---|---|---|---|
| srv-proxy-01 | DC1, DC2 | 636 | TCP | Authelia LDAPS → AD (auth soignants) | HDS, RGPD |
| srv-proxy-01 | DC1, DC2 | 53 | TCP/UDP | DNS interne | — |
| srv-proxy-01 | srv-web-01 | 8080 | TCP | Nginx → App Node.js clinique | HDS |
| srv-web-01 | srv-oracle-db-01 | 1521 | TCP | App → Oracle XE (dossiers patients) | HDS, HIPAA |
| NET-DMZ | DC1, DC2 | 123 | UDP | NTP sync temps | — |
| NET-DMZ | Internet | 80, 443 | TCP | Mises à jour Ubuntu | — |
| NET-DMZ | srv-wazuh | 1514, 1515 | TCP | Agents Wazuh → Manager SIEM | HDS |
| NET-DMZ | srv-zabbix | 10051 | TCP | Agent Zabbix actif → Serveur | — |
| NET-DMZ | PRIVATE_NETWORK | * | * | **BLOQUÉ** — isolation DMZ | HDS |

---

## Flux VLAN-SRV (172.16.11.0/24)

| Source | Destination | Port | Proto | Rôle | Conformité |
|---|---|---|---|---|---|
| DC1, DC2 | Internet | 53, 80, 443, 123 | TCP/UDP | DNS forwarder, Windows Update, NTP | — |
| srv-zabbix | NET-SRV/DMZ/CLIENT/BACKUP | 10050 | TCP | Polling Zabbix agents passifs | — |
| srv-zabbix | FW1 | 161 | TCP/UDP | SNMP polling OPNsense | — |
| srv-zabbix, srv-wazuh | srv-proxy-01 | 1025 | TCP | Alertes SMTP → Mailpit | — |
| NET-SRV | srv-wazuh | 1514, 1515 | TCP | Agents Wazuh SRV → Manager | HDS |
| srv-zabbix, srv-wazuh | Internet | 80, 443 | TCP | Mises à jour | — |
| srv-oracle-db-01 | Internet | 80, 443 | TCP | Mises à jour Oracle Linux | — |
| NET-SRV | PRIVATE_NETWORK | * | * | **BLOQUÉ** (hors règles listées) | HDS |

---

## Flux VLAN-CLIENT (172.16.22.0/24)

| Source | Destination | Port | Proto | Rôle | Conformité |
|---|---|---|---|---|---|
| Poste-Admin-IT | OPNsense FW1/FW2 | 4443 | TCP | Administration GUI firewall | — |
| Poste-Admin-IT | srv-zabbix, srv-wazuh | 443 | TCP | Dashboards monitoring & SIEM | — |
| Poste-Admin-IT | NET-SRV, NET-DMZ | 22 | TCP | SSH administration serveurs | — |
| Poste-Admin-IT | DC1, DC2 | 3389 | TCP | RDP administration AD | — |
| Poste-Admin-IT | SRV-VEEAM | 3389 | TCP | RDP console VEEAM | — |
| NET-CLIENT | DC1, DC2 | 53 | TCP/UDP | DNS résolution interne | — |
| NET-CLIENT | DC1, DC2 | 88, 389, 636 | TCP/UDP | Kerberos + LDAPS authentification | HDS |
| NET-CLIENT | DC1, DC2 | 123 | UDP | NTP sync temps | — |
| NET-CLIENT | srv-proxy-01 | 443 | TCP | **Accès portail clinique via Authelia MFA** | HDS, NIS2 |
| NET-CLIENT | srv-wazuh | 1514, 1515 | TCP | Agent Wazuh → Manager | HDS |
| NET-CLIENT | srv-zabbix | 10051 | TCP | Agent Zabbix actif | — |
| NET-CLIENT | Internet | 80, 443 | TCP | Windows Update | — |
| NET-CLIENT | NET-SRV | * | * | **BLOQUÉ** — accès SRV via proxy uniquement | HDS |
| NET-CLIENT | NET-BACKUP | * | * | **BLOQUÉ** | HDS |

---

## Flux VLAN-BACKUP (172.16.44.0/24)

| Source | Destination | Port | Proto | Rôle | Conformité |
|---|---|---|---|---|---|
| SRV-VEEAM | Cibles backup | 2500-5000 | TCP | VEEAM backup jobs | HDS/PRA |
| SRV-VEEAM | Internet | 80, 443 | TCP | Mises à jour VEEAM | — |
| NET-BACKUP | NET-CLIENT | * | * | **BLOQUÉ** | HDS |
| NET-BACKUP | NET-DMZ | * | * | **BLOQUÉ** | HDS |

---

## Flux VLAN-GUEST (172.16.55.0/24)

| Source | Destination | Port | Proto | Rôle | Conformité |
|---|---|---|---|---|---|
| NET-GUEST | Internet | 53 | UDP | DNS public uniquement | — |
| NET-GUEST | Internet | 80, 443 | TCP | Navigation web | — |
| NET-GUEST | PRIVATE_NETWORK | * | * | **BLOQUÉ** — isolation totale | HDS |

---

## Flux HA & Administration

| Source | Destination | Port | Proto | Rôle |
|---|---|---|---|---|
| FW1 (10.0.0.1) | FW2 (10.0.0.2) | pfsync | IP | Synchronisation états de connexion CARP |
| FW1/FW2 | Tailscale network | 41641 | UDP | VPN administration distante |
| FW1 | Internet | 123 | UDP | NTP sync temps firewall |
