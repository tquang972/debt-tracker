import { store } from './store.js';
import { formatCurrency, formatDate, getRelativeDate, isThisWeek, isThisMonth } from './utils.js';

const app = document.getElementById('app');
const mainContent = document.getElementById('mainContent');
const userSelector = document.getElementById('userSelector');

export const renderUserSelector = () => {
    const people = store.getPeople();
    const currentId = store.getCurrentUserId();

    userSelector.innerHTML = `
        <select id="userSelect" class="user-select-input">
            ${people.map(p => `<option value="${p.id}" ${p.id === currentId ? 'selected' : ''}>${p.name}</option>`).join('')}
            <option value="add_new">+ Add Person</option>
        </select>
    `;

    document.getElementById('userSelect').addEventListener('change', (e) => {
        if (e.target.value === 'add_new') {
            const name = prompt('Enter name for new person:');
            if (name) {
                const newId = store.addPerson(name);
                store.setCurrentUserId(newId);
                renderUserSelector();
                renderDashboard(); // Refresh view
            } else {
                e.target.value = currentId; // Revert
            }
        } else {
            store.setCurrentUserId(e.target.value);
            // Refresh current view
            const activeTab = document.querySelector('.nav-item.active').dataset.view;
            if (activeTab === 'dashboard') renderDashboard();
            else if (activeTab === 'debts') renderDebts();
            else if (activeTab === 'history') renderHistory();
        }
    });
};

export const renderDashboard = () => {
    // Hide loading elements
    const loadingMsg = document.getElementById('loadingMsg');
    const errorLog = document.getElementById('errorLog');
    if (loadingMsg) loadingMsg.style.display = 'none';
    if (errorLog) errorLog.style.display = 'none';

    const debts = store.getDebts().filter(d => d.balance > 0); // Only show unpaid debts
    const totalDebt = debts.reduce((sum, d) => sum + parseFloat(d.balance), 0);

    // Forecasting
    const weeklyDue = debts.filter(d => isThisWeek(d.dueDate)).reduce((sum, d) => sum + parseFloat(d.balance), 0); // Simplified: assumes full balance due, logic can be refined
    const monthlyDue = debts.filter(d => isThisMonth(d.dueDate)).reduce((sum, d) => sum + parseFloat(d.balance), 0);

    const upcomingDebts = debts
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    mainContent.innerHTML = `
        <div class="dashboard-header">
            <div class="card summary-card">
                <h3>Total Debt</h3>
                <div class="amount">${formatCurrency(totalDebt)}</div>
            </div>
            <div class="forecast-row">
                <div class="card forecast-card">
                    <h4>Due This Week</h4>
                    <div class="amount-sm">${formatCurrency(weeklyDue)}</div>
                </div>
                <div class="card forecast-card">
                    <h4>Due This Month</h4>
                    <div class="amount-sm">${formatCurrency(monthlyDue)}</div>
                </div>
            </div>
            <div class="actions-row" style="margin-top: 1rem; text-align: right;">
                 <button id="notifyBtn" class="btn-sm btn-secondary" style="font-size: 0.8rem;">
                    🔔 Enable Notifications
                 </button>
            </div>
        </div>

        <div class="section-header">
            <h3>Upcoming</h3>
        </div>
        
        <div class="debt-list">
            ${upcomingDebts.map(debt => createDebtItem(debt)).join('')}
            ${upcomingDebts.length === 0 ? '<p class="empty-state">No upcoming debts.</p>' : ''}
        </div>
    `;

    const notifyBtn = document.getElementById('notifyBtn');
    if (Notification.permission === 'granted') {
        notifyBtn.textContent = '🔕 Notifications On';
        notifyBtn.disabled = true;
    } else {
        notifyBtn.addEventListener('click', async () => {
            const granted = await import('./notifications.js').then(m => m.requestPermission());
            if (granted) {
                notifyBtn.textContent = '🔕 Notifications On';
                notifyBtn.disabled = true;
                import('./notifications.js').then(m => m.checkDueDates());
            }
        });
    }
};

export const renderDebts = () => {
    // Hide loading elements
    const loadingMsg = document.getElementById('loadingMsg');
    const errorLog = document.getElementById('errorLog');
    if (loadingMsg) loadingMsg.style.display = 'none';
    if (errorLog) errorLog.style.display = 'none';

    const debts = store.getDebts().filter(d => d.balance > 0);

    mainContent.innerHTML = `
        <div class="section-header">
            <h3>All Debts</h3>
            <button class="btn-icon" id="addDebtBtn">+</button>
        </div>
        <div class="debt-list">
            ${debts.map(debt => createDebtItem(debt)).join('')}
        </div>
    `;

    document.getElementById('addDebtBtn').addEventListener('click', showAddDebtModal);
};

