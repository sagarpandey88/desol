import { Router } from 'express';
import { validate } from '../middleware/validate';
import {
  RegisterSchema,
  LoginSchema,
  register,
  login,
} from '../controllers/authController';

const router = Router();

router.post('/register', validate(RegisterSchema), register);
router.post('/login', validate(LoginSchema), login);

export default router;
