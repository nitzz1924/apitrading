"use strict";
const app = require("../../server/server");
const _ = require("lodash");
const cron = require("node-cron");
const moment = require("moment-timezone");
const currentTime = moment().tz("Asia/Kolkata");
module.exports = function (TdStockData) {
  var getIntradayData = app.datasources.getIntradayData;
  var schedulew = "0 8 * * 1-5";
  var scheduletwo = "*/5 9-20 * * 1-5";
  function getProductListAsync() {
    return new Promise((resolve, reject) => {
      getIntradayData.getProductList((err, response) => {
        if (err) return reject(err);
        if (!_.isEmpty(response)) {
          resolve(response.PRODUCTS.slice(18));
        } else {
          resolve([]);
        }
      });
    });
  }
  cron.schedule(schedulew, async () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 1);
    TdStockData.destroyAll({ createdAt: { lt: threeDaysAgo } }, (err, info) => {
      if (err) {
        console.log("Error deleting old records: " + err.message);
      } else {
        console.log(`Old records deleted successfully. Deleted count: ${info.count}`);
      }
    });
  });
  cron.schedule(scheduletwo, async () => {
    try {
      const listType = await getProductListAsync();
      // Fetch intraday data for each product type
      const intradayPromises = listType.map(type => {
        return new Promise((resolve, reject) => {
          getIntradayData.getcurrentIntraday(type, (err, responseIntraday) => {
            if (err || _.isEmpty(responseIntraday)) {
              console.error("Error fetching intraday data for", type, err);
              return reject(err);
            }
            // Fetch historical data
            getIntradayData.GetHistory('DAY', `${type}-I`, 50, 2, (error, responseHistory) => {
              if (error || _.isEmpty(responseHistory)) {
                console.log("Error fetching history for", type);
              } else {
                responseIntraday.day50 = responseHistory.OHLC;
              }
              resolve(responseIntraday); // Resolve after history data is fetched
            });
          });
        });
      });
      // Process all promises
      Promise.allSettled(intradayPromises)
        .then(results => {
          const intraday = results
            .filter(p => p.status === "fulfilled")
            .map(p => p.value);
          if (_.isEmpty(intraday)) {
            console.log("No valid intraday data to insert.");

          }
          const filteredData = intraday.filter(symbol => symbol.day50.length != 0);
          // Insert filtered data into TdStockData
          TdStockData.create(filteredData, (err, data) => {
            if (err) {
              console.error("Error inserting data:", err);
            }
            console.log("Data inserted successfully.");
          });
        })
        .catch(error => {
          console.error("Error processing intraday data", error);
        });
    }
    catch (error) {
      console.error("Error fetching product list:", error);
      return;
    }



  });
  TdStockData.getTodayHistory =async (callback) => {
     const listType = await getProductListAsync();
      if (_.isEmpty(listType)) {
        return callback(null, {
          result: { status: "0", message: "No product list available", list: [] },
        });
      }
      // Fetch intraday data for each product type
      const intradayPromises = listType.map(type => {
        return new Promise((resolve, reject) => {
          getIntradayData.getcurrentIntraday(type, (err, responseIntraday) => {
            if (err || _.isEmpty(responseIntraday)) {
              console.error("Error fetching intraday data for", type, err);
              return reject(err);
            }
            // Fetch historical data
            getIntradayData.GetHistory('DAY', `${type}-I`, 50, 2, (error, responseHistory) => {
              if (error || _.isEmpty(responseHistory)) {
                console.log("Error fetching history for", type);
              } else {
                responseIntraday.day50 = responseHistory.OHLC;
              }
              resolve(responseIntraday); // Resolve after history data is fetched
            });
          });
        });
      });
      // Process all promises
      Promise.allSettled(intradayPromises)
        .then(results => {
          const intraday = results
            .filter(p => p.status === "fulfilled")
            .map(p => p.value);
          if (_.isEmpty(intraday)) {
            console.log("No valid intraday data to insert.");
            return callback(null, { status: "0", message: "No valid data to insert." });
          }
          const filteredData = intraday.filter(symbol => symbol.day50.length != 0);
          // Insert filtered data into TdStockData
          TdStockData.create(filteredData, (err, data) => {
            if (err) {
              console.error("Error inserting data:", err);
              return callback(null, err);
            }
          });
        })
        .catch(error => {
          console.error("Error processing intraday data", error);
          callback(error, []);
        });
  };
};
