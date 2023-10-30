const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });

const sendEmail = (receiverEmail, subject, mailbody, fromEmail = 'moverstrip@gmail.com', receiverName, fromName, attachments, addbcc, addCC) => {
    var params = {
        Destination: {
            ToAddresses: [
                receiverEmail,
            ]
        },
        Message: {
            Body: {
                Html: {
                    Charset: "UTF-8",
                    Data: mailbody
                },
                Text: {
                    Charset: "UTF-8",
                    Data: mailbody
                }
            },
            Subject: {
                Charset: 'UTF-8',
                Data: subject
            }
        },
        Source: fromEmail, /* required */
        ReplyToAddresses: [fromEmail],
    };

    // Create the promise and SES service object
    var sendPromise = new AWS.SES({ apiVersion: '2010-12-01' }).sendEmail(params).promise();

    // Handle promise's fulfilled/rejected states
    sendPromise.then(
        function (data) {
            console.log(data.MessageId);
        }).catch(
            function (err) {
                console.error(err, err.stack);
            });
}
module.exports = { sendEmail }