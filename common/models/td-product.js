"use strict";
const { messaging } = require("firebase-admin");
const app = require("../../server/server");
const _ = require("lodash");
const cron = require("node-cron");
module.exports = function (TdProduct) {
  var OneTimeOnly = "0 8 * * 1-5";
  var getIntradayData = app.datasources.getIntradayData;
  cron.schedule(OneTimeOnly, async () => {
    getIntradayData.getProductList(async (err, response) => {
      if (!_.isEmpty(response)) {
        if (!_.isEmpty(response)) {
          await new Promise((resolve, reject) => {
            TdProduct.destroyAll({}, (err, info) => {
              if (err) {
                console.log(null, "Error deleting old records: " + err.message);
              } else {
                TdProduct.create(
                  { List: response.PRODUCTS.slice(18) },
                  (err, data) => {
                    if (err) {
                      console.error(err);
                      reject(err);
                    } else {
                      console.log(null, {
                        result: "Data updated successfully.and old data deleted",
                      });
                      resolve();
                    }
                  }
                );
              }
            });

          });
        }
      }
    });
  });
  TdProduct.AddProductList = (callback) => {
    getIntradayData.getProductList(async (err, response) => {
      if (!_.isEmpty(response)) {
        if (!_.isEmpty(response)) {
          await new Promise((resolve, reject) => {
            TdProduct.destroyAll({}, (err, info) => {
              if (err) {
                callback(null, "Error deleting old records: " + err.message);
              } else {
                TdProduct.create(
                  { List: response.PRODUCTS.slice(16) },
                  (err, data) => {
                    if (err) {
                      console.error(err);
                      reject(err);
                    } else {
                      callback(null, {
                        result: "Data updated successfully.and old data deleted",
                      });
                      resolve();
                    }
                  }
                );
              }
            });

          });
        }
      }
    });
  };
  TdProduct.GetFnoRacking = (time, callback) => {
    const dataArray = [];
    TdProduct.find()
      .then((data) => {
        const promises = data[0].List.map((item) => {
          return getIntradayData.GetSnapshot(`${item}-I`, time);
        });
        return Promise.all(promises);
      })
      .then((results) => {
        dataArray.push(...results.map((result) => result[0].item));
        callback(null, dataArray);
      })
      .catch((error) => {
        callback(error, null);
      });
  };
};
