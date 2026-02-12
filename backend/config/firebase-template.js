// 🔐 Firebase Configuration Template
// Copy this file to firebase-config.js and fill in your actual Firebase credentials

// Get these from Firebase Console → Project Settings → General → Your apps
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Admin SDK Configuration (for backend use)
// Get this from Firebase Console → Project Settings → Service Accounts
const adminConfig = {
    type: "service_account",
    project_id: "YOUR_PROJECT_ID",
    private_key_id: "YOUR_PRIVATE_KEY_ID",
    private_key: "YOUR_PRIVATE_KEY",
    client_email: "firebase-adminsdk-xxxxx@YOUR_PROJECT_ID.iam.gserviceaccount.com",
    client_id: "YOUR_CLIENT_ID",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40YOUR_PROJECT_ID.iam.gserviceaccount.com"
};

module.exports = { firebaseConfig, adminConfig };
