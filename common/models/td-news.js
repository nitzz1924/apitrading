"use strict";
const request = require("request");
const configt = require("../../server/config.json");
const app = require("../../server/server");
const _ = require("lodash");
module.exports = function (TdNews) {
    TdNews.getNewsData = (date, type, callback) => {
        const currenturl = `https://newsapi.org/v2/everything?q=${type}&from=${date}&sortBy=publishedAt&apiKey=d0a15662f3c54133b4821e0a79410ed6`;
        request(currenturl, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                const jsonData = JSON.parse(body);
                if (_.isEmpty(body)) {
                    callback(null, {
                        StrikePrice: { status: "0", message: "Data not find", Item: [] },
                    });
                } else {
                    callback(null, {
                        StrikePrice: {
                            status: "1",
                            message: "success",
                            Item: jsonData,
                        },
                    });
                }
            } else {
                callback(null, {
                    StrikePrice: { status: "0", message: "Data not find", value: 0 },
                });
            }
        });
    };
};
