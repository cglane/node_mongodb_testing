import mongodb from 'mongodb';
import q from 'q';

import config from '../../config/config';

const database = (config.env === 'development') ? config.gdg_dev : config.gdg_prod;

/**
*Query API settings for clientsettings
*@property{Object} query
*@property{Array} client settings that match query
**/
function querySettings(query = {}) {
  const deferred = q.defer();
  mongodb.MongoClient.connect(`mongodb://${database}`, (connectError, db) => {
    if (connectError) throw connectError;
    const collection = db.collection('clientsettings');
    return collection.find(query)
      .toArray((queryErr, docs) => {
        if (queryErr) throw queryErr;
        deferred.resolve(docs);
      });
  });
  return deferred.promise;
}


export default { querySettings };
