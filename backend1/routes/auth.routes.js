import express from 'express';
import { register, login, logout, me,googleLogin } from '../controllers/auth.controller.js';


const router = express.Router();
router.post('/google-login', googleLogin);

router.post('/register', register);
router.post('/login', login);

router.get('/me', me);
router.get("/logout", logout);

export default router; // ✅ this line fixes the error
