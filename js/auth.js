/**
 * Authentication Module
 * Handles Firebase Authentication for the Debt Tracker app
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import {
    getAuth,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged as firebaseOnAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCfsNlaVRn0SG-lShPngu37D6AKEXVebb8",
    authDomain: "debt-tracker-cf9e6.firebaseapp.com",
    projectId: "debt-tracker-cf9e6",
    storageBucket: "debt-tracker-cf9e6.firebasestorage.app",
    messagingSenderId: "804807373024",
    appId: "1:804807373024:web:1f7e6943e55668cf39e085",
    measurementId: "G-812W9QY820"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

/**
 * Sign in with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<UserCredential>}
 */
export async function signIn(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('[Auth] User signed in:', userCredential.user.email);
        return userCredential;
    } catch (error) {
        console.error('[Auth] Sign in error:', error.code, error.message);
        throw error;
    }
}

/**
 * Sign out the current user
 * @returns {Promise<void>}
 */
export async function signOut() {
    try {
        await firebaseSignOut(auth);
        console.log('[Auth] User signed out');
        // Handle GitHub Pages redirect issue (missing trailing slash)
        const path = window.location.pathname;
        let target = 'login.html';

        if (!path.endsWith('/') && !path.endsWith('.html')) {
            const url = new URL(window.location.href);
            url.pathname = url.pathname + '/login.html';
            target = url.href;
        }

        window.location.href = target;
    } catch (error) {
        console.error('[Auth] Sign out error:', error);
        throw error;
    }
}

/**
 * Listen for authentication state changes
 * @param {Function} callback - Callback function that receives the user object
 * @returns {Function} Unsubscribe function
 */
export function onAuthStateChanged(callback) {
    return firebaseOnAuthStateChanged(auth, (user) => {
        if (user) {
            console.log('[Auth] User authenticated:', user.email);
        } else {
            console.log('[Auth] No user authenticated');
        }
        callback(user);
    });
}

/**
 * Get the current authenticated user
 * @returns {User|null}
 */
export function getCurrentUser() {
    return auth.currentUser;
}

/**
 * Check if user is authenticated, redirect to login if not
 * Call this on protected pages
 */
export function requireAuth() {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged((user) => {
            unsubscribe();
            if (user) {
                resolve(user);
            } else {
                console.log('[Auth] Not authenticated, redirecting to login');

                // Handle GitHub Pages redirect issue (missing trailing slash)
                // If path is like /debt-tracker (no slash), 'login.html' resolves to /login.html (wrong)
                // We want /debt-tracker/login.html
                const path = window.location.pathname;
                let target = 'login.html';

                if (!path.endsWith('/') && !path.endsWith('.html')) {
                    // We are likely at a directory root without slash
                    // Construct absolute path to ensure we stay in the directory
                    const url = new URL(window.location.href);
                    url.pathname = url.pathname + '/login.html';
                    target = url.href;
                }

                window.location.href = target;
                reject(new Error('Not authenticated'));
            }
        });
    });
}

console.log('[Auth] Module loaded');
