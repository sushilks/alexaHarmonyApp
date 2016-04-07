'use strict';
var alexa = require('alexa-app'),
    HarmonyUtils = require('harmony-hub-util'),
    harmony_clients = {},
    conf = require('./remote_conf.js'),
    Q = require('q'),
    hub_ip = conf.hub_ip,
    app_id = conf.app_id,
    MAX_ACTIVITY_WAIT_TIME_MS = 15000;


// Define an alexa-app
var app = new alexa.app('remote');

app.launch(function(req, res) {
    console.log("Launching the application");
});


function execCmdDF(hutils, is_device, dev_or_act, cmd, cnt, fn, res) {
    console.log("execCmd called with cnt = " + cnt + " is_dev " + is_device +
                " dev/act " + dev_or_act + " cmd = " + cmd);
    if (cnt === 0) {
        fn(res);
        hutils.end();
        return;
    }
    hutils.executeCommand(is_device, dev_or_act, cmd).then(function (res) {
        console.log(cnt + ". Command " + cmd + " to device/activity " +
                    dev_or_act + " was executed with result : " + res);
        if (res) {
            setTimeout(function () {
                execCmdDF(hutils, is_device, dev_or_act, cmd, cnt - 1, fn, res);
            }, 100);
        }
    }, function(err) {
        console.log("ERROR Occured " + err);
        console.log("      stack " + err.stack);
    });
}

function execCmd(dev, cmd, cnt, fn, res) {
    new HarmonyUtils(hub_ip).then(function (hutil) {
        execCmdDF(hutil, true, dev, cmd, cnt, fn, res);
    });
}

function execCmdCurrentActivity(cmd, cnt, fn, res) {
    new HarmonyUtils(hub_ip).then(function (hutils) {
        hutils.readCurrentActivity().then(function (current_activity) {
            execCmdDF(hutils, false, current_activity, cmd, cnt, fn, res);
        });
    });
}

/**
 * Waits for a specific activity to be the current activity
 * (assumes the activity has already been executed).
 * 
 * @param {string} hutils - The hutils to use
 * @param {string} act - The activity to wait for
 * @param {number} max_wait_timestamp - The timestamp to give up on waiting
 * @returns deferred promise
 */
function waitForActivity(hutils, act, max_wait_timestamp) {
   var deferred = Q.defer(),
      wait_interval = 3000;
   
   hutils.readCurrentActivity().then(function (current_activity) {
      if (current_activity != act) {
         if (Date.now() > max_wait_timestamp) {
            deferred.reject('Max wait time exceeded waiting for ' + act);
            return;
         }
         console.log(act + ' is not the current activity yet, waiting another ' + wait_interval + 'ms ...');
         setTimeout(function () {
            waitForActivity(hutils, act, max_wait_timestamp).then(function (res) {
               deferred.resolve(res);
            }, function (err) {
               deferred.reject(err);
            });
         }, wait_interval);
      } else {
         console.log(act + ' is now the current activity');
         deferred.resolve(true);
      }
   }, function (err) {
      deferred.reject(err);
   });
   
   return deferred.promise;
}

/**
 * Executes a command for a specific activity, executing and waiting
 * for that activity if needed.
 * 
 * @param {string} act - The activity the command should be executed under
 * @param {string} cmd - The command to execute
 * @param {string} cnt - The count
 */
function execActivityCmd(act, cmd, cnt) {
   new HarmonyUtils(hub_ip).then(function (hutils) {
       hutils.readCurrentActivity().then(function (current_activity) {
          if (current_activity != act) {
             // Need to switch activities and wait
             execActivity(act, function (res) {
                waitForActivity(hutils, act, Date.now() + MAX_ACTIVITY_WAIT_TIME_MS).then(function (res) {
                   execCmdCurrentActivity(cmd, 1, function (res) {
                      hutils.end();
                      console.log('Command executed with result : ' + res);
                   });
                }, function (err) { 
                   console.error(err);
                   hutils.end();
                });
             });
          } else {
             console.log(act + ' is already the current activity, executing command');
             execCmdCurrentActivity(cmd, 1, function (res) {
                console.log('Command executed with result : ' + res);
                hutils.end();
             });
          }
       });
   });
}

function execActivity(act, fn) {
    new HarmonyUtils(hub_ip).then(function (hutils) {
        hutils.executeActivity(act).then(function (res) {
            fn(res);
        });
    });
}

app.pre = function(req, res, type) {
    if (req.applicationId !== app_id) {
        console.log(" Received and invalid applicaiton ID " + req.applicationId);
        res.fail("Invalid applicationId");
    }
};

