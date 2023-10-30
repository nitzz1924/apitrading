/**
 * Created by anil-thinksys on 12/12/16.
 */

//======================================= Dependencies ================================================

var _ = require("lodash");

//======================================= Implementation =========================================

/**
 * Convert list of models or model to json
 * @param item
 * @returns {*}
 */
JSON.toJSON = function (item , dontThrowError) {
  //null check
  if(!item){
    return;
  }
  //check if array
  if(_.isArray( item )){
    //convert list of models to list of json objects
    return item.map( function (obj) {
      return obj.toJSON ? obj.toJSON() : obj;
    })
  }
  //otherwise return plain json object if transformable
  if( item && item.toJSON ){
    return item.toJSON();
  }
  //otherwise return the object as is
  try {
    return JSON.parse(item);
  }catch(err){
    if(!dontThrowError){
      //log and throw error by default
      console.error(`Error While Parsing JSON ... JSON Data \n: ${item} ..\n Error`, err);
      throw err;
    }
    return item;
  }
}