export const renderHistory = () => {
    // Hide loading elements
    const loadingMsg = document.getElementById('loadingMsg');
    const errorLog = document.getElementById('errorLog');
    if (loadingMsg) loadingMsg.style.display = 'none';
    if (errorLog) errorLog.style.display = 'none';

    const currentUserId = store.getCurrentUserId();
    const allPayments = store.getPayments();
    const debts = store.getDebts('all');

    // Filter payments to only show those for current user's debts
    const payments = allPayments.filter(pay => {
        const debt = debts.find(d => d.id === pay.debtId);
        return debt && debt.personId === currentUserId;
    });

    mainContent.innerHTML = `
        <div class="section-header">
            <h3>Payment History</h3>
        </div>
        <div class="history-list">
            ${payments.map(pay => {
        const debt = debts.find(d => d.id === pay.debtId);
        const debtName = debt ? debt.name : 'Unknown Debt';
        return `
                <div class="card history-item">
                    <div class="history-details">
                        <div class="history-name" style="font-weight: 600; margin-bottom: 0.25rem;">${debtName}</div>
                        <span class="history-date">${formatDate(pay.date)}</span>
                        ${pay.note ? `<span class="history-note">${pay.note}</span>` : ''}
                    </div>
                    <div class="history-amount success">
                        -${formatCurrency(pay.amount)}
                    </div>
                </div>
            `;
    }).join('')}
        </div>
    `;
};

const createDebtItem = (debt) => {
    return `
        <div class="card debt-item">
            <div class="debt-info">
                <div class="debt-name">${debt.name}</div>
                ${debt.note ? `<div class="debt-note">${debt.note}</div>` : ''}
                <div class="debt-due ${getRelativeDate(debt.dueDate) === 'Overdue' ? 'text-danger' : ''}">
                    Due: ${formatDate(debt.dueDate)} (${getRelativeDate(debt.dueDate)})
                </div>
            </div>
            <div class="debt-actions">
                <div class="debt-balance">${formatCurrency(debt.balance)}</div>
                <button class="btn-sm pay-btn" data-id="${debt.id}">Pay</button>
            </div>
        </div>
    `;
};

// --- Modals ---

export const showAddDebtModal = () => {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal card">
            <h3>Add New Debt</h3>
            <form id="addDebtForm">
                <div class="form-group">
                    <label>Name</label>
                    <input type="text" name="name" required placeholder="e.g. Car Loan">
                </div>
                <div class="form-group">
                    <label>Balance</label>
                    <input type="number" name="balance" step="0.01" required placeholder="0.00">
                </div>
                <div class="form-group">
                    <label>Due Date</label>
                    <input type="date" name="dueDate" required>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" id="cancelBtn">Cancel</button>
                    <button type="submit" class="btn">Save</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('cancelBtn').addEventListener('click', () => modal.remove());
    document.getElementById('addDebtForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        store.addDebt({
            name: formData.get('name'),
            balance: formData.get('balance'),
            dueDate: formData.get('dueDate'),
            personId: store.getCurrentUserId()
        });
        modal.remove();
        renderDebts(); // Refresh
    });
};

export const showPayModal = (debtId) => {
    const debt = store.getDebts().find(d => d.id === debtId);
    if (!debt) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal card">
            <h3>Make Payment</h3>
            <p>For: ${debt.name}</p>
            <form id="payForm">
                <div class="form-group">
                    <label>Amount</label>
                    <input type="number" name="amount" step="0.01" value="${debt.balance}" required>
                </div>
                <div class="form-group">
                    <label>Date</label>
                    <input type="date" name="date" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="form-group">
                    <label>Note</label>
                    <input type="text" name="note" placeholder="Optional note">
                </div>
                <div class="form-group checkbox-group">
                    <input type="checkbox" id="recurring" name="recurring" checked>
                    <label for="recurring">Populate next month's debt?</label>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" id="cancelPayBtn">Cancel</button>
                    <button type="submit" class="btn">Confirm Payment</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('cancelPayBtn').addEventListener('click', () => modal.remove());
    document.getElementById('payForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        // 1. Record Payment
        store.addPayment({
            debtId: debtId,
            amount: formData.get('amount'),
            date: formData.get('date'),
            note: formData.get('note')
        });

        // 2. Handle Recurring Debt
        if (formData.get('recurring')) {
            const currentDueDate = new Date(debt.dueDate);
            // Add 1 month, handling year rollover automatically
            currentDueDate.setMonth(currentDueDate.getMonth() + 1);

            // Format as YYYY-MM-DD
            const nextDueDate = currentDueDate.toISOString().split('T')[0];

            store.addDebt({
                name: debt.name,
                balance: debt.balance, // Assuming same amount
                dueDate: nextDueDate,
                personId: debt.personId,
                note: debt.note
            });
        }

        modal.remove();
        // Refresh current view
        const activeTab = document.querySelector('.nav-item.active').dataset.view;
        if (activeTab === 'dashboard') renderDashboard();
        else renderDebts();
    });
};
