# Preuve de Concept : Architecture Zero Trust & MFA (Authelia + Nginx)

Dans le cadre du projet Résilience pour la Clinique Le Chatelet, l'application médicale (hébergeant des données de santé - HDS) a été portée sur le Web. 
Pour répondre aux exigences strictes de sécurité (NIS2, RGPD), cette application n'est jamais exposée directement sur Internet. Elle est protégée par une passerelle **Zero Trust** combinant un Reverse Proxy (Nginx) et un Fournisseur d'Identité (Authelia).

## 1. Le Reverse Proxy (Nginx) : Le point d'entrée unique
Nginx gère la terminaison TLS (HTTPS) et bloque toute requête non authentifiée. Avant de transmettre le flux à l'application métier (`172.16.33.20`), Nginx interroge le moteur Authelia via le module `auth_request`.

```nginx
# Extrait de /etc/nginx/sites-enabled/portal.clinique-chatelet.local
server {
    listen 443 ssl http2;
    server_name portal.clinique-chatelet.local;
    ssl_certificate /etc/nginx/ssl/portal.crt;
    # ssl_certificate_key <REDACTED>

    # Redirection vers notre application Web Sécurisée (SRV-WEB-01)
    location / {
        # Interrogation d'Authelia en arrière-plan
        auth_request /authelia/api/verify;
        
        # Si non authentifié (401), redirection vers le portail MFA
        error_page 401 =302 https://$server_name/authelia/?rd=$scheme://$http_host$request_uri;

        # Transfert vers l'application métier si l'authentification réussit
        proxy_pass [http://172.16.33.20:8080](http://172.16.33.20:8080);
        proxy_set_header X-Real-IP $remote_addr;
    }
}

<p align="center">
  <img src="screenshots/authelia/authelia_MFA-login.png" width="700">
</p>

## 2. Le Moteur d'Authentification (Authelia) : MFA & Active Directory
Authelia est configuré pour exiger systématiquement un Second Facteur (TOTP/WebAuthn) pour accéder au portail clinique. L'authentification primaire est déléguée à l'Active Directory interne via LDAPS.

YAML
# Extrait expurgé de /etc/authelia/configuration.yml
totp:
  issuer: 'Clinique Le Chatelet'
  algorithm: sha1

access_control:
  default_policy: deny
  rules:
    # Blocage strict : 2FA obligatoire pour le portail médical
    - domain: 'portal.clinique-chatelet.local'
      policy: two_factor

authentication_backend:
  ldap:
    implementation: activedirectory
    address: 'ldaps://ldap.clinique-chatelet.local:636'
    base_dn: 'DC=clinique-chatelet,DC=local'
    user: 'CN=svc_authelia,OU=CLINIQUE_SERVICE_ACCOUNTS,DC=clinique-chatelet,DC=local'
    # password: <REDACTED_AD_SVC_PASSWORD>

    # [SECURITE] Filtre empêchant les comptes AD désactivés de se connecter
    users_filter: '(&({username_attribute}={input})(objectClass=user)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))'

<p align="center">
  <img src="screenshots/authelia/authelia_MFA-TOTP.png" width="700">
</p>

## 3. Communication sécurisée (Mailpit)
Pour l'enregistrement des nouveaux employés et la configuration de leur second facteur, Authelia communique de manière chiffrée avec un relais SMTP local (Mailpit dans cet environnement de laboratoire)

<p align="center">
  <img src="screenshots/authelia/Notif-Mailpit_MFA-Authelia.png" width="700">
</p>