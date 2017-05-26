import express from 'express';
import messageRoutes from './message.routes';

const router = express.Router(); // eslint-disable-line new-cap

/** GET /health-check - Check service health */
router.get('/health-check', (req, res) => {
  res.status(200).send('Authentication OK');
});

// set message routs at /messages
router.use('/messages', messageRoutes);

export default router;
