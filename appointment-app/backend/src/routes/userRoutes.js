import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getMe, listUsers } from '../controllers/userController.js';

const router = Router();

router.use(authenticate);
router.get('/me', getMe);
router.get('/', listUsers);

export default router;
