import mongoose from 'mongoose';
import util from 'util';

import config from '../../config/config';

const debug = require('debug')('Languages Connection');

// make bluebird default Promise
Promise = require('bluebird'); // eslint-disable-line no-global-assign

// plugin bluebird promise in mongoose
mongoose.Promise = Promise;

// Create Connection
const mongoUri = config.mongo.langs.host;
const langsConnection = mongoose.createConnection(mongoUri);

// Export Connection
module.exports = langsConnection;

// On Success
langsConnection.on('connected', () => {
  console.log('Lanugage DB Connected');
});

// Error Handling
langsConnection.on('error', () => {
  throw new Error(`unable to connect to database: ${mongoUri}`);
});

// print mongoose logs in dev env

if (config.MONGOOSE_DEBUG) {
  langsConnection.set('debug', (collectionName, method, query, doc) => {
    debug(`${collectionName}.${method}`, util.inspect(query, false, 20), doc);
  });
}
