import { store } from './store.js';

const rawData = `Monthly Debts Tracker
*****************************UPCOMING DEBT************************************
-------------------------------------DUNG--------------------------------------------------------------------------
Zelle dad per loan: 163.075(personal loan-5k) due 11/12
-dzung owns Quang: 139.82 on amex plat due 12/28
Amex Gold:336.21-142.14-3.68 -2.5-7.94-24.55-15.58=139.82 due 11/28 
-------------------------------------POP----------------------------------------
- Tesla Payment: $656 due 11/25 (auto BofA) 
- Honda Payment: 630.70 due 11/27(auto BofA) 
- Than's Bus Ink 2131: $70.70 due 11/28(auto robin)
- Mom’s Amex Business Plat: $648.20 due 11/28 (auto robin)


- KC Water: $144.90 due 12/1 (auto BOA) 
- Dad Robinhood Gold: 3571.63 due 12/1
- Dad's Biz loan: $466.67 due 12/7 (auto Dad's BOA) 
- Dad’s Amex Personal Loan: 818.35 due 12/12(25k)(auto BOA) 


- Than's BofA 7849: $15.53 due 12/14 (auto BofA)
- Mobile Phone Bill $120 due 12/15 


- SW Biz card: 7,000 due 12/17


- Spire $40 due 12/22 (auto Gold Robin) 
- Additional Gold Card: 2,186.36 due 12/28 
- Evergy $50 12/29(auto Gold Robin) 


- StateFarm: $1100 due 1/1 
- Tax Bill: $120,000 due 4/15/2026
------------------------------------QUANG--------------------------------------
MONTHLY DEBT PAYMENT+ CAR + INSURANCE+ RENT: 466.67+326.14+ 671+500+25+87+110+95+54+170+500 = 3004.81
----------------------------------
correct to dzun:221.61 overpayment on gold card 11.13
Robinhood Gold: 29.48+70+20.45+47+55.80+82+64
Mom plat:102.12+122.69


-Quang's BOA 6493: 83 due 11/25 (Auto Robin) 
- Dzung’s BOA 9312: $130 due 11/25(Auto Robin)
-Quang 's BOA 4972: 157 due 11/25 (Auto Robin) 
- Tesla Payment: $670 due 11/25 (Auto Robin)
- Quang's Amex: 138.13  due 11/28 (Auto Robin) 
- Quang's Chase 9403: 211.13 due 11/28(Auto Robin) 
————-1,389———
-Nhan SF 211.14 due 12/2(New payment from Nhan) 


- Dad's Biz loan: $466.67 due 12/7 [auto Zelle]
-dad’s business loan:116.67 due 12/8/2025
- Zelle dad per loan: 326.14(personal loan-10k) due 12/12[auto Zelle] 


-Mom Personal Loan: 351.53 due 12/14/2025 (auto robin)


- Zelle Dad $170 for Insurance due 12/15[auto Zelle] 
- Than's Debt: 500 due 12/15 [17th PAYMENT][auto Zelle] 


- Nhan's Barclay: 179.97 due 12/16 (Auto Robin)
- Mom’s BOA : $83 due 12/18(Auto Robin) 


- Additional Gold Card: 1500 due 12/28 paid by BT 


-Mom's BOA: $8,653+ 4% = 8,999.12 due 2/6/2026
- Dzung’s BOA 9312: $13,363.34 (including 4%) due 4/12/2026
-Tax Bill: $90,000 due 4/15/2026 
- Quang's BOA 4972: $15,768.99 (4% was transfer fee) due 10/28/2026
- Quang's BOA  6493: $10,400 (4% was transfer fee) due 10/28/2026
- Nhan Phan's Barclay: $18,000 (4% was transfer  fee) due 11/1/2026
- Student Loan Payment: $21 due 11/12/28 (Auto Robin) 
*****************************HISTORY********************************************
-------------------------------------Than----------------------------------------


- Than's BofA 7849: $15.53 due 11/14 (auto BofA)
- Dad’s Amex Personal Loan: 818.35 due 11/12(25k)(auto BOA) 
- Dad's Biz loan: $466.67 due 11/7 (auto Dad's BOA) 
- Additional Gold Card: 2,186.36 due 11/28 
-Dzung Plat: 780.39 paid 10/28 
- Dad Robinhood Gold: 3616.23 due 10/28
- Than's Bus Ink 2131: $70.70 due 10/28(auto robin)
- KC Water: $144.90 due 11/1 (auto BOA) 
- Tesla Payment: $656 due 10/25 (auto BofA) 
- Honda Payment: 630.70 due 10/27(auto BofA) 
- Mom’s Amex Business Plat: $3500 due 10/28 (David'BT) 
-------------------------------------Quang--------------------------------------


- Nhan's Barclay: 179.97 due 11/16 (Auto Robin)
- Mom’s BOA : $83 due 11/18(Auto Robin) 
- Zelle Dad $170 for Insurance due 11/15[auto Zelle] 
- Than's Debt: 500 due 11/15 [17th PAYMENT][auto Zelle] 
- Zelle dad per loan: 326.14(personal loan-10k) due 11/12[auto Zelle] 
Mom plat:46.88+300+48.25 paid 11/7
- Dad's Biz loan: $466.67 due 11/7 [auto Zelle]
- Additional Gold Card: 2083.88+591.97+567.42  +(142.14+3.68+2.5+7.94+24.55+15.58) )dzung =3439.66  due 11/04 paid by BT 
-Quang 's BOA 4972: 78 due 10/25 (Auto Robin) 
-Quang's BOA 6493: 83 due 10/25 (Auto Robin) 
- Tesla Payment: $670 due 10/25 (Auto Robin)


Dung---------------------------------------------------------------------------
-dzung owns Quang: 139.82 on amex plat due 11/10
zelled Quang 1147.68 for Amex Gold payment October on 10.05
zelle Quang 953.12 for Dzung Amex Plat on 10/19
repay dad $800 due 9/25
Zelle dad per loan: 163.075(personal loan-5k) due 10/12
Zelle Quang: 618.69 (Gold BT)
Amex Gold: 618.69 due 9/28  (made on 9/11 Quang BT)
Uyen's Amex: 1146.87 +1297.09due 8/28 
Zelle dad per loan: 163.075(personal loan-5k) due 8/12 
Uyen's Amex: 2129.72 due 7/28(832.63 7/29)
- Dzung's Alaska:55+ 44.95+174.85+639.36 + 1106 + 931.51 = 3448.89 due 7/31
Zelle dad per loan: 163.075(personal loan-5k) due 7/12 
Uyen's Amex:1068.34 due 6/14
Zelle dad per loan: 163.075(personal loan-5k) due 6/2 
Uyen's Amex: 1070.62 due 5/28 
Zelle dad per loan: 163.075(personal loan-5k) due 5/12
Uyen's Amex: 1896.22-59.72-47.93 = 1788.57 by 4/28
Uyen's Amex: 1322.88-2239.58+1853.93= 937.23 by 3/28
Uyen's Amex: 2303.03-(2221.6-1772.50) = 1853.93 by 2/28
dzung: 1,772.50 on gold 1/22 
dzung: 351.57 on gold 11/28
Robinhood Comission 2023 + 2024 to Quang: 786 +465 =$1,251 due 1/17/2025 ( paid to dad's mom amex plat bus)`;

