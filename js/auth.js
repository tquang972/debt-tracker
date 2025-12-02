/**
 * Authentication Module
 * Handles Firebase Authentication for the Debt Tracker app
 * Uses Firebase Compat SDK to match existing store.js implementation
 */

// Firebase is already initialized in firebase-config.js (via index.html scripts)
// We just need to access the auth service

/**
 * Sign in with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<firebase.auth.UserCredential>}
 */
export async function signIn(email, password) {
    try {
        const auth = window.firebase.auth();
        // Set persistence to LOCAL so login survives refreshes
        await auth.setPersistence(window.firebase.auth.Auth.Persistence.LOCAL);
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
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
        await window.firebase.auth().signOut();
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
    const auth = window.firebase.auth();
    return auth.onAuthStateChanged((user) => {
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
 * @returns {firebase.User|null}
 */
export function getCurrentUser() {
    return window.firebase.auth().currentUser;
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
                const path = window.location.pathname;
                let target = 'login.html';

                if (!path.endsWith('/') && !path.endsWith('.html')) {
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
