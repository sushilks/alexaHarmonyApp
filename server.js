//var hotswap = require('hotswap');
var fs = require('fs');
var path = path = require('path');
var express = require('express');
var alexa = require('alexa-app');
var bodyParser = require('body-parser');
var https = require('https');
var privateKey = fs.readFileSync('./cert/private-key.pem', 'utf8');
var certificate = fs.readFileSync('./cert/certificate.pem', 'utf8');
var credentials = {key: privateKey, cert: certificate,
                   //requestCert: true, rejectUnauthorized: true
                   requestCert: true
                   };

// this code is largely taken from
// https://github.com/matt-kruse/alexa-app-server

// Start up the server
var expressApp = express();
var httpsServer = https.createServer(credentials, expressApp);
var PORT = 443;
expressApp.use(bodyParser.urlencoded({ extended: true }));
expressApp.use(bodyParser.json());
expressApp.set('view engine', 'ejs');

// Register Alexa apps
//register_apps('./','/');
var app = require('./remote.js');
var endpoint = '/remote';
expressApp.post(endpoint,function(req,res) {
    var subject = req.connection.getPeerCertificate().subject;
    app.request(req.body).then(function(response) {
        res.json(response);
    },function(response) {
        res.status(500).send("Server Error");
    });
});
// Configure GET requests to run a debugger UI
expressApp.get(endpoint,function(req,res) {
    var subject = req.connection.getPeerCertificate().subject;
    res.render('test',{"app":app,"schema":app.schema(),"utterances":app.utterances(),"intents":app.intents});
});



// Serve static files
//expressApp.use(express.static('public_html'));

//expressApp.listen(PORT);
httpsServer.listen(PORT);
console.log("Listening on port "+PORT);
