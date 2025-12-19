import { store } from './store.js';
import { getRelativeDate, parseLocalDate } from './utils.js';

export const requestPermission = async () => {
    if (!('Notification' in window)) {
        alert('This browser does not support desktop notifications');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
};

export const checkDueDates = async () => {
    if (Notification.permission !== 'granted') return;

    const debts = store.getDebts('all'); // Check all debts, not just current user
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    debts.forEach(debt => {
        if (debt.balance <= 0) return;

        const dueDate = parseLocalDate(debt.dueDate);

        const diffTime = dueDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 7 || diffDays === 1) {
            // Check if we already notified for this debt today (to avoid spam on reload)
            const notifiedKey = `notified_${debt.id}_${new Date().toISOString().split('T')[0]}`;
            if (localStorage.getItem(notifiedKey)) return;

            const title = diffDays === 1 ? 'Debt Due Tomorrow!' : 'Debt Due in 1 Week';
            const body = `${debt.name} is due on ${debt.dueDate}. Amount: $${debt.balance}`;

            new Notification(title, {
                body: body,
                icon: '/icons/icon-192.png', // Assuming we have an icon, or fallback
                tag: debt.id // Prevent duplicate notifications
            });

            localStorage.setItem(notifiedKey, 'true');
        }
    });
};
