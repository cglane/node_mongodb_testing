import chai, { expect } from 'chai';
import mongoose from 'mongoose';
import Messages from '../models/Messages.js';
import Archive from '../models/Message_Archive.js';
import config from '../../config/config';

chai.config.includeStack = true;
const days = 2;
const clientId = '12309280';
const message = {
  s_body:"hello text",
  companyMessage:false,
  s_type:"Normal",
  clientId:'12309280',
  userId:'12345678',
  s_subject:"subject text",
  s_sender:"john@doe.com",
  s_iconClass:"fa fa-envelope-o",
  s_prompt:"templates.goToProject",
  s_route:"app.project",
  s_archive:false,
  s_routeParams:"({id:1222222})",
  s_unread:true,
  s_recipient:"charles@mailinator.com",
  email_sent:true
};
let savedMsg = {};

before((done) => {
  mongoose.connect(config.mongo.dev.host, (error) => {
    if (error) console.error('Error while connecting:\n%\n', error);
    console.log('connected');
    done(error);
  });
});

describe('Archive Messages', () => {
  before((done) => {
    const d = new Date();
    d.setDate(d.getDate() - (days + 1));
    message.createdAt = d;
    Messages.createMsg(message)
      .then((msg) => {
        savedMsg = msg;
        done();
      });
  });
  describe('base functionality', () => {
    it('should return messages archived', (done) => {
      Messages.archiveMessages(clientId, days).then((response) => {
        expect(response.status).to.equal('Messages Archived Successfully');
        done();
      });
    }).timeout(5000);
    it('should not have messages older than days in collection', (done) => {
      const d = new Date();
      d.setDate(d.getDate() - days);
      Messages.find({ clientId: clientId, createdAt: { $lt: d } })
        .then((oldMessages) => {
          expect(oldMessages).to.eql([]);
          done();
        });
    }).timeout(5000);
    it('make sure message added to archive', (done) => {
      Archive.findOne({ originalId: savedMsg._id })
        .then((archive) => {
          expect(archive.archivedObj.s_body).to.eql(message.s_body);
          done();
        });
    }).timeout(5000);
  });
});
