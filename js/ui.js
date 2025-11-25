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

    // Attach event listeners for debt actions in Upcoming list
    document.querySelectorAll('.pay-btn').forEach(btn => {
        btn.addEventListener('click', () => showPayModal(btn.dataset.id));
    });

    document.querySelectorAll('.edit-debt-btn').forEach(btn => {
        btn.addEventListener('click', () => showEditDebtModal(btn.dataset.id));
    });

    document.querySelectorAll('.delete-debt-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (confirm('Delete this debt?')) {
                await store.deleteDebt(btn.dataset.id);
            }
        });
    });
};

export const renderDebts = () => {
    // Hide loading elements
    const loadingMsg = document.getElementById('loadingMsg');
    const errorLog = document.getElementById('errorLog');
    if (loadingMsg) loadingMsg.style.display = 'none';
    if (errorLog) errorLog.style.display = 'none';

    const debts = store.getDebts().filter(d => d.balance > 0);
    console.log("[UI] renderDebts called");
    console.log("[UI] Current User ID:", store.getCurrentUserId());
    console.log("[UI] Debts found:", debts.length, debts);

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

    document.querySelectorAll('.pay-btn').forEach(btn => {
        btn.addEventListener('click', () => showPayModal(btn.dataset.id));
    });

    document.querySelectorAll('.edit-debt-btn').forEach(btn => {
        btn.addEventListener('click', () => showEditDebtModal(btn.dataset.id));
    });

    document.querySelectorAll('.delete-debt-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (confirm('Delete this debt?')) {
                await store.deleteDebt(btn.dataset.id);
            }
        });
    });
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
                    <div class="history-right">
                        <div class="history-amount success">
                            -${formatCurrency(pay.amount)}
                        </div>
                        <div class="history-actions">
                            <button class="btn-icon-sm edit-pay-btn" data-id="${pay.id}">✏️</button>
                            <button class="btn-icon-sm delete-pay-btn" data-id="${pay.id}">🗑️</button>
                        </div>
                    </div>
                </div>
            `;
    }).join('')}
        </div>
    `;

    document.querySelectorAll('.edit-pay-btn').forEach(btn => {
        btn.addEventListener('click', () => showEditPaymentModal(btn.dataset.id));
    });

    document.querySelectorAll('.delete-pay-btn').forEach(btn => {
        btn.addEventListener('click', () => showDeletePaymentModal(btn.dataset.id));
    });
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
                <div class="debt-buttons">
                    <button class="btn-sm pay-btn" data-id="${debt.id}">Pay</button>
                    <button class="btn-icon-sm edit-debt-btn" data-id="${debt.id}">✏️</button>
                    <button class="btn-icon-sm delete-debt-btn" data-id="${debt.id}">🗑️</button>
                </div>
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
    document.getElementById('payForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        // 1. Record Payment (await to ensure Firestore update before UI refresh)
        await store.addPayment({
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

            await store.addDebt({
                name: debt.name,
                balance: debt.balance, // Assuming same amount
                dueDate: nextDueDate,
                personId: debt.personId,
                note: debt.note || ''
            });
        }

        modal.remove();
        // Notify listeners that data may have changed
        store.notifyListeners();
        // Give Firestore snapshot a moment to update before re-rendering
        setTimeout(() => {
            const activeTab = document.querySelector('.nav-item.active').dataset.view;
            if (activeTab === 'dashboard') renderDashboard();
            else renderDebts();
        }, 250);
    });
};

