const express = require('express');
const router = express.Router();
const { generateRiskAssessment } = require('../services/llm.service');
const { evaluatePolicy } = require('../services/policy.service');
const { calculateOffers } = require('../services/offer.service');
const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

router.post('/assess', async (req, res) => {
  const { sessionId, transcript, kycData } = req.body;

  try {
    // 1. Generate LLM Analysis
    const sessionData = {
      transcript: transcript || [],
      estimatedAge: kycData.estimatedAge,
      location: kycData.location,
      device: kycData.deviceMetadata
    };

    const assessment = await generateRiskAssessment(sessionData);
    
    // 2. Evaluate Policy
    const policyResult = evaluatePolicy(assessment, kycData);

    // 3. Generate Offers if policy passed
    let offers = [];
    if (policyResult.passed) {
      offers = calculateOffers(assessment, kycData);
    }

    // 4. Persistence (Simplified)
    const applicationId = uuidv4();
    const assessmentId = uuidv4();

    // Store in DB
    const insertApp = db.prepare(`
      INSERT INTO applications (id, session_id, estimated_age, employment_type, monthly_income, loan_purpose, purpose_category, consent_given, geo_latitude, geo_longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertApp.run(
      applicationId, 
      sessionId, 
      kycData.estimatedAge || 0,
      assessment.customerProfile.employmentType,
      assessment.customerProfile.estimatedIncome,
      assessment.customerProfile.loanPurpose,
      assessment.customerProfile.purposeCategory,
      assessment.customerProfile.consentGiven ? 1 : 0,
      kycData.location?.lat || 0,
      kycData.location?.lng || 0
    );

    const insertRisk = db.prepare(`
      INSERT INTO risk_assessments (id, application_id, session_id, risk_band, risk_score, llm_output, policy_result, rationale)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertRisk.run(
      assessmentId,
      applicationId,
      sessionId,
      assessment.riskClassification.riskBand,
      assessment.riskClassification.riskScore,
      JSON.stringify(assessment),
      JSON.stringify(policyResult),
      assessment.riskClassification.rationale
    );

    res.json({
      success: true,
      assessment,
      policyResult,
      offers
    });

  } catch (err) {
    console.error('Assessment Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