const parseAmount = (str) => {
    // Handle complex math expressions like "336.21-142.14..." or "466.67+326.14..."
    // Or simple "$1,200.00"
    try {
        // Remove currency symbols and commas
        let clean = str.replace(/[$,]/g, '');
        // If it contains math operators, evaluate it (safe enough for this context)
        if (/[+\-*\/=]/.test(clean)) {
            // Extract the part before '=' if present
            if (clean.includes('=')) {
                clean = clean.split('=')[1];
            } else {
                // Evaluate expression
                // Be careful with eval, but for this specific data it's okay-ish. 
                // Better to just take the first number if it's complex, or try to sum.
                // For now, let's try to find the last number which is usually the total, or the first.
                // Actually, let's just regex for the number.
            }
        }
        const match = clean.match(/[\d.]+/);
        return match ? parseFloat(match[0]) : 0;
    } catch (e) {
        return 0;
    }
};

const parseDate = (str) => {
    if (!str) return null;
    // Handle "11/12", "11/12/28", "12/1"
    const parts = str.split('/');
    if (parts.length < 2) return null;

    let month = parseInt(parts[0]);
    let day = parseInt(parts[1]);
    let year = parts.length > 2 ? parseInt(parts[2]) : new Date().getFullYear();

    // Adjust year if 2 digits
    if (year < 100) year += 2000;

    // If date is in past (e.g. 11/12 when now is 11/23), might mean next year? 
    // Or if it's history, it's past.
    // For now, assume current year unless specified.

    return new Date(year, month - 1, day).toISOString().split('T')[0];
};

