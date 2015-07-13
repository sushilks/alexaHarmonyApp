# alexaHarmonyApp
An application allowing Amazon Echo (Alexa) to directly control Harmony Remote control

## What is it
--------------
A server that allows your Amazon Echo (Alexa) to communicate with your Harmony Remote control.
It can be easily configure to carry out scripting of commands to send to your remote.


## Pre-requiste
----------------
Latest Node.js

## Installation
----------------
Git checkout the repository
run the follwoing command
```
npm install
```

### Create Certificates
Follow the instruction from amazong for creating a self-signed certificate
https://developer.amazon.com/appsandservices/solutions/alexa/alexa-skills-kit/docs/testing-an-alexa-skill#create-a-private-key-and-self-signed-certificate-for-testing

Put the created certificate in ./cert directory


### Configure the Application
Create the application on amazon and copy the application id for it.
Modify the variables at the top of the file "remote_conf.js"
   hub_ip : IP address of the harmony hub.
   app_id : Application ID as registered on amazon.

### Run the server
>node server.js
Listening on port 443

### Point your browser to the server
https://xx.yy.xx.yy/remote

The resulting page will show you the "Intent Schema" and "Sample Utterances"
You will need to use this to configure the application on amazon.



## Example Usages
----------------
This was how I programed the remote for my use case, it's fairly easy to customize it.

### Direct commands to devices

Alexa tell remote to increase volume by 5

Alexa tell remote to decrease volume by 2

Alexa tell remote to mute

Alexa tell remote to turn the TV off

### Activity commands

Alexa tell remote to start Movie

Alexa tell remote to start Music

Alexa tell remote to power everything off
