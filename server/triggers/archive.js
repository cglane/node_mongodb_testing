import mongodb from 'mongodb';
import R from 'ramda';
import q from 'q';
import Messages from '../models/Messages';
import config from '../../config/config';

function archiveDev() {
  const deferred = q.defer();
  mongodb.MongoClient.connect(`mongodb://${config.gdg_dev}`, (connectError, db) => {
    if (connectError) throw connectError;
    const collection = db.collection('clientsettings');
    collection.find({ custId: '12309280' })
      .toArray((queryErr, docs) => {
        if (queryErr) throw queryErr;
        const archiveSetting = docs[0].customerSettings.archiveMessages;
        console.log(archiveSetting, 'settings');
        Messages.archiveMessages('12309280', archiveSetting)
          .then((x) => {
            console.log(x, 'x');
            deferred.resolve('All rows inserted into DB');
          }).catch(e => console.log(e))
      });
  });
  return deferred.promise;
}

function archiveAllZones() {
  const deferred = q.defer();
  let requests = [];
  mongodb.MongoClient.connect(`mongodb://${config.gdg_dev}`, (connectError, db) => {
    if (connectError) throw connectError;
    const collection = db.collection('clientsettings');
    collection.find({})
      .toArray((queryErr, docs) => {
        if (queryErr) throw queryErr;
        const clientIds = R.pluck('custId');
        const archiveSettings = R.pluck('customerSettings.archiveSettings')
        const clientArchiveSettings = R.zipObj(clientIds, archiveSettings)
        console.log(clientArchiveSettings);
        requests = R.map((id) => Messages.archiveMessages(id, 180))(clientIds);
        requests.resolve(requests);
      });
  });
  return deferred.promise;
}

export default { archiveDev, archiveAllZones };
