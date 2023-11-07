app = require("../server/server");
loopback = require("loopback");
const _ = require("lodash");
const moment = require('moment-timezone');
const currentTime = moment().tz('Asia/Kolkata');
var TdDerivatives = loopback.getModel("TdDerivatives");
var globeldatasource = app.dataSources.globeldatasource;
globeldatasource.getProductList((err, response) => {
    if (!_.isEmpty(response)) {
        const listType = response.PRODUCTS;
        for (const type of listType) {
            getIntra(type);
        }
    }
})
function findClosestItem(arr, value, key) {
    let closest = null;
    let index = -1;
    let nearestValue = null;
    arr.forEach((item, i) => {
        if (item[key] > 0) {
            const diff = Math.abs(value - item.value);
            if (closest === null || diff < closest) {
                closest = diff;
                nearestValue = item.value; // Update the nearest value
                index = i;
            }
        }
    });
    return { closest, index, nearestValue };
}
function getIntra(type) {
    globeldatasource.getcurrentIntraday(type, (err, response) => {
        if (_.isEmpty(response)) {
            console.log("error 1");
        } else {
            const currentdata = response;
            const strickPrice = response.AVERAGETRADEDPRICE;
            // Wrap the whole operation in a Promise to handle the asynchronous calls
            const processOptionData = async () => {
                try {
                    const responsedate = await new Promise((resolve, reject) => {
                        globeldatasource.getOptionExpiryDates(type, (err, responsedate) => {
                            if (_.isEmpty(responsedate)) {
                                reject("Data not found");
                            } else {
                                resolve(responsedate);
                            }
                        });
                    });

                    const expirydate = responsedate.EXPIRYDATES[0];

                    const responseOption = await new Promise((resolve, reject) => {
                        globeldatasource.getOptionDataToday(
                            type,
                            expirydate,
                            (err, responseOption) => {
                                if (_.isEmpty(responseOption)) {
                                    reject("Data not found");
                                } else {
                                    resolve(responseOption);
                                }
                            }
                        );
                    });

                    const apiResult = responseOption;
                    const putArr = [];
                    const callArr = [];

                    for (const result of apiResult) {
                        const identi = result.INSTRUMENTIDENTIFIER.split("_");
                        const value = parseInt(identi[4]);
                        if (result.SERVERTIME > 0) {
                            if (identi[3] === "CE") {
                                callArr.push({
                                    ...result,
                                    value,
                                    optionType: identi[3],
                                    optionDate: identi[2],
                                });
                            } else if (identi[3] === "PE") {
                                putArr.push({
                                    ...result,
                                    value,
                                    optionType: identi[3],
                                    optionDate: identi[2],
                                });
                            }
                        }
                    }
                    const currentOptionStrike = strickPrice;
                    const result = findClosestItem(callArr, currentOptionStrike, "value");
                    const index = result.index;
                    const strike = result.nearestValue;

                    if (index !== -1) {
                        let putTotal = 0;
                        let callTotal = 0;
                        for (let i = index - 5; i < index + 5; i++) {
                            putTotal += putArr[i].OPENINTERESTCHANGE;
                            callTotal += callArr[i].OPENINTERESTCHANGE;
                        }
                        const datatoday = {
                            ...currentdata,
                            putTotal,
                            callTotal,
                            strike,
                            ...{ time: moment(currentTime).format('HH:mm'),timeUpdate:moment(currentTime).unix() },
                          };
                        if (!_.isEmpty(datatoday)) {
                            await new Promise((resolve, reject) => {
                                TdDerivatives.create(datatoday, (err, data) => {
                                    if (err) {
                                        console.error(err);
                                        reject(err);
                                    } else {
                                        console.log("Data updated successfully.", type);
                                        resolve();
                                    }
                                });
                            });
                        }
                    }
                } catch (error) {
                    console.error("Error:", error);
                }
            };
            processOptionData();
        }
    });
}
