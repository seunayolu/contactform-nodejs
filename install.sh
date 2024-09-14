#!/bin/bash

# EFS Utils Installation for Ubuntu 24.04

sudo apt update -y
sudo apt -y install git binutils rustc cargo pkg-config libssl-dev
git clone https://github.com/aws/efs-utils
cd efs-utils
./build-deb.sh
sudo apt-get -y install ./build/amazon-efs-utils*deb
cd ~

sudo mkdir -p /usr/src/app

# Variable for EFS

EFS_DNS_NAME=fs-02accc65a4054a881.efs.eu-west-1.amazonaws.com

# EFS Mount to the /usr/src/app

sudo mount -t nfs4 -o nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2,noresvport "$EFS_DNS_NAME":/ /usr/src/app

# Install nodejs npm and mysql-client
sudo apt install nodejs npm git mysql-client -y

# Clone nodejs github repo

git clone https://github.com/seunayolu/contactform-nodejs.git

# copy nodejs file to the usr/src/app folder

sudo cp -r contactform-nodejs/* /usr/src/app

# Install the necessary dependencies and start the nodejs app

cd /usr/src/app
sudo npm install
cd app && sudo npm start



