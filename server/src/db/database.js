const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'verilend.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

const schema = `
-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  customer_name TEXT,
  phone TEXT,
  email TEXT,
  campaign_source TEXT,
  status TEXT DEFAULT 'initiated', 
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME,
  duration_seconds INTEGER
);

-- Transcripts table
CREATE TABLE IF NOT EXISTS transcripts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,
  speaker TEXT,
  text TEXT,
  is_final BOOLEAN DEFAULT 1,
  confidence REAL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(session_id) REFERENCES sessions(id)
);

-- KYC Signals table
CREATE TABLE IF NOT EXISTS kyc_signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,
  signal_type TEXT,
  signal_data TEXT,
  confidence REAL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(session_id) REFERENCES sessions(id)
);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  declared_age INTEGER,
  estimated_age REAL,
  employment_type TEXT,
  employer TEXT,
  monthly_income INTEGER,
  loan_purpose TEXT,
  purpose_category TEXT,
  existing_emis INTEGER DEFAULT 0,
  consent_given BOOLEAN DEFAULT 0,
  consent_timestamp DATETIME,
  geo_latitude REAL,
  geo_longitude REAL,
  device_fingerprint TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(session_id) REFERENCES sessions(id)
);

-- Risk Assessments table
CREATE TABLE IF NOT EXISTS risk_assessments (
  id TEXT PRIMARY KEY,
  application_id TEXT,
  session_id TEXT,
  risk_band TEXT,
  risk_score INTEGER,
  llm_output TEXT,
  fraud_signals TEXT,
  policy_result TEXT,
  rationale TEXT,
  assessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(application_id) REFERENCES applications(id),
  FOREIGN KEY(session_id) REFERENCES sessions(id)
);

-- Offers table
CREATE TABLE IF NOT EXISTS offers (
  id TEXT PRIMARY KEY,
  application_id TEXT,
  session_id TEXT,
  amount INTEGER,
  tenure_months INTEGER,
  interest_rate REAL,
  emi INTEGER,
  total_payable INTEGER,
  total_interest INTEGER,
  processing_fee INTEGER,
  risk_band TEXT,
  status TEXT DEFAULT 'generated',
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(application_id) REFERENCES applications(id),
  FOREIGN KEY(session_id) REFERENCES sessions(id)
);

-- Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,
  event_type TEXT,
  event_data TEXT,
  actor TEXT,
  ip_address TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(session_id) REFERENCES sessions(id)
);
`;

db.exec(schema);

module.exports = db;
