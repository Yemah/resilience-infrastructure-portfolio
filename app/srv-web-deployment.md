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
2. Intégration Zero-Trust (Consommation des Headers Authelia)
L'application Web n'a pas d'écran de connexion propre. Elle fait une confiance aveugle au Reverse Proxy Nginx qui a déjà vérifié le MFA via Authelia. Node.js se contente de lire les headers sécurisés injectés par le proxy pour identifier l'utilisateur et ses groupes Active Directory.

JavaScript
// Extraction sécurisée de l'identité via les Headers injectés par Nginx
app.use((req, res, next) => {
    req.medecin = {
        username: req.headers['remote-user'] || 'Inconnu',
        name: req.headers['remote-name'] || 'Utilisateur Non Authentifié',
        groups: req.headers['remote-groups'] || ''
    };
    next();
});
3. Contrôle d'Accès Basé sur les Rôles (RBAC)
Une fois l'identité transmise par l'Active Directory, l'API backend vérifie les droits avant toute modification de données (HDS).

JavaScript
// Protection de la route de création de dossier patient
app.post('/api/patients', async (req, res) => {
    const groupes = req.medecin.groups || '';
    
    // Seuls les Médecins et le personnel Administratif ont les droits d'écriture
    if (!groupes.includes('GS_Medecins') && !groupes.includes('GS_Administratifs')) {
        return res.status(403).json({ success: false, message: 'Accès refusé' });
    }
    // ... Logique d'insertion Oracle ...
});

<p align="center">
  <img src="screenshots/web-app/clinique-web_GUI.PNG" width="700">
</p>
