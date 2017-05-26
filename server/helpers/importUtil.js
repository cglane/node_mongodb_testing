import R from 'ramda';
import json2csv from 'json2csv';
import csvtojson from 'csvtojson';
import q from 'q';
import Rollbase from './rbUtils';
import Messages from '../models/Messages';

const fs = require('fs');

const userRels = ['R12766153', 'R16561891', 'R20752918', 'R24773892'];
const params = ['s_body', 's_type', 'createdAt', 'R12766153', 'R16561891', 'R20752918', 'R24773892', 's_subject', 's_sender', 's_iconClass', 's_prompt', 's_route', 's_archive', 's_unread', 'email'];

/**
  *Compare cleaned messge object and userRel array to determine
  *what the userId is for the message object
  *@property{Object} messageObject
  *@returns{String} userRel
**/
function getUserRel(messageObject) {
  return R.compose(
    R.filter(key => R.contains(key, userRels)),
    R.keys
  )(messageObject);
}

/**
  *Cleans rollbase response and maps to userId value
  *@property{Object} x messageObject from rollbase
  *@returns {Object} returnObject
**/
function replaceUserRels(x) {
  const returnObj = x;
  const userRel = getUserRel(returnObj, userRels);
  const userVal = returnObj[userRel];
  delete returnObj[userRel];
  returnObj.userId = userVal;
  return returnObj;
}

/**
  *Map Rollbase params to new mongoose Schema
  *@property{Array} rollbaseArray response from rollbase query
  *@property{Array} rollbaseParams names of rollbase fields
  *@property{Object} Object reflecting <Message> Schema structure
**/

function formatData(clientId, jsonObject) {
  const messageObject = R.compose(
    R.filter(x => !R.isEmpty(x)),
    R.merge({ clientId: clientId })
  )(jsonObject);
  return replaceUserRels(messageObject);
}

/**
  *Query Rollbase for Messages created during a certain date range
  *and save as csv
  *@property{String} clientId
  *@property{Number} days
  *@returns{Object} Response message
**/

function getCompanyMessages(clientId, days) {
  const queryStr = `SELECT ${params.join(',')} FROM message1 WHERE createdAt > NOW() - INTERVAL ${days} DAY`;
  return Rollbase.selectQuery(queryStr, 0, 30, clientId)
    .then((messages) => {
      const messageObjects = R.map(R.zipObj(params))(messages);
      const csv = json2csv({ data: messageObjects });
      fs.writeFile('./import/12309280.csv', csv, (err) => {
        if (err) return 'File Did not Save';
        return 'File Saved';
      });
    });
}

/**
  *Import old messages from Rollbase into MongoDB
  *@property{String} clientId
  *@returns{String} Import Status
**/

function importCompanyMessages(clientId) {
  const deferred = q.defer();
  csvtojson()
    .fromFile(`./import/${clientId}.csv`)
    .on('json', (jsonObject) => {
      const formatedData = formatData(clientId, jsonObject);
      Messages.createMsg(formatedData)
        .then(msg => console.log(msg._id, ':msg uploaded'))
        .catch(err => console.log(err));
    })
    .on('done', (err) => {
      if (err) deferred.resolve('Error reading the file');
      deferred.resolve('All rows inserted into DB');
    });
  return deferred.promise;
}

export default { getCompanyMessages, importCompanyMessages };
