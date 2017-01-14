module.exports = function(Mls) {
    function objToString(obj) {
        var str = '{';
        if (typeof obj == 'object') {

            for (var p in obj) {
                if (obj.hasOwnProperty(p)) {
                    str += p + ':' + objToString(obj[p]) + ',';
                }
            }
        } else {
            if (typeof obj == 'string') {
                return '"' + obj + '"';
            } else {
                return obj + '';
            }
        }
        return str.substring(0, str.length - 1) + "}";
    }

    Mls.addMls = function(mlsId, agentId, startDate, endDate, openTime, closeTime, cb) {
        var https = require('https');
        var options = {
            host: "api.simplyrets.com",
            path: "/properties/" + mlsId,
            auth: "simplyrets:simplyrets"
        };
        https.get(options, function(res) {
            var body = "";
            res.on('data', function(chunk) {
                body += chunk;
            });
            res.on('end', function() {
                var response = JSON.parse(body);
                if (response.message != "Resource does not exist") {
                    var mlsdatas = {
                        yearBuilt: response["property"]["yearBuilt"],
                        bathsFull: response["property"]["bathsFull"],
                        bedrooms: response["property"]["bedrooms"],
                        garageSpaces: response["property"]["garageSpaces"],
                        area: response["property"]["area"],
                        stories: response["property"]["stories"],
                        lotSize: response["property"]["lotSize"],
                        pool: response["property"]["pool"],
                        type: response["property"]["type"],
                        listPrice: response["listPrice"],
                        state: (response["address"]["state"]),
                        city: response["address"]["city"],
                        hoa: response["association"]["fee"],
                        lng: response["geo"]["lng"],
                        lat: response["geo"]["lat"],
                        photos: response["photos"],
                        startDate: startDate,
                        endDate: endDate,
                        openTime: openTime,
                        closeTime: closeTime,
                        agentId: agentId
                    };
                    // console.log("response", response);
                    // console.log("mlsdatas", mlsdatas);
                    Mls.create(mlsdatas, function(err, mls) {
                        if (!err) {
                            console.log("Mls.create(mlsdatas)", err);
                        }
                        cb(null, mls);
                    });
                } else {
                    cb(new Error('Resource does not exist'), null);
                }
            });
        });
    }
    Mls.observe('before save', function updateTimestamp(ctx, next) {
        if (ctx.instance) {
            if (!ctx.instance.id) {
                ctx.instance.created = Math.floor(Date.now() / 1000);
            }
            ctx.instance.modified = Math.floor(Date.now() / 1000);
        } else {
            ctx.data.modified = Math.floor(Date.now() / 1000);
        }
        next();
    });
    Mls.remoteMethod('addMls', {
        accepts: [
            { arg: 'mlsId', type: 'Number', default: 1005252 },
            { arg: 'agentId', type: 'Number', default: 1 },
            { arg: 'startDate', type: 'Number', default: "1484106972" },
            { arg: 'endDate', type: 'Number', default: "1484172972" },
            { arg: 'openTime', type: 'Number', default: 480 },
            { arg: 'closeTime', type: 'Number', default: 720 }
            // {arg: 'mlsId', type: 'Number'},
            // {arg: 'startDate', type: 'Date'},
            // {arg: 'endDate', type: 'Date'},
            // {arg: 'openHour', type: 'Number'},
            // {arg: 'closeHour', type: 'Number'},
        ],
        returns: [
            { type: 'object', root: true },
        ]
    });
};
