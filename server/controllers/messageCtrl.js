import Messages from '../models/Messages';
import messageUtil from '../helpers/messageUtil.js';


/**
 * Create Message
 * @property {Object} req.body.msg - mesage information for creating message
 * @returns {Message}
 */
function createMsg(req, res, next) {
  Messages.createMsg(req.body)
    .then((msg) => {
      res.status(200).send(msg);
    })
    .catch(e => next(e));
}

/**
 * Update Message and update archive field
 * @property {Object} req.body - message object
 * @returns {String} response message
 */
function setArchiveField(req, res, next) {
  Messages.setArchiveField(req.body._id, !req.body.s_archive)
    .then((response) => {
      res.status(200).send(response);
    })
    .catch(e => next(e));
}


/**
 * Get all user messages including company messages
 * @property {string} req.params.userId
 * @returns {Message} Array of all messages
 */

function getUserMessages(req, res, next) {
  Messages.getUserMessages(req.params.userId)
  .then((response) => {
    res.status(200).send(response);
  })
  .catch(e => next(e));
}

/**
 * Get all user messages including company messages
 * @property {string} req.params.userId
 * @property {string} req.params.clientId
 * @returns {Message} Array of all company messages
 */
function getCompanyMessages(req, res, next) {
  Messages.getCompanyMessages(req.params.userId, req.params.clientId)
  .then((companyMessages) => {
    res.status(200).send(messageUtil.removeDuplicates(companyMessages));
  })
  .catch(e => next(e));
}

/**
 * Update Message and update archive field
 * @property {Object} req.body - message object
 * @returns {String} response message
 */

function markAsRead(req, res, next) {
  Messages.markAsRead(req.body)
  .then((response) => {
    res.status(200).send(response);
  })
  .catch(e => next(e));
}


export default
{
  createMsg,
  setArchiveField,
  getUserMessages,
  getCompanyMessages,
  markAsRead,
};
