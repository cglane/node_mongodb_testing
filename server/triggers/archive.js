import mongodb from 'mongodb';
import R from 'ramda';
import q from 'q';
import Messages from '../models/Messages';
import settingsUtil from '../helpers/clientSettingsUtil.js';

function archiveZone(clientId, archiveSetting) {
  return Messages.archiveMessages(clientId, archiveSetting)
          .then(response => response.status)
          .catch(e => console.log(e));
}

function archiveDev() {
  return settingsUtil.querySettings()
    .then((docs) => {
      const gdgSettings = R.find(R.propEq('custId', '12309280'))(docs);
      const archiveSetting = gdgSettings.customerSettings.archiveMessages;
      return archiveZone('12309280', archiveSetting);
    });
}

/**
  *Iterates through client settings list
**/
function archiveAllZones() {
  const deferred = q.defer();
  let archiveRequests = [];
  settingsUtil.querySettings()
    .then((docs) => {
      archiveRequests = R.map(x =>
        archiveZone(x.custId, (x.customerSettings.archiveMessagess || 180))
      )(docs);
      q.all(archiveRequests).then((responses) => {
        deferred.resolve(responses);
      });
    });
  return deferred.promise;
}

export default { archiveDev, archiveAllZones };
