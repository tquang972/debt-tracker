import { store, CATEGORIES } from './store.js';
import { formatCurrency, formatDate, getRelativeDate, isThisWeek, isThisMonth, parseLocalDate } from './utils.js';

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
            else if (activeTab === 'analytics') renderAnalytics();
        }
    });
};

export const renderDashboard = () => {
    // Hide loading elements
    const loadingMsg = document.getElementById('loadingMsg');
    const errorLog = document.getElementById('errorLog');
    if (loadingMsg) loadingMsg.style.display = 'none';
    if (errorLog) errorLog.style.display = 'none';

    const debts = store.getDebts().filter(d => d.balance >= 0.01);
    const totalDebt = debts.reduce((sum, d) => sum + parseFloat(d.balance), 0);

    // Calculate forecast windows (Monday to Sunday)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to start of day

    // Get Monday of this week (for baseline)
    const day = today.getDay(); // 0 (Sun) to 6 (Sat)
    const diffToMonday = (day === 0 ? -6 : 1 - day); // Mon is day 1. If Sun, go back 6.
    const startOfThisWeek = new Date(today.getTime() + diffToMonday * 24 * 60 * 60 * 1000);

    // This Week Range (Mon 12/15 - Sun 12/21)
    const endOfThisWeek = new Date(startOfThisWeek.getTime() + 6 * 24 * 60 * 60 * 1000);
    endOfThisWeek.setHours(23, 59, 59, 999);

    // 2nd Week Range (Mon 12/22 - Sun 12/28)
    const startOf2ndWeek = new Date(startOfThisWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
    const endOf2ndWeek = new Date(startOf2ndWeek.getTime() + 6 * 24 * 60 * 60 * 1000);
    endOf2ndWeek.setHours(23, 59, 59, 999);

    // 3rd Week Range (Mon 12/29 - Sun 01/04)
    const startOf3rdWeek = new Date(startOfThisWeek.getTime() + 14 * 24 * 60 * 60 * 1000);
    const endOf3rdWeek = new Date(startOf3rdWeek.getTime() + 6 * 24 * 60 * 60 * 1000);
    endOf3rdWeek.setHours(23, 59, 59, 999);

    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    const weeklyDue = debts
        .filter(d => parseLocalDate(d.dueDate) <= endOfThisWeek)
        .reduce((sum, d) => sum + parseFloat(d.balance), 0);

    const twoWeeksDue = debts
        .filter(d => {
            const date = parseLocalDate(d.dueDate);
            return date >= startOf2ndWeek && date <= endOf2ndWeek;
        })
        .reduce((sum, d) => sum + parseFloat(d.balance), 0);

    const threeWeeksDue = debts
        .filter(d => {
            const date = parseLocalDate(d.dueDate);
            return date >= startOf3rdWeek && date <= endOf3rdWeek;
        })
        .reduce((sum, d) => sum + parseFloat(d.balance), 0);

    const monthlyDue = debts
        .filter(d => parseLocalDate(d.dueDate) <= endOfMonth)
        .reduce((sum, d) => sum + parseFloat(d.balance), 0);

    // Sort by due date
    debts.sort((a, b) => parseLocalDate(a.dueDate) - parseLocalDate(b.dueDate));

    mainContent.innerHTML = `
        <header class="dashboard-header">
            <section class="summary-card">
                <h3 class="summary-card__title">Total Debt</h3>
                <div class="summary-card__amount">${formatCurrency(totalDebt)}</div>
            </section>
            <div class="dashboard-forecast">
                <article class="forecast-card">
                    <h4 class="forecast-card__title">Due This Week</h4>
                    <div class="forecast-card__amount">${formatCurrency(weeklyDue)}</div>
                </article>
                <article class="forecast-card">
                    <h4 class="forecast-card__title">Due in 2 Weeks</h4>
                    <div class="forecast-card__amount">${formatCurrency(twoWeeksDue)}</div>
                </article>
                <article class="forecast-card">
                    <h4 class="forecast-card__title">Due in 3 Weeks</h4>
                    <div class="forecast-card__amount">${formatCurrency(threeWeeksDue)}</div>
                </article>
                <article class="forecast-card">
                    <h4 class="forecast-card__title">Due This Month</h4>
                    <div class="forecast-card__amount">${formatCurrency(monthlyDue)}</div>
                </article>
            </div>
            <div class="dashboard-actions">
                 <button id="notifyBtn" class="btn btn--secondary btn--sm">
                    🔔 Enable Notifications
                 </button>
            </div>
        </header>

        <section class="upcoming-section">
            <header class="section-header">
                <h3 class="section-header__title">All Debts</h3>
                <button class="btn-icon" id="addDebtBtn">+</button>
            </header>
            
            <div class="debt-list">
                ${debts.map(debt => createDebtItem(debt)).join('')}
                ${debts.length === 0 ? '<p class="empty-state">No debts found.</p>' : ''}
            </div>
        </section>
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

    // Attach event listeners for debt actions
    document.getElementById('addDebtBtn').addEventListener('click', showAddDebtModal);

    document.querySelectorAll('.pay-btn').forEach(btn => {
        btn.addEventListener('click', () => showPayModal(btn.dataset.id));
    });

    document.querySelectorAll('.edit-debt-btn').forEach(btn => {
        btn.addEventListener('click', () => showEditDebtModal(btn.dataset.id));
    });

    document.querySelectorAll('.delete-debt-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
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

    const debts = store.getDebts().filter(d => d.balance >= 0.01);

    mainContent.innerHTML = `
        <header class="section-header">
            <h3 class="section-header__title">All Debts</h3>
            <button class="btn-icon" id="addDebtBtn">+</button>
        </header>
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
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            e.preventDefault();
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
        <header class="section-header">
            <h3 class="section-header__title">Payment History</h3>
        </header>
        <div class="history-list">
            ${payments.map(pay => {
        const debt = debts.find(d => d.id === pay.debtId);
        const debtName = debt ? debt.name : 'Unknown Debt';
        return `
                <article class="history-item">
                    <div class="history-item__details">
                        <div class="history-item__name">${debtName}</div>
                        <div class="history-item__dates">
                            <span class="history-item__date">Paid: ${formatDate(pay.date)}</span>
                            ${debt && debt.dueDate ? `<span class="history-item__due-date">Due: ${formatDate(debt.dueDate)}</span>` : ''}
                        </div>
                        ${pay.note ? `<span class="history-item__note">${pay.note}</span>` : ''}
                    </div>
                    <div class="history-item__right">
                        <div class="history-item__amount history-item__amount--success">
                            -${formatCurrency(pay.amount)}
                        </div>
                        <div class="history-item__actions">
                            <button class="btn-icon btn-icon--sm edit-pay-btn" data-id="${pay.id}" aria-label="Edit">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                            </button>
                            <button class="btn-icon btn-icon--sm delete-pay-btn" data-id="${pay.id}" aria-label="Delete">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                            </button>
                        </div>
                    </div>
                </article>
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

export const renderAnalytics = () => {
    const currentUserId = store.getCurrentUserId();
    const allPayments = store.getPayments();
    const allDebts = store.getDebts('all');
    const filteredDebts = allDebts.filter(d => d.personId === currentUserId);


    const debts = filteredDebts;
    // Filter payments for current user
    const payments = allPayments.filter(pay => {
        const debt = debts.find(d => d.id === pay.debtId);
        return debt && debt.personId === currentUserId;
    });

    // 1. Initialize structure and Aggregate by Debt Due Date
    // This ensures that if a debt is fully paid, it shows as 100% (Green) in its due month,
    // regardless of when the payments were actually made.
    const dataByYear = {};
    const userDebts = debts.filter(d => d.personId === currentUserId);

    userDebts.forEach(debt => {
        if (!debt.dueDate) return; // Skip if no due date

        // Parse date manually to avoid timezone issues (YYYY-MM-DD -> Local Date)
        const [y, m, d] = debt.dueDate.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        const year = date.getFullYear();
        const month = date.toLocaleString('default', { month: 'short' });

        if (!dataByYear[year]) dataByYear[year] = {};
        if (!dataByYear[year][month]) {
            dataByYear[year][month] = { total: 0, count: 0, payments: [], expected: 0 };
        }

        // Calculate amounts for this debt
        const debtPayments = allPayments.filter(p => p.debtId === debt.id);
        const totalPaid = debtPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
        const originalAmount = parseFloat(debt.balance) + totalPaid;
        const remainingBalance = parseFloat(debt.balance);

        // Add to month totals
        dataByYear[year][month].expected += originalAmount;
        dataByYear[year][month].total += totalPaid;
        dataByYear[year][month].count += debtPayments.length;

        // Add associated payments to the list
        debtPayments.forEach(payment => {
            dataByYear[year][month].payments.push({
                ...payment,
                type: 'payment',
                debtName: debt.name,
                paymentDate: payment.date
            });
        });

        // Add pending item if there is a remaining balance
        if (remainingBalance > 0) {
            dataByYear[year][month].payments.push({
                type: 'pending',
                id: `pending-${debt.id}`,
                amount: remainingBalance,
                debtName: debt.name,
                date: debt.dueDate // Use due date for sorting/display
            });
        }
    });

    // Sort years descending
    const years = Object.keys(dataByYear).sort((a, b) => b - a);

    // Find max value for bar scaling (use max of Total OR Expected)
    let maxMonthTotal = 0;
    years.forEach(year => {
        Object.values(dataByYear[year]).forEach(data => {
            const maxVal = Math.max(data.total, data.expected);
            if (maxVal > maxMonthTotal) maxMonthTotal = maxVal;
        });
    });

    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    mainContent.innerHTML = `
        <header class="section-header">
            <h3 class="section-header__title">Analytics</h3>
        </header>
        <div class="analytics-container">
            ${years.map(year => {
        const yearTotal = Object.values(dataByYear[year]).reduce((sum, data) => sum + data.total, 0);
        const yearExpected = Object.values(dataByYear[year]).reduce((sum, data) => sum + data.expected, 0);

        return `
                    <section class="analytics-year">
                        <header class="analytics-year__header">
                            <span class="analytics-year__label">${year}</span>
                            <div class="analytics-year__totals">
                                <span class="analytics-year__total">Paid: ${formatCurrency(yearTotal)}</span>
                                <span class="analytics-year__expected">Exp: ${formatCurrency(yearExpected)}</span>
                            </div>
                        </header>
                        <div class="analytics-year__months">
                            ${monthOrder.map(month => {
            const data = dataByYear[year][month];
            if (!data) return '';

            const barWidth = (data.total / maxMonthTotal * 100).toFixed(1);
            const expectedWidth = (data.expected / maxMonthTotal * 100).toFixed(1);
            const monthId = `analytics-${year}-${month}`;

            // Calculate progress percentage for color coding
            const percentPaid = data.expected > 0 ? (data.total / data.expected * 100) : 0;
            const progressClass = percentPaid >= 100 ? 'complete' : percentPaid >= 50 ? 'good' : 'pending';

            return `
                                    <article class="analytics-month">
                                        <div class="analytics-month__summary" onclick="document.getElementById('${monthId}').classList.toggle('visible'); this.parentElement.classList.toggle('expanded');">
                                            <div class="analytics-month__label">${month}</div>
                                            <div class="analytics-month__bar-container">
                                                <!-- Expected Bar (Background) -->
                                                <div class="analytics-month__bar analytics-month__bar--expected" style="width: ${expectedWidth}%"></div>
                                                <!-- Actual Bar (Foreground) -->
                                                <div class="analytics-month__bar analytics-month__bar--actual ${progressClass}" style="width: ${barWidth}%"></div>
                                            </div>
                                            <div class="analytics-month__details">
                                                <div class="analytics-month__amounts">
                                                    <span class="analytics-month__amount">${formatCurrency(data.total)}</span>
                                                    <span class="analytics-month__expected-amount">/ ${formatCurrency(data.expected)}</span>
                                                </div>
                                                <svg class="analytics-month__chevron" viewBox="0 0 24 24">
                                                    <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                                                </svg>
                                            </div>
                                        </div>
                                        <ul id="${monthId}" class="analytics-payment-list">
                                            ${data.payments.sort((a, b) => new Date(b.date) - new Date(a.date)).map(pay => {
                const isPending = pay.type === 'pending';
                return `
                                                <li class="analytics-payment-item ${isPending ? 'analytics-payment-item--pending' : ''}">
                                                    <span class="analytics-payment-item__date">${formatDate(pay.date)}</span>
                                                    <span class="analytics-payment-item__name">
                                                        ${pay.debtName} 
                                                    </span>
                                                    <span class="analytics-payment-item__amount">${formatCurrency(pay.amount)}</span>
                                                </li>
                                            `}).join('')}
                                        </ul>
                                    </article>
                                `;
        }).join('')}
                        </div>
                    </section>
                `;
    }).join('')}
            ${years.length === 0 ? '<p class="empty-state">No payment data available.</p>' : ''}
        </div>
    `;
};

const createDebtItem = (debt) => {
    const category = debt.category || 'Uncategorized';
    return `
        <article class="debt-item">
            <div class="debt-item__info">
                <div class="debt-item__header">
                    <div class="debt-item__name">${debt.name}</div>
                    <span class="debt-item__category">${category}</span>
                </div>
                ${debt.note ? `<div class="debt-item__note">${debt.note}</div>` : ''}
                <div class="debt-item__due ${getRelativeDate(debt.dueDate) === 'Overdue' ? 'text-danger' : ''}">
                    Due: ${formatDate(debt.dueDate)} (${getRelativeDate(debt.dueDate)})
                </div>
            </div>
            <div class="debt-item__actions">
                <div class="debt-item__balance">${formatCurrency(debt.balance)}</div>
                <div class="debt-item__buttons">
                    <button class="btn-icon btn-icon--sm edit-debt-btn" data-id="${debt.id}" aria-label="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                    </button>
                    <button class="btn-icon btn-icon--sm delete-debt-btn" data-id="${debt.id}" aria-label="Delete">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                    </button>
                    <button class="btn btn--sm pay-btn" data-id="${debt.id}">Pay</button>
                </div>
            </div>
        </article>
    `;
};

// --- Modals ---

const showModal = (content) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <section class="modal">
            ${content}
        </section>
    `;

    document.body.appendChild(overlay);

    // Close on click outside
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
        }
    });

    // Close on Escape key
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);

    return overlay;
};

export const showAddDebtModal = () => {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <section class="modal">
            <h3 class="modal__title">Add New Debt</h3>
            <form id="addDebtForm">
                <div class="form__group">
                    <label class="form__label">Name</label>
                    <input type="text" name="name" class="form__input" required placeholder="e.g. Car Loan">
                </div>
                <div class="form__group">
                    <label class="form__label">Balance</label>
                    <input type="number" name="balance" class="form__input" step="0.01" required placeholder="0.00">
                </div>
                <div class="form__group">
                    <label class="form__label">Due Date</label>
                    <input type="date" name="dueDate" class="form__input" required>
                </div>
                <div class="form__group">
                    <label class="form__label">Category</label>
                    <select name="category" class="form__input">
                        ${CATEGORIES.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                    </select>
                </div>
                <div class="form__actions">
                    <button type="button" class="btn btn--secondary" id="cancelBtn">Cancel</button>
                    <button type="submit" class="btn btn--primary">Save</button>
                </div>
            </form>
        </section>
    `;
    document.body.appendChild(modal);

    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    document.getElementById('cancelBtn').addEventListener('click', () => modal.remove());
    document.getElementById('addDebtForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        store.addDebt({
            name: formData.get('name'),
            balance: formData.get('balance'),
            dueDate: formData.get('dueDate'),
            category: formData.get('category'),
            personId: store.getCurrentUserId()
        });
        modal.remove();
        renderDebts(); // Refresh
    });
};

export const showPayModal = (debtId) => {
    // Prevent duplicate modals
    const existingModal = document.querySelector('.modal-overlay');
    if (existingModal) {
        console.log('[DEBUG] Modal already exists, removing it first');
        existingModal.remove();
    }

    const debt = store.getDebts().find(d => d.id === debtId);
    if (!debt) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <section class="modal">
            <h3 class="modal__title">Make Payment</h3>
            <p class="modal__subtitle">For: ${debt.name}</p>
            <div id="payContainer">
                <div class="form__group">
                    <label class="form__label">Amount</label>
                    <input type="number" id="payAmount" class="form__input" step="0.01" value="${debt.balance}" required>
                </div>
                <div class="form__group">
                    <label class="form__label">Date</label>
                    <input type="date" id="payDate" class="form__input" value="${(() => {
            const today = new Date();
            // Force CT timezone
            const ctDate = new Date(today.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
            const year = ctDate.getFullYear();
            const month = String(ctDate.getMonth() + 1).padStart(2, '0');
            const day = String(ctDate.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        })()}" required>
                </div>
                <div class="form__group">
                    <label class="form__label">Note</label>
                    <input type="text" id="payNote" class="form__input" placeholder="Optional note">
                </div>
                <div class="form__group checkbox-group">
                    <input type="checkbox" id="recurring" checked>
                    <label for="recurring">Populate next month's debt?</label>
                </div>
                <div class="form__actions">
                    <button type="button" class="btn btn--secondary" id="cancelPayBtn">Cancel</button>
                    <button type="button" class="btn btn--primary" id="confirmPayBtn">Confirm Payment</button>
                </div>
            </div>
        </section>
    `;
    document.body.appendChild(modal);

    // Helper to close modal
    const close = () => {
        console.log('[DEBUG] close() function called');
        console.log('[DEBUG] Calling modal.remove()');
        modal.remove();
        console.log('[DEBUG] modal.remove() completed');
    };

    // Attach listeners using scoped selector
    modal.querySelector('#cancelPayBtn').addEventListener('click', close);

    modal.querySelector('#confirmPayBtn').addEventListener('click', async () => {
        const btn = modal.querySelector('#confirmPayBtn');
        const amountInput = modal.querySelector('#payAmount');
        const dateInput = modal.querySelector('#payDate');
        const noteInput = modal.querySelector('#payNote');
        const recurringInput = modal.querySelector('#recurring');

        // Manual Validation
        if (!amountInput.value || !dateInput.value) {
            alert('Please fill in Amount and Date');
            return;
        }

        try {
            btn.textContent = 'Processing...';
            btn.disabled = true;

            // 1. Record Payment
            await store.addPayment({
                debtId: debtId,
                amount: amountInput.value,
                date: dateInput.value,
                note: noteInput.value
            });
            // 2. Handle Recurring Debt
            if (recurringInput.checked) {
                try {
                    // Parse date manually to avoid timezone issues
                    const [year, month, day] = debt.dueDate.split('-').map(Number);
                    const currentDueDate = new Date(year, month - 1, day); // month is 0-indexed
                    currentDueDate.setMonth(currentDueDate.getMonth() + 1);

                    // Format as YYYY-MM-DD
                    const nextYear = currentDueDate.getFullYear();
                    const nextMonth = String(currentDueDate.getMonth() + 1).padStart(2, '0');
                    const nextDay = String(currentDueDate.getDate()).padStart(2, '0');
                    const nextDueDate = `${nextYear}-${nextMonth}-${nextDay}`;

                    await store.addDebt({
                        name: debt.name,
                        balance: debt.balance,
                        dueDate: nextDueDate,
                        personId: debt.personId,
                        note: debt.note || ''
                    });
                } catch (recErr) {
                    console.error("Recurring debt error:", recErr);
                    alert("Payment saved, but failed to create next month's debt: " + recErr.message);
                }
            }

            console.log('[DEBUG] About to call close()');
            console.log('[DEBUG] modal exists?', !!modal);
            console.log('[DEBUG] modal.parentNode exists?', !!modal.parentNode);

            // Close modal (same as Cancel button)
            close();

            console.log('[DEBUG] close() completed');

        } catch (err) {
            console.error(err);
            alert('Error processing payment: ' + err.message);
            btn.textContent = 'Confirm Payment';
            btn.disabled = false;
        }
    });
};

export const showEditPaymentModal = (paymentId) => {
    const payment = store.getPayments().find(p => p.id === paymentId);
    if (!payment) return;

    const currentUserId = store.getCurrentUserId();
    const allDebts = store.getDebts('all');
    const debts = allDebts.filter(d => d.personId === currentUserId);
    const currentDebt = allDebts.find(d => d.id === payment.debtId);

    const overlay = showModal(`
        <h3 class="modal__title">Edit Payment</h3>
        <form id="editPaymentForm">
            <div class="form__group">
                <label class="form__label">Debt</label>
                <select name="debtId" class="form__input" required>
                    ${debts.map(d => `
                        <option value="${d.id}" ${d.id === payment.debtId ? 'selected' : ''}>
                            ${d.name}
                        </option>
                    `).join('')}
                </select>
            </div>
            <div class="form__group">
                <label class="form__label">Amount</label>
                <input type="number" name="amount" class="form__input" step="0.01" value="${payment.amount}" required>
            </div>
            <div class="form__group">
                <label class="form__label">Paid Date</label>
                <input type="date" name="date" class="form__input" value="${payment.date}" required>
            </div>
            <div class="form__group">
                <label class="form__label">Debt Due Date</label>
                <input type="date" name="debtDueDate" class="form__input" value="${currentDebt ? currentDebt.dueDate : ''}">
                <div class="form__help">Updates the due date for this debt</div>
            </div>
            <div class="form__group">
                <label class="form__label">Note</label>
                <input type="text" name="note" class="form__input" value="${payment.note || ''}" placeholder="Optional note">
            </div>
            <div class="form__actions">
                <button type="button" class="btn btn--secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                <button type="submit" class="btn btn--primary">Update</button>
            </div>
        </form>
    `);

    overlay.querySelector('#editPaymentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        // Update payment
        await store.updatePayment(paymentId, {
            debtId: formData.get('debtId'),
            amount: formData.get('amount'),
            date: formData.get('date'),
            note: formData.get('note')
        });

        // Update debt due date if changed
        const newDueDate = formData.get('debtDueDate');
        if (currentDebt && newDueDate && newDueDate !== currentDebt.dueDate) {
            await store.updateDebt(currentDebt.id, {
                dueDate: newDueDate
            });
        }

        document.body.removeChild(overlay);
        store.notifyListeners();
    });
};

