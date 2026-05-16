# Matrice de Conformité HDS / NIS2 / RGPD

**Projet :** Résilience — Clinique Le Châtelet  
**Périmètre :** Infrastructure SI hébergeant des données de santé (HDS)  
**Date :** Mai 2026

---

## HDS — Hébergeur de Données de Santé

| ID | Exigence HDS | Mesure technique implémentée | Composant | Niveau |
|---|---|---|---|---|
| HDS-1 | Contrôle d'accès aux données patients | MFA obligatoire via Authelia (TOTP) + RBAC LDAP (AD) | Authelia + DC1/DC2 | ✅ Conforme |
| HDS-2 | Chiffrement des flux | TLS 1.2+ sur tous les flux HTTPS (Nginx), LDAPS :636 | Nginx + OPNsense | ✅ Conforme |
| HDS-3 | Rétention des logs ≥ 6 mois | Politique ISM OpenSearch configurée (rétention 180j) | Wazuh Indexer | ✅ Conforme |
| HDS-4 | Traçabilité des accès données patients | Journalisation Authelia (succès/échec) + Wazuh FIM sur Oracle | Wazuh + Authelia | ✅ Conforme |
| HDS-5 | Isolation des données de santé | VLAN-DMZ dédié app clinique, VLAN-SRV dédié Oracle XE | OPNsense VLANs | ✅ Conforme |
| HDS-6 | Disponibilité et continuité | Cluster CARP HA (FW1/FW2) + Sauvegarde VEEAM | OPNsense + VEEAM | ✅ Conforme |
| HDS-7 | Détection d'intrusion | Wazuh SIEM + IDS (règles HIPAA/HDS natives) | Wazuh 4.14.4 | ✅ Conforme |
| HDS-8 | Gestion des vulnérabilités | Wazuh Vulnerability Detection sur tous les agents | Wazuh | ✅ Conforme |
| HDS-9 | Supervision de l'infrastructure | Zabbix 7.4.9 (72 métriques Oracle, Linux, Nginx, SNMP) | Zabbix | ✅ Conforme |
| HDS-10 | Sauvegarde des données | VEEAM Backup sur VLAN-BACKUP isolé | VEEAM | ✅ Conforme |

---

## NIS2 — Article 21 (Mesures de cybersécurité)

| ID | Exigence NIS2 | Mesure technique implémentée | Composant | Niveau |
|---|---|---|---|---|
| NIS2-1 | MFA obligatoire | TOTP via Authelia sur portail clinique | Authelia | ✅ Conforme |
| NIS2-2 | Détection d'intrusion | Wazuh SIEM — règles MITRE ATT&CK, HIPAA, FIM | Wazuh 4.14.4 | ✅ Conforme |
| NIS2-3 | Gestion des incidents | Alertes Wazuh → Mailpit → notification admin | Wazuh + Postfix | ✅ Conforme |
| NIS2-4 | Sécurité de la chaîne d'approvisionnement | Mises à jour contrôlées par VLAN (règles firewall dédiées) | OPNsense | ✅ Conforme |
| NIS2-5 | Continuité d'activité | Replication AD1->AD2 + HA CARP + VEEAM Backup | OPNsense + VEEAM | ✅ Conforme |
| NIS2-6 | Chiffrement | TLS 1.2+ obligatoire, LDAPS, OpenVPN certificats | Nginx + OPNsense | ✅ Conforme |
| NIS2-7 | Contrôle d'accès | RBAC via groupes AD, principe du moindre privilège | DC1/DC2 + Authelia | ✅ Conforme |
| NIS2-8 | Tests de sécurité | VM Kali dédiée aux pentest (planifié) | Kali Linux | ⚠️ Planifié |

---

## RGPD — Article 32 (Mesures techniques)

| ID | Exigence RGPD | Mesure technique implémentée | Composant | Niveau |
|---|---|---|---|---|
| RGPD-1 | Pseudonymisation / chiffrement | Données en transit chiffrées TLS, accès authentifié MFA | Nginx + Authelia | ✅ Conforme |
| RGPD-2 | Confidentialité et intégrité | Segmentation VLAN, règles Deny All, FIM Wazuh | OPNsense + Wazuh | ✅ Conforme |
| RGPD-3 | Disponibilité et résilience | Cluster HA CARP, VEEAM, supervision Zabbix | Infra complète | ✅ Conforme |
| RGPD-4 | Rétablissement après incident | VEEAM + procédure de failover CARP documentée | VEEAM + OPNsense | ⚠️ Partiel |
| RGPD-5 | Évaluation de l'efficacité | Dashboards Wazuh HIPAA + rapports Zabbix | Wazuh + Zabbix | ✅ Conforme |
| RGPD-6 | Notification CNIL 72h | Alertes Wazuh temps réel → admin (délai < 1h) | Wazuh | ✅ Conforme |

---

## HIPAA — Security Rule (45 CFR Part 164)

| Règle HIPAA | Contrôle | Implémentation | Composant |
|---|---|---|---|
| 164.312(a)(1) | Contrôle d'accès | MFA + RBAC LDAP + audit trails | Authelia + Wazuh |
| 164.312(a)(2)(i) | Identifiants uniques | Comptes AD individuels par soignant | DC1/DC2 |
| 164.312(b) | Audit Controls | Logs Wazuh — rétention 6 mois OpenSearch | Wazuh Indexer |
| 164.312(c)(1) | Intégrité | FIM Wazuh sur fichiers Oracle et configs critiques | Wazuh |
| 164.312(d) | Authentification personne | TOTP second facteur Authelia | Authelia |
| 164.312(e)(1) | Sécurité transmission | TLS 1.2+ sur tous les flux, VPN soignants distants | Nginx + OpenVPN |

---

## Axes d'amélioration identifiés

| Priorité | Action | Justification |
|---|---|---|
| P1 | Activer Suricata IPS sur FW1 | Détection/blocage actif des intrusions réseau |
| P2 | Compléter les Jobs Backup des VM | Garantir RPO/RTO documentés pour HDS |
| P3 | Durcissement CIS Oracle Linux | Score actuel 35% — objectif 70%+ |
| P4 | Déployer les pentest Kali | Valider l'efficacité des contrôles NIS2-8 |
| P5 | Activer GLPI | Gestion des actifs et incidents (ITIL) |
