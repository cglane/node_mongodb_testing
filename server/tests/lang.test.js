import chai, { expect } from 'chai';
import mongoose from 'mongoose';
import config from '../../config/config';
import langUtil from '../helpers/langUtil';

chai.config.includeStack = true;
var gdgLangs = {};
const clientId = config.gdgId;
const language = 'en-US';
const basePath = 'https://static.gooddonegreat.com/LangFiles';
const group = 'templates';
const languageOptions = ['en-US', 'fr-FR'];

before((done) => {
  mongoose.connect(config.mongo.dev.host, (error) => {
    if (error) console.error('Error while connecting:\n%\n', error);
    console.log('connected');
    done(error);
  });
});

describe('Build Messages', () => {
  describe('should connect to S3', () => {
    it('and return lanugage files', (done) => {
      langUtil.getLanguageFile(language, clientId, group)
        .then((response) => {
          expect(response).to.be.an('object');
          done();
        }).catch(e => console.log(e, 'e'));
    });
    it('and return error string on error', (done) => {
      langUtil.getLanguageFile('en-Blah', clientId, group)
        .then()
        .catch((e) => {
          expect(e).to.be.a('string');
          done();
        });
    });
    it('should return languages files per clientId', (done) => {
      langUtil.getCompanyLanguages(languageOptions, clientId)
        .then((response) => {
          expect(response).to.be.an('object');
          done();
        });
    }).timeout(6000);
    it('should return error getting client that does not have custom', (done) => {
      langUtil.getCompanyLanguages(languageOptions, '1222222')
        .then((response) => {
          expect(response).to.be.a('string');
          done();
        });
    }).timeout(6000);
    it('should set cache', (done) => {
      langUtil.setCache(clientId).then((response) => {
        expect(response).to.be.an('object');
        done();
      });
    }).timeout(4000);
    it('should fail setting cache for fake clientId', (done) => {
      langUtil.setCache('1222222').then((response) => {
        expect(response).to.be.an('object').that.is.empty;
        done();
      });
    });
    it('should return the cache for a client', (done) => {
      langUtil.getCache(clientId).then((response) => {
        gdgLangs = response;
        expect(response).to.be.an('object');
        done();
      });
    });
    it('should return the gdgCache for client that does not have custom languages', (done) => {
      langUtil.getCache('fakeId').then((response) => {
        expect(response).to.deep.equal(gdgLangs);
        done();
      });
    });
    it('should clear the langCache', (done) => {
      expect(langUtil.clearCache()).to.equal('Cache empty');
      done();
    });
  });
});
