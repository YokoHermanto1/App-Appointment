import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { createAppointment, listAppointments, getAppointment } from '../controllers/appointmentController.js';

const router = Router();

router.use(authenticate);
router.post('/', createAppointment);
router.get('/', listAppointments);
router.get('/:id', getAppointment);

export default router;
