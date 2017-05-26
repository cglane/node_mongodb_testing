import winston from 'winston';

const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.File)({
      filename:'mylogfile.log',
      json: true,
      colorize: true
    })
  ]
});

export default logger;
