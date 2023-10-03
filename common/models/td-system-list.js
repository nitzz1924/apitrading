"use strict";
module.exports = function (Tdsystemlist) {
  Tdsystemlist.pingMe = (callback) => {
    Tdsystemlist.findOne({ where: { listType: "pingMe" } })
      .then((data) => {
        callback(null, data.value);
      })
      .catch((e) => {
        callback(e.message);
      });
  };
};
