'use strict';
var alexa = require('alexa-app'),
    HarmonyUtils = require('harmony-hub-util'),
    harmony_clients = {},
    conf = require('./remote_conf.js'),
    hub_ip = conf.hub_ip,
    app_id = conf.app_id;


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

app.intent('WatchNBC',
      {
          "slots" : {},
          "utterances" : ["{to|} watch nbc"]
      },
      function (req, res) {
          res.say('Turning on NBC!');
          console.log('Turning on NBC!');
          execActivity('Watch Tivo', function (res) {
              console.log("Command to Watch Tivo executed with result : " + res);
          });
          execCmd('Tivo', 'NumericBasic', 5, function (res) {
              console.log("Command Tivo NumericBasic 5 executed with result : " + res);
          });
          execCmd('Tivo', 'NumericBasic', 1, function (res) {
              console.log("Command Tivo NumericBasic 1 executed with result : " + res);
          });
          execCmd('Tivo', 'NumericBasic', 6, function (res) {
              console.log("Command Tivo NumericBasic 6 executed with result : " + res);
          });
      });

app.intent('WatchTBS',
      {
          "slots" : {},
          "utterances" : ["{to|} watch tbs"]
      },
      function (req, res) {
          res.say('Turning on TBS!');
          console.log('Turning on TBS!');
          execActivity('Watch Tivo', function (res) {
              console.log("Command to Watch Tivo executed with result : " + res);
          });
          execCmd('Tivo', 'NumericBasic', 5, function (res) {
              console.log("Command Tivo NumericBasic 5 executed with result : " + res);
          });
          execCmd('Tivo', 'NumericBasic', 5, function (res) {
              console.log("Command Tivo NumericBasic 5 executed with result : " + res);
          });
          execCmd('Tivo', 'NumericBasic', 2, function (res) {
              console.log("Command Tivo NumericBasic 2 executed with result : " + res);
          });
      });


module.exports = app;
