import express from 'express';
const router = express.Router();
import * as authContoller from '../controllers/authController.js'
import autyMiddleware from '../middleware/auth.js'

//public routes

router.post('/signup',authContoller.register);
router.post('/login',authContoller.login);
router.post('/reset-password',authContoller.requestPasswordReset);

// protected routes 
router.get('/me',autyMiddleware,authContoller.getCurrentUser);

export default router;