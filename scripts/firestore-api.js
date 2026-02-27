/**
 * Firestore REST API Helper for Debt Tracker Bot
 * 
 * Usage:
 *   1. Download service account key from Firebase Console
 *   2. Set SERVICE_ACCOUNT_PATH environment variable or place file at ./service-account.json
 *   3. Run: node scripts/firestore-api.js
 * 
 * For bot integration, import the DebtTrackerAPI class:
 *   const { DebtTrackerAPI } = require('./scripts/firestore-api.js');
 */

const { GoogleAuth } = require('google-auth-library');
const https = require('https');
const path = require('path');

const PROJECT_ID = 'debt-tracker-cf9e6';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

class DebtTrackerAPI {
    constructor(serviceAccountPath = null) {
        this.serviceAccountPath = serviceAccountPath ||
            process.env.SERVICE_ACCOUNT_PATH ||
            path.join(process.cwd(), 'service-account.json');
        this.accessToken = null;
        this.tokenExpiry = null;
    }

    /**
     * Get a valid access token (refreshes if expired)
     */
    async getAccessToken() {
        // Return cached token if still valid (with 5 min buffer)
        if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry - 300000) {
            return this.accessToken;
        }

        const auth = new GoogleAuth({
            keyFile: this.serviceAccountPath,
            scopes: ['https://www.googleapis.com/auth/datastore']
        });

        const client = await auth.getClient();
        const tokenResponse = await client.getAccessToken();

        this.accessToken = tokenResponse.token;
        // Tokens typically last 1 hour
        this.tokenExpiry = Date.now() + 3600000;

        return this.accessToken;
    }

    /**
     * Make a request to the Firestore REST API
     */
    async request(endpoint, method = 'GET', body = null) {
        const token = await this.getAccessToken();
        const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const options = {
                hostname: urlObj.hostname,
                path: urlObj.pathname + urlObj.search,
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch {
                        resolve(data);
                    }
                });
            });

            req.on('error', reject);
            if (body) req.write(JSON.stringify(body));
            req.end();
        });
    }

    /**
     * Run a structured query
     */
    async query(collectionId, filters = [], orderBy = null, limit = null) {
        const structuredQuery = {
            from: [{ collectionId }]
        };

        if (filters.length === 1) {
            structuredQuery.where = { fieldFilter: filters[0] };
        } else if (filters.length > 1) {
            structuredQuery.where = {
                compositeFilter: {
                    op: 'AND',
                    filters: filters.map(f => ({ fieldFilter: f }))
                }
            };
        }

        if (orderBy) {
            structuredQuery.orderBy = Array.isArray(orderBy) ? orderBy : [orderBy];
        }

        if (limit) {
            structuredQuery.limit = limit;
        }

        const result = await this.request(':runQuery', 'POST', { structuredQuery });
        return this.parseQueryResults(result);
    }

    /**
     * Parse Firestore document fields to plain JS objects
     */
    parseDocument(doc) {
        if (!doc || !doc.fields) return null;

        const parsed = { id: doc.name.split('/').pop() };

        for (const [key, value] of Object.entries(doc.fields)) {
            if ('stringValue' in value) parsed[key] = value.stringValue;
            else if ('doubleValue' in value) parsed[key] = value.doubleValue;
            else if ('integerValue' in value) parsed[key] = parseInt(value.integerValue);
            else if ('booleanValue' in value) parsed[key] = value.booleanValue;
            else if ('nullValue' in value) parsed[key] = null;
            else if ('timestampValue' in value) parsed[key] = new Date(value.timestampValue);
            else if ('arrayValue' in value) {
                parsed[key] = (value.arrayValue.values || []).map(v => this.parseValue(v));
            }
            else if ('mapValue' in value) {
                parsed[key] = this.parseDocument({ fields: value.mapValue.fields });
            }
        }

        return parsed;
    }

    parseValue(value) {
        if ('stringValue' in value) return value.stringValue;
        if ('doubleValue' in value) return value.doubleValue;
        if ('integerValue' in value) return parseInt(value.integerValue);
        if ('booleanValue' in value) return value.booleanValue;
        return null;
    }

    parseQueryResults(results) {
        if (!Array.isArray(results)) return [];
        return results
            .filter(r => r.document)
            .map(r => this.parseDocument(r.document));
    }

    // ========== Convenience Methods ==========

    /**
     * Get all debts for a user
     */
    async getDebts(userId = 'me', activeOnly = true) {
        const filters = [
            {
                field: { fieldPath: 'personId' },
                op: 'EQUAL',
                value: { stringValue: userId }
            }
        ];

        if (activeOnly) {
            filters.push({
                field: { fieldPath: 'balance' },
                op: 'GREATER_THAN',
                value: { doubleValue: 0 }
            });
        }

        return this.query('debts', filters,
            { field: { fieldPath: 'dueDate' }, direction: 'ASCENDING' }
        );
    }

    /**
     * Get all payments
     */
    async getPayments(debtId = null) {
        const filters = debtId ? [{
            field: { fieldPath: 'debtId' },
            op: 'EQUAL',
            value: { stringValue: debtId }
        }] : [];

        return this.query('payments', filters,
            { field: { fieldPath: 'date' }, direction: 'DESCENDING' }
        );
    }

    /**
     * Get all people/users
     */
    async getPeople() {
        return this.query('people', []);
    }

    /**
     * Get a summary of debts due this week
     */
    async getWeeklySummary(userId = 'me') {
        const debts = await this.getDebts(userId, true);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Calculate end of week (Sunday)
        const day = today.getDay();
        const diffToMonday = day === 0 ? -6 : 1 - day;
        const startOfWeek = new Date(today.getTime() + diffToMonday * 86400000);
        const endOfWeek = new Date(startOfWeek.getTime() + 6 * 86400000);
        endOfWeek.setHours(23, 59, 59, 999);

        const dueThisWeek = debts.filter(d => {
            const dueDate = new Date(d.dueDate + 'T00:00:00');
            return dueDate <= endOfWeek;
        });

        const totalDueThisWeek = dueThisWeek.reduce((sum, d) => sum + (parseFloat(d.balance) || 0), 0);
        const totalDebt = debts.reduce((sum, d) => sum + (parseFloat(d.balance) || 0), 0);

        return {
            totalDebt,
            totalDueThisWeek,
            debtsCount: debts.length,
            dueThisWeekCount: dueThisWeek.length,
            dueThisWeek: dueThisWeek.map(d => ({
                name: d.name,
                balance: d.balance,
                dueDate: d.dueDate,
                category: d.category || 'Uncategorized'
            }))
        };
    }
}

