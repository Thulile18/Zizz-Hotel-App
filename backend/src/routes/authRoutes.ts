import { Router } from 'express';
import { register, login } from '../controllers/authController';
import { githubLogin } from '../controllers/githubController';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/github', githubLogin);

export default router;