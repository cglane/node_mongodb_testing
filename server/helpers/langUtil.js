import q from 'q';
import _ from 'underscore';
import R from 'ramda';
import config from '../../config/config.js';
import RX from './ramdaObjectsUtil';
import clientSettingsUtil from './clientSettingsUtil';

let langCache = {};
const AWS = require('aws-sdk');

const S3_BUCKET = 'static.gooddonegreat.com';
AWS.config.update({
  accessKeyId: config.awsAccessKey,
  secretAccessKey: config.awsSecretKey,
  region: 'us-east-1'
});

const S3 = new AWS.S3();

/**
  *Calls AWS language files that are held in an S3 Bucket
  *@property{String} language
  *@property{String} clientId
  *@property{String} group
  *@returns{Object} contains language, group, and file content
**/

function getLanguageFile(language, clientId, group) {
  const key = `LangFiles/${clientId}/${language}/${group}.lang.json`;
  const deferred = q.defer();
  S3.getObject({ Bucket: S3_BUCKET, Key: key }, (err, body) => {
    if (err) deferred.reject(`Couldn't find ${key}`);
    try {
      const parsedBody = JSON.parse(body.Body.toString());
      deferred.resolve({ language: language, group: group, body: parsedBody });
    } catch (e) {
      deferred.reject(`Error parsing ${key}`);
    }
  });
  return deferred.promise;
}

/**
  *Get Company language files per language array
**/

function getCompanyLanguages(languageOptions = ['en-US'], clientId, groups = ['emails', 'templates']) {
  const deferred = q.defer();
  const rtrnObj = RX.nestedObject(languageOptions, groups);
  const requests = [];
  _.each(languageOptions, (lang) => {
    _.each(groups, (group) => {
      requests.push(getLanguageFile(lang, clientId, group));
    });
  });

  q.all(requests).then((langFiles) => {
    _.each(langFiles, (langObj) => {
      rtrnObj[langObj.language][langObj.group] = langObj.body;
    });
    deferred.resolve(rtrnObj);
  })
  .catch((e) => {
    // Failure to find customer languages
    deferred.resolve(e);
  });
  return deferred.promise;
}

/**
  *If Company has custom language file then return that as an object
  *and set companyObj in the cache
  *otherwise query for gdg product languages and return them
**/

function setCache(id) {
  const deferred = q.defer();
  clientSettingsUtil.querySettings({ custId: id }).then((settings) => {
    const languageOptions = (settings[0]) ? settings[0].localeSupported : [];
    getCompanyLanguages(languageOptions, id).then((response) => {
      if (R.is(Object, response) && !R.isEmpty(response)) {
        langCache[id] = { hasCustom: true, cache: response };
      } else {
        langCache[id] = { hasCustom: false };
      }
      deferred.resolve(response);
    });
  });
  return deferred.promise;
}

/**
  *If the client has cache then return that cache
  *Situation:
  *Client Has cache and custom
  *->Get client cache
  *But has cache but no custom
  *->get gdg languages
  *Client doesn't have cache
  *->get client lanugages
  *---> if no custom set custom equals false
  *---> return default languages
  *@property{id} id customer id
  *@returns{Promise} language object
**/

function getCache(id) {
  const deferred = q.defer();
  if (langCache[id]) {
    if (langCache[id].hasCustom) {
      deferred.resolve(langCache[id].cache);
    } else {
      getCache(config.gdgId).then(x => deferred.resolve(x));
    }
  } else {
    setCache(id).then(() => {
      getCache(id).then(x => deferred.resolve(x));
    });
  }
  return deferred.promise;
}

function clearCache() {
  langCache = {};
  return 'Cache empty';
}

export default { getLanguageFile, getCompanyLanguages, getCache, setCache, clearCache };
