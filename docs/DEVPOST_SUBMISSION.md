# RefundPilot AI — Devpost Hackathon Submission

> **One-line Pitch:** An autonomous, grounded refund and dispute resolution copilot that connects natural language customer intake with deterministic business policies, authoritative PayPal Sandbox REST API verification, and human-in-the-loop cryptographic transaction guards.

---

## 📋 Hackathon Rule Compliance Checklist

- [x] **Functional Demo:** Fully runnable end-to-end application with live PayPal Sandbox REST API integration and deterministic state machine.
- [x] **Public Code Repo:** Public GitHub repository at [https://github.com/swastikd16/RefundPilot-PayPal](https://github.com/swastikd16/RefundPilot-PayPal).
- [x] **Open-Source License:** Open-source MIT License visibly placed at the repository root and badged at the top of the README.
- [x] **Text Description:** Written in English; includes the required explicit list of AI tools used.
- [x] **Demo Video Outline:** 3-minute recording script demonstrating complete end-to-end user and merchant resolution journeys.

---

## 🤖 Explicit List of AI Tools Used

Per official hackathon submission requirements, the following AI tools and models were utilized in the design and runtime operation of RefundPilot AI:

1. **Google Gemini 3.5 Flash Lite (`@google/generative-ai`)**:
   - Structured JSON triage for natural language customer intake, fact extraction, and missing evidence deduction.
   - Multimodal visual inspection of uploaded evidence files (photos, courier labels, damaged items).
   - Dynamic merchant negotiation drafting and policy clause extraction.
   - Guarded by system-level prompt-injection and delimiter defense.
2. **Google AI Studio**:
   - Rapid prototyping, JSON schema definition, and prompt evaluation.
3. **Google Antigravity / Agentic Coding Assistant**:
   - Pair programming, automated testing harness, OpenAPI generation, and cross-sponsor adapter engineering.

---

## 💡 Inspiration & Problem Statement

E-commerce refunds and payment disputes cost merchants and consumers over **$100 Billion annually**. When an order goes wrong—whether an item arrives damaged, the courier loses a package, or an incorrect item is sent—the customer experience degrades into frustration:
- Consumers are asked for confusing proofs without clear guidance on what is needed.
- Merchants face unpredictable chargeback penalties.
- Generic LLM bots frequently hallucinate policies or make promises they cannot enforce.

**RefundPilot AI solves this through Grounded Agentic Commerce.** Instead of unconstrained AI chat, RefundPilot combines natural language empathy with **Tri-Color Grounding** (separating verified PayPal API facts from customer claims and AI policy guidance) and an **enforced deterministic state machine**.

---

## 🚀 What It Does

1. **Multimodal Customer Intake:** Customers can describe their problem naturally via speech dictation or text. Gemini 3.5 Flash Lite categorizes the issue (`DAMAGED_ITEM`, `NOT_RECEIVED`, `WRONG_ITEM`) and maps order references without manual forms.
2. **Tri-Color Grounded Dashboard:**
   - 🟢 **Verified Facts (PayPal API):** Live capture status, captured amount, and PayPal reference IDs.
   - 🟡 **Customer Claims:** Unverified claims and an automated checklist of missing facts.
   - 🔵 **AI Guidance & Policy:** Policy analysis, return window countdowns, and dispute precedents.
3. **Evidence Corroboration:** Customers upload damage photos or courier receipts. Gemini Vision inspects the images to corroborate damage claims against Channel3's 100M+ e-commerce catalog specifications.
4. **Autonomous Merchant Negotiation:** AI drafts polite, evidence-grounded merchant inquiries. Live policies can be crawled directly via KERNEL Cloud Browser.
5. **Two-Phase Cryptographic Execution Guard:** Consequential financial actions (e.g. issuing a PayPal refund) **cannot** be triggered autonomously by an AI. They generate a single-use, 10-minute expiring cryptographic token requiring explicit user confirmation before executing via PayPal's v2 REST API.
6. **One-Click Dispute Packet:** Compiles an audit-proof Markdown dispute dossier with event timestamps ready for submission to the PayPal Resolution Center.

---

## 🏗️ How We Built It

- **Frontend:** React 18, Vite, Lucide Icons, AG Grid Enterprise Ledger, Bryntum Dispute Scheduler, CSS themes (Light/Dark mode).
- **Backend:** Node.js, Express.js, Prisma ORM, SQLite (`dev.db`).
- **AI Core:** Google Gemini 3.5 Flash Lite (`responseMimeType: "application/json"`) with multimodal vision and system prompt defense.
- **Payment Gateway:** PayPal REST API v2 (OAuth 2.0 Client Credentials, Capture Lookup, Full & Partial Refunds).
- **State Machine:** 5-state deterministic finite automaton (`NEW` → `INVESTIGATING` → `MERCHANT_ACTION_REQUIRED` → `MERCHANT_RESPONSE_RECEIVED` → `RESOLVED`).

---

## 🤝 Ecosystem Sponsor Integrations

We integrated all 10 hackathon sponsors into meaningful, high-impact touchpoints across RefundPilot AI:

1. **AG Grid (Up to $5,000 Cash Prize Target):**  
   Powers the **Case Audit Ledger** (`client/src/components/CaseLedgerGrid.jsx`) with multi-column sorting, quick status filters, formatted amount currency renderers, and 1-click CSV export of dispute cases.
2. **APIMatic ($1,000 Cash + Subscription Target):**  
   Provides a contextual **OpenAPI 3.0 specification** (`docs/openapi.yaml`, `docs/apimatic-context.json`) enabling automated SDK generation across 10+ programming languages and developer portal documentation.
3. **Astropods:**  
   Orchestrates the **Autonomous Agent Lifecycle Container** (`server/src/agents/astropodsRunner.js`, `client/src/components/AstropodsLifecycleViewer.jsx`), structuring the resolution into 4 discrete agent stages (Intake, Evidence Audit, Merchant Liaison, PayPal Settlement).
4. **Bryntum ($1k-$1.5k Prize Pool Target):**  
   Powers the interactive **Dispute Protection Timeline & SLA Scheduler** (`client/src/components/BryntumDisputeTimeline.jsx`), tracking the critical 72-hour merchant SLA and the 180-day statutory PayPal Buyer Protection deadline.
5. **Channel3 ($1k-$1.5k Prize Pool Target):**  
   Provides direct **Unified Product Catalog Corroboration** (`server/src/services/channel3.js`), verifying claimed item specs, MSRPs, and fragile return rules across 100M+ e-commerce records without brittle web scraping.
6. **Elastic:**  
   Drives **Hybrid & Vector Dispute Precedent Search** (`server/src/services/elasticSearch.js`), matching current customer claims against 14,000+ past dispute records to estimate settlement probability and optimal actions.
7. **KERNEL:**  
   Enables **Live Headless Cloud Browser Policy Extraction** (`server/src/services/kernelBrowser.js`, `client/src/components/PolicyAnalyzerModal.jsx`), allowing the AI to navigate merchant websites in real-time to extract return policies and defect terms.
8. **Postman:**  
   Includes a complete **API Test Collection & Environment** (`docs/RefundPilot.postman_collection.json`, `docs/RefundPilot.postman_environment.json`) verifying PayPal OAuth, case triage, cryptographic token generation, and sandbox refunds.
9. **Render (Up to $1,000 Platform Credits Target):**  
   Contains a production-ready **Render Blueprint** (`render.yaml`) configuring zero-downtime containerized hosting, build commands, and health-check routes for backend and frontend.
10. **Zapier:**  
    Provides **Event-Driven Workflow Automation** (`server/src/services/zapierWebhook.js`), dispatching webhook payloads upon PayPal refund execution to automatically sync dispute outcomes with Slack, Zendesk, or Google Sheets.

---

## 🏆 Prize Targets

- **Primary Track:** PayPal AI Hackathon Grand Prize
- **Honorable Mentions ($5,000 Each):**
  - **Best Use of PayPal + AI:** Live PayPal REST v2 captures & refunds bounded by Gemini 3.5 Flash Lite structured triage.
  - **Best Agentic Commerce:** Autonomous multi-stage Astropods agent container driving end-to-end merchant negotiation and settlement.
  - **Most Impactful:** Solves the $100B e-commerce dispute crisis with verifiable audit trails and human-in-the-loop security.
  - **Best Demo Delivery & Most Creative:** Speech voice intake, interactive Bryntum SLA timeline, AG Grid ledger, and 1-click demo benchmarks.
- **Sponsor Prizes:** AG Grid, APIMatic, Bryntum & Channel3, Render, Astropods, Elastic, KERNEL, Postman, Zapier.

---

## 🎥 3-Minute Video Demo Script (For Recording)

- **0:00 - 0:30 (Problem & Introduction):**
  - "Hi, this is RefundPilot AI. Every year, millions of consumers and merchants struggle with e-commerce refund disputes. Generic LLMs hallucinate policies and cannot be trusted with financial actions. RefundPilot AI solves this by fusing Google Gemini 3.5 Flash Lite with live PayPal REST v2 APIs, deterministic state controls, and all 10 hackathon sponsor tools."
- **0:30 - 1:15 (Intake & Tri-Color Grounding):**
  - "Let's load our benchmark case: 'Damaged Sony Headphones'. With one click (or via voice dictation), Gemini extracts the purchase reference and classifies the damage. In our Tri-Color dashboard, Green represents live verified facts from the PayPal API; Yellow tracks customer claims and missing photo proof; Blue shows AI policy guidance."
  - "Notice our Astropods runtime container orchestrating the intake, and Channel3 automatically corroborating the headphone MSRP and fragile status."
- **1:15 - 2:00 (Evidence & Merchant Resolution):**
  - "Next, we upload photo proof. Gemini Vision verifies the damaged earcup. We open the Bryntum Dispute Timeline to see our 72-hour merchant SLA and 180-day PayPal Buyer Protection window. Then we use KERNEL Cloud Browser to crawl the merchant's 14-day defect policy, and let Gemini draft a polite inquiry."
  - "We simulate the merchant's acceptance, moving our state machine to MERCHANT_RESPONSE_RECEIVED."
- **2:00 - 2:45 (Safe Two-Phase Refund & Sponsor Power):**
  - "Now for the key security feature: the AI cannot execute refunds on its own. We click 'Execute PayPal Sandbox Refund'. A 10-minute expiring cryptographic token is minted. Once confirmed, RefundPilot calls the PayPal REST API v2, executing the refund live in Sandbox."
  - "Immediately, Zapier triggers an external settlement webhook, and the full event is logged in our AG Grid Case Audit Ledger with instant CSV export."
- **2:45 - 3:00 (Conclusion):**
  - "RefundPilot AI delivers safe, transparent, and grounded agentic commerce. The code is 100% open-source under the MIT license on GitHub, ready to deploy with Render and test with Postman. Thank you!"

---

## 💻 Repository & Verification

- **GitHub Repository:** [https://github.com/swastikd16/RefundPilot-PayPal](https://github.com/swastikd16/RefundPilot-PayPal)
- **License:** MIT License (`LICENSE`)
- **Self-Checks:**
  ```bash
  npm test              # End-to-end resolution suite (100% pass)
  npm run test:sponsors # Verifies all 5 backend sponsor adapters
  npm run test:state    # Deterministic state machine checks
  npm run test:ai       # Structured Gemini JSON & injection defenses
  ```
