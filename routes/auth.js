const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

const router = express.Router();

// Login page
router.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    res.render('login', { title: 'Login' });
});

// Register page
router.get('/register', (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    res.render('register', { title: 'Register' });
});

// Logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            req.flash('error_msg', 'Error logging out');
            return res.redirect('/dashboard');
        }
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
});

// Register POST
router.post('/register',
    [
        body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
        body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
        body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
        body('confirmPassword').custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords do not match');
            }
            return true;
        })
    ],
    async (req, res) => {
        console.log('📝 Registration attempt:', req.body.email);
        const errors = validationResult(req);
        
        if (!errors.isEmpty()) {
            console.log('❌ Validation errors:', errors.array());
            const errorMessages = errors.array().map(error => error.msg);
            req.flash('error_msg', errorMessages.join('. '));
            return res.redirect('/auth/register');
        }

        try {
            const { username, email, password } = req.body;
            console.log('🔍 Checking for existing user...');

            // Check if user exists
            const existingUser = await User.findOne({ $or: [{ email }, { username }] });
            if (existingUser) {
                console.log('⚠️ User already exists');
                req.flash('error_msg', 'User with this email or username already exists');
                return res.redirect('/auth/register');
            }

            console.log('🔐 Hashing password...');
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 12);

            console.log('💾 Creating user...');
            // Create user
            const user = new User({
                username,
                email,
                password: hashedPassword
            });

            await user.save();
            console.log('✅ User created successfully:', email);

            req.flash('success_msg', 'Registration successful! You can now login.');
            console.log('🔄 Redirecting to /auth/login');
            res.redirect('/auth/login');
        } catch (error) {
            console.error('❌ Registration error:', error);
            req.flash('error_msg', 'Registration failed. Please try again.');
            res.redirect('/auth/register');
        }
    }
);

// Login POST
router.post('/login',
    [
        body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
        body('password').notEmpty().withMessage('Password is required')
    ],
    async (req, res) => {
        console.log('🔐 Login attempt:', req.body.email);
        const errors = validationResult(req);
        
        if (!errors.isEmpty()) {
            console.log('❌ Validation errors:', errors.array());
            const errorMessages = errors.array().map(error => error.msg);
            req.flash('error_msg', errorMessages.join('. '));
            return res.redirect('/auth/login');
        }

        try {
            const { email, password } = req.body;
            console.log('🔍 Looking for user:', email);

            // Find user
            const user = await User.findOne({ email });
            if (!user) {
                console.log('⚠️ User not found:', email);
                req.flash('error_msg', 'Invalid email or password');
                return res.redirect('/auth/login');
            }

            console.log('✅ User found:', email);

            // Check if account is locked
            if (user.isLocked) {
                console.log('🔒 Account is locked');
                const lockTimeRemaining = user.lockTimeRemaining;
                req.flash('error_msg', `Account locked due to too many failed login attempts. Try again in ${lockTimeRemaining} minutes.`);
                return res.redirect('/auth/login');
            }

            console.log('🔑 Verifying password...');
            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password);
            
            if (!isValidPassword) {
                console.log('❌ Invalid password');
                await user.incLoginAttempts();
                const attemptsLeft = 5 - (user.loginAttempts + 1);
                
                if (attemptsLeft > 0) {
                    req.flash('error_msg', `Invalid email or password. ${attemptsLeft} attempts remaining.`);
                } else {
                    req.flash('error_msg', 'Account locked due to too many failed login attempts. Try again in 15 minutes.');
                }
                return res.redirect('/auth/login');
            }

            console.log('✅ Password valid');

            // Reset login attempts on successful login
            if (user.loginAttempts > 0) {
                console.log('🔄 Resetting login attempts');
                await user.resetLoginAttempts();
            }

            console.log('💾 Creating session...');
            // Set session
            req.session.user = {
                id: user._id,
                username: user.username,
                email: user.email,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin
            };

            console.log('✅ Session created, redirecting to dashboard');
            req.flash('success_msg', `Welcome back, ${user.username}!`);
            res.redirect('/dashboard');
        } catch (error) {
            console.error('❌ Login error:', error);
            req.flash('error_msg', 'Login failed. Please try again.');
            res.redirect('/auth/login');
        }
    }
);

module.exports = router;