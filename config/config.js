import Joi from 'joi';

// require and configure dotenv, will load vars in .env in PROCESS.ENV
require('dotenv').config();

// define validation for all the env vars
const envVarsSchema = Joi.object({
  NODE_ENV: Joi.string()
    .allow(['development', 'production', 'test', 'provision'])
    .default('development'),
  PORT: Joi.number()
    .default(4040),
  MONGOOSE_DEBUG: Joi.boolean()
    .when('NODE_ENV', {
      is: Joi.string().equal('development'),
      then: Joi.boolean().default(true),
      otherwise: Joi.boolean().default(false)
    }),
  JWT_SECRET: Joi.string().required()
    .description('JWT Secret required to sign'),
  MONGO_DEV_HOST: Joi.string().required()
    .description('Mongo DB host url'),
  MONGO_DEV_PORT: Joi.number()
    .default(27017),
  MONGO_LANGS_HOST: Joi.string().required()
    .description('Mongo DB Langs'),
  AUTH_TOKEN: Joi.string().required()
    .description('Api Token'),
  RB_PASSWORD: Joi.string().required()
    .description('RB password'),
  RB_USER: Joi.string().required()
    .description('RB user'),
  GDG_DEV: Joi.string().required()
    .description('GDG Dev MongoDB'),
  GDG_PROD: Joi.string().required()
    .description('GDG Prod'),
  GDG_ID: Joi.string().required()
    .description('GDG Product Code Id'),
  AWS_ACCESS_KEY: Joi.string().required()
    .description('AWS Access Key'),
  AWS_SECRET_KEY: Joi.string().required()
    .description('AWS Secret Key')
}).unknown()
  .required();

const { error, value: envVars } = Joi.validate(process.env, envVarsSchema);
if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const config = {
  env: envVars.NODE_ENV,
  gdgId: envVars.GDG_ID,
  port: envVars.PORT,
  awsAccessKey: envVars.AWS_ACCESS_KEY,
  awsSecretKey: envVars.AWS_SECRET_KEY,
  mongooseDebug: envVars.MONGOOSE_DEBUG,
  jwtSecret: envVars.JWT_SECRET,
  gdg_dev: envVars.GDG_DEV,
  gdg_prod: envVars.GDG_PROD,
  auth: {
    token: envVars.AUTH_TOKEN
  },
  rollbase: {
    user: envVars.RB_USER,
    pass: envVars.RB_PASSWORD
  },
  mongo: {
    dev: {
      host: envVars.MONGO_DEV_HOST,
      port: envVars.MONGO_DEV_PORT
    },
    langs: {
      host: envVars.MONGO_LANGS_HOST
    }
  }
};

export default config;
