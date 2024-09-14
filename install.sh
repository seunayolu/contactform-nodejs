#!/bin/bash

sudo apt update -y
sudo apt install nodejs npm git -y

git clone https://github.com/seunayolu/contactform-nodejs.git

cd contactform-nodejs
sudo npm install
sudo npm start