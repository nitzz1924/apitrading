"use strict";
const app = require("../../server/server");
const _ = require("lodash");
module.exports = function (TdFnoRanking) {
  var getIntradayData = app.datasources.getIntradayData;
  TdFnoRanking.getNiftyRanking = (callback) => {
    const timeHistory = [];
    getIntradayData.getProductList(async (err, responseType) => {
      if (!_.isEmpty(responseType) && responseType.PRODUCTS) {
        try {
          console.log(responseType);
          const listTime = ["MINUTE", "HOUR", "DAY", "WEEK", "MONTH"];
          await Promise.all(
            responseType.PRODUCTS.slice(16).map(async (type) => {
              try {
                const responses = await Promise.all(
                  listTime.map(async (timing) => {
                    try {
                      return await new Promise((resolve) => {
                        getIntradayData.GetHistory(
                          timing,
                          type + "-I",
                          1,
                          1,
                          (err, data) => {
                            resolve(data);
                          }
                        );
                      });
                    } catch (error) {
                      console.log(
                        `Error fetching history for ${type} - ${timing}:`,
                        error
                      );
                      return null; // or handle the error accordingly
                    }
                  })
                );
                responses.forEach((response2, index) => {
                  if (_.isEmpty(response2)) {
                    console.log(
                      `Error: Empty response2 for ${type} - ${listTime[index]}`
                    );
                  } else {
                    const labelAverage = calculateLabelAverage(response2.OHLC);
                    timeHistory.push({
                      ...labelAverage,
                      type,
                      timing: listTime[index],
                    });
                  }
                });
              } catch (error) {
                console.log(`Error fetching data for ${type}:`, error);
              }
            })
          );
          const dataarry = compareAndCreateRanking(timeHistory);
          callback(null, { list: dataarry });
        } catch (error) {
          console.log("Error:", error);
          callback(error, null);
        }
      } else {
        console.log("Error: PRODUCTS is undefined or empty in the response.");
        callback(new Error("PRODUCTS is undefined or empty"), null);
      }
    });
  };
  function calculateLabelAverage(OHLC) {
    const labelSum = OHLC.reduce(
      (sum, calculate) => {
        sum.CLOSE += calculate.CLOSE;
        sum.HIGH += calculate.HIGH;
        sum.LOW += calculate.LOW;
        sum.OPEN += calculate.OPEN;
        sum.OPENINTEREST += calculate.OPENINTEREST;
        sum.QUOTATIONLOT += calculate.QUOTATIONLOT;
        sum.TRADEDQTY += calculate.TRADEDQTY;
        return sum;
      },
      {
        CLOSE: 0,
        HIGH: 0,
        LOW: 0,
        OPEN: 0,
        OPENINTEREST: 0,
        QUOTATIONLOT: 0,
        TRADEDQTY: 0,
      }
    );

    const labelAverage = {};
    Object.keys(labelSum).forEach((key) => {
      labelAverage[key] = labelSum[key] / OHLC.length;
    });

    return labelAverage;
  }
  function compareAndCreateRanking(data) {
    const rankings = [];
    const timings = ["MINUTE", "HOUR", "DAY", "WEEK", "MONTH"];
    for (const timing of timings) {
      const timingData = data.filter((item) => item.timing === timing);
      const sortedData = timingData.sort(
        (a, b) => ((b.OPENINTEREST - a.OPENINTEREST) / a.OPENINTEREST) * 100
      );
      for (let i = 0; i < sortedData.length; i++) {
        const type = sortedData[i].type;
        const typeRanking = rankings[i] || { Rank: i + 1 };
        typeRanking[timing] = type;
        rankings[i] = typeRanking;
      }
    }

    return rankings;
  }
  TdFnoRanking.getNiftyRankingTime = (duration, callback) => {
    getIntradayData.getProductList(async (err, responseType) => {
      if (!_.isEmpty(responseType)) {
        async function fetchData() {
          const timeHistory = await Promise.all(
            responseType.PRODUCTS.slice(16).map(async (type) => {
              try {
                const data = await new Promise((resolve, reject) => {
                  getIntradayData.GetHistory(
                    duration,
                    type + "-I",
                    1,
                    5,
                    (err, data) => {
                      if (err || _.isEmpty(data)) {
                        console.log(`Error: Empty response for ${type}`, err);
                        reject(err);
                      } else {
                        resolve(data);
                      }
                    }
                  );
                });

                const labelAverage = calculateLabelAverage(data.OHLC);
                return {
                  ...labelAverage,
                  type,
                  timing: duration,
                };
              } catch (error) {
                console.log(`Error fetching history for ${type}`, error);
                return null; // or handle the error accordingly
              }
            })
          );

          callback(null, timeHistory.filter(Boolean));
        }

        function calculateLabelAverage(OHLC) {
          const labelSum = OHLC.reduce(
            (sum, calculate) => {
              sum.CLOSE += calculate.CLOSE;
              sum.HIGH += calculate.HIGH;
              sum.LOW += calculate.LOW;
              sum.OPEN += calculate.OPEN;
              sum.OPENINTEREST += calculate.OPENINTEREST;
              sum.QUOTATIONLOT += calculate.QUOTATIONLOT;
              sum.TRADEDQTY += calculate.TRADEDQTY;
              return sum;
            },
            {
              CLOSE: 0,
              HIGH: 0,
              LOW: 0,
              OPEN: 0,
              OPENINTEREST: 0,
              QUOTATIONLOT: 0,
              TRADEDQTY: 0,
            }
          );

          const labelAverage = {};
          Object.keys(labelSum).forEach((key) => {
            labelAverage[key] = labelSum[key] / OHLC.length;
          });

          return labelAverage;
        }

        fetchData();
      }
    });
  };
};
