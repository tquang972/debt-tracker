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
    const handlePayButton = (e) => {
        if (e.target.classList.contains('pay-btn')) {
            e.preventDefault(); // Prevent double-firing
            const debtId = e.target.dataset.id;
            showPayModal(debtId);
        }
    };

    document.addEventListener('click', handlePayButton);
    document.addEventListener('touchend', handlePayButton);

    // Check notifications
    checkDueDates();
};

document.addEventListener('DOMContentLoaded', init);
