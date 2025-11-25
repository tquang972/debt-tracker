console.log("[App] Loading imports...");
import { renderDashboard, renderDebts, renderHistory, renderAnalytics, showPayModal, renderUserSelector } from './ui.js';
import { store } from './store.js';
import { checkDueDates } from './notifications.js';
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

    // Check notifications
    checkDueDates();

    // Subscribe to Store Updates (Real-time Sync)
    store.subscribe(() => {
        const activeTab = document.querySelector('.nav-item.active');
        const view = activeTab ? activeTab.dataset.view : 'dashboard';

        if (view === 'dashboard') renderDashboard();
        if (view === 'debts') renderDebts();
        if (view === 'history') renderHistory();

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