// ========== CLI Usage ==========
if (require.main === module) {
    (async () => {
        console.log('🔌 Debt Tracker API - Testing Connection\n');

        try {
            const api = new DebtTrackerAPI();

            // Test: Get weekly summary
            console.log('📊 Weekly Summary:');
            console.log('-'.repeat(40));
            const summary = await api.getWeeklySummary('me');
            console.log(`Total Debt: $${summary.totalDebt.toFixed(2)}`);
            console.log(`Due This Week: $${summary.totalDueThisWeek.toFixed(2)} (${summary.dueThisWeekCount} items)`);

            if (summary.dueThisWeek.length > 0) {
                console.log('\nDebts due this week:');
                summary.dueThisWeek.forEach(d => {
                    console.log(`  • ${d.name}: $${d.balance} (due ${d.dueDate})`);
                });
            }

            // Test: List all debts
            console.log('\n📋 All Active Debts:');
            console.log('-'.repeat(40));
            const debts = await api.getDebts('me');
            debts.forEach(d => {
                console.log(`  • ${d.name}: $${d.balance} (${d.category || 'Uncategorized'}) - due ${d.dueDate}`);
            });

            console.log('\n✅ API connection successful!');

        } catch (error) {
            console.error('❌ Error:', error.message);
            if (error.message.includes('ENOENT')) {
                console.log('\n💡 Tip: Make sure service-account.json exists.');
                console.log('   Download it from: https://console.firebase.google.com/project/debt-tracker-cf9e6/settings/serviceaccounts/adminsdk');
            }
            process.exit(1);
        }
    })();
}

module.exports = { DebtTrackerAPI };
