import Promise from 'bluebird';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import R from 'ramda';
import APIError from '../helpers/APIError';
import MessageArchive from './Message_Archive';

const MessageSchema = new mongoose.Schema({
  s_body: {
    type: String,
    required: true
  },
  companyMessage: Boolean,
  _companyMessageId: mongoose.Schema.Types.ObjectId,
  s_type: String,
  clientId: {
    type: String,
    required: true
  },
  userId: String,
  s_subject: {
    type: String,
    required: String
  },
  s_sender: {
    type: String,
    default: 'noreply@gdg.do'
  },
  s_iconClass: {
    type: String,
    default: 'fa fa-envelope-o'
  },
  s_prompt: String,
  s_route: String,
  s_archive: {
    type: Boolean,
    default: false
  },
  s_routeParams: String,
  s_unread: {
    type: Boolean,
    default: true
  },
  s_recipient: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

/**
 * Methods
 */
MessageSchema.method({

});

/**
* Define Statics
**/

MessageSchema.statics = {
  /**
    * Archive then delete client messges
    * @param {Array} messages - array of message objects to be archived and deleted
    * @returns {Promise<Object>} - Status object of bulk insert and remove
  **/

  removeAndArchive(messages) {
    return MessageArchive.bulkInsertArchive(messages)
    .then(() => {
      const msgIds = R.pluck('_id', messages);
      return this.remove({
        _id: { $in: msgIds }
      })
      .then(removedMsgs => removedMsgs)
      .catch(() => ({ status: `Could not remove messages for clientId:${messages[0].clientId}` }));
    })
    .catch(() => ({ status: `Couldn't archive messages for clientId: ${messages[0].clientId}` }));
  },
  /**
    * Find Client's old messages, archives them and then deletes them
    * @param {String} clientId - clientId as part of message
    * @returns {Promise<Object>} - Status object of bulk insert and remove
  **/
  archiveMessages(clientId, days) {
    console.log(clientId, 'clientId');
    console.log(days, 'days');
    const d = new Date();
    d.setDate(d.getDate() - days);
    return this.find({
      clientId: clientId,
      createdAt: { $lt: d }
    })
    .exec()
    .then((messages) => {
      console.log(messages, 'messges');
      if (messages) {
        return this.removeAndArchive(messages)
          .then(() => ({ status: `Messages for clientId: ${clientId} Archived Successfully` }));
      }
      return { status: `No messages for clientId: ${clientId} older than ${days} days` };
    })
    .catch(() => ({ status: `Couldn't find messages with clientId: ${clientId} and days: ${days}` }));
  },
  /**
   * Get user messages and company messages
   * @param {String} id - The objectId of user.
   * @returns {Promise<Message, APIError>}
   */
  getUserMessages(userId) {
    return this.find({ userId: userId, companyMessage: false })
      .lean()
      .exec()
      .then((userMsgs) => {
        if (userMsgs.length > 0) {
          return userMsgs;
        }
        const err = new APIError(`No messages for user with id: ${userId}  exists!`, httpStatus.NO_CONTENT);
        return Promise.reject(err);
      })
      .catch(() => {
        const err = new APIError(`User with id: ${userId}  does not exist!`, httpStatus.BAD_REQUEST);
        return Promise.reject(err);
      })
      ;
  },
  /**
  * Archive individual Message
  * @param {objectId} id - The objectId of message
  * @param {Boolean} value - The Boolean value we want to set archive field to
  * @returns {Promise<Message, APIError>}
  ***/
  setArchiveField(id, value) {
    return this.findOneAndUpdate({ _id: id },
    { $set: { s_archive: value } })
    .exec()
    .then((archiveMsg) => {
      if (archiveMsg) {
        return { status: httpStatus.OK, message: `archive field set to ${value}` };
      }
      const err = new APIError(`No message with id of: ${id} updated`, httpStatus.NOT_FOUND);
      return Promise.reject(err);
    })
    .catch(() => {
      const err = new APIError(`No message exists with id of: ${id}`, httpStatus.BAD_REQUEST);
      return Promise.reject(err);
    });
  },
  /**
  * @param {objectId} id - The objectId of message
  * @param {Promise<Message, APIError>}
  **/
  deleteMsg(id) {
    return this.findByIdAndRemove(id)
    .exec()
    .then((message) => {
      if (message) {
        return { status: httpStatus.OK, message: `Message with id: ${id} Deleted` };
      }
      const err = new APIError(`No message exists with id of: ${id}`, httpStatus.NOT_FOUND);
      return Promise.reject(err);
    });
  },
  /**
  * Find all company messages per clientId
  * @param {String} id - clientId
  * @param {Promise<Message, APIError>}
  **/
  getCompanyMessages(userId, clientId) {
    return this.find({
      $or: [
        { companyMessage: true, clientId: clientId, userId: { $exists: false } },
        { companyMessage: true, clientId: clientId, userId: userId }
      ]
    })
      .lean()
      .exec()
      .then((messages) => {
        if (messages.length > 0) {
          return messages;
        }
        const err = new APIError(`No company messages for client: ${clientId}, found`, httpStatus.NO_CONTENT);
        return Promise.reject(err);
      })
      .catch(() => {
        const err = new APIError(`Error querying for userId: ${userId}, and clientId:${clientId}`, httpStatus.BAD_REQUEST);
        return Promise.reject(err);
      });
  },
  /**
  * Create a message record
  * @param {Object} msg - message record to be saved
  * @param {Promise<Message, APIError>}
  **/
  createMsg(msg) {
    return this.create(msg)
      .then((record) => {
        if (record) {
          return record;
        }
        const err = new APIError('No message created possibly missing required fields');
        return Promise.reject(err);
      })
      .catch(() => {
        const err = new APIError('No message created possibly missing required fields');
        return Promise.reject(err);
      });
  },
  /**
  * Toggle s_unread field
  * @property{Message}
  * @returns {Promise<Object, APIError>}
  **/
  markAsRead(msg) {
    return this.findOneAndUpdate({ _id: msg._id },
    { $set: { s_unread: !msg.s_unread } })
    .exec()
    .then((updatedMsg) => {
      if (updatedMsg) {
        return { status: httpStatus.OK, message: `s_unread field set to ${!msg.s_unread}` };
      }
      const err = new APIError(`No message with id of: ${msg._id} updated`, httpStatus.NOT_FOUND);
      return Promise.reject(err);
    })
    .catch(() => {
      const err = new APIError(`Error searching for message record with id of: ${msg._id}`, httpStatus.BAD_REQUEST);
      return Promise.reject(err);
    });
  }
};


export default mongoose.model('Message', MessageSchema);
