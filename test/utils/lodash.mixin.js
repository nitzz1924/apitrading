  /**
 * Created by anil-thinksys on 14/12/16.
 */

var _ = require("lodash");

//======================================= Mixins =========================================

/**
 * Mixin for picking multiple keys from Array
 */
_.mixin({

  mapPick: function (objs,keys){
    return _.map(objs, function (obj) {
      return _.pick(obj,keys)
    })
  },

  mapBy : function (objs,key){
    var map = {};
    _.forEach(objs, obj => {
      map[(obj[key]||'').toString()] = (obj && obj.toJSON && obj.toJSON()) || obj;
    })
    return map;
  },

  mapToKey : function (objs,key , destinationKey){
    var map = {};
    _.forEach(objs, obj => {
      map[(obj[key]||'').toString()] = (obj[destinationKey]||'').toString();
    })
    return map;
  },

  //update collection where query add toUpdate
  updateAll : function (items , query, toUpdate) {
    //fill query if null
    query = query ? query : {};
    if((! toUpdate) || _.isEmpty(toUpdate)){
      //nothing to update
      return items;
    }
    //for each item
    items.forEach( item => {
      var isMatch = _.filter( [ item] , query);
      //if matched update object
      if( !_.isEmpty(isMatch)){
        _.assign( item , toUpdate );
      }
    });
    return items;
  },

  renameProperty : function (object, currentName, nameToReplaceWith) {

    if( !currentName || !nameToReplaceWith){
      console.log(`Both currentName and nameToReplaceWith are required paramaters..`);
    }

    if(object && object[currentName]){
      object[nameToReplaceWith] = object[currentName];
      delete object[currentName];
    }
  },

  renamePropertyInCollection : function ( collection , currentName, nameToReplaceWith, dontMutateOriginalCollection) {

    if(!collection || _.isEmpty(collection)){
      return collection;
    }

    if( !currentName || !nameToReplaceWith){
      console.log(`Both currentName and nameToReplaceWith are required paramaters..`);
    }

    if(dontMutateOriginalCollection){
      collection = _.cloneDeep(collection);
    }

    collection.forEach( record => {
      _.renameProperty(record , currentName , nameToReplaceWith );
    });

    return collection;
  }


});
