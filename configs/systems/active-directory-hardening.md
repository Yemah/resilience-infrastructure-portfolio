Markdown
# Infrastructure Active Directory (Tier 0) : Durcissement et Haute Disponibilité

L'Active Directory (AD DS) constitue le cœur de confiance (Tier 0) de la Clinique Le Châtelet. Il centralise les identités, applique la conformité des postes de travail via les GPO, et agit comme fournisseur d'identité sécurisé pour la passerelle Zero-Trust (Authelia).

## 1. Topologie et Haute Disponibilité (FSMO & Réplication)
Le domaine `clinique-chatelet.local` fonctionne au niveau fonctionnel **Windows Server 2016**. Pour garantir la résilience de l'authentification, l'annuaire est répliqué sur deux contrôleurs de domaine (DC1 et DC2).

**Répartition des rôles FSMO (Maîtres d'opérations) :**
Tous les rôles critiques sont centralisés sur le contrôleur principal (DC1), tandis que le Catalogue Global (GC) est répliqué.
```powershell
PS C:\> netdom query fsmo
Contrôleur de schéma            DC1.clinique-chatelet.local
Maître des noms de domaine      DC1.clinique-chatelet.local
Contrôleur domaine princip.     DC1.clinique-chatelet.local
Gestionnaire du pool RID        DC1.clinique-chatelet.local
Maître d’infrastructure         DC1.clinique-chatelet.local
```
**Santé de la réplication (Repadmin) :**
La réplication inter-sites est surveillée. Les derniers rapports n'indiquent aucun échec (0 / 5) avec un delta de synchronisation optimal (moins de 20 minutes) entre DC1 et DC2.

## 2. Modèle d'Administration et Segmentation Logique (OU)**
L'arborescence de l'annuaire a été construite selon un modèle de moindre privilège, séparant strictement les comptes de services, les postes de travail et les utilisateurs métiers.

```Plaintext
Name                      DistinguishedName
----                      -----------------
CLINIQUE_USERS            OU=CLINIQUE_USERS,DC=clinique-chatelet,DC=local
 ├── Administratifs       OU=Administratifs,OU=CLINIQUE_USERS...
 │    ├── Direction
 │    └── Secretariat
 ├── Soignants            OU=Soignants,OU=CLINIQUE_USERS...
 │    ├── Aides-Soignants
 │    └── IDE
 ├── Medecins             OU=Medecins,OU=CLINIQUE_USERS...
 └── IT                   OU=IT,OU=CLINIQUE_USERS...

CLINIQUE_COMPUTERS        OU=CLINIQUE_COMPUTERS,DC=clinique-chatelet,DC=local
 ├── Servers              OU=Servers,OU=CLINIQUE_COMPUTERS...
 └── Workstations         OU=Workstations,OU=CLINIQUE_COMPUTERS...

CLINIQUE_SERVICE_ACCOUNTS OU=CLINIQUE_SERVICE_ACCOUNTS,DC=clinique-chatelet,DC=local
```

![Active Directory Users & Computers - OU](../../screenshots/ad-ds/ADUC-OU.png)

## 3. Stratégie de Sécurité Globale (GPO & Mots de passe)
L'infrastructure s'appuie sur une flotte de Stratégies de Groupe (GPO) dédiées exclusivement au durcissement (Hardening) du système d'information, s'inspirant des recommandations de l'ANSSI.

**GPOs de Durcissement Actives :**

- ***GPO-Security-Disable-SMBv1 :*** Mitigation contre les vers réseau (ex: WannaCry).

- ***GPO-BitLocker-NoTPM :*** Chiffrement obligatoire des disques des postes de travail.

- ***GPO-Security-Audit-Policy :*** Remontée avancée des événements vers le SIEM Wazuh.

- ***GPO-Workstations-Hardening :*** Verrouillage des ports USB et restriction des droits administrateurs locaux.

**Politique de Verrouillage (Mitigation Brute-Force) :**
Pour protéger l'annuaire contre les attaques par force brute ou pulvérisation de mots de passe (Password Spraying), des seuils stricts sont configurés :

```PowerShell
ComplexityEnabled        : True
MinPasswordLength        : 7
LockoutThreshold         : 5 tentatives échouées
LockoutDuration          : 00:30:00 (30 minutes de verrouillage)
LockoutObservationWindow : 00:30:00
```

!Group Policy Mgmt - GPO](../../screenshots/ad-ds/GPMC-GPO.png)

## 4. Sécurisation des Flux d'Authentification (LDAPS)
L'authentification en clair (LDAP, port 389) a été proscrite pour les applications tierces. Les requêtes de la passerelle Authelia vers l'annuaire sont encapsulées dans un tunnel TLS via LDAPS.

Vérification de l'écoute du port sécurisé (636) sur le contrôleur :

```PowerShell
PS C:\> Get-NetTCPConnection -LocalPort 636 -ErrorAction SilentlyContinue | Select-Object LocalAddress, LocalPort, State

LocalAddress LocalPort  State
------------ ---------  -----
0.0.0.0            636 Listen
```

![Autorité de Certification - LDAPS](../../screenshots/ad-ds/ADCS-LDAPS.png)
