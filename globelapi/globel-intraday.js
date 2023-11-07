const app = require("../server/server");
const loopback = require("loopback");
const _ = require("lodash");
const moment = require("moment-timezone");
const globeldatasource = app.dataSources.globeldatasource;
const TdDerivatives = loopback.getModel("TdDerivatives");
const listType = ["NIFTY", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY"];
(async () => {
  for (const type of listType) {
    try {
      const currentdata = await getcurrentIntraday(type);
      if (!_.isEmpty(currentdata)) {
        const strickPrice = currentdata.AVERAGETRADEDPRICE;
        const responsedate = await getOptionExpiryDates(type);
        const expirydate = responsedate.EXPIRYDATES[0];
        const responseOption = await getOptionDataToday(type, expirydate);

        const { callArr, putArr } = processOptionData(responseOption, strickPrice);

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
            ...currentdata,
            putTotal,
            callTotal,
            strike,
            time: moment().tz('Asia/Kolkata').format("HH:mm"),
            timeUpdate: moment().tz('Asia/Kolkata').unix(),
          };

          if (!_.isEmpty(datatoday)) {
            await TdDerivatives.create(datatoday);
            console.log("Data updated successfully.");
          }
        }
      } else {
        console.log("error 1");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }
})();

async function getcurrentIntraday(type) {
  return new Promise((resolve, reject) => {
    globeldatasource.getcurrentIntraday(type, (err, response) => {
      if (err || _.isEmpty(response)) {
        reject("Error fetching current intraday data");
      } else {
        resolve(response);
      }
    });
  });
}

async function getOptionExpiryDates(type) {
  return new Promise((resolve, reject) => {
    globeldatasource.getOptionExpiryDates(type, (err, responsedate) => {
      if (err || _.isEmpty(responsedate)) {
        reject("Error fetching option expiry dates");
      } else {
        resolve(responsedate);
      }
    });
  });
}

async function getOptionDataToday(type, expirydate) {
  return new Promise((resolve, reject) => {
    globeldatasource.getOptionDataToday(type, expirydate, (err, responseOption) => {
      if (err || _.isEmpty(responseOption)) {
        reject("Error fetching option data for today");
      } else {
        resolve(responseOption);
      }
    });
  });
}

function processOptionData(apiResult, strickPrice) {
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

  return { callArr, putArr };
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
