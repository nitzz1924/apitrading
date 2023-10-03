// Copyright IBM Corp. 2015,2019. All Rights Reserved.
// Node module: generator-loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

"use strict";
const _ = require("lodash");
let models = [],
  excludedModels = [],
  defaultACL = [
    {
      accessType: "*",
      principalType: "ROLE",
      principalId: "$everyone",
      permission: "DENY",
    },
    {
      accessType: "*",
      principalType: "ROLE",
      principalId: "$authenticated",
      permission: "ALLOW",
    },
  ];
function loadCustomModels() {
  var allModels = require("./../model-config");
  _.forEach(allModels, (model, modelName) => {
    if (
      model.public &&
      !_.includes(excludedModels, modelName) &&
      !_.includes(models, modelName)
    ) {
      models.push(modelName);
    }
  });
}
module.exports = function (app, cb) {
  /*
   * The `app` object provides access to a variety of LoopBack resources such as
   * models (e.g. `app.models.YourModelName`) or data sources (e.g.
   * `app.datasources.YourDataSource`). See
   * https://loopback.io/doc/en/lb3/Working-with-LoopBack-objects.html
   * for more info.
   */
  var allModels = app.datasources.mongoDB.models;

  loadCustomModels();

  models.forEach((model) => {
    var thisModel = allModels[model];
    //add ACL
    // console.log("Model:",thisModel.modelName);
    if (
      _.get(thisModel, "definition.settings.acls") &&
      _.isEmpty(thisModel.definition.settings.acls)
    ) {
      thisModel.definition.settings.acls = defaultACL;
    } else {
      console.log("Model ignored", thisModel.modelName);
    }
  });
  process.nextTick(cb); // Remove if you pass `cb` to an async function yourself
};
