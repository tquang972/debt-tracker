console.log("[App] Loading imports...");
import { renderDashboard, renderDebts, renderHistory, renderAnalytics, showPayModal, renderUserSelector } from './ui.js?v=5';
import { store } from './store.js?v=5';
import { checkDueDates } from './notifications.js?v=5';
import { signOut } from './auth.js?v=5';
console.log("[App] Imports loaded, store:", store);

const init = () => {
    console.log("App init started");
    // Initial Render
    renderUserSelector();
    renderDashboard();

    // Navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // Update Active State
            navItems.forEach(nav => nav.classList.remove('active'));
            e.currentTarget.classList.add('active');

            // Render View
            const view = e.currentTarget.dataset.view;
            if (view === 'dashboard') renderDashboard();
            if (view === 'debts') renderDebts();
            if (view === 'history') renderHistory();
            if (view === 'analytics') renderAnalytics();
        });
    });

    // Global Event Delegation for dynamic buttons (both click and touch)
    // Global Event Delegation for dynamic buttons
    const handlePayButton = (e) => {
        const btn = e.target.closest('.pay-btn');
        if (btn) {
            e.preventDefault();
            const debtId = btn.dataset.id;
            showPayModal(debtId);
        }
    };

    document.addEventListener('click', handlePayButton);
    // Removed touchend listener as it can conflict with scrolling and standard click behavior
    // Relied on touch-action: manipulation in CSS for fast clicks

    // PWA Install Logic
    let deferredPrompt;
    const installBtn = document.getElementById('installBtn');

    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault();
        // Stash the event so it can be triggered later.
        deferredPrompt = e;
        // Update UI to notify the user they can add to home screen
        installBtn.style.display = 'block';
    });

    installBtn.addEventListener('click', (e) => {
        // Hide the app provided install promotion
        installBtn.style.display = 'none';
        // Show the install prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the A2HS prompt');
            } else {
                console.log('User dismissed the A2HS prompt');
            }
            deferredPrompt = null;
        });
    });

    // Logout Handler
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await signOut();
            } catch (error) {
                console.error('[App] Logout error:', error);
                alert('Failed to logout. Please try again.');
            }
        });
    }

    // Check notifications
    checkDueDates();

    // Subscribe to Store Updates (Real-time Sync)
    store.subscribe(() => {
        const activeTab = document.querySelector('.nav-item.active');
        const view = activeTab ? activeTab.dataset.view : 'dashboard';

        if (view === 'dashboard') renderDashboard();
        if (view === 'debts') renderDebts();
        if (view === 'history') renderHistory();
        if (view === 'analytics') renderAnalytics();

        // Also update user selector if people list changes
        renderUserSelector();
    });
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // DOM already loaded, run init immediately
    init();
}
