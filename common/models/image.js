'use strict';

module.exports = function(Image) {
    var Upload = require('s3-uploader');
    Image.upToS3 = function(uri, cb) {
        var client = new Upload('us-resource-west', {
            aws: {
                path: 'open-houz/',
                region: 'us-west-1',
                acl: 'public-read',
                accessKeyId: 'AKIAJ4GNOYBCZBDWBL6A',
                secretAccessKey: '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'
            },

            cleanup: {
                versions: true,
                original: false
            },


            versions: [{
                maxHeight: 100,
                aspect: '1:1',
                format: 'png',
                suffix: '-thumb'
            }, {
                quality: 80,
                format: 'jpg'
            }]
        });
        client.upload(uri, {}, function(err, versions, meta) {
            if (err) {
                return false;
                throw err;
            }

            var imageUrl = "";
            var imageUrlThumb = "";
            versions.forEach(function(image, callback) {
                if (imageUrl == "") {
                    imageUrl = image.url;
                } else {
                    imageUrlThumb = image.url;
                }
            });

            cb(null, {
                url: imageUrl,
                urlThumb: imageUrlThumb
            });
        });
    }
    Image.uploads = function(content, cb) {
        var imagePath = "./server/storage/images/out.jpg";
        require("fs").writeFile(imagePath, content, 'base64', function(err) {
            if (err) {
                console.log(err);
            } else {
                Image.upToS3(imagePath, function(err, data) {
                    cb(null, {
                        url: data.url,
                        urlThumb: data.urlThumb
                    });
                });
            }
        });

    }

    Image.remoteMethod('uploads', {
        accepts: [
            { arg: 'content', type: 'String' }
        ],
        returns: [
            { arg: 'data', type: 'Object' }
        ],
        http: { path: '/uploads', verb: 'post' }
    });
};
