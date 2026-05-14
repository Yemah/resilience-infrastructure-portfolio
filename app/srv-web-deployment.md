# Architecture Applicative : Portail Web Médical (Node.js)

Le portail Web (`SRV-WEB-01`) est l'interface métier utilisée par les médecins. Développé en Node.js (Express), il intègre nativement des mécanismes de contrôle d'accès basés sur les rôles (RBAC) et s'appuie sur le Reverse Proxy pour la délégation d'authentification.

## 1. Déploiement en Service Système (Systemd)
L'application ne tourne pas dans un simple terminal. Elle est gérée par `systemd` pour garantir sa haute disponibilité (redémarrage automatique en cas de crash) et isolée sous un compte utilisateur non-privilégié (`web_admin`).

```ini
# /etc/systemd/system/clinique-app.service
[Unit]
Description=Clinique Le Chatelet - Application Web
After=network.target

[Service]
Type=simple
User=web_admin
WorkingDirectory=/var/www/clinique-app
Environment="NODE_ENV=production"
ExecStart=/home/web_admin/.nvm/versions/node/v20.20.0/bin/node /var/www/clinique-app/server.js
Restart=on-failure
RestartSec=10

## 2. Intégration Zero-Trust (Consommation des Headers Authelia)
L'application Web n'a pas d'écran de connexion propre. Elle fait une confiance aveugle au Reverse Proxy Nginx qui a déjà vérifié le MFA via Authelia. Node.js se contente de lire les headers sécurisés injectés par le proxy pour identifier l'utilisateur et ses groupes Active Directory.
