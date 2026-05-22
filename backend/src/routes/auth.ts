import { Router } from 'express';
import { 
  signup, 
  login, 
  refresh, 
  logout, 
  getMe, 
  changePassword, 
  forgotPassword, 
  resetPassword, 
  sendEmailOtp,
  verifyAndLinkEmail,
  removeEmail,
  signupValidation, 
  loginValidation 
} from '../controllers/auth';
import { signupLimiter, loginLimiter } from '../middlewares/rateLimiter';
import { validateRequest, sanitizeBody } from '../middlewares/security';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/signup', signupLimiter, sanitizeBody, signupValidation, validateRequest, signup);
router.post('/login', loginLimiter, sanitizeBody, loginValidation, validateRequest, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);

router.post('/change-password', authenticate, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Email management
router.post('/email/send-otp', authenticate, sendEmailOtp);
router.post('/email/verify-link', authenticate, verifyAndLinkEmail);
router.post('/email/remove', authenticate, removeEmail);

export default router;
