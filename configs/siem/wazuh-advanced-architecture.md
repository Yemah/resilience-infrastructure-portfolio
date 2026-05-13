# Architecture SIEM Avancée, SOAR & Déploiement Centralisé (Wazuh)

Le déploiement du SIEM Wazuh au sein de la Clinique Le Châtelet a été pensé selon les standards d'un SOC moderne : couverture intégrale, gestion centralisée des politiques de sécurité (MCO), et remédiation automatisée (Active Response).

## 1. Couverture du Parc et Segmentation Logique
Pour assurer une traçabilité totale (exigence HDS), 100% de l'infrastructure est couverte par des agents Wazuh, incluant les pare-feux (FreeBSD), les serveurs Windows (AD, Veeam) et Linux (DMZ, BDD).

Les agents ne sont pas gérés unitairement mais segmentés par rôle métier pour appliquer des politiques de sécurité granulaires.

```bash
wazuh_admin@srv-wazuh:~$ sudo /var/ossec/bin/agent_groups -l
Groups (7):
  Admin_Workstation (1)
  Backup (0)
  DC_Servers (2)       # Contrôleurs de domaine
  Database (1)         # Base Oracle HDS
  Monitoring (1)       # Zabbix
  Web_DMZ (2)          # Proxy et WebApp
  default (10)

## 2. Infrastructure as Code : Configuration Centralisée (agent.conf)
Pour garantir la cohérence des politiques de sécurité (Baseline), la configuration n'est pas modifiée sur les terminaux. Elle est poussée dynamiquement par le Manager (/var/ossec/etc/shared/default/agent.conf).

A. Baseline Windows (Durcissement et Réduction du Bruit)
Sur Windows, le File Integrity Monitoring (FIM) surveille en temps réel les dossiers critiques. Le bruit de fond de l'Event Channel est filtré à la source pour économiser la bande passante et le stockage (Events 5145/5156 ignorés).

XML
<agent_config os="Windows">
  <syscheck>
    <directories check_all="yes" realtime="yes">C:\Users\Administrator</directories>
    <directories check_all="yes">C:\Windows\System32\drivers\etc</directories>
    <ignore>C:\Windows\System32\LogFiles</ignore>
  </syscheck>

  <localfile>
    <location>Security</location>
    <log_format>eventchannel</log_format>
    <query>Event/System[EventID != 5145 and EventID != 5156]</query>
  </localfile>
</agent_config>

B. Baseline Linux
Sur les environnements Linux, le dossier /etc est surveillé en temps réel (realtime="yes") pour détecter toute altération de configuration des services critiques (Proxy, DB).

XML
<agent_config os="Linux">
  <syscheck>
    <directories check_all="yes" realtime="yes">/etc</directories>
    <directories check_all="yes">/usr/bin</directories>
    <ignore>/etc/mtab</ignore>
    <ignore>/etc/hosts.deny</ignore>
  </syscheck>
</agent_config>

## 3. Posture de Sécurité & Détection de Vulnérabilités
Le manager (ossec.conf) est configuré pour auditer en continu les failles CVE et évaluer les configurations (SCA) face aux benchmarks CIS.

XML
  <wodle name="syscollector">
    <interval>1h</interval>
    <hardware>yes</hardware>
    <packages>yes</packages>
    <ports all="yes">yes</ports>
  </wodle>

  <vulnerability-detection>
    <enabled>yes</enabled>
    <feed-update-interval>60m</feed-update-interval>
  </vulnerability-detection>

![Dashboard Wazuh HIPAA](screenshots/wazuh/wazuh-02-hipaa-alerts-dashboard.png)

## 4. Capacités SOAR : Remédiation Automatisée (Active Response)
Afin de réduire le temps de réponse (MTTR) lors d'une attaque, Wazuh est couplé aux pare-feux locaux des endpoints.

Scénario d'usage : Mitigation d'attaque Brute Force SSH
Si le SIEM détecte une attaque par force brute réussie ou répétée (Règles 5712, 5720), il ordonne dynamiquement à l'agent ciblé de bloquer l'IP source via son pare-feu local (iptables/ufw) pendant 30 minutes.

XML
  <active-response>
    <command>firewall-drop</command>
    
    <location>local</location>
    
    <rules_id>5712, 5720</rules_id>
    
    <timeout>1800</timeout>
  </active-response>