var baseUrl = `https://${'dev' || 'www'}.gdg.do/rest/api/`,
  xml2js = require('xml2js'),
  _ = require('underscore'),
  q = require('q'),
  config = require('../../config/config.js');

/**
 * @typedef {Object} TransactionReturn
 * @property {number} url The assembled url from the passed fieldMap
 * @property {number} request The modified request library with the appropriate header
 */

/**
 * Assembles the URL and sets the appropriate header
 * @param  {number} customerId ID of the customer zone to log in to
 * @påaram  {string} callName Name of the Rollbase REST method
 * @param  {object} fields Map of fields to be added to the url
 * @return {TransactionReturn}
 */
let startTransaction = (customerId, callName, fields) => {
  var authHeader = new Buffer(config.rollbase.user + '@' + customerId + ':' + config.rollbase.pass).toString('base64'),
    request = require('request').defaults({ headers: {'Authorization': 'Basic '+authHeader} }),
    url = baseUrl + callName +'?output=JSON';
  if(fields){
    for(var key in fields){
      url = url + '&' + key + '=' + fields[key];
    }
  }
  return {request, url};
};
/**
 * Does a basic call and attempts to parse the response as JSON
 * @param  {object} fields Fields to be sent through the url
 * @param  {string} callName Name of the Rollbase REST method
 * @param  {string} httpMethod HTTP method for the call
 * @param  {number} customerId ID of the customer zone
 */
let performBasicCall = (fields, callName, httpMethod, customerId) => {
  return new Promise((resolve, reject) => {
    let {request, url} = startTransaction(customerId, callName, fields);
    request[httpMethod](url, function(err, response, body){
      if(err) reject(err);
      try{
        resolve(JSON.parse(body));
      } catch(err){
        resolve(body);
      }
    });
  });
};
/**
 * Performs a POST with the passed XML as the body
 * @param  {string} xmlString XML to be sent in POST body
 * @param  {string} callname Name of the Rollbase REST method
 * @param  {number} customerId ID of the customer zone
 */
let performXmlPost = (xmlString, callName, customerId) => {
  return new Promise((resolve, reject) => {
    let {request, url} = startTransaction(customerId, callName);

    request({method: 'POST', url: url, body: xmlString}, function(err, response, body){
      if(err) return reject(err);
      resolve(body);
    });
  });
};

