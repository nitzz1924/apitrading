/**
 * Created by anil on 4/4/17.
 */


var dbSource = require('../server/boot/mongodb-config'),
  path = require('path'),
  _ = require('lodash');

//======================================= Exports ================================================

module.exports = { fetchDistinctRecords ,   fetchRecordsFromCollection , dropModel , reIndex, createMultiple, deleteMultiple, createDataInChunks, getRecordCount, _mongoUpsertMultiple }

//======================================= Implementation =========================================
/**
 * Fetch Records from given mongodb collection with given filter
 * @param collection
 * @param filter
 */
function fetchRecordsFromCollection( collectionName , filter , projection, connectionType ) {
  return new Promise( ( resolve , reject) =>{
    var db = dbSource.getDb(connectionType);
    db.collection(collectionName).find( filter , projection || {} ).toArray( (err , data ) =>{
      if(err) {
        return reject(err);
      }
      _.renamePropertyInCollection( data || [] , "_id" , "id");
      //send data
      resolve(data);
    });
  });
}

/**
 * Fetch Distinct Records  of given field from given mongodb collection with given filter
 * @param collection
 * @param filter
 */
function fetchDistinctRecords( collectionName , fieldName , filter, connectionType  ) {
  return new Promise( ( resolve , reject) =>{
    var db = dbSource.getDb(connectionType);
    db.collection(collectionName).distinct(  fieldName , filter , (err , data ) =>{
      if(err) {
        return reject(err);
      }
      //send data
      resolve(data);
    });
  });
}


/**
 * Drop Collection Directly From Mongo
 * @param modelName
 */
function dropModel( modelName, connectionType ) {
  var app = require('../server/server');
  //Drop Collection and Rebuild Indexes
  var db = dbSource.getDb(connectionType);
  return db.collection(modelName).drop().catch(Function())
}

/**
 * Reindexes the mongo collection
 * @param model
 * @param cb
 */
function reIndex (model , cb) {
  if (!model.dataSource) {
    throw new Error('No Datasource attached to this Model.');
  }
  model.dataSource.autoupdate(model.modelName , function (err, data) {
    if(cb)  cb.apply( null , arguments);
  })
}
function createMultiple( collectionName , collectionData, connectionType) {
  return new Promise( ( resolve , reject) =>{
    var db = dbSource.getDb(connectionType);
    db.collection(collectionName).insertMany( collectionData,(err , data ) =>{
      if(err) {
        return reject(err);
      }
      resolve(data);
    });
  });
}

//======================================= Implementation =========================================
/**
 * Get Records Count
 * @param collection
 * @param collectionData
 */
function getRecordCount( collectionName , query, connectionType) {
  return new Promise( ( resolve , reject) =>{
    var db = dbSource.getDb(connectionType);
    db.collection(collectionName).count( query,(err , data ) =>{
      if(err) {
        return reject(err);
      }
      resolve(data);
    });
  });
}

function deleteMultiple( collectionName , query, connectionType) {
  return new Promise( ( resolve , reject) =>{
    var db = dbSource.getDb(connectionType);
    db.collection(collectionName).deleteMany(query,(err , data ) =>{
      if(err) {
        return reject(err);
      }
      resolve(data);
    });
  });
}

function createDataInChunks(Model, collection, chunkSize = 50, logger) {
  let taskList = [];
  if (_.isEmpty(collection)) return Promise.resolve(collection);
  return requestSeriesCreate(Model, _.chunk(collection, chunkSize), logger);
}

function requestSeriesCreate(Model, list, logger = console) {
  const responseList = [];
  return list.reduce((promise, dataList) => {
      return promise
        .then(() => Promise.all(dataList.map(dl => create(Model, dl, logger))))
        .then(records => {
          logger.info(`Processed ${_.size(records)} Records`)
          responseList.push(...records);
        });
    }, Promise.resolve())
    .then(response => {
      return responseList;
    })
}

function create(Model, data) {
  return new Promise((resolve, reject) => {
    if (_.isEmpty(data)) return resolve(data);
    Model.create(data, (err, res) => {
      if (err) return reject(err);
      // resolve(data);
      resolve(res);
    })
  })
}

function _mongoUpsertMultiple( collectionName , upsetRecord, dbSourceName  ) {
  return new Promise( ( resolve , reject) =>{
    var db = dbSource.getDb(dbSourceName);
    db.collection(collectionName).updateMany(upsetRecord.search,upsetRecord.replace, (err , data ) =>{
      if(err) reject(err);
      else resolve(data);
    });
  });
}