export const runImport = () => {
    const lines = rawData.split('\n');
    let currentPerson = 'me';
    let section = 'upcoming'; // upcoming | history

    // Clear existing data? Or append? Let's clear for clean import.
    // store.data.debts = [];
    // store.data.payments = [];
    // store.data.people = [];

    // Create People
    const peopleMap = {
        'DUNG': store.addPerson('Dung'),
        'POP': store.addPerson('Pop'),
        'QUANG': store.addPerson('Quang'),
        'THAN': store.addPerson('Than')
    };

    lines.forEach(line => {
        line = line.trim();
        if (!line) return;

        // Detect Section
        if (line.includes('***HISTORY***')) {
            section = 'history';
            return;
        }

        // Detect Person Header
        if (line.includes('---')) {
            const nameMatch = line.match(/[A-Z]{3,}/); // Match DUNG, POP, etc.
            if (nameMatch) {
                const name = nameMatch[0];
                if (peopleMap[name]) {
                    currentPerson = peopleMap[name];
                }
            }
            return;
        }

        // Parse Debt/Payment Line
        // Format: "Name: Amount due Date"
        if (line.includes('due') || line.includes('paid')) {
            // Strategy: Look for "due" or "paid" and the date following it.
            // Then look for the amount before it.

            // 1. Extract Date
            let dateStr = '';
            let dateMatch = line.match(/(\d{1,2}\/\d{1,2}(\/\d{2,4})?)/);
            if (dateMatch) dateStr = dateMatch[0];
            const date = parseDate(dateStr);

            // 2. Extract Name and Amount
            // Split by colon to separate Name from Details
            let parts = line.split(':');
            let name = parts[0].replace(/^-\s*/, '').trim();
            let details = parts.slice(1).join(':'); // Everything after first colon

            // If no colon, maybe it's "Name Amount due..."
            if (parts.length === 1) {
                // Try to guess name end? Hard.
                // Let's assume the whole thing is name if no colon, unless we find amount.
                details = line;
            }

            // 3. Find Amount in 'details'
            // If there's an '=', take the number after it.
            let amount = 0;
            if (details.includes('=')) {
                const afterEq = details.split('=')[1];
                let m = afterEq.match(/[\d,]+(\.\d+)?/);
                if (m) amount = parseFloat(m[0].replace(/,/g, ''));
            } else {
                // Take the first number found in details
                let m = details.match(/[\d,]+(\.\d+)?/);
                if (m) amount = parseFloat(m[0].replace(/,/g, ''));
            }

            // Special case for lines like "Amex Gold:336...=139 due..."
            // The name is "Amex Gold"

            // Log for debugging
            log(`Parsed: ${name}, Amount: ${amount}, Date: ${date}, Person: ${currentPerson}`);

            if (amount > 0) {
                if (section === 'upcoming') {
                    store.addDebt({
                        name,
                        balance: amount,
                        dueDate: date,
                        personId: currentPerson
                    });
                    log(`-> Added Debt: ${name} ($${amount})`);
                } else {
                    // History
                    const debt = store.addDebt({
                        name,
                        balance: 0,
                        dueDate: date,
                        personId: currentPerson
                    });
                    store.addPayment({
                        debtId: debt.id,
                        amount: amount,
                        date: date,
                        note: 'Imported History'
                    });
                    log(`-> Added History: ${name} ($${amount})`);
                }
            }
        }
    });

    log('Import Complete!');
    // location.reload(); // Don't reload so we can see logs
};

function log(msg) {
    const div = document.createElement('div');
    div.textContent = msg;
    document.body.appendChild(div);
    console.log(msg);
}

// Expose to window
window.runImport = runImport;