app.intent('IncreaseVolume',
    {
        "slots" : {'AMOUNT' : 'NUMBER'},
        "utterances" : ["{increase|} volume {by|} {1-9|AMOUNT}"]
    },
    function (req, res) {
        var amt = parseInt(req.slot('AMOUNT'), 10);
        if (isNaN(amt)) {
            amt = 1;
        }
        res.say('Increasing volume by ' + amt);
        console.log('Increasing volume by ' + amt);
        execCmdCurrentActivity('Volume,Volume Up', amt, function (res) {
            console.log("Command Volume UP was executed with result : " + res);
        });
    });
app.intent('DecreaseVolume',
    {
        "slots" : {'AMOUNT' : 'NUMBER'},
        "utterances" : ["{decrease volume|reduce volume|down volume|volume down} {by|} {1-9|AMOUNT}"]
    },
    function (req, res) {
        var amt = parseInt(req.slot('AMOUNT'), 10);
        if (isNaN(amt)) {
            amt = 1;
        }
        res.say('Decreasing volume by ' + amt);
        console.log('Decreasing volume by ' + amt);
        execCmdCurrentActivity('Volume,Volume Down', amt, function (res) {
            console.log("Command Volume Down was executed with result : " + res);
        });
    });

app.intent('MuteVolume',
    {
        "slots" : {},
        "utterances" : ["{mute|quiet|shut up|unmute}"]
    },
    function (req, res) {
        res.say('Muting!');
        console.log('Muting!');
        execCmdCurrentActivity('Volume,Mute', 1, function (res) {
            console.log("Command Mute executed with result : " + res);
        });
    });


app.intent('IncreaseTVVolume',
    {
        "slots" : {'AMOUNT' : 'NUMBER'},
        "utterances" : ["{increase|} TV volume by {1-9|AMOUNT}"]
    },
    function (req, res) {
        var amt = parseInt(req.slot('AMOUNT'), 10);
        if (isNaN(amt)) {
            amt = 1;
        }
        res.say('Increasing TV volume by ' + amt);
        console.log('Increasing volume by ' + amt);
        execCmd('TV', 'VolumeUp', amt, function (res) {
            console.log("Command Volume UP was executed with result : " + res);
        });
    });
app.intent('DecreaseTVVolume',
    {
        "slots" : {'AMOUNT' : 'NUMBER'},
        "utterances" : ["{decrease TV volume|reduce TV volume} by {1-9|AMOUNT}"]
    },
    function (req, res) {
        var amt = parseInt(req.slot('AMOUNT'), 10);
        if (isNaN(amt)) {
            amt = 1;
        }
        res.say('Decreasing TV volume by ' + amt);
        console.log('Decreasing volume by ' + amt);
        execCmd('TV', 'VolumeDown', amt, function (res) {
            console.log("Command Volume Down was executed with result : " + res);
        });
    });

app.intent('MuteTVVolume',
    {
        "slots" : {},
        "utterances" : ["{mute|unmute} {TV|telivision}"]
    },
    function (req, res) {
        res.say('Muting TV!');
        console.log('Muting!');
        execCmd('TV', 'Mute', 1, function (res) {
            console.log("Command Mute executed with result : " + res);
        });
    });


app.intent('TurnOffTV',
    {
        "slots" : {},
        "utterances" : ["{turn the TV off|turn TV off}"]
    },
    function (req, res) {
        res.say('Turning TV off!');
        console.log('Turning TV off!');
        execCmd('TV', 'PowerOff', 1, function (res) {
            console.log("Command TV PowerOff executed with result : " + res);
        });
    });

app.intent('TurnOnTV',
    {
        "slots" : {},
        "utterances" : ["{turn on the TV|turn the TV on|turn on TV|turn TV on}"]
    },
    function (req, res) {
        res.say('Turning TV on!');
        console.log('Turning TV on!');
        execCmd('TV', 'PowerOn', 1, function (res) {
            console.log("Command TV PowerOn executed with result : " + res);
        });
    });

app.intent('TurnOffAmplifier',
    {
        "slots" : {},
        "utterances" : ["{turn the amplifer off|turn amplifier off}"]
    },
    function (req, res) {
        res.say('Turning amplifer off!');
        console.log('Turning amplifier off!');
        execCmd('Amplifier', 'PowerToggle', 1, function (res) {
            console.log("Command for amplifer PowerToggle executed with result : " + res);
        });
    });

