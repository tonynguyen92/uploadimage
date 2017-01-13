module.exports = function(Email) {
    Email.observe('before save', function updateTimestamp(ctx, next) {
        if (ctx.instance) {
            ctx.instance.created = Math.floor(Date.now() / 1000);
            ctx.instance.modified = Math.floor(Date.now() / 1000);
        } else {
            ctx.data.modified = Math.floor(Date.now() / 1000);
        }
        next();
    });
    //
    // Email.observebk('after save', function (ctx, next) {
    //   var aws = require('aws-sdk');
    //   aws.config.loadFromPath('common/models/email-config.json');
    //   var ses = new aws.SES({apiVersion: '2010-12-01'});
    //
    //   var to = [ctx.instance.to];
    //
    //   var from = 'support@clearsystems.asia';
    //
    //   ses.sendEmail(
    //     {
    //       Source: from,
    //       Destination: {ToAddresses: to},
    //       Message: {
    //         Subject: {
    //           Data: ctx.instance.title
    //         },
    //         Body: {
    //           Html: {
    //             Data: ctx.instance.content,
    //             Charset: "utf-8"
    //           }
    //         }
    //       }
    //     }, function (err, data) {
    //       if (err){
    //         console.log("Email.observe('after save')", err);
    //       }
    //       next();
    //     });
    // });

    Email.observe('after save', function(ctx, next) {
        var mandrill = require('mandrill-api/mandrill');
        var configMandrill = {
            "accessKeyId": "AKIAIF2T7OB62M57ZETQ",
            "secretAccessKey": "Aj0U+PP5ETu8iXJgYeA5t75YsuAvmwUAL5lYFBfl86Qu",
            "region": "us-west-2",
            "mandrill_key": "lGoTvCDQ5D_7BjBtpmYBmQ",
            "mandrill_url": "https://mandrillapp.com/api/1.0/messages/send.json",
            "mandrill_default_from": "no-reply@clearsystems.asia",
            "mandrill_default_name": "OPENHOUZ",
            "mandrill_reply_to": "support@clearsystems.asia",
            "mandrill_reply_name": "Support Center"
        };


        var mandrill_client = new mandrill.Mandrill(configMandrill.mandrill_key);

        var message = {
            to: [],
            headers: {}
        };
        message.important = false;
        message.subject = ctx.instance.title;
        message.html = ctx.instance.content;
        message.from_email = configMandrill.mandrill_default_from;
        message.from_name = configMandrill.mandrill_default_name;

        var to = {};
        to.type = "to";
        to.email = ctx.instance.to;

        message.to.push(to);

        message.headers["Reply-To"] = configMandrill.mandrill_reply_to;


        var async = false;
        var ip_pool = "Main Pool";

        var moment = require('moment-timezone');
        var send_at = moment().tz("UTC").format("YYYY-MM-DD hh:mm:ss");

        mandrill_client.messages.send({
            "message": message,
            "async": async,
            "ip_pool": ip_pool,
            "send_at": send_at
        }, function(result) {
            console.log("=>>>>>> Email.observe('after save')", result);
            next();
        }, function(e) {
            // Mandrill returns the error as an object with name and message keys
            console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
            // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'

            next();
        });

    });

};
