import chai, { expect } from 'chai';
import mongoose from 'mongoose';
import config from '../../config/config';
import importUtil from '../helpers/importUtil.js';

chai.config.includeStack = true;
const days = 3;
const clientId = '12309280';


before((done) => {
  mongoose.connect(config.mongo.dev.host, (error) => {
    if (error) console.error('Error while connecting:\n%\n', error);
    console.log('connected');
    done(error);
  });
});

describe('Import Messages', () => {
  before((done) => {
    importUtil.getCompanyMessages(clientId, days)
      .then(() => done());
  });
  it('should read file and add to DB', (done) => {
    importUtil.importCompanyMessages(clientId)
      .then((response) => {
        expect(response).to.equal('All rows inserted into DB');
        done();
      });
  });
});
