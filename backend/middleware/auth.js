const admin = require('firebase-admin');

// Try to load service account config
let serviceAccount;
try {
    const adminConfig = require('../config/firebase-config');
    if (adminConfig && adminConfig.adminConfig) {
        serviceAccount = adminConfig.adminConfig;
    }
} catch (e) {
    console.log('⚠️ Firebase Admin config not found. Auth will run in MOCK mode.');
}

// Initialize Firebase Admin (only if config exists)
if (serviceAccount) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('✅ Firebase Admin SDK initialized');
    } catch (e) {
        console.log('⚠️ Firebase Admin initialization failed:', e.message);
    }
}

const db = admin.firestore();

// 🎯 Auth Middleware: Verify Firebase ID Token
const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            status: 'error',
            message: 'Unauthorized: No token provided',
            code: 'NO_TOKEN'
        });
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        if (admin.apps.length > 0) {
            // Real Firebase verification
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            req.user = decodedToken;
            req.user.uid = decodedToken.uid;
            req.user.isAnonymous = decodedToken.firebase?.isAnonymous || false;
        } else {
            // Mock mode for development (remove in production!)
            req.user = {
                uid: idToken.substring(0, 28),
                email: 'demo@ethiopodcasts.com',
                name: 'Demo User',
                picture: null,
                isMock: true
            };
        }
        next();
    } catch (error) {
        console.error('Auth error:', error.message);
        return res.status(401).json({
            status: 'error',
            message: 'Invalid or expired token',
            code: 'INVALID_TOKEN'
        });
    }
};

// 🎯 Optional Auth Middleware: Allows both authenticated and anonymous requests
const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        req.user = null;
        return next();
    }

    try {
        await verifyToken(req, res, next);
    } catch (e) {
        req.user = null;
        next();
    }
};

// 🎯 Admin Check Middleware
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            status: 'error',
            message: 'Authentication required'
        });
    }
    
    // Check if user has admin claim
    if (!req.user.admin && !process.env.ADMIN_UIDS?.includes(req.user.uid)) {
        return res.status(403).json({
            status: 'error',
            message: 'Admin access required'
        });
    }
    
    next();
};

module.exports = { verifyToken, optionalAuth, requireAdmin, db, admin };
