# Preuve de Concept : Haute Disponibilité (HA) & Segmentation Réseau

Ce document démontre l'implémentation technique du cluster pare-feu au sein de la Clinique Le Chatelet. L'objectif est de garantir une **disponibilité à 99.99%** et une **isolation stricte** des flux (HDS/HIPAA).

## 1. État du Cluster CARP (Common Address Redundancy Protocol)
Le cluster est composé de deux nœuds OPNsense en mode Actif/Passif. Les adresses IP virtuelles (VIP) basculent instantanément en cas de défaillance matérielle.

**Vérification sur OPNsense-FW1 (Nœud Actif / Master) :**
L'`advskew` est à 0, le FW1 porte le rôle `MASTER` pour l'ensemble des VLANs.
```bash
root@opnsense-fw1:~ # ifconfig | grep -A 2 -i 'carp'
        carp: MASTER vhid 11 advbase 1 advskew 0
              peer 224.0.0.18 peer6 ff02::12
        vlan: 111 vlanproto: 802.1q vlanpcp: 0 parent interface: vmx1
--
        carp: MASTER vhid 33 advbase 1 advskew 0
              peer 224.0.0.18 peer6 ff02::12
        vlan: 333 vlanproto: 802.1q vlanpcp: 0 parent interface: vmx1
# [TRONQUÉ POUR LISIBILITÉ : Idem pour VLAN 222, 444, 555]



**Vérification sur OPNsense-FW2 (Nœud Passif / Backup) :**
L'`advskew` est configuré à 100 pour garantir qu'il reste en écoute (BACKUP).
```bash
root@OPNsense-FW2:~ # ifconfig | grep -A 2 -i 'carp'
        carp: BACKUP vhid 11 advbase 1 advskew 100
              peer 224.0.0.18 peer6 ff02::12
        vlan: 111 vlanproto: 802.1q vlanpcp: 0 parent interface: vmx1

<p align="center">
  <img src="screenshots/opnsense/opnsense-01-carp-status.PNG" width="700">
</p>

## 2. Synchronisation d'État (Stateful Failover via pfSync)
Pour garantir qu'aucune session TCP (ex: transfert de dossier patient) ne soit interrompue lors d'une bascule, pfSync réplique la table d'état en temps réel sur un lien dédié (10.0.0.0/30).

```bash
root@opnsense-fw1:~ # ifconfig pfsync0
pfsync0: flags=1000041<UP,RUNNING,LOWER_UP> metric 0 mtu 1500
        syncdev: vmx2 syncpeer: 10.0.0.2 maxupd: 128 defer: off version: 1400
        syncok: 1     # <--- PROUVE QUE LA RÉPLICATION EST ACTIVE ET FONCTIONNELLE
        groups: pfsync

## 3. Segmentation VLAN (Norme 802.1Q)
Le réseau est micro-segmenté pour limiter la surface d'attaque et bloquer les mouvements latéraux (Mitigation Ransomware).

```bash
root@opnsense-fw1:~ # ifconfig | grep -A 2 '^vlan'
vlan0.111: description: VLAN_SRV (opt2)       # Serveurs critiques (SIEM, AD, BDD)
vlan0.222: description: VLAN_CLIENT (opt3)    # Postes de travail médicaux
vlan0.333: description: VLAN_DMZ (opt4)       # Reverse Proxy Web isolé
vlan0.444: description: VLAN_BACKUP (opt5)    # Réseau de sauvegarde (Sanctuarisé)
vlan0.555: description: VLAN_GUEST (opt6)     # WiFi Patients (Accès Internet Only)
vlan0.999: description: VLAN_MGMT (opt9)      # Administration IT Out-of-Band

## 4. Statistiques du Moteur de Filtrage (pf)
Le pare-feu applique une politique de Default Deny (Tout ce qui n'est pas explicitement autorisé est bloqué et tracé).

```bash
root@opnsense-fw1:~ # pfctl -s info
State Table                          Total             Rate
  current entries                    15981
  searches                       271652786         3441.2/s
Counters
  match                           22781388          288.6/s


![Demo Failover OPNsense](screenshots/opnsense/failover-demo.gif)