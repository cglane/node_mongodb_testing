import chai, { expect } from 'chai';
import mongoose from 'mongoose';
import Messages from '../models/Messages';
import Archive from '../models/Message_Archive';
import config from '../../config/config';
import ArchiveTriggers from '../triggers/archive';

chai.config.includeStack = true;
const days = 2;
const clientId = '12309280';


before((done) => {
  mongoose.connect(config.mongo.dev.host, (error) => {
    if (error) console.error('Error while connecting:\n%\n', error);
    console.log('connected');
    done(error);
  });
});

describe('Archive Messages triggers', () => {
  it('run archive dev trigger', (done) => {
    ArchiveTriggers.archiveDev()
      .then((response) => {
        expect(response).to.equal('All rows inserted into DB');
        done();
      });
  });
  it('should run trigger aover all zones', (done) => {
    ArchiveTriggers.archiveAllZones()
      .then((response) => {
        console.log(response, 'resopnse');
        expect(response).to.be.an('array');
        done();
      });
  });
});
