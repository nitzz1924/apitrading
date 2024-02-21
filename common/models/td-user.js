'use strict';
const app = require('../../server/server');
const loopback = require("loopback");
module.exports = function (Tduser) {
    var smsService = app.dataSources.smsService;
    Tduser.sendphoneverificationCode = sendPhoneVerificationCode;
    Tduser.sendOTP = sendOTP;
    Tduser.verifyOTP = verifyOTP;
    Tduser.testSMS = testSMS;
    Tduser.resetUserPassword = resetUserPassword;
    Tduser.resetUserPassFromPanel = resetUserPassFromPanel;
    Tduser.changeUserStatus = changeUserStatus;
    Tduser.generateAccessToken = generateAccessToken;
    function sendPhoneVerificationCode(currentUser, cb) {
        if (!currentUser) {
            cb('user not found', null);
            return console.log(`User info not Present .. User : ${currentUser}`);
        }
        let code = Math.floor(1000 + Math.random() * 9000).toString().substring(-2);
        // eslint-disable-next-line max-len
        //DLT Message Checked Message Send
        var dltTemplateId = "1207166157960258515";
        let message = `OTP ${code} To verify tour contact on Moverstrip.`;
        smsService.sendSMS(currentUser.username, message, dltTemplateId, (err, response) => {
            if (err) throw err; // error making request
            if (response.error) {
                console.error('> response error: ' + response.error.stack);
            }
            console.log('SMS sent', response);
        });

        currentUser.verificationCode = code;
        currentUser.codeCreatedAt = Date.now();
        // var expiryTime = new Date;
        // expiryTime.setMinutes(expiryTime.getMinutes() + 100);
        // currentUser.codeexpiryAt = expiryTime;
        currentUser.save(function (err, res) { });
        // eslint-disable-next-line max-len
        console.log('Phone verification code was sent for ' + currentUser.id, ' at ', new Date());
        cb(null, 'SMS Sent');
    }
    function resetUserPassFromPanel(userId, dedug, cb) {
        Tduser.findOne({
            where: {
                id: userId
            }
        }, function (err, userObj) {
            if (err) cb(null, err);
            if (!userObj) {
                cb("User is not found", null);
            } else {
                let newPassword = Math.random().toString(12).substring(2, 8);
                userObj.password = newPassword;
                Tduser.patchOrCreate(userObj);
                //DLT Message Checked Message Send
                var dltTemplateId = "1207166157900066388";
                let message = `Moverstrip Password has been reset. Please note new password ${newPassword}.`
                smsService.sendSMS(userObj.username, message, dltTemplateId, (err, response) => {
                    if (err) throw err; //error making request
                    if (response.error) {
                        console.error('> response error: ' + response.error.stack);
                    }
                    console.log("SMS sent", response)
                });
                cb(null, `Password reset successfully.${(dedug) ? newPassword : ""}`);
            }
        });
    };

    function changeUserStatus(userId, newStatus, cb) {
        Tduser.findOne({
            where: {
                id: userId
            }
        }, function (err, userObj) {
            if (err) cb(null, err);
            if (!userObj) {
                cb("User is not found", null);
            } else if (userObj.status == newStatus) {
                cb("The old status same as given status", null);
            } else {
                //DLT SMS Checked Message Send
                var dltTemplateId = "1207162375011147858";
                let message = `Dear Moverstrip subscriber, Your account is ${(newStatus == "I" ? "de-activated" : "activated")}`
                smsService.sendSMS(userObj.username, message, dltTemplateId, (err, response) => {
                    if (err) throw err; //error making request
                    if (response.error) {
                        console.error('> response error: ' + response.error.stack);
                    }
                    console.log("SMS sent", response)
                });
                userObj.status = newStatus;
                Tduser.patchOrCreate(userObj);
                cb(null, "Status changed successfully.");
            }
        });
    };

    function sendOTP(handle, mode, cb) {
        if (mode == 'phone') {
            Tduser.findOne({
                where: {
                    username: handle,
                },
            }, function (err, userObj) {
                if (err) cb(err, null);
                if (!userObj) cb('User record not found', null);
                Tduser.sendphoneverificationCode(userObj, function (err, data) {
                    cb(null, data);
                });
            });
        } else if (mode == 'email') {
            Tduser.findOne({
                where: {
                    email: handle,
                },
            }, function (err, userObj) {
                if (err) cb(null, err);
                if (!userObj) cb('User record not found', null);
                Tduser.sendEmailOtp(userObj, function (err, data) {
                    cb(null, data);
                });
            });
        } else {
            cb('Invalid Mode', null);
        }
    }

    function resetUserPassword(handle, otp, newPassword, cb) {
        Tduser.findOne({
            where: {
                or: [{
                    username: handle,
                }, {
                    email: handle,
                }],
            },
        }, function (err, userObj) {
            if (err) cb(null, err);
            if (!userObj) {
                cb('User is not found', null);
            } else if (userObj.verificationCode != otp) {
                cb('Provided OTP is not found', null);
            } else {
                userObj.password = newPassword;
                userObj.save();
                cb(null, 'Password reset successfully.');
            }
        });
    };

    function verifyOTP(phone, otp, cb) {
        var whereFilter = {
            username: phone,
            verificationCode: otp,
        };
        console.log(`whereFilter: ${JSON.stringify(whereFilter)}`);
        Tduser.findOne({
            where: whereFilter,
        }, function (err, userObj) {
            if (err) cb(null, err);
            if (!userObj) {
                console.log(`User record not found: ${JSON.stringify(whereFilter)}`);
                cb('User record not found', null);
            } else {
                console.log(`User found: ${JSON.stringify(whereFilter)}`);
                userObj.phoneVerified = true;
                // Mark User as Active
                userObj.status = 'A';
                userObj.save();
                cb(null, 'User record verified successfully');
            }
        });
    };
    function testSMS(phone, message, cb) {
        var dltTemplateId = "1207161762420476512";
        smsService.sendSMS(phone, message, dltTemplateId, (err, response) => {
            if (err) throw err; //error making request
            if (response.error) {
                console.error('> response error: ' + response.error.stack);
            }
            console.log("SMS sent", response);
            cb()
        });
    };
    function generateAccessToken(username, cb) {
        var AccessToken = loopback.getModel("AccessToken");
        try {
            AccessToken.createAccessTokenId((e, token) => {
                Tduser.findOne({ where: { username } }).then(user => {
                    AccessToken.create({
                        id: token,
                        userId: user.id,
                        ttl: 1209600,
                        created: new Date()
                    }).then(r => {
                        console.log(r)
                        cb(null, r)
                    })
                })
            });

        } catch (error) {
            console.log(error)
            cb(error)
        }

    };
    function sendNotification(registrationTokens, cb) {
        var payload = {
            notification: {
                title: "Account Deposit",
                body: "A deposit to your savings account has just cleared."
            }
        };

        var options = {
            priority: "normal",
            timeToLive: 60 * 60
        };

        admin.messaging().sendToDevice(registrationTokens[0], payload, options)
            .then(function (response) {
                console.log("Successfully sent message:", response);
            })
            .catch(function (error) {
                console.log("Error sending message:", error);
            });
    }
};
