import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import chai, { expect } from 'chai';
import app from '../../index';
import config from '../../config/config';

chai.config.includeStack = true;

describe('Authorization', () => {

  describe('# GET /api/health-check', () => {
    it('should return OK for authentication', (done) => {
      request(app)
        .get('/api/health-check')
        .set('Authorization', `Bearer ${config.auth.token}`)
        .expect(200)
        .end((err,res) => {
          if(err) done(err)
          expect(res.text).to.equal('Authentication OK');
          return done();
        })
    });
    it('should return Authentication error', (done) => {
      request(app)
        .get('/api/health-check')
        .set('Authorization', `Bearer fakeAuth`)
        .expect(401)
        .end((err, res) => {
          if(err) done(err)
          expect(res.text).to.equal('Authentication Failed');
          return done();
        })
    });
  });

});
