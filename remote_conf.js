module.exports = {
    hub_ip : '',
    app_id : 'amzn1.echo-sdk-ams.app.999999-d0ed-9999-ad00-999999d00ebe',
    channels : [
         {
           intent : 'WatchNBC',
           utterance_name : 'NBC',
           activity: 'Watch Tivo',
           channel: "516"
        },
        {
           intent : 'WatchTBS',
           utterance_name : 'TBS',
           activity: 'Watch Tivo',
           channel: "552"
        }
    ]
};
