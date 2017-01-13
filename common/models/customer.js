'use strict';
var _ = require("underscore");
var fs = require('fs');
var app = require('../../server/server');
module.exports = function(Customer) {
    Customer.observe('before save', function updateTimestamp(ctx, next) {
        if (ctx.instance) {
            ctx.instance.created = Math.floor(Date.now() / 1000);
            ctx.instance.modified = Math.floor(Date.now() / 1000);
            var md5 = require('md5');
            ctx.instance.verificationToken = md5(Date.now());
        } else {
            ctx.data.modified = Math.floor(Date.now() / 1000);
        }
        next();
    });

    Customer.afterRemote('create', function(context, customer, next) {
        if (customer.email != "" && customer.isFacebook == false) {
            var global = require("../utils/global.js");
            var dateFormat = require('dateformat');
            var today_st = dateFormat(new Date(), "fullDate");

            fs.readFile("./common/email_templates/email-confirmation.html", 'utf8', function(err, email_content) {
                if (err) {
                    if (err) {
                        console.log("fs.readFile('./common/email_templates/email-confirmation.html')", err);
                    }
                    next();
                }

                email_content = global.replace_all(email_content, "[[LINK]]", 'https://ohapilb.clearsystems.asia/api/buyers/confirm_email?uid=' + buyer.id + '&token=' + buyer.verificationToken);
                email_content = global.replace_all(email_content, "[[FULLNAME]]", customer.fullname);
                email_content = global.replace_all(email_content, "[[DATE]]", today_st);
                email_content = global.replace_all(email_content, "[[EMAIL]]", customer.email);

                var data_email = {
                    to: customer.email,
                    title: 'Confirmation email!',
                    content: email_content,
                    userId: customer.id,
                    userType: 'customer'
                };

                app.models.Email.create(data_email, function(err, Email) {
                    if (err) {
                        console.log("Agent.afterRemote('create')", err);
                    }
                    next();
                });
            });
        } else {
            next();
        }
    });
    Customer.forgot_password = function(email, cb) {
        var randomstring = require("randomstring");
        var token = randomstring.generate({
            length: 6,
            charset: 'numeric'
        });
        Customer.findOne({ where: { email: email } }, function(err, customer) {
            if (err) {
                cb(err, null);
            } else {
                if (_.isEmpty(customer)) {
                    cb(null, "Cannot find your email in my systems");
                } else {
                    var global = require("../utils/global.js");
                    fs.readFile("./common/email_templates/email-resetpassword.html", 'utf8', function(err, email_content) {
                        if (err) {
                            console.log("fs.readFile('./common/email_templates/email-resetpassword.html')", err);
                            cb(err, null);
                        } else {
                            email_content = global.replace_all(email_content, "[[TOKEN]]", token);
                            if (!_.isEmpty(customer.fullname)) {
                                email_content = global.replace_all(email_content, "[[FULLNAME]]", customer.fullname);
                            } else {
                                email_content = global.replace_all(email_content, "[[FULLNAME]]", "");
                            }
                            customer.resetPasswordToken = token;
                            customer.save(function(err, result) {
                                if (err) {
                                    cb(err, null);
                                } else {
                                    var data_email = {
                                        to: customer.email,
                                        title: 'Reset Password Email!',
                                        content: email_content,
                                        userId: customer.id,
                                        userType: 'customer'
                                    };

                                    app.models.Email.create(data_email, function(err, Email) {
                                        if (err) {
                                            cb(err, null);
                                        } else {
                                            cb(null, "success");
                                        }

                                    });
                                }
                            });
                        }
                    });
                }
            }
        });
    }
    Customer.confirm_email = function(uid, token, redirect, cb) {
        Customer.findOne({
            'id': uid,
            "verificationToken": token
        }, function(err, customer) {
            if (err) {
                cb(err, null);
            } else {

                if (_.isEmpty(customer)) {
                    cb(null, "Not found");
                } else {
                    customer.isVerified = true;
                    customer.verificationToken = '';
                    customer.save(function(err, result) {
                        if (err) {
                            cb(err, null);
                        } else {
                            cb(null, result);
                        }
                    });
                }
            }
        });
    }
    Customer.login_facebook = function(token, cb) {
        var https = require('https');
        var options = "https://graph.facebook.com/me?fields=id,name,email,first_name,last_name,middle_name,birthday,picture.type(large).width(400).height(400)&access_token=" + token;
        https.get(options, function(res) {
            var body = "";
            res.on('data', function(chunk) {
                body += chunk;
            });
            res.on('end', function() {
                var response = JSON.parse(body);
                if (_.isEmpty(response.id)) {
                    cb(null, "token invalid");
                } else {
                    Customer.findOne({ 'username': response.id }, function(err, data) {
                        if (_.isEmpty(data)) {
                            var customerData = {
                                username: response.id,
                                email: response.email,
                                password: "NDAaA8I3J0OHlaDDoRtzpIoR4lZIZ1",
                                fullname: response.first_name + response.middle_name + response.last_name,
                                isFacebook: true,
                                fbToken: token,
                                avatar: response.picture.data.url,
                                isVerified: true
                            };
                            Customer.create(customerData, function(err, customer) {
                                if (err) {
                                    cb(err, null);
                                } else {
                                    Customer.app.models.AccessToken.create({
                                        ttl: "1209600",
                                        userId: customer.id
                                    }, function(err, data) {
                                        cb(null, data);
                                    });
                                }
                            });
                        } else {
                            Customer.app.models.AccessToken.create({
                                ttl: "1209600",
                                created: new Date(),
                                userId: data.id
                            }, function(err, data) {
                                cb(null, data);
                            });
                        }
                    });
                }
            });
        });
    }
    Customer.change_password = function(email, password, token, cb) {
        Customer.findOne({ where: { email: email } }, function(err, customer) {
            if (err) {
                cb(err, null);
            } else {
                if (_.isEmpty(customer)) {
                    cb(null, "Cannot find your email in my systems");
                } else {
                    if ((token == customer.resetPasswordToken) && (token != "")) {
                        customer.password = password;
                        customer.resetPasswordToken = "";
                        customer.save(function(err, result) {
                            if (err) {
                                cb(err, null);
                            } else {
                                cb(null, "success");
                            }
                        });
                    } else {
                        cb(null, "Token invalid");
                    }
                }
            }
        });
    }
    Customer.remoteMethod('confirm_email', {
        accepts: [
            { arg: 'uid', type: 'Number' },
            { arg: 'token', type: 'String' },
            { arg: 'redirect', type: 'String' }
        ],
        http: { verb: 'Get' },
        returns: [
            { root: true, type: 'Object' },
        ]
    });
    Customer.remoteMethod('forgot_password', {
        accepts: [
            { arg: 'email', type: 'String' }
        ],
        returns: [
            { arg: 'data', type: 'Object' },
        ]
    });
    Customer.remoteMethod('change_password', {
        accepts: [
            { arg: 'email', type: 'String' },
            { arg: 'password', type: 'String' },
            { arg: 'token', type: 'String' }
        ],
        returns: [
            { arg: 'data', type: 'Object' }
        ]
    });
    Customer.remoteMethod('login_facebook', {
        accepts: [
            { arg: 'token', type: 'String' }
        ],
        returns: [
            { root: true, type: 'Object' },
        ]
    });
};