export const showEditPaymentModal = (paymentId) => {
    const payment = store.getPayments().find(p => p.id === paymentId);
    if (!payment) return;

    const debts = store.getDebts('all');
    const currentDebt = debts.find(d => d.id === payment.debtId);

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal card">
            <h3>Edit Payment</h3>
            <form id="editPaymentForm">
                <div class="form-group">
                    <label>Debt</label>
                    <select name="debtId" required>
                        ${debts.map(d => `
                            <option value="${d.id}" ${d.id === payment.debtId ? 'selected' : ''}>
                                ${d.name}
                            </option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Amount</label>
                    <input type="number" name="amount" step="0.01" value="${payment.amount}" required>
                </div>
                <div class="form-group">
                    <label>Date</label>
                    <input type="date" name="date" value="${payment.date}" required>
                </div>
                <div class="form-group">
                    <label>Note</label>
                    <input type="text" name="note" value="${payment.note || ''}" placeholder="Optional note">
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" id="cancelEditPayBtn">Cancel</button>
                    <button type="submit" class="btn">Update</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('cancelEditPayBtn').addEventListener('click', () => modal.remove());
    document.getElementById('editPaymentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        await store.updatePayment(paymentId, {
            debtId: formData.get('debtId'),
            amount: formData.get('amount'),
            date: formData.get('date'),
            note: formData.get('note')
        });
        modal.remove();
        store.notifyListeners();
    });
};

export const showEditDebtModal = (debtId) => {
    const debt = store.getDebts('all').find(d => d.id === debtId);
    if (!debt) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal card">
            <h3>Edit Debt</h3>
            <form id="editDebtForm">
                <div class="form-group">
                    <label>Name</label>
                    <input type="text" name="name" value="${debt.name}" required>
                </div>
                <div class="form-group">
                    <label>Balance</label>
                    <input type="number" name="balance" step="0.01" value="${debt.balance}" required>
                </div>
                <div class="form-group">
                    <label>Due Date</label>
                    <input type="date" name="dueDate" value="${debt.dueDate}" required>
                </div>
                <div class="form-group">
                    <label>Note</label>
                    <input type="text" name="note" value="${debt.note || ''}" placeholder="Optional note">
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" id="cancelEditDebtBtn">Cancel</button>
                    <button type="submit" class="btn">Update</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('cancelEditDebtBtn').addEventListener('click', () => modal.remove());
    document.getElementById('editDebtForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        await store.updateDebt(debtId, {
            name: formData.get('name'),
            balance: formData.get('balance'),
            dueDate: formData.get('dueDate'),
            note: formData.get('note')
        });
        modal.remove();
        store.notifyListeners();
    });
};

export const showDeletePaymentModal = (paymentId) => {
    const payment = store.getPayments().find(p => p.id === paymentId);
    if (!payment) return;

    const debt = store.getDebts('all').find(d => d.id === payment.debtId);
    const debtName = debt ? debt.name : 'Unknown Debt';

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal card">
            <h3>Delete Payment</h3>
            <p>Payment: <strong>${formatCurrency(payment.amount)}</strong> for <strong>${debtName}</strong></p>
            <p style="margin-top: 1rem; color: var(--text-secondary); font-size: 0.9rem;">Choose how to delete this payment:</p>
            <div class="form-actions" style="margin-top: 1.5rem; flex-direction: column; gap: 0.75rem;">
                <button type="button" class="btn" id="restoreBtn" style="width: 100%;">
                    Restore to Upcoming
                    <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 0.25rem;">Add ${formatCurrency(payment.amount)} back to debt balance</div>
                </button>
                <button type="button" class="btn-secondary" id="permanentDeleteBtn" style="width: 100%; color: var(--danger);">
                    Permanently Delete
                    <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 0.25rem;">Remove payment without changing balance</div>
                </button>
                <button type="button" class="btn-secondary" id="cancelDeleteBtn" style="width: 100%;">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('cancelDeleteBtn').addEventListener('click', () => modal.remove());

    document.getElementById('restoreBtn').addEventListener('click', async () => {
        await store.deletePayment(paymentId);
        modal.remove();
    });

    document.getElementById('permanentDeleteBtn').addEventListener('click', async () => {
        await store.permanentlyDeletePayment(paymentId);
        modal.remove();
    });
};