app.intent('TurnOnAmplifier',
    {
        "slots" : {},
        "utterances" : ["{turn on the amplifier|turn the amplifier on}"]
    },
    function (req, res) {
        res.say('Toggle power on the amplifier!');
        console.log('Turning amplifier on!');
        execCmd('Amplifier', 'PowerToggle', 1, function (res) {
            console.log("Command Amplifier PowerToggle executed with result : " + res);
        });
    });

app.intent('AmplifierInputNext',
    {
        "slots" : {},
        "utterances" : ["{select next amplifier input}"]
    },
    function (req, res) {
        res.say('selecting next input on amplifier!');
        console.log('Selecting next amplifier input!');
        execCmd('Amplifier', 'InputNext', 1, function (res) {
            console.log("Command Amplifier InputNext executed with result : " + res);
        });
    });


app.intent('SelectChromeCast',
    {
        "slots" : {},
        "utterances" : ["{to|} {select|} {chrome cast|chromecast}"]
    },
    function (req, res) {
        res.say('Selecting Chromecast!');
        console.log('Selecting Chromecast!');
        execCmd('TV', 'InputHdmi3', 1, function (res) {
            console.log("Command TV InputHdmi3 executed with result : " + res);
        });
    });

app.intent('SelectTivo',
    {
        "slots" : {},
        "utterances" : ["{to|} select tivo"]
    },
    function (req, res) {
        res.say('Selecting tivo!');
        console.log('Selecting tivo!');
        execCmd('TV', 'InputHdmi2', 1, function (res) {
            console.log("Command TV InputHdmi2 executed with result : " + res);
        });
    });

app.intent('SelectPlaystation',
    {
        "slots" : {},
        "utterances" : ["{select|} {playstation}"]
    },
    function (req, res) {
        res.say('Selecting ps4!');
        console.log('Selecting ps4!');
        execCmd('TV', 'InputHdmi1', 1, function (res) {
            console.log("Command TV InputHdmi1 executed with result : " + res);
        });
    });

app.intent('TurnOff',
    {
        "slots" : {},
        "utterances" : ["{shutdown|good night|power everything off|power off everything|turn everything off|turn off everything|shut down}"]
    },
    function (req, res) {
        res.say('Turning off everything!');
        console.log('Turning off everythign!');
        execActivity('PowerOff', function (res) {
            console.log("Command to PowerOff executed with result : " + res);
        });
    });


app.intent('Movie',
    {
        "slots" : {},
        "utterances" : ["{movie|start movie|watch movie}"]
    },
    function (req, res) {
        res.say('Turning on Movie Mode!');
        console.log('Turning on Movie Mode!');
        execActivity('Watch a Movie', function (res) {
            console.log("Command to Watch a Movie executed with result : " + res);
        });
    });


app.intent('TIVO',
    {
        "slots" : {},
        "utterances" : ["{tivo|start tivo|watch tivo}"]
    },
    function (req, res) {
        res.say('Turning on Tivo Mode!');
        console.log('Turning on Tivo Mode!');
        execActivity('Watch Tivo', function (res) {
            console.log("Command to Watch Tivo executed with result : " + res);
        });
    });

app.intent('Music',
    {
        "slots" : {},
        "utterances" : ["{music|start music}"]
    },
    function (req, res) {
        res.say('Turning on Music Mode!');
        console.log('Turning on Music Mode!');
        execActivity('Listen to Digital Music', function (res) {
            console.log("Command to Music executed with result : " + res);
        });
    });

/**
 * Creates an intent function for a specific channel configuration
 * 
 * @param {object} channel - The channel configuration to create the function for
 * @returns {function} The channel intent function
 */
function getChannelFunction(channel) {
   return function (req, res) {
      res.say('Turning on ' + channel.utterance_name + '!');
      console.log('Turning on ' + channel.utterance_name + '!');
      var cmd = [], channel_chars = channel.channel.split(""), j;
      for (j = 0; j < channel_chars.length; j++) { 
         cmd[j] = 'NumericBasic,' + channel_chars[j];
      }
      execActivityCmd(channel.activity, cmd, 1);
   }
}

if (conf.channels) {
   // Iterate through the configured channels and create intents for them
   var channel_index;
   for (channel_index = 0; channel_index < conf.channels.length; channel_index++) {
      var channel = conf.channels[channel_index];
      app.intent(channel.intent,
            {
                "slots" : {},
                "utterances" : ["{to|} watch " + channel.utterance_name]
            },
            getChannelFunction(channel));
      console.log('Added intent ' + channel.intent + 
            ' with utterance ' + channel.utterance_name + 
            ' which triggers channel ' + channel.channel );
   }
}

module.exports = app;
