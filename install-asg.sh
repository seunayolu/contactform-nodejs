#!/bin/bash

# Update the apt repository
sudo apt update -y

# EFS Utils Installation for Ubuntu 24.04

sudo apt -y install git binutils rustc cargo pkg-config libssl-dev
git clone https://github.com/aws/efs-utils
cd efs-utils
./build-deb.sh
sudo apt-get -y install ./build/amazon-efs-utils*deb
cd ~

# Install nodejs npm and mysql-client
sudo apt install nodejs npm git mysql-client -y

# Variable for EFS

EFS_DNS_NAME=fs-0bc07e8d29a0b0eb4.efs.eu-west-1.amazonaws.com

# EFS Mount to the /usr/src/app

echo "$EFS_DNS_NAME:/ /usr/src/app nfs4 nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2 0 0" | sudo tee -a /etc/fstab
sudo systemctl daemon-reload
sudo mount -a

# start the nodejs app

cd /usr/src/app
cd app && sudo npm start