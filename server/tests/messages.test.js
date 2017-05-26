import mongoose from 'mongoose';
import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import chai, { expect } from 'chai';
import app from '../../index';
import config from '../../config/config';

chai.config.includeStack = true;

/**
 * root level hooks
 */
after((done) => {
  // required because https://github.com/Automattic/mongoose/issues/1251#issuecomment-65793092
  mongoose.models = {};
  mongoose.modelSchemas = {};
  mongoose.connection.close();
  done();
});

before((done)=> {
        mongoose.connect(config.mongo.dev.host, function(error) {
            if (error) console.error('Error while connecting:\n%\n', error);
            console.log('connected');
            done(error);
        });
    });
describe('Test Message', () => {
  let savedMessage = {}
  let message = {
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

  describe('# POST /messages/createMsg', () => {
    it('should create a message record', (done) => {
      request(app)
        .post('/api/messages/createMsg')
        .set('Authorization', `Bearer ${config.auth.token}`)
        .send(message)
        .expect(200)
        .then((res) => {
          expect(res.body.s_body).to.equal(message.s_body);
          savedMessage = res.body;
          done();
        })
        .catch(done);
    });
    it('should fail to create message with bad object', (done) => {
      let badMessage = message
      delete badMessage['s_body']
      request(app)
        .post('/api/messages/createMsg')
        .set('Authorization', `Bearer ${config.auth.token}`)
        .send(message)
        .expect(httpStatus.INTERNAL_SERVER_ERROR)
        .then((res) => {
          done();
        })
        .catch(done);
    });
  });
  describe('# PUT /messages/setArchiveField', () => {
    it('should set archive field to oposite of what it is', (done) => {
      request(app)
        .put('/api/messages/setArchiveField')
        .set('Authorization', `Bearer ${config.auth.token}`)
        .send(savedMessage)
        .expect(200)
        .then((res) => {
          expect(res.body.message).to.equal(`archive field set to ${!savedMessage.s_archive}`);
          done();
        })
        .catch(done);
    });
    it('should fail trying to find message with bad id', (done) => {
      let badMessage = message
      badMessage['_id'] = '12345'
      request(app)
        .put('/api/messages/setArchiveField')
        .set('Authorization', `Bearer ${config.auth.token}`)
        .send(badMessage)
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          done();
        })
        .catch(done);
    });
  });
  describe('# GET /messages/getUserMessages', () => {
    it('should get user messages', (done) => {
      request(app)
        .get(`/api/messages/getUserMessages/${savedMessage.userId}`)
        .set('Authorization', `Bearer ${config.auth.token}`)
        .expect(200)
        .then((res) => {
          expect(res.body).to.be.a('array');
          done();
        })
        .catch(done);
    });
    it('should fail trying to find message with bad id', (done) => {
      request(app)
        .get(`/api/messages/getUserMessages/fakeId`)
        .set('Authorization', `Bearer ${config.auth.token}`)
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          done();
        })
        .catch(done);
    });
  });
  describe('# GET /messages/getCompanyMessages', () => {
    it('should get companyMessages sans duplicates', (done) => {
      request(app)
        .get(`/api/messages/getCompanyMessages/${savedMessage.userId}/${savedMessage.clientId}`)
        .set('Authorization', `Bearer ${config.auth.token}`)
        .expect(200)
        .then((res) => {
          expect(res.body).to.be.a('array');
          done();
        })
        .catch(done);
    });
    it('should fail trying to find messages with bad id', (done) => {
      request(app)
        .get(`/api/messages/getCompanyMessages/fakeId/fakeId`)
        .set('Authorization', `Bearer ${config.auth.token}`)
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          done();
        })
        .catch(done);
    });
  });
  describe('# PUT  /messages/markAsRead', () => {
    it('should update msg and toggle s_unread value', (done) => {
      request(app)
        .put(`/api/messages/markAsRead`)
        .set('Authorization', `Bearer ${config.auth.token}`)
        .send(savedMessage)
        .expect(200)
        .then((res) => {
          expect(res.body.message).to.equal(`s_unread field set to ${!savedMessage.s_unread}`);
          done();
        })
        .catch(done);
    });
    it('should update msg and toggle s_unread value', (done) => {
      let badMessage = savedMessage
      badMessage._id = 'badId'
      request(app)
        .put(`/api/messages/markAsRead`)
        .set('Authorization', `Bearer ${config.auth.token}`)
        .send(badMessage)
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          done();
        })
        .catch(done);
    });
  });
});
