import re
import json
from datetime import datetime

# Read the data file
with open('data/Monthly Debts Tracker .txt', 'r') as f:
    content = f.read()

# Initialize data structure
people = [
    {"id": "dung", "name": "Dung", "isDefault": True},
    {"id": "pop", "name": "Pop", "isDefault": False},
    {"id": "quang", "name": "Quang", "isDefault": False}
]

debts = []
payments = []

# Split into main sections
upcoming_section = content.split('*****************************UPCOMING DEBT************************************')[1].split('*****************************HISTORY********************************************')[0]
history_section = content.split('*****************************HISTORY********************************************')[1] if '*****************************HISTORY********************************************' in content else ""

def parse_debt_line(line, person_id, is_upcoming=True):
    """Parse a single debt line"""
    # Skip empty lines
    if not line.strip() or line.startswith('---'):
        return None
    
    # Find due date first
    due_match = re.search(r'due\s+(\d{1,2}/\d{1,2}(?:/\d{4})?)', line)
    if not due_match:
        return None
    
    due_date_str = due_match.group(1)
    
    # Extract everything before "due" as the name/amount section
    before_due = line[:due_match.start()].strip()
    
    # Find the amount (last number before "due", may have $ or comma)
    amount_match = re.search(r'([\d,]+\.?\d*)\s*(?:\(|on|$)', before_due[::-1])
    if not amount_match:
        # Try to find any number pattern
        amount_match = re.search(r'\$?([\d,]+\.?\d+)', before_due)
        if not amount_match:
            return None
        amount_str = amount_match.group(1)
    else:
        # Reverse it back
        amount_str = amount_match.group(1)[::-1]
    
    amount = float(amount_str.replace(',', ''))
    
    # Name is everything before the amount
    name_end = before_due.rfind(amount_str)
    name = before_due[:name_end].strip().lstrip('-').strip().rstrip(':').rstrip('：').strip()
    
    # If name still has = in it (math expression), extract the actual name
    if '=' in name:
        name = name.split(':')[0].strip()
    
    # Convert date to YYYY-MM-DD format
    date_parts = due_date_str.split('/')
    month = int(date_parts[0])
    day = int(date_parts[1])
    year = int(date_parts[2]) if len(date_parts) > 2 else (2025 if month >= 11 else 2026)
    due_date = f"{year}-{month:02d}-{day:02d}"
    
    # Extract note (content in parentheses or after due date or math expressions)
    note_parts = []
    
    # Math expressions
    math_match = re.search(r'([\d\.\-\+\*/\s]+)=', line)
    if math_match:
        note_parts.append(f"Calculation: {math_match.group(0)}{amount_str}")
    
    # Parentheses content
    paren_matches = re.findall(r'\(([^)]+)\)', line)
    note_parts.extend(paren_matches)
    
    # Content after due date
    after_due = line[due_match.end():].strip()
    if after_due and not after_due.startswith('('):
        note_parts.append(after_due)
    
    note = "; ".join(note_parts) if note_parts else ""
    
    debt_id = f"d_{len(debts) + 1}"
    
    return {
        "id": debt_id,
        "name": name,
        "balance": amount,
        "dueDate": due_date,
        "personId": person_id,
        "note": note
    }

def parse_section(section_text, person_id, is_upcoming=True):
    """Parse a section for a specific person"""
    lines = section_text.split('\n')
    for line in lines:
        debt = parse_debt_line(line, person_id, is_upcoming)
        if debt:
            if is_upcoming:
                debts.append(debt)
            else:
                # For history, create a payment record
                payment_id = f"pay_{len(payments) + 1}"
                payments.append({
                    "id": payment_id,
                    "debtId": debt["id"],
                    "amount": debt["balance"],
                    "date": debt["dueDate"],
                    "note": debt.get("note", "")
                })
                # Also add the debt with 0 balance
                debt["balance"] = 0
                debts.append(debt)

# Parse Upcoming section
sections = {}
current_person = None

for line in upcoming_section.split('\n'):
    if 'DUNG' in line and '-' in line:
        current_person = 'dung'
        sections.setdefault('dung_upcoming', [])
    elif 'POP' in line and '-' in line:
        current_person = 'pop'
        sections.setdefault('pop_upcoming', [])
    elif 'QUANG' in line and '-' in line:
        current_person = 'quang'
        sections.setdefault('quang_upcoming', [])
    elif current_person and line.strip():
        sections.setdefault(f'{current_person}_upcoming', []).append(line)

# Parse each section
for person in ['dung', 'pop', 'quang']:
    key = f'{person}_upcoming'
    if key in sections:
        parse_section('\n'.join(sections[key]), person, True)

# Parse History section
if history_section:
    sections_history = {}
    current_person = None
    
    for line in history_section.split('\n'):
        if 'DUNG' in line and '-' in line:
            current_person = 'dung'
            sections_history.setdefault('dung_history', [])
        elif 'POP' in line and '-' in line:
            current_person = 'pop'
            sections_history.setdefault('pop_history', [])
        elif 'QUANG' in line and '-' in line:
            current_person = 'quang'
            sections_history.setdefault('quang_history', [])
        elif current_person and line.strip():
            sections_history.setdefault(f'{current_person}_history', []).append(line)
    
    for person in ['dung', 'pop', 'quang']:
        key = f'{person}_history'
        if key in sections_history:
            parse_section('\n'.join(sections_history[key]), person, False)

# Generate the JavaScript file
output = f"""// Auto-generated from parser.py
export const initialData = {json.dumps({
    "people": people,
    "debts": debts,
    "payments": payments
}, indent=2)};
"""

with open('js/initialData.js', 'w') as f:
    f.write(output)

print(f"✅ Parsed {len(debts)} debts and {len(payments)} payments")
print(f"   - Dung: {len([d for d in debts if d['personId'] == 'dung'])} debts")
print(f"   - Pop: {len([d for d in debts if d['personId'] == 'pop'])} debts")
print(f"   - Quang: {len([d for d in debts if d['personId'] == 'quang'])} debts")
