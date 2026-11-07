# RefundPilot AI — PayPal AI Hackathon 🚀

> **AI-Powered End-to-End Refund Resolution & Dispute Guard**  
> Built strictly according to the [RefundPilot AI SRS v1.0](./RefundPilot_AI_SRS.pdf) specification.

RefundPilot AI coordinates purchase refund disputes from natural language complaint intake to verified PayPal Sandbox settlement. It bridges natural language understanding with deterministic financial guardrails.

---

## 🌟 Key Highlights

1. **Natural Language Intake**: Customers explain their problem in everyday language; Gemini AI classifies the defect (`DAMAGED_ITEM`, `DEFECTIVE`, `NOT_RECEIVED`, etc.), extracts order references, and identifies missing evidence.
2. **Tri-Color Grounding Hub**:
   - 🟢 **Verified PayPal Facts**: Live data from PayPal Sandbox API (capture ID, captured amount, confirmed status).
   - 🟡 **Customer Claims**: Stated user assertions and missing evidence checklist.
   - 🔵 **AI Guidance & Policy**: Grounded advice and merchant policies with explicit disclaimers.
3. **Two-Phase Consequential Action Guard**:
   - AI **never** triggers financial transactions autonomously.
   - Sandbox refunds generate a single-use, 10-minute expiring cryptographic confirmation token requiring explicit human confirmation.
4. **Deterministic State Machine**:
   - Enforces transition rules (`NEW` → `INVESTIGATING` → `MERCHANT_ACTION_REQUIRED` → `MERCHANT_RESPONSE_RECEIVED` → `RESOLVED`).
   - Prevents unauthorized jumps (e.g., closing a case does not imply a refund occurred).
5. **Traceable Audit Timeline**:
   - Append-only event history tracking every action, AI inference, merchant response, and PayPal API confirmation.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Lucide Icons, Vanilla CSS (high-contrast, accessible).
- **Backend**: Node.js v22, Express, Prisma ORM, SQLite (`dev.db`).
- **AI Orchestration**: Google Gemini API (`gemini-2.5-flash`) with structured JSON schema outputs & rule-based offline fallback.
- **Payment Gateway**: PayPal v2 REST API (OAuth 2.0, Captures, Refunds) in Sandbox mode.

---

## ⚡ Quickstart (2 Steps)

### 1. Configure Environment Variables

Edit `server/.env` with your PayPal Sandbox and Gemini API credentials:

```env
PORT=5000
PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_paypal_sandbox_client_secret
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
GEMINI_API_KEY=your_gemini_api_key
DATABASE_URL="file:./dev.db"
APP_BASE_URL=http://localhost:5173
```

*(Note: If API keys are not supplied, the application automatically runs in demo mode with pre-seeded fixtures and offline rule extraction so you can test immediately!)*

### 2. Start Backend & Frontend

Open two terminals:

**Terminal 1 (Backend Server):**
```bash
npm run server
# Server starts at http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
npm run client
# Vite app opens at http://localhost:5173
```

---

## 🧪 Automated Verification Suite

Run our assert-based self-checks covering SRS test scenarios (TC-001 through TC-016):

```bash
# Test 1: State Machine & Policy Rules
npm run test:state

# Test 2: AI Structured Extraction & Injection Defense
npm run test:ai

# Test 3: Full End-to-End Damaged Item Scenario
npm test

# Verify PayPal Sandbox credentials
npm run verify:paypal
```

---

## 🎬 2-Minute Judge Demo Walkthrough

1. Open **`http://localhost:5173`**.
2. Click **"Seed Demo Case"** in the top navigation:
   - This instantly loads the SRS reference case (*Sony WH-1000XM5 headphones arrived with a cracked right earcup*).
3. Observe the **Tri-Color Grounding cards**:
   - 🟢 Verified PayPal Capture: `$399.00 USD` (COMPLETED).
   - 🟡 Customer Claims & Missing Evidence Checklist.
   - 🔵 AI Guidance advising seller contact before formal escalation.
4. Go to **Evidence Vault**:
   - Upload any sample defect photo (e.g. `defect.png`). Notice the timeline appends an `EVIDENCE_UPLOADED` event.
5. In the **Merchant Resolution Hub**:
   - Click **"AI Draft Inquiry"** → Review the auto-generated professional message → Click **"Approve & Send to Seller"**.
   - Use the **Simulate Merchant Response** selector to choose **"Merchant: Accept Claim"** and click **Record Reply**.
   - Notice the case automatically advances to `MERCHANT_RESPONSE_RECEIVED`.
6. Click **"Execute PayPal Sandbox Refund"**:
   - A modal appears showing the **Expiring Confirmation Token** and target capture details.
   - Click **"Confirm & Authorize Refund"**.
   - The verified refund is executed, PayPal snapshot status updates to `REFUNDED`, and the case securely transitions to `RESOLVED` with an immutable audit log.

