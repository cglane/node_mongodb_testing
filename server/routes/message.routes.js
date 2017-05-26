import express from 'express';
import messageCtrl from '../controllers/messageCtrl.js';

const router = express.Router(); // eslint-disable-line new-cap

/** POST /api/messages/createMsg - Returns new message schema */
router.route('/createMsg')
  .post(messageCtrl.createMsg);

/** PUT /api/messages/setArchiveField - Sets s_archive field**/

router.route('/setArchiveField')
  .put(messageCtrl.setArchiveField);

/** GET /api/messages/getUserMessages - Gets all user messages excluding companyMessages**/

router.route('/getUserMessages/:userId/')
  .get(messageCtrl.getUserMessages);


/** GET /api/messages/getCompanyMessages - Gets all user companyMessages**/

router.route('/getCompanyMessages/:userId/:clientId')
  .get(messageCtrl.getCompanyMessages);

  /** PUT /api/messages/markAsRead - Sets normal and company messages s_unread to toggled value**/
router.route('/markAsRead')
  .put(messageCtrl.markAsRead);

export default router;
