/**
 * Created by anil on 9/2/17.
 */

var geo = require('./geo'),
  _ = require('lodash');

//======================================= Definition =========================================

// Array.prototype.geoNear = geoNear;
Object.defineProperty(Array.prototype, 'geoNear', { enumerable: false, value: geoNear });

//======================================= Implementation =========================================

/**
 *
 * @param filter : { }
 * @returns {*}
 */
function geoNear(filter) {
  var list = this;
  //filter based on where filter if present
  if( filter && filter.where){
    list = this.filter( item=>{
      var isMatch = true;
      _.forEach( filter.where , ( value , key)=>{
        var fetchedValue = _.get( item , key);
        if( typeof value == "boolean"){
          //By Value
          fetchedValue = !!fetchedValue;
        }
        if( fetchedValue != value){
          isMatch = false;
        }
      });
      return isMatch;
    });
  }
  //filter Array by given criteria
  return geo.filter( list , filter);
}