var exportObj = {

  /**
   * Used to create record in rollbase
   * @param  {string} objName Integration name of object to be created
   * @param  {Object} fieldMap Map of fields to be added to object
   * @param  {number} customerId ID of customer zone to create record in
   */
  createRecord(objName, fieldMap, customerId){
    let fields = _.extend(fieldMap, {objName});
    return performBasicCall(fields, 'createRecord', 'get', customerId);
  },

  /**
   * Used to obtain all record data and related objects
   * @param  {string} objName Integration name of the object to be obtained
   * @param  {number} composite Depth of related objects to be obtained
   * @param  {number} id ID of the root object to be obtained
   * @param  {number} customerId ID of customer zone that data exists in
   */
  getRecord(objName, composite, id, customerId){
    let fields = {composite, id, objName};
    return performBasicCall(fields, 'getRecord', 'get', customerId);
  },

  /**
   * Used to update an existing record in rollbase
   * @param  {string} objName Integration name of the object to be updated
   * @param  {Object} fieldMap Map of fields to update existing record with
   * @param  {number} id ID of existing record to update
   * @param  {number} customerId ID of customer zone to perform update
   */
  updateRecord(objName, fieldMap, id, customerId){
    let fields = _.extend(fieldMap, {id, objName});
    return performBasicCall(fields, 'updateRecord', 'post', customerId);
  },
  /**
   * Used to remove a record from a zone found by an ID
   * @param  {string} objName Integration name of object to be removed
   * @param  {number} id ID of the record to be removed
   * @param  {number} customerId ID of customer zone to perform delete
   */
  deleteRecord(objName, id, customerId){
    let fields = {objName, id};
    return performBasicCall(fields, 'deleteRecord', 'get', customerId);
  },
  /**
   * Used to perform an SQL SELECT statement on a single object
   * @param  {string} queryStr SQL SELECT Query to be performed
   * @param  {number} startRow Row to start from in SELECT
   * @param  {number} maxRows Maximum number of results
   * @param  {number} customerId ID of customer zone to perform select
   */
  selectQuery(queryStr, startRow=0, maxRows=20000, customerId){
    let fields = {startRow, maxRows};
    fields.query = encodeURI(queryStr).replace(/#/g,"%23");
    return performBasicCall(fields, 'selectQuery', 'get', customerId);
  },

  mapDataFromQuery(fields, rows){
    return rows.map(row => {
      return row.reduce((row, field, index) => {
        row[fields[index]] = field;
        return row;
      }, {});
    });
  },
  /**
   * Used to set file upload fields on existing records
   * @param  {string} objName Integration name of the object to be updated
   * @param  {Object} fields Fields that are to be set as binary data
   * @param  {number} customerId ID of customer zone to perform update
   */
  setBinary: function(objName, fields, customerId) {
    return performBasicCall(fields, 'setBinaryData', 'get', customerId);
  },
  /**
   * Used to insert an array of records
   * @param  {Object[]} fieldMap The records to be created, with each containing an objName attribute
   * @param  {number} customerId ID of customer zone to perform update
   */
  bulkCreate(fieldMap, customerId){
    var xmlString = "<?xml version=\"1.0\" encoding=\"utf-8\"?><request>";
    for(var i = 0; i < fieldMap.length; i++){
      xmlString = xmlString + "<data objName=\"" + fieldMap[i].objName + "\" useIds=\"false\">";
      for(var key in fieldMap[i]){
        if(key !== "objName"){
          xmlString = xmlString + "<Field name=\"" + key + "\">"+fieldMap[i][key]+"</Field>";
        }
      }
      xmlString = xmlString + "</data>";
    }
    xmlString = xmlString + "</request>";

    return performXmlPost(xmlString, 'createArr', customerId);
  },
  /**
   * Used to update an array of records
   * @param  {Object[]} fieldMap The records to be created, with each containing an objName attribute
   * @param  {number} customerId ID of customer zone to perform update
   */
  bulkUpdate(fieldMap, customerId){
    var xmlString = "<?xml version=\"1.0\" encoding=\"utf-8\"?><request>";
    for(var i = 0; i < fieldMap.length; i++){
      xmlString = xmlString + "<data objName=\"" + fieldMap[i].objName + "\" useIds=\"false\" id=\"" + fieldMap[i].id + "\">";
      for(var key in fieldMap[i]){
        if(key !== "objName" && key !== "id"){
          xmlString = xmlString + "<Field name=\"" + key + "\">"+fieldMap[i][key]+"</Field>";
        }
      }
      xmlString = xmlString + "</data>";
    }
    xmlString = xmlString + "</request>";
    return performXmlPost(xmlString, 'updateArr', customerId);
  },

  /**
   * Used to obtain the value of a field
   * @param  {string} objName Integration name of the field's object to be obtained
   * @param  {number} id ID of existing record to obtain
   * @param  {Object} fieldName Integration name of field to obtain
   * @param  {number} customerId ID of customer zone to perform update
   */
  getDataField(objName, id, fieldName, customerId){
    let fields = {objName, fieldName, id};
    return performBasicCall(fields, 'getDataField', 'get', customerId);
  },
  /**
   * Used to get all Application IDs for a given customer zone
   * @param  {number} customerId ID of customer zone to perform get
   */
  getApplicationIds(customerId){
    return performBasicCall({}, 'getApplicationIds', 'get', customerId);
  },
  /**
   * Used to obtain a full object definition from a customer
   * @param  {string} objName Integration name of the object to be retrieved
   * @param  {number} customerId ID of customer zone to perform get
   */
  getObjectDef(objName, customerId){
    var deferred = q.defer();
    performBasicCall({objName}, 'getObjectDef', 'get', customerId)
      .then(body => {
        try {
          body = JSON.parse(body);
          if(body.status == 'fail') deferred.reject(body);
        } catch(e) {
          xml2js.parseString(body, function(err, result){
            if(err) deferred.reject(err);
            else deferred.resolve(result);
          });
        }
      });
      return deferred.promise;
  },
  /**
   * Used to obtain a full list of objects in Rollbase
   * @param  {number} customerId ID of customer zone to perform get
   */
  getObjectDefNames(customerId){
    return performBasicCall({}, 'getObjectDefNames', 'get', customerId)
  },
  /**
   * Used to obtain a Rollbase field definition
   * @param  {string} objName Integration name of object that the field exists off of
   * @param  {string} fieldName Integration name of field to be obtained
   * @param  {number} customerId ID of customer zone to perform update
   */
  getFieldDef(objName, fieldName, customerId){
    return performBasicCall({fieldName}, 'getFieldDef', 'get', customerId)
      .then(body => {
        return new Promise((resolve) => {
          xml2js.parseString(body, function(err, result){
            resolve(result);
          });
        });
      });
  },
  /**
   * Used to obtain a picklist code from a given id
   * @param  {string} objName Integration name of the Rollbase object that the picklist exists off of
   * @param  {string} field Integration name of the picklist field
   * @param  {number} id ID of the piclist value
   * @param  {number} customerId ID of customer zone to perform get
   */
  getCodeById(objName, field, id, customerId){
    var fields = {objName, field, id};
    return performBasicCall(fields, 'getCodeById', 'get', customerId);
  },
  /**
   * Used to get all values from a dependent picklist from a given field on a given object
   * @param  {string} objName Integration name of object that the picklists exists on
   * @param  {string} fieldName Integration name of the picklist field
   * @param  {number} customerId ID of customer zone to perform update
   */
  getDependentPicklist(objName, fieldName, customerId){
    return exportObj.getObjectDef(customerId, objName).then(function(response){
      var mainValueId = response.DataObjectDef.DataFieldDefs[0].DataFieldDef
      .filter(function(item){
        return item.$.fieldName == fieldName;
      })[0].Props[0].mainListId[0];

      return performBasicCall({fieldName, mainValueId}, 'getPicklist', 'get', customerId);
    });
  },
};

module.exports = exportObj;
