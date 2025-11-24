import { renderDashboard, renderDebts, renderHistory, showPayModal, renderUserSelector } from './ui.js';
import { checkDueDates } from './notifications.js';

const init = () => {
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
};

document.addEventListener('DOMContentLoaded', init);
