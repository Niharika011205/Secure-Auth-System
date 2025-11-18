const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    refreshTokens: [{
        token: String,
        createdAt: { type: Date, default: Date.now }
    }],
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date
    },
    lastLogin: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Virtual for checking if account is locked
userSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Get remaining lock time in minutes
userSchema.virtual('lockTimeRemaining').get(function() {
    if (this.lockUntil && this.lockUntil > Date.now()) {
        return Math.ceil((this.lockUntil - Date.now()) / 1000 / 60);
    }
    return 0;
});

// Increment login attempts
userSchema.methods.incLoginAttempts = function() {
    // If we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $set: { loginAttempts: 1 },
            $unset: { lockUntil: 1 }
        });
    }
    
    // Otherwise increment
    const updates = { $inc: { loginAttempts: 1 } };
    
    // Lock the account after 5 attempts for 15 minutes
    const maxAttempts = 5;
    const lockTime = 15 * 60 * 1000; // 15 minutes
    
    if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
        updates.$set = { lockUntil: Date.now() + lockTime };
    }
    
    return this.updateOne(updates);
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $set: { 
            loginAttempts: 0,
            lastLogin: new Date()
        },
        $unset: { lockUntil: 1 }
    });
};

module.exports = mongoose.model('User', userSchema);