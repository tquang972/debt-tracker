# Firestore REST API Access for Bots

This guide explains how to access your Debt Tracker data from an external bot or script.

## Quick Start

Your Firebase project: `debt-tracker-cf9e6`

### Step 1: Generate a Service Account Key (One-time setup)

1. Go to [Firebase Console](https://console.firebase.google.com/project/debt-tracker-cf9e6/settings/serviceaccounts/adminsdk)
2. Click **"Generate new private key"**
3. Save the JSON file somewhere secure (e.g., `service-account.json`)
4. **Never commit this file to git!**

### Step 2: Use the API

#### Option A: Use the provided Node.js helper (Recommended)

See `scripts/firestore-api.js` in this project.

```bash
# Install dependency
npm install google-auth-library

# Run example
node scripts/firestore-api.js
```

#### Option B: Direct REST API calls

**Base URL:**
```
https://firestore.googleapis.com/v1/projects/debt-tracker-cf9e6/databases/(default)/documents
```

**Endpoints:**
| Action | Method | Endpoint |
|--------|--------|----------|
| List all debts | GET | `/debts` |
| Get single debt | GET | `/debts/{documentId}` |
| List all payments | GET | `/payments` |
| List all people | GET | `/people` |

---

## API Response Format

Firestore REST API returns data in a specific format. Here's an example:

```json
{
  "documents": [
    {
      "name": "projects/debt-tracker-cf9e6/databases/(default)/documents/debts/abc123",
      "fields": {
        "name": { "stringValue": "Car Loan" },
        "balance": { "doubleValue": 450.00 },
        "dueDate": { "stringValue": "2026-02-01" },
        "personId": { "stringValue": "me" },
        "category": { "stringValue": "Auto" }
      },
      "createTime": "2025-11-15T...",
      "updateTime": "2026-01-20T..."
    }
  ]
}
```

---

## Authentication

The API requires a **Bearer token** from your service account.

### Getting an Access Token (Node.js)

```javascript
const { GoogleAuth } = require('google-auth-library');

async function getAccessToken() {
  const auth = new GoogleAuth({
    keyFile: './service-account.json',
    scopes: ['https://www.googleapis.com/auth/datastore']
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token;
}
```

### Getting an Access Token (Python)

```python
from google.oauth2 import service_account
from google.auth.transport.requests import Request

credentials = service_account.Credentials.from_service_account_file(
    'service-account.json',
    scopes=['https://www.googleapis.com/auth/datastore']
)
credentials.refresh(Request())
access_token = credentials.token
```

---

## Example: Fetch All Debts for a User

### Node.js
```javascript
const fetch = require('node-fetch');

async function getDebtsForUser(accessToken, userId = 'me') {
  const projectId = 'debt-tracker-cf9e6';
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'debts' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'personId' },
            op: 'EQUAL',
            value: { stringValue: userId }
          }
        }
      }
    })
  });
  
  return response.json();
}
```

### cURL
```bash
curl -X POST \
  "https://firestore.googleapis.com/v1/projects/debt-tracker-cf9e6/databases/(default)/documents:runQuery" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "structuredQuery": {
      "from": [{"collectionId": "debts"}],
      "where": {
        "fieldFilter": {
          "field": {"fieldPath": "personId"},
          "op": "EQUAL",
          "value": {"stringValue": "me"}
        }
      }
    }
  }'
```

---

## Useful Queries

### Get Debts with Balance > 0 (Active Debts)
```json
{
  "structuredQuery": {
    "from": [{"collectionId": "debts"}],
    "where": {
      "compositeFilter": {
        "op": "AND",
        "filters": [
          {
            "fieldFilter": {
              "field": {"fieldPath": "personId"},
              "op": "EQUAL",
              "value": {"stringValue": "me"}
            }
          },
          {
            "fieldFilter": {
              "field": {"fieldPath": "balance"},
              "op": "GREATER_THAN",
              "value": {"doubleValue": 0}
            }
          }
        ]
      }
    },
    "orderBy": [{"field": {"fieldPath": "dueDate"}, "direction": "ASCENDING"}]
  }
}
```

### Get Payments for a Specific Debt
```json
{
  "structuredQuery": {
    "from": [{"collectionId": "payments"}],
    "where": {
      "fieldFilter": {
        "field": {"fieldPath": "debtId"},
        "op": "EQUAL",
        "value": {"stringValue": "YOUR_DEBT_ID"}
      }
    }
  }
}
```

---

## Rate Limits & Cost

| Metric | Free Tier |
|--------|-----------|
| Document reads | 50,000/day |
| Document writes | 20,000/day |
| Document deletes | 20,000/day |

For a personal bot, you'll stay well within these limits.

---

## Security Notes

1. **Keep your service account key secure** - Never commit it to git
2. **Use environment variables** for the key path in production
3. **The service account bypasses Firestore security rules** - It has admin access

---

## Need Help?

- [Firestore REST API Docs](https://firebase.google.com/docs/firestore/use-rest-api)
- [Structured Query Reference](https://firebase.google.com/docs/firestore/reference/rest/v1/StructuredQuery)
