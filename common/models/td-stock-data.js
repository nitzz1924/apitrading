"use strict";
const app = require("../../server/server");
const _ = require("lodash");
const cron = require("node-cron");
module.exports = function (TdStockData) {
  var getIntradayData = app.datasources.getIntradayData;
  var scheduletwo = "*/2 10-15 * * 1-5";
  cron.schedule(scheduletwo, async () => {
    TdStockData.destroyAll({}, (err, info) => {
      if (err) {
        callback(null, "Error deleting old records: " + err.message);
      } else {
        callback(null, `Old records deleted successfully. Deleted count: ${info.count}`);
      }
    });
    getIntradayData.GetProductListOwn((err, response) => {
      if (_.isEmpty(response)) {
        console.log({
          result: { status: "0", message: "Data not found", list: [] },
        });
      }
      const listType = response[0].List;
      if (_.isEmpty(listType)) {
        console.log({
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

          }
          const filteredData = intraday.filter(symbol => symbol.day50.length != 0);
          // Insert filtered data into TdStockData
          TdStockData.create(filteredData, (err, data) => {
            if (err) {
              console.error("Error inserting data:", err);
              return callback(null, err);
            }
            console.log("Data inserted successfully.");
          });
        })
        .catch(error => {
          console.error("Error processing intraday data", error);
        });
    });
  });
  TdStockData.getTodayHistory = (callback) => {
    getIntradayData.GetProductListOwn((err, response) => {
      if (_.isEmpty(response)) {
        return callback(null, {
          result: { status: "0", message: "Data not found", list: [] },
        });
      }
      const listType = response[0].List;
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
    });
  };
};