export const showEditDebtModal = (debtId) => {
    const debt = store.getDebts('all').find(d => d.id === debtId);
    if (!debt) return;

    const currentCategory = debt.category || 'Uncategorized';
    const overlay = showModal(`
        <h3 class="modal__title">Edit Debt</h3>
        <form id="editDebtForm">
            <div class="form__group">
                <label class="form__label">Name</label>
                <input type="text" name="name" class="form__input" value="${debt.name}" required>
            </div>
            <div class="form__group">
                <label class="form__label">Balance</label>
                <input type="number" name="balance" class="form__input" step="0.01" value="${debt.balance}" required>
            </div>
            <div class="form__group">
                <label class="form__label">Due Date</label>
                <input type="date" name="dueDate" class="form__input" value="${debt.dueDate}" required>
            </div>
            <div class="form__group">
                <label class="form__label">Category</label>
                <select name="category" class="form__input">
                    ${CATEGORIES.map(cat => `<option value="${cat}" ${cat === currentCategory ? 'selected' : ''}>${cat}</option>`).join('')}
                </select>
            </div>
            <div class="form__group">
                <label class="form__label">Note</label>
                <input type="text" name="note" class="form__input" value="${debt.note || ''}" placeholder="Optional note">
            </div>
            <div class="form__actions">
                <button type="button" class="btn btn--secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                <button type="submit" class="btn btn--primary">Update</button>
            </div>
        </form>
    `);

    overlay.querySelector('#editDebtForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        await store.updateDebt(debtId, {
            name: formData.get('name'),
            balance: formData.get('balance'),
            dueDate: formData.get('dueDate'),
            category: formData.get('category'),
            note: formData.get('note')
        });
        document.body.removeChild(overlay);
        store.notifyListeners();
    });
};

export const showDeletePaymentModal = (paymentId) => {
    const payment = store.getPayments().find(p => p.id === paymentId);
    if (!payment) return;

    const debt = store.getDebts('all').find(d => d.id === payment.debtId);
    const debtName = debt ? debt.name : 'Unknown Debt';

    const overlay = showModal(`
        <h3 class="modal__title">Delete Payment</h3>
        <p class="modal__subtitle">Payment: <strong>${formatCurrency(payment.amount)}</strong> for <strong>${debtName}</strong></p>
        <p class="modal__text">Choose how to delete this payment:</p>
        <div class="form__actions form__actions--vertical">
            <button type="button" class="btn btn--primary" id="restoreBtn">
                Restore Balance & Delete
            </button>
            <button type="button" class="btn btn--danger" id="permanentDeleteBtn">
                Delete Record Only
            </button>
            <button type="button" class="btn btn--secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        </div>
    `);

    overlay.querySelector('#restoreBtn').addEventListener('click', async () => {
        await store.deletePayment(paymentId);
        document.body.removeChild(overlay);
    });

    overlay.querySelector('#permanentDeleteBtn').addEventListener('click', async () => {
        await store.permanentlyDeletePayment(paymentId);
        document.body.removeChild(overlay);
    });
};
