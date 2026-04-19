# VeriLend — Intelligent Video-Based Loan Origination Platform

> Real-time KYC, AI risk assessment, and instant loan offers — all inside a single video call.

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [What The Platform Does](#2-what-the-platform-does)
3. [System Overview](#3-system-overview)
4. [System Architecture](#4-system-architecture)
5. [Code Structure & Reproducibility](#5-code-structure--reproducibility)
6. [Core Logic Deep Dive](#6-core-logic-deep-dive)
7. [Architecture Decisions](#7-architecture-decisions)
8. [Performance Optimizations](#8-performance-optimizations)
9. [Setup Instructions](#9-setup-instructions)
10. [API Reference](#10-api-reference)
11. [Known Limitations](#11-known-limitations)
12. [What I'd Improve With More Time](#12-what-id-improve-with-more-time)

---

## 1. Problem Statement

Traditional loan origination is slow, paper-heavy, and fraud-prone. Customers visit branches, fill forms, and wait days for decisions. Lenders rely on static documents that can be forged, and have no real-time signal about the applicant's intent, identity, or risk profile.

**VeriLend solves this by turning a video call into a complete, intelligent onboarding pipeline.**

During a single live session, the platform simultaneously:
- Verifies the customer's identity via computer vision
- Captures verbal consent via speech-to-text
- Extracts income, employment, and loan purpose from natural conversation
- Scores risk using an LLM
- Generates personalised loan offers in real time

---

## 2. What The Platform Does

| Capability | How |
|---|---|
| Live video call | WebRTC peer-to-peer, signalled via Socket.IO |
| Face detection & age estimation | `face-api.js` running TinyFaceDetector + AgeGenderNet in-browser |
| Speech-to-text | Web Speech API (`webkitSpeechRecognition`) with `en-IN` locale |
| Consent detection | Keyword matching over rolling transcript |
| Geolocation capture | Browser Geolocation API |
| Device fingerprinting | Navigator metadata (UA, platform, timezone, screen, cores, memory) |
| AI risk assessment | Google Gemini 1.5 Flash via structured JSON prompt |
| Policy evaluation | Rule engine (age, income, risk band, consent checks) |
| Offer calculation | EMI formula with FOIR cap, risk-adjusted interest rates |
| Persistence | SQLite via `better-sqlite3` |


---

## 3. System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (React + Vite)                   │
│                                                                 │
│  ┌──────────────┐   ┌──────────────┐   ┌─────────────────────┐ │
│  │  VideoCall   │   │ TranscriptPanel│  │   Side Panel (KYC)  │ │
│  │  (WebRTC)    │   │  (STT)        │  │  Age / Geo / Device │ │
│  └──────┬───────┘   └──────┬────────┘  └──────────┬──────────┘ │
│         │                  │                       │            │
│  ┌──────▼───────────────────▼───────────────────────▼─────────┐ │
│  │              Zustand Global State Stores                    │ │
│  │   kycStore  |  transcriptStore  |  offerStore               │ │
│  └──────────────────────────┬──────────────────────────────────┘ │
│                             │  REST POST /api/assessments/assess  │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   Express Server   │
                    │   + Socket.IO      │
                    └─────────┬──────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
     ┌────────▼──────┐ ┌──────▼──────┐ ┌─────▼──────────┐
     │  LLM Service  │ │Policy Service│ │  Offer Service │
     │ (Gemini 1.5)  │ │ (Rule Engine)│ │ (EMI Formula)  │
     └────────┬──────┘ └─────────────┘ └────────────────┘
              │
     ┌────────▼──────┐
     │  SQLite DB    │
     │ (better-sqlite│
     │    3)         │
     └───────────────┘
```

---

## 4. System Architecture

### 4.1 High-Level Data Flow

```
Customer Opens Browser
        │
        ▼
  LandingPage.jsx
  (Choose role: customer / agent)
        │
        ▼
  VideoSession.jsx  ──────────────────────────────────────────┐
        │                                                      │
        ├── useWebRTC()          ◄──── Socket.IO Signaling ───►│
        │     └── RTCPeerConnection (STUN: stun.l.google.com)  │
        │                                                      │
        ├── useFaceDetection()                                 │
        │     └── face-api.js (TinyFaceDetector + AgeGenderNet)│
        │           └── Smoothed age → kycStore               │
        │                                                      │
        ├── useSpeechRecognition()                             │
        │     └── Web Speech API (en-IN, continuous)           │
        │           └── Final transcripts → transcriptStore    │
        │                 └── Socket emit → transcript-update  │
        │                                                      │
        ├── useGeolocation()                                   │
        │     └── navigator.geolocation → kycStore            │
        │                                                      │
        └── DeviceFingerprint (side-effect component)          │
              └── navigator metadata → kycStore               │
                                                              │
  Agent clicks "Generate AI Risk Assessment"                  │
        │                                                      │
        ▼                                                      │
  POST /api/assessments/assess                                 │
        │                                                      │
        ├── generateRiskAssessment()  →  Gemini 1.5 Flash      │
        │     └── Returns: customerProfile + riskClassification│
        │                                                      │
        ├── evaluatePolicy()  →  Rule Engine                   │
        │     └── Returns: { passed, violations[] }            │
        │                                                      │
        ├── calculateOffers()  →  EMI Formula                  │
        │     └── Returns: offers[] (12/24/36 month tenures)   │
        │                                                      │
        └── Persist to SQLite                                  │
              └── applications + risk_assessments tables       │
```

### 4.2 WebRTC Signaling Flow

```
Customer Browser                 Socket.IO Server              Agent Browser
      │                                │                             │
      │──── join-room(sessionId) ──────►│                             │
      │                                │◄──── join-room(sessionId) ──│
      │                                │                             │
      │                                │──── user-joined ───────────►│
      │                                │                             │
      │◄─────────────────────────────────────── user-joined ─────────│
      │                                │                             │
      │ createOffer()                  │                             │
      │──── offer(SDP) ───────────────►│──── offer(SDP) ────────────►│
      │                                │                             │
      │                                │     createAnswer()          │
      │◄─── answer(SDP) ───────────────│◄─── answer(SDP) ────────────│
      │                                │                             │
      │──── ice-candidate ────────────►│──── ice-candidate ─────────►│
      │◄─── ice-candidate ─────────────│◄─── ice-candidate ──────────│
      │                                │                             │
      │◄══════════════ P2P Media Stream (Audio + Video) ════════════►│
```

### 4.3 AI Assessment Pipeline

```
  Session Data (transcript + KYC signals)
              │
              ▼
  ┌───────────────────────────────────────┐
  │         Gemini 1.5 Flash              │
  │                                       │
  │  Structured JSON Prompt:              │
  │  - Extract employment type            │
  │  - Estimate income from conversation  │
  │  - Identify loan purpose              │
  │  - Validate consent                   │
  │  - Flag inconsistencies               │
  │  - Assign riskScore (0–100)           │
  └───────────────┬───────────────────────┘
                  │
                  ▼
  ┌───────────────────────────────────────┐
  │         Assessment Output             │
  │                                       │
  │  customerProfile:                     │
  │    employmentType, estimatedIncome,   │
  │    loanPurpose, purposeCategory,      │
  │    consentGiven                       │
  │                                       │
  │  riskClassification:                  │
  │    riskBand (LOW/MEDIUM/HIGH/VERY_HIGH│
  │    riskScore (0–100)                  │
  │    redFlags[], rationale              │
  └───────────────┬───────────────────────┘
                  │
        ┌─────────┴──────────┐
        │                    │
        ▼                    ▼
  Policy Engine         Offer Engine
  (Rule checks)         (EMI formula)
        │                    │
        ▼                    ▼
  PASS / REJECT        Offers (12/24/36m)
```

### 4.4 Database Schema

```
sessions ──────────────────────────────────────────────────────────
  id (PK), customer_name, phone, email, campaign_source,
  status, started_at, ended_at, duration_seconds

transcripts ────────────────────────────────────────────────────────
  id (PK), session_id (FK), speaker, text, is_final,
  confidence, timestamp

kyc_signals ────────────────────────────────────────────────────────
  id (PK), session_id (FK), signal_type, signal_data,
  confidence, timestamp

applications ───────────────────────────────────────────────────────
  id (PK), session_id (FK), declared_age, estimated_age,
  employment_type, employer, monthly_income, loan_purpose,
  purpose_category, existing_emis, consent_given,
  consent_timestamp, geo_latitude, geo_longitude,
  device_fingerprint, created_at

risk_assessments ───────────────────────────────────────────────────
  id (PK), application_id (FK), session_id (FK),
  risk_band, risk_score, llm_output (JSON), fraud_signals,
  policy_result (JSON), rationale, assessed_at

offers ─────────────────────────────────────────────────────────────
  id (PK), application_id (FK), session_id (FK),
  amount, tenure_months, interest_rate, emi,
  total_payable, total_interest, processing_fee,
  risk_band, status, generated_at

audit_logs ─────────────────────────────────────────────────────────
  id (PK), session_id (FK), event_type, event_data,
  actor, ip_address, timestamp
```


---

## 5. Code Structure & Reproducibility

```
verilend/
├── client/                        # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx                # Router: / and /session/:sessionId
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx    # Role selector + session entry
│   │   │   └── VideoSession.jsx   # Main session UI (orchestrator)
│   │   ├── components/
│   │   │   ├── video/
│   │   │   │   ├── VideoCall.jsx      # WebRTC video layout
│   │   │   │   ├── VideoControls.jsx  # Mute / camera / hang up
│   │   │   │   └── FaceOverlay.jsx    # Bounding box + age label
│   │   │   ├── kyc/
│   │   │   │   ├── AgeEstimator.jsx   # Reads from kycStore
│   │   │   │   └── DeviceFingerprint.jsx  # Side-effect collector
│   │   │   ├── stt/
│   │   │   │   ├── ConsentDetector.jsx    # Keyword scan over transcript
│   │   │   │   └── TranscriptPanel.jsx    # Live transcript display
│   │   │   └── offers/
│   │   │       └── OfferCard.jsx      # Loan offer display + accept
│   │   ├── hooks/
│   │   │   ├── useWebRTC.js           # RTCPeerConnection + Socket.IO
│   │   │   ├── useFaceDetection.js    # face-api.js loop
│   │   │   ├── useSpeechRecognition.js # Web Speech API wrapper
│   │   │   └── useGeolocation.js      # navigator.geolocation
│   │   └── stores/
│   │       ├── kycStore.js            # age, location, device
│   │       ├── transcriptStore.js     # transcripts[], interimText
│   │       └── offerStore.js          # assessment, policyResult, offers
│   └── vite.config.js
│
├── server/                        # Node.js + Express backend
│   └── src/
│       ├── index.js               # Express + Socket.IO bootstrap
│       ├── routes/
│       │   └── assessment.routes.js   # POST /api/assessments/assess
│       ├── services/
│       │   ├── llm.service.js         # Gemini 1.5 Flash integration
│       │   ├── policy.service.js      # Eligibility rule engine
│       │   └── offer.service.js       # EMI + offer calculation
│       ├── socket/
│       │   └── handlers.js            # WebRTC signaling + transcript relay
│       └── db/
│           └── database.js            # SQLite schema + connection
│
├── pitch-deck.html                # Project pitch deck
└── README.md
```

---

## 6. Core Logic Deep Dive

### 6.1 Face Detection & Age Estimation

`useFaceDetection.js` runs a `requestAnimationFrame` loop against the local video element using three `face-api.js` models:

- `tinyFaceDetector` — lightweight MTCNN-style detector
- `faceLandmark68Net` — 68-point facial landmark model
- `ageGenderNet` — CNN regression for age + gender

Age is **smoothed** using a rolling window of the last 20 frames to prevent jitter:

```js
ageHistory.current.push(result.age);
if (ageHistory.current.length > 20) ageHistory.current.shift();
const avgAge = ageHistory.current.reduce((a, b) => a + b, 0) / ageHistory.current.length;
setEstimatedAge(Math.round(avgAge));
```

The smoothed age is written to `kycStore` and displayed live via `AgeEstimator.jsx` and `FaceOverlay.jsx`.

### 6.2 Speech-to-Text & Consent Detection

`useSpeechRecognition.js` wraps the browser's `webkitSpeechRecognition` API:

- `continuous: true` — keeps listening across pauses
- `interimResults: true` — shows partial results in real time
- `lang: 'en-IN'` — tuned for Indian English accents
- Auto-restarts on `onend` if `isListening` is still true

Final transcripts are stored in `transcriptStore`. `ConsentDetector.jsx` scans the full transcript for consent keywords:

```js
const CONSENT_KEYWORDS = ['i agree', 'i consent', 'yes i do', 'i accept', 'confirm', 'proceed', 'authorized'];
const detected = CONSENT_KEYWORDS.some(keyword => allText.includes(keyword));
```

### 6.3 Risk Scoring via LLM

`llm.service.js` sends a structured prompt to Gemini 1.5 Flash with `responseMimeType: "application/json"`. The prompt includes the full transcript, estimated age, geolocation, and device signals.

The model returns a typed JSON object validated against `ASSESSMENT_SCHEMA`:

```
riskScore 80–100  →  LOW
riskScore 50–79   →  MEDIUM
riskScore 30–49   →  HIGH
riskScore 0–29    →  VERY_HIGH
```

### 6.4 Policy Engine

`policy.service.js` runs deterministic rule checks after the LLM assessment:

| Rule | Condition |
|---|---|
| Minimum age | `age >= 21` |
| Maximum age | `age <= 60` |
| Minimum income | `estimatedIncome >= ₹15,000/month` |
| Risk band | `riskBand !== 'VERY_HIGH'` |
| Consent | `consentGiven === true` |

Any violation causes `passed: false` and the offer engine is skipped.

### 6.5 Offer Calculation

`offer.service.js` uses the standard EMI present value formula with a 50% FOIR (Fixed Obligation to Income Ratio) cap:

```
Base Rate:  10.5% p.a.
Risk Premium:
  LOW       +0.0%
  MEDIUM    +2.5%
  HIGH      +5.5%
  VERY_HIGH +15.0%

maxEMI = estimatedIncome × 0.5
maxAmount = maxEMI × (1 - (1 + r)^-n) / r   [where r = monthly rate, n = tenure months]
```

Three offers are generated for tenures of 12, 24, and 36 months. Amounts are rounded down to the nearest ₹5,000. Processing fee is 2% of the loan amount.

---

## 7. Architecture Decisions

### Why WebRTC + Socket.IO instead of a hosted video SDK?

WebRTC gives full control over the media stream, which is essential for running `face-api.js` directly on the local video element. Hosted SDKs (Twilio, Agora) abstract away the raw stream and would block in-browser CV inference.

### Why face-api.js in the browser instead of a server-side CV API?

Running inference client-side eliminates the need to stream raw video frames to a server, which would be bandwidth-heavy, latency-sensitive, and a privacy risk. The TinyFaceDetector model is ~190KB and runs at 15–30fps on modern hardware.

### Why Gemini 1.5 Flash for risk assessment?

The task requires extracting structured financial intent from unstructured conversational text. Gemini 1.5 Flash supports `responseMimeType: "application/json"` for reliable structured output, has a large context window for long transcripts, and is fast enough for near-real-time assessment.

### Why SQLite instead of PostgreSQL?

For a hackathon prototype, SQLite via `better-sqlite3` is synchronous, zero-config, and file-based. The schema is fully normalised and production-ready — swapping to PostgreSQL requires only changing the DB driver.

### Why Zustand for state management?

Zustand is minimal, has no boilerplate, and works well with React hooks. The three stores (`kycStore`, `transcriptStore`, `offerStore`) map cleanly to the three data domains of the application.

---

## 8. Performance Optimizations

| Area | Optimization |
|---|---|
| Face detection | `TinyFaceDetector` (vs SSD MobileNet) — 4× faster, smaller model |
| Age smoothing | 20-frame rolling average prevents re-renders on every frame |
| Speech recognition | Interim results shown locally; only final results emitted over socket |
| LLM calls | Single structured prompt returns all fields in one round-trip |
| DB writes | `better-sqlite3` synchronous API avoids async overhead for simple inserts |
| Video | `objectFit: cover` + hardware-accelerated CSS transforms for mirror effect |

---

## 9. Setup Instructions

### Prerequisites

- Node.js >= 18
- A Google Gemini API key ([get one here](https://aistudio.google.com/app/apikey))

### 1. Clone the repo

```bash
git clone https://github.com/rohanjain1648/VeriLend_Hackaton.git
cd VeriLend_Hackaton
```

### 2. Server setup

```bash
cd server
npm install
```

Create `server/.env`:

```env
PORT=3001
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key_here
DB_PATH=./data/verilend.db
```

Start the server:

```bash
node src/index.js
```

### 3. Client setup

```bash
cd client
npm install
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

Start the client:

```bash
npm run dev
```

### 4. Open the app

Open two browser tabs (or two different browsers) at `http://localhost:5173`.

- Tab 1: Select **Customer View** → Start Live Session
- Tab 2: Select **Agent View** → Start Live Session

Both will join `test-session-123`. The customer initiates the WebRTC offer when the agent joins. Once the conversation is complete, the agent clicks **Generate AI Risk Assessment**.

---

## 10. API Reference

### `POST /api/assessments/assess`

Runs the full AI assessment pipeline for a session.

**Request body:**

```json
{
  "sessionId": "test-session-123",
  "transcript": [
    { "text": "I work as a software engineer earning 80000 per month", "speaker": "customer", "timestamp": "..." },
    { "text": "I need a loan for home renovation", "speaker": "customer", "timestamp": "..." },
    { "text": "I agree and consent to this process", "speaker": "customer", "timestamp": "..." }
  ],
  "kycData": {
    "estimatedAge": 32,
    "location": { "lat": 28.6139, "lng": 77.2090, "accuracy": 15 },
    "deviceMetadata": {
      "userAgent": "Mozilla/5.0...",
      "platform": "Win32",
      "timeZone": "Asia/Kolkata"
    }
  }
}
```

**Response:**

```json
{
  "success": true,
  "assessment": {
    "customerProfile": {
      "employmentType": "salaried",
      "estimatedIncome": 80000,
      "loanPurpose": "home renovation",
      "purposeCategory": "home",
      "consentGiven": true
    },
    "riskClassification": {
      "riskBand": "LOW",
      "riskScore": 85,
      "redFlags": [],
      "rationale": "Stable salaried income, clear purpose, explicit consent given."
    }
  },
  "policyResult": {
    "passed": true,
    "violations": []
  },
  "offers": [
    { "tenure": 12, "amount": 480000, "interestRate": "10.5", "emi": 40000, "processingFee": 9600 },
    { "tenure": 24, "amount": 860000, "interestRate": "10.5", "emi": 40000, "processingFee": 17200 },
    { "tenure": 36, "amount": 1225000, "interestRate": "10.5", "emi": 40000, "processingFee": 24500 }
  ]
}
```

### `GET /health`

Returns `{ "status": "ok" }`. Used for uptime checks.

### Socket.IO Events

| Event | Direction | Payload | Description |
|---|---|---|---|
| `join-room` | Client → Server | `{ sessionId, role }` | Join a signaling room |
| `user-joined` | Server → Client | `{ socketId, role }` | Peer joined notification |
| `offer` | Client ↔ Server | `{ sdp, sessionId }` | WebRTC SDP offer |
| `answer` | Client ↔ Server | `{ sdp, sessionId }` | WebRTC SDP answer |
| `ice-candidate` | Client ↔ Server | `{ candidate, sessionId }` | ICE candidate exchange |
| `transcript-update` | Client → Server | `{ text, isFinal, timestamp, sessionId }` | New transcript segment |
| `transcript-received` | Server → Client | `{ text, isFinal, timestamp, senderId }` | Relayed transcript |
| `kyc-signal` | Client → Server | `{ type, data, sessionId }` | KYC signal (age, geo, etc.) |
| `kyc-signal-update` | Server → Client | `{ type, data, senderId }` | Relayed KYC signal |

---

## 11. Known Limitations

- **Single STUN server** — Uses only `stun.l.google.com`. Behind symmetric NAT (corporate networks), the P2P connection may fail. A TURN server is needed for production.
- **Web Speech API** — Only supported in Chromium-based browsers. Firefox and Safari have partial or no support.
- **face-api.js models** — Loaded from a CDN (`jsdelivr`). First load takes 2–5 seconds. Models should be self-hosted in production.
- **Session ID is hardcoded** — `test-session-123` is used for demo. Production needs a backend-generated session ID with proper lifecycle management.
- **No authentication** — There is no user auth, JWT, or session token. Any client can call any API endpoint.
- **SQLite concurrency** — `better-sqlite3` is single-writer. Under concurrent load, writes will queue. PostgreSQL is needed for production scale.
- **Consent detection is keyword-based** — Simple string matching can produce false positives. An LLM-based consent classifier would be more robust.

---

## 12. What I'd Improve With More Time

- **TURN server** — Deploy a Coturn instance for reliable connectivity behind NAT/firewalls.
- **Self-hosted face-api models** — Serve models from `/public/models` to eliminate CDN dependency and cold-start latency.
- **Auth layer** — JWT-based auth with role-based access control (customer vs agent vs admin).
- **Real session management** — Backend-generated session IDs, session lifecycle (initiated → active → completed → archived).
- **LLM consent classifier** — Replace keyword matching with a Gemini call that understands context and nuance.
- **Fraud signal enrichment** — Cross-reference geolocation against IP geolocation, detect VPN/proxy usage, add liveness detection to prevent photo spoofing.
- **Agent dashboard** — A separate view showing all active sessions, historical assessments, and offer acceptance rates.
- **Offer acceptance flow** — Full e-sign integration (e.g., Digio, Leegality) triggered on offer acceptance.
- **PostgreSQL + Redis** — Replace SQLite with PostgreSQL for production writes and Redis for Socket.IO horizontal scaling.
- **Test coverage** — Unit tests for `policy.service.js` and `offer.service.js`, integration tests for the assessment route.

---

*Built for VeriLend Hackathon 2025*
