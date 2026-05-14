# Infrastructure de Données : Oracle 21c (HDS)

La gestion des dossiers patients est assurée par une base de données **Oracle 21c XE** hébergée sur `SRV-ORACLE-DB-01` (Oracle Linux 9). L'architecture a été durcie pour respecter les normes de sécurité liées à l'hébergement de données de santé (HDS).

## 1. Principe de Moindre Privilège & Comptes de Service
Pour réduire la surface d'attaque, tous les comptes systèmes par défaut d'Oracle ont été verrouillés (`LOCKED`). La base de données ne contient que les comptes strictement nécessaires à l'exploitation et à la supervision.

```sql
SQL> SELECT username, account_status FROM dba_users WHERE default_tablespace NOT IN ('SYSTEM', 'SYSAUX');

USERNAME                       ACCOUNT_STATUS
------------------------------ ----------------
C##ZBX_MONITOR                 OPEN             -- Compte de supervision (Zabbix)
CLINIQUE_APP                   OPEN             -- Compte de service de l'application Node.js
MDDATA                         LOCKED           -- Verrouillé
ORDSYS                         LOCKED           -- Verrouillé
-- [20+ autres comptes systèmes verrouillés]
```

## 2. Isolation du Stockage (Tablespace Dédié)
Les données médicales ne sont pas stockées dans les espaces de données par défaut. Un fichier de données dédié de 1 Go (clinique_data01.dbf) a été provisionné pour isoler les données de l'application et prévenir la saturation du système.

```Plaintext
NAME                                         TAILLE_MB
-------------------------------------------- ----------
/opt/oracle/oradata/XE/system01.dbf          1360
/opt/oracle/oradata/XE/sysaux01.dbf          1020
/opt/oracle/oradata/XE/clinique_data01.dbf   1024  <-- Tablespace Métier
```
## 3. Configuration du Listener Réseau
Le Listener Oracle écoute sur le port standard TCP:1521. L'accès à ce port est strictement filtré par le pare-feu OPNsense, n'autorisant que l'adresse IP du SRV-WEB-01 en provenance de la DMZ.

```Ini, TOML
# /opt/oracle/homes/OraDBHome21cXE/network/admin/listener.ora
LISTENER =
  (DESCRIPTION_LIST =
    (DESCRIPTION =
      (ADDRESS = (PROTOCOL = TCP)(HOST = 0.0.0.0)(PORT = 1521))
      (ADDRESS = (PROTOCOL = IPC)(KEY = EXTPROC1521))
    )
  )
```
## 4. Anonymisation des Données (Conformité RGPD)
Aperçu expurgé de la table des patients. La structure permet l'intégration d'un frontend Web pour la gestion des rendez-vous et la téléconsultation (module Jitsi).

```SQL
SQL> SELECT patient_id, nom, TO_CHAR(date_naissance, 'YYYY') AS annee_naissance FROM CLINIQUE_APP.PATIENTS;

PATIENT_ID NOM        ANNEE_NAISSANCE  EMAIL
---------- ---------- ---------------- -------------------------
4          Lenoir     1980             paul.lenoir@<REDACTED>
5          Labelle    1992             celine.labelle@<REDACTED>
```

![Affichage d'integration du module Jitsi](../../screenshots/web-app/Jitsi-module.png)


