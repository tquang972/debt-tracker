// Initialize Firebase (Compat)
// firebase is available globally from the script tag

const firebaseConfig = {
    apiKey: "AIzaSyCfsNlaVRn0SG-lShPngu37D6AKEXVebb8",
    authDomain: "debt-tracker-cf9e6.firebaseapp.com",
    projectId: "debt-tracker-cf9e6",
    storageBucket: "debt-tracker-cf9e6.firebasestorage.app",
    messagingSenderId: "804807373024",
    appId: "1:804807373024:web:1f7e6943e55668cf39e085",
    measurementId: "G-812W9QY820"
};

if (typeof window === 'undefined' && !globalThis.firebase) {
    // Provide a minimal mock for Node environment
    globalThis.firebase = {
        initializeApp: () => { },
        firestore: () => ({
            collection: () => ({
                add: async (doc) => ({ id: 'mockId', ...doc }),
                get: async () => ({ exists: true, data: () => ({}) })
            })
        })
    };
}

if (!globalThis.firebase) {
    console.error("Firebase global not found! Check script tags.");
    throw new Error("Firebase not loaded");
}

globalThis.firebase.initializeApp(firebaseConfig);
export const db = globalThis.firebase.firestore();
