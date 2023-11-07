const app = require("../server/server");
const loopback = require("loopback");
const _ = require("lodash");
const moment = require('moment-timezone');
const currentTime = moment().tz('Asia/Kolkata');
const TdDerivatives = loopback.getModel("TdDerivatives");
const globeldatasource = app.dataSources.globeldatasource;
async function processProduct() {
  try {
    const productList = await new Promise((resolve, reject) => {
      globeldatasource.getProductList((err, response) => {
        if (err || _.isEmpty(response.PRODUCTS)) {
          reject("Error fetching product list");
          processProduct();
        } else {
          resolve(response.PRODUCTS);
        }
      });
    });
    for (const productType of productList.slice(16)) {
      await getIntradayData(productType);
    }
  } catch (error) {
    console.error(error);
  }
}
async function getIntradayData(type) {
  try {
    const currentData = await new Promise((resolve, reject) => {
      globeldatasource.getcurrentIntraday(type, (err, response) => {
        if (err || _.isEmpty(response)) {
          reject("Error fetching current intraday data");
        } else {
          resolve(response);
        }
      });
    });
    const strickPrice = currentData.AVERAGETRADEDPRICE;
    const expiryDates = await new Promise((resolve, reject) => {
      globeldatasource.getOptionExpiryDates(type, (err, response) => {
        if (err || _.isEmpty(response.EXPIRYDATES)) {
          reject("Error fetching option expiry dates");
        } else {
          resolve(response.EXPIRYDATES);
        }
      });
    });
    const expiryDate = expiryDates[0];
    const optionDataToday = await new Promise((resolve, reject) => {
      globeldatasource.getOptionDataToday(type, expiryDate, (err, response) => {
        if (err || _.isEmpty(response)) {
          reject("Error fetching option data for today",expiryDate);
        } else {
          resolve(response);
        }
      });
    });
    const callArr = [];
    const putArr = [];
    for (const result of optionDataToday) {
      const identi = result.INSTRUMENTIDENTIFIER.split("_");
      const value = parseInt(identi[4]);

      if (result.SERVERTIME > 0) {
        if (identi[3] === "CE") {
          callArr.push({ ...result, value, optionType: identi[3], optionDate: identi[2] });
        } else if (identi[3] === "PE") {
          putArr.push({ ...result, value, optionType: identi[3], optionDate: identi[2] });
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
        if (putArr[i] && callArr[i]) {
          putTotal += putArr[i].OPENINTERESTCHANGE;
          callTotal += callArr[i].OPENINTERESTCHANGE;
        }
      }

      const datatoday = {
        ...currentData,
        putTotal,
        callTotal,
        strike,
        time: moment(currentTime).format('HH:mm'),
        timeUpdate: moment(currentTime).unix(),
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
}

function findClosestItem(arr, value, key) {
  let closest = null;
  let index = -1;
  let nearestValue = null;
  arr.forEach((item, i) => {
    if (item[key] > 0) {
      const diff = Math.abs(value - item.value);
      if (closest === null || diff < closest) {
        closest = diff;
        nearestValue = item.value;
        index = i;
      }
    }
  });

  return { closest, index, nearestValue };
}
processProduct();
