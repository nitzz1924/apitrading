"use strict";
const request = require("request");
const configt = require("../../server/config.json");
const app = require("../../server/server");
const _ = require("lodash");
module.exports = function (TdNews) {
    TdNews.getNewsData = (type, callback) => {
        const currenturl = `https://newsapi.org/v2/top-headlines?country=in&category=${type}&apiKey=d0a15662f3c54133b4821e0a79410ed6`;
        const options = {
            url: currenturl,
            headers: {
                'User-Agent': 'tradsathi-api/1.0', // Replace 'YourApp/1.0' with your application name and version
            },
        };
        request(options, function (error, response, body) {
            const jsonData = JSON.parse(body);
            console.log(JSON.stringify(body));
            if (_.isEmpty(body)) {
                callback(null, {
                    dataList: { status: "0", message: `"Data not find"`, Item: [] },
                });
            } else {
                callback(null, {
                    dataList: {
                        status: "1",
                        message: "success",
                        Item: jsonData.articles,
                    },
                });
            }
        });
    };
};
