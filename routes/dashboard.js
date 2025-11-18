const express = require('express');
const User = require('../models/User');

const router = express.Router();

// Auth middleware
const requireAuth = (req, res, next) => {
    console.log('🔐 Auth check - Session user:', req.session.user ? 'exists' : 'missing');
    if (!req.session.user) {
        req.flash('error_msg', 'Please login to access this page');
        return res.redirect('/auth/login');
    }
    next();
};

// Dashboard
router.get('/', requireAuth, async (req, res) => {
    try {
        console.log('📊 Loading dashboard for user:', req.session.user.id);
        // Get fresh user data
        const user = await User.findById(req.session.user.id).select('-password -refreshTokens');
        
        if (!user) {
            console.log('⚠️ User not found in database');
            req.session.destroy();
            req.flash('error_msg', 'User not found');
            return res.redirect('/auth/login');
        }

        console.log('✅ Dashboard loaded for:', user.email);
        // Update session with fresh data
        req.session.user = {
            id: user._id,
            username: user.username,
            email: user.email,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin
        };

        res.render('dashboard', { 
            title: 'Dashboard',
            user: user
        });
    } catch (error) {
        console.error('❌ Dashboard error:', error);
        req.flash('error_msg', 'Error loading dashboard');
        res.redirect('/auth/login');
    }
});

// Profile page
router.get('/profile', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.session.user.id).select('-password -refreshTokens');
        res.render('profile', { 
            title: 'Profile',
            user: user
        });
    } catch (error) {
        console.error('Profile error:', error);
        req.flash('error_msg', 'Error loading profile');
        res.redirect('/dashboard');
    }
});

// Security page
router.get('/security', requireAuth, (req, res) => {
    res.render('security', { 
        title: 'Security Features'
    });
});

module.exports = router;