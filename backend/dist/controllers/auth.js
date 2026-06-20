"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeEmail = exports.verifyAndLinkEmail = exports.sendEmailOtp = exports.resetPassword = exports.forgotPassword = exports.changePassword = exports.getMe = exports.logout = exports.refresh = exports.login = exports.signup = exports.loginValidation = exports.signupValidation = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_validator_1 = require("express-validator");
const mongoose_1 = __importDefault(require("mongoose"));
const https_1 = __importDefault(require("https"));
const User_1 = __importDefault(require("../models/User"));
const RefreshToken_1 = __importDefault(require("../models/RefreshToken"));
const AbuseLog_1 = __importDefault(require("../models/AbuseLog"));
const encryption_1 = require("../services/encryption");
const socketManager_1 = require("../services/socketManager");
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 36500; // 100 years for permanent session
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const sendOtpEmail = async (email, otp) => {
    const apiKey = process.env.RESEND_API_KEY || 're_73QjCDcx_82pmGk48rQjSQJ5YggN9XcV1';
    const postData = JSON.stringify({
        from: 'Unseen Security <onboarding@resend.dev>',
        to: email,
        subject: 'Your Unseen Verification OTP Code',
        html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #3c166d; border-radius: 12px; background-color: #0b011d; color: #ffffff;">
        <h2 style="color: #c77dff; text-align: center; font-size: 24px; margin-bottom: 24px; letter-spacing: 2px;">UNSEEN SECURITY</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #d0c8ec;">You requested a verification code to access or secure your anonymous identity. Please use the following One-Time Password (OTP):</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #ff0a54; background-color: #160733; padding: 12px 30px; border-radius: 8px; border: 1px solid #5a189a; font-family: monospace;">${otp}</span>
        </div>
        <p style="font-size: 13px; line-height: 1.5; color: #8e80bc;">This OTP is valid for <strong>15 minutes</strong>. If you did not request this, please ignore this message securely.</p>
        <hr style="border: 0; border-top: 1px solid #3c166d; margin: 24px 0;" />
        <p style="font-size: 11px; text-align: center; color: #6c5f93;">&copy; 2026 Unseen. The Anonymous Network.</p>
      </div>
    `
    });
    const options = {
        hostname: 'api.resend.com',
        port: 443,
        path: '/emails',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };
    return new Promise((resolve) => {
        const req = https_1.default.request(options, (res) => {
            let responseBody = '';
            res.on('data', (chunk) => { responseBody += chunk; });
            res.on('end', () => {
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                    console.log(`[RESEND SUCCESS] OTP email delivered to ${email}`);
                }
                else {
                    console.error(`[RESEND ERROR] Code: ${res.statusCode}, Body: ${responseBody}`);
                }
                resolve();
            });
        });
        req.on('error', (err) => {
            console.error('[RESEND CONNECTION EXCEPTION]', err);
            resolve();
        });
        req.write(postData);
        req.end();
    });
};
// ─── Validation rules ──────────────────────────────────────────────────────
exports.signupValidation = [
    (0, express_validator_1.body)('username')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ min: 3, max: 20 }).withMessage('Username must be 3-20 characters')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 4 })
        .withMessage('Password must be at least 4 characters'),
    (0, express_validator_1.body)('displayName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Display name must be 2–50 characters'),
    (0, express_validator_1.body)('email')
        .optional({ checkFalsy: true })
        .isEmail()
        .withMessage('Invalid email address'),
];
exports.loginValidation = [
    (0, express_validator_1.body)('username').trim().notEmpty().withMessage('Username is required'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
];
// ─── Helpers ───────────────────────────────────────────────────────────────
function generateUsername() {
    const adjectives = ['Shadow', 'Silent', 'Void', 'Phantom', 'Hidden', 'Dark', 'Ghost', 'Neon', 'Mystic', 'Cosmic', 'Astral', 'Hollow', 'Faded', 'Lost'];
    const nouns = ['Echo', 'Pulse', 'Signal', 'Drift', 'Cipher', 'Mirage', 'Specter', 'Wraith', 'Glitch', 'Nexus', 'Veil', 'Storm'];
    const num = Math.floor(Math.random() * 9000) + 1000;
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adj}${noun}${num}`;
}
const AVATAR_COLORS = [
    'from-violet-500 to-purple-900',
    'from-rose-500 to-pink-900',
    'from-blue-400 to-indigo-900',
    'from-emerald-400 to-teal-900',
    'from-amber-400 to-orange-900',
    'from-cyan-400 to-sky-900',
    'from-yellow-400 to-yellow-900',
    'from-green-400 to-green-900',
    'from-red-500 to-red-900',
    'from-sky-400 to-sky-900',
    'from-lime-400 to-lime-900',
    'from-fuchsia-500 to-fuchsia-900',
    'from-orange-400 to-red-600',
    'from-teal-400 to-cyan-800',
    'from-pink-400 to-rose-800',
    'from-indigo-400 to-violet-800'
];
function randomAvatarColor() {
    return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}
function issueTokens(userId, username, role, sessionId) {
    const accessToken = jsonwebtoken_1.default.sign({ id: userId, username, role, sessionId }, process.env.JWT_SECRET || 'secret', { expiresIn: ACCESS_TOKEN_EXPIRY });
    const refreshToken = (0, encryption_1.generateSecureToken)(40);
    return { accessToken, refreshToken };
}
function setRefreshCookie(res, refreshToken) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'strict',
        maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
        path: '/',
    });
}
// ─── Controllers ───────────────────────────────────────────────────────────
const signup = async (req, res) => {
    try {
        const { username: reqUsername, displayName, email, password } = req.body;
        const ipHash = (0, encryption_1.hashOneWay)(req.ip || 'unknown');
        let finalUsername = reqUsername ? reqUsername.toLowerCase() : '';
        if (finalUsername) {
            // Check if provided username is already taken
            const existing = await User_1.default.findOne({ username: finalUsername });
            if (existing) {
                return res.status(400).json({ message: 'This identity (username) is already taken.' });
            }
        }
        else {
            // Generate unique username
            finalUsername = generateUsername();
            let attempts = 0;
            while (await User_1.default.findOne({ username: finalUsername }) && attempts < 10) {
                finalUsername = generateUsername();
                attempts++;
            }
        }
        const passwordHash = await bcrypt_1.default.hash(password, 10);
        const sessionId = new mongoose_1.default.Types.ObjectId().toString();
        const newUser = new User_1.default({
            username: finalUsername,
            displayName: displayName || finalUsername,
            email: email || undefined,
            passwordHash,
            avatarColor: randomAvatarColor(),
            currentSessionId: sessionId,
        });
        await newUser.save();
        const { accessToken, refreshToken } = issueTokens(newUser._id.toString(), newUser.username, newUser.role, sessionId);
        const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
        await RefreshToken_1.default.create({
            userId: newUser._id,
            token: refreshToken,
            deviceInfo: req.headers['user-agent'] || 'Unknown',
            ipAddress: ipHash,
            expiresAt,
        });
        setRefreshCookie(res, refreshToken);
        res.status(201).json({
            accessToken,
            refreshToken,
            user: {
                id: newUser._id,
                username: newUser.username,
                displayName: newUser.displayName,
                avatarColor: newUser.avatarColor,
                role: newUser.role,
                email: newUser.email,
                emailVerified: newUser.emailVerified,
            },
        });
    }
    catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Account already exists.' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.signup = signup;
const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const ipHash = (0, encryption_1.hashOneWay)(req.ip || 'unknown');
        const user = await User_1.default.findOne({
            $or: [
                { username: username.toLowerCase().trim() },
                { email: username.toLowerCase().trim() },
                { displayName: username.trim() },
                { displayName: new RegExp(`^${username.trim()}$`, 'i') }
            ]
        });
        if (!user) {
            // Generic message — don't reveal if username exists
            return res.status(401).json({ message: 'Invalid credentials.' });
        }
        // Check suspension
        if (user.isSuspended) {
            return res.status(403).json({ message: `Account suspended: ${user.suspendReason || 'Policy violation.'}` });
        }
        // Check if account is locked
        if (user.lockUntil && user.lockUntil > new Date()) {
            const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
            return res.status(423).json({ message: `Account locked. Try again in ${minutesLeft} minutes.` });
        }
        const isMatch = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            // Increment failed login attempts
            user.loginAttempts += 1;
            if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
                user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
                await AbuseLog_1.default.create({
                    userId: user._id,
                    ipHash,
                    eventType: 'account_locked',
                    details: `Locked after ${MAX_LOGIN_ATTEMPTS} failed attempts`,
                    severity: 'high',
                });
            }
            else {
                await AbuseLog_1.default.create({
                    userId: user._id,
                    ipHash,
                    eventType: 'failed_login',
                    details: `Attempt ${user.loginAttempts}/${MAX_LOGIN_ATTEMPTS}`,
                    severity: 'low',
                });
            }
            await user.save();
            const remaining = MAX_LOGIN_ATTEMPTS - user.loginAttempts;
            return res.status(401).json({
                message: `Invalid credentials. ${remaining > 0 ? `${remaining} attempts remaining.` : 'Account locked.'}`,
            });
        }
        // Generate new unique session ID
        const sessionId = new mongoose_1.default.Types.ObjectId().toString();
        // Revoke all existing refresh tokens for this user (logs out other devices)
        await RefreshToken_1.default.deleteMany({ userId: user._id });
        // Reset on success
        user.loginAttempts = 0;
        user.lockUntil = undefined;
        user.lastSeenAt = new Date();
        user.currentSessionId = sessionId;
        await user.save();
        const { accessToken, refreshToken } = issueTokens(user._id.toString(), user.username, user.role, sessionId);
        const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
        await RefreshToken_1.default.create({
            userId: user._id,
            token: refreshToken,
            deviceInfo: req.headers['user-agent'] || 'Unknown',
            ipAddress: ipHash,
            expiresAt,
        });
        // Terminate other active sockets in real-time
        (0, socketManager_1.invalidateUserSessions)(user._id.toString(), sessionId);
        setRefreshCookie(res, refreshToken);
        res.json({
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                username: user.username,
                displayName: user.displayName,
                avatarColor: user.avatarColor,
                bio: user.bio,
                role: user.role,
                followersCount: user.followersCount,
                followingCount: user.followingCount,
                email: user.email,
                emailVerified: user.emailVerified,
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.login = login;
const refresh = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken || req.body?.refreshToken;
        if (!token)
            return res.status(401).json({ message: 'No refresh token.' });
        const stored = await RefreshToken_1.default.findOne({ token }).populate('userId');
        if (!stored || stored.expiresAt < new Date()) {
            if (stored)
                await stored.deleteOne();
            return res.status(401).json({ message: 'Refresh token expired. Please log in again.' });
        }
        const user = await User_1.default.findById(stored.userId);
        if (!user || !user.isActive || user.isSuspended) {
            return res.status(401).json({ message: 'Account not accessible.' });
        }
        // Rotate refresh token
        await stored.deleteOne();
        const sessionId = user.currentSessionId || new mongoose_1.default.Types.ObjectId().toString();
        if (!user.currentSessionId) {
            user.currentSessionId = sessionId;
            await user.save();
        }
        const { accessToken, refreshToken: newRefreshToken } = issueTokens(user._id.toString(), user.username, user.role, sessionId);
        const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
        await RefreshToken_1.default.create({
            userId: user._id,
            token: newRefreshToken,
            deviceInfo: req.headers['user-agent'] || 'Unknown',
            ipAddress: (0, encryption_1.hashOneWay)(req.ip || 'unknown'),
            expiresAt,
        });
        setRefreshCookie(res, newRefreshToken);
        res.json({ accessToken, refreshToken: newRefreshToken });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.refresh = refresh;
const logout = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;
        if (token) {
            await RefreshToken_1.default.deleteOne({ token });
        }
        res.clearCookie('refreshToken', { path: '/' });
        res.json({ message: 'Logged out successfully.' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.logout = logout;
const getMe = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user?.id).select('-passwordHash -loginAttempts -lockUntil');
        if (!user)
            return res.status(404).json({ message: 'User not found.' });
        // Update last seen
        await User_1.default.findByIdAndUpdate(req.user?.id, { lastSeenAt: new Date() });
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.getMe = getMe;
const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required.' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters.' });
        }
        const user = await User_1.default.findById(req.user?.id);
        if (!user)
            return res.status(404).json({ message: 'User not found.' });
        const isMatch = await bcrypt_1.default.compare(oldPassword, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect current password.' });
        }
        user.passwordHash = await bcrypt_1.default.hash(newPassword, 10);
        await user.save();
        res.json({ message: 'Password updated successfully.' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.changePassword = changePassword;
const forgotPassword = async (req, res) => {
    try {
        const { email, displayName, secureOtp } = req.body;
        if (!email)
            return res.status(400).json({ message: 'Email is required.' });
        const ipHash = (0, encryption_1.hashOneWay)(req.ip || 'unknown');
        const user = await User_1.default.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            // For security, don't leak if email exists, but return success
            return res.json({ message: 'If that email is registered, an OTP has been sent.' });
        }
        // Cooldown check to prevent spam recovery requests (60 seconds)
        if (user.lastOtpSentAt && Date.now() - user.lastOtpSentAt.getTime() < 60 * 1000) {
            const secondsLeft = Math.ceil((60 * 1000 - (Date.now() - user.lastOtpSentAt.getTime())) / 1000);
            return res.status(429).json({ message: `Please wait ${secondsLeft} seconds before requesting a new OTP.` });
        }
        // Validation for Login page forgot password flow: matching email + displayName
        if (displayName && user.displayName.toLowerCase().trim() !== displayName.toLowerCase().trim()) {
            await AbuseLog_1.default.create({
                userId: user._id,
                ipHash,
                eventType: 'suspicious_activity',
                details: `Forgot password failed: Display name mismatch for email '${email}' (Provided: '${displayName}', Actual: '${user.displayName}')`,
                severity: 'medium',
            });
            return res.status(400).json({ message: 'Email and Display Name do not match our records.' });
        }
        const otp = secureOtp || Math.floor(100000 + Math.random() * 900000).toString();
        user.resetPasswordOtp = otp;
        user.resetPasswordOtpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
        user.lastOtpSentAt = new Date();
        user.failedOtpAttempts = 0; // Reset count
        await user.save();
        sendOtpEmail(email, otp).catch(e => console.error('Failed to send recovery OTP email:', e));
        res.json({
            message: 'If that email is registered, an OTP has been sent.',
            otp: process.env.NODE_ENV === 'development' ? otp : undefined
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: 'All fields are required.' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters.' });
        }
        const ipHash = (0, encryption_1.hashOneWay)(req.ip || 'unknown');
        const user = await User_1.default.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }
        // Check if OTP has expired
        if (!user.resetPasswordOtp || !user.resetPasswordOtpExpires || user.resetPasswordOtpExpires < new Date()) {
            return res.status(400).json({ message: 'OTP has expired or is invalid. Please request a new one.' });
        }
        // Brute-force check
        const currentFailedAttempts = user.failedOtpAttempts || 0;
        if (currentFailedAttempts >= 5) {
            // Invalidate OTP
            user.resetPasswordOtp = undefined;
            user.resetPasswordOtpExpires = undefined;
            user.failedOtpAttempts = 0;
            await user.save();
            await AbuseLog_1.default.create({
                userId: user._id,
                ipHash,
                eventType: 'suspicious_activity',
                details: `OTP recovery locked: Too many failed OTP attempts for email '${email}'`,
                severity: 'high',
            });
            return res.status(429).json({ message: 'Too many failed verification attempts. This OTP has been invalidated. Please request a new one.' });
        }
        // Verify OTP
        if (user.resetPasswordOtp !== otp.trim()) {
            user.failedOtpAttempts = currentFailedAttempts + 1;
            await user.save();
            await AbuseLog_1.default.create({
                userId: user._id,
                ipHash,
                eventType: 'suspicious_activity',
                details: `Failed OTP attempt (${user.failedOtpAttempts}/5) for email '${email}'`,
                severity: 'low',
            });
            return res.status(400).json({ message: `Invalid OTP. You have ${5 - user.failedOtpAttempts} attempts remaining.` });
        }
        // OTP is valid! Reset password
        user.passwordHash = await bcrypt_1.default.hash(newPassword, 10);
        user.resetPasswordOtp = undefined;
        user.resetPasswordOtpExpires = undefined;
        user.failedOtpAttempts = 0;
        await user.save();
        res.json({ message: 'Password has been reset successfully.' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.resetPassword = resetPassword;
const sendEmailOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email)
            return res.status(400).json({ message: 'Email is required.' });
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format.' });
        }
        const user = await User_1.default.findById(req.user?.id);
        if (!user)
            return res.status(404).json({ message: 'User not found.' });
        // Cooldown check (60s)
        if (user.lastOtpSentAt && Date.now() - user.lastOtpSentAt.getTime() < 60 * 1000) {
            const secondsLeft = Math.ceil((60 * 1000 - (Date.now() - user.lastOtpSentAt.getTime())) / 1000);
            return res.status(429).json({ message: `Please wait ${secondsLeft} seconds before requesting a new OTP.` });
        }
        // Check if email is already taken by another user
        const existingUser = await User_1.default.findOne({ email: email.toLowerCase().trim(), _id: { $ne: user._id } });
        if (existingUser) {
            return res.status(400).json({ message: 'Email is already in use by another account.' });
        }
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetPasswordOtp = otp;
        user.resetPasswordOtpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
        user.lastOtpSentAt = new Date();
        user.failedOtpAttempts = 0;
        await user.save();
        sendOtpEmail(email, otp).catch(e => console.error('Failed to send verification OTP email:', e));
        res.json({
            message: 'Verification OTP sent successfully.',
            otp: process.env.NODE_ENV === 'development' ? otp : undefined
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.sendEmailOtp = sendEmailOtp;
const verifyAndLinkEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required.' });
        }
        const user = await User_1.default.findById(req.user?.id);
        if (!user)
            return res.status(404).json({ message: 'User not found.' });
        // Validate OTP exists
        if (!user.resetPasswordOtp || !user.resetPasswordOtpExpires || user.resetPasswordOtpExpires < new Date()) {
            return res.status(400).json({ message: 'OTP has expired or is invalid.' });
        }
        // Brute-force check
        const currentFailedAttempts = user.failedOtpAttempts || 0;
        if (currentFailedAttempts >= 5) {
            user.resetPasswordOtp = undefined;
            user.resetPasswordOtpExpires = undefined;
            user.failedOtpAttempts = 0;
            await user.save();
            return res.status(429).json({ message: 'Too many failed verification attempts. This OTP has been invalidated. Please request a new one.' });
        }
        if (user.resetPasswordOtp !== otp.trim()) {
            user.failedOtpAttempts = currentFailedAttempts + 1;
            await user.save();
            return res.status(400).json({ message: `Invalid OTP. You have ${5 - user.failedOtpAttempts} attempts remaining.` });
        }
        // Success! Verify and link/update email
        user.email = email.toLowerCase().trim();
        user.emailVerified = true;
        user.resetPasswordOtp = undefined;
        user.resetPasswordOtpExpires = undefined;
        user.failedOtpAttempts = 0;
        await user.save();
        res.json({
            message: 'Recovery email updated and verified successfully.',
            user: {
                id: user._id,
                username: user.username,
                displayName: user.displayName,
                avatarColor: user.avatarColor,
                email: user.email,
                emailVerified: user.emailVerified,
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.verifyAndLinkEmail = verifyAndLinkEmail;
const removeEmail = async (req, res) => {
    try {
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({ message: 'Password is required to confirm email removal.' });
        }
        const user = await User_1.default.findById(req.user?.id);
        if (!user)
            return res.status(404).json({ message: 'User not found.' });
        const isMatch = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect password.' });
        }
        // Remove email fields
        user.email = undefined;
        user.emailVerified = false;
        await user.save();
        res.json({
            message: 'Recovery email removed successfully.',
            user: {
                id: user._id,
                username: user.username,
                displayName: user.displayName,
                avatarColor: user.avatarColor,
                email: undefined,
                emailVerified: false,
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.removeEmail = removeEmail;
