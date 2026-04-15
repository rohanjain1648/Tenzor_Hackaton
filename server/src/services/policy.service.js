const POLICY_CONFIG = {
  eligibility: {
    minAge: 21,
    maxAge: 60,
    minIncome: 15000, 
    blockedPurposes: ['gambling', 'speculative']
  },
  fraud: {
    maxAgeTolerance: 12, // match between declared vs CV estimated
    requireLocation: true
  }
};

function evaluatePolicy(assessment, application) {
  const violations = [];
  const { customerProfile, riskClassification } = assessment;
  
  // 1. Age Check (Declared or CV)
  const age = application.declaredAge || application.estimatedAge;
  if (age < POLICY_CONFIG.eligibility.minAge) violations.push('Age below minimum eligibility');
  if (age > POLICY_CONFIG.eligibility.maxAge) violations.push('Age exceeds maximum eligibility');

  // 2. Income Check
  if (customerProfile.estimatedIncome < POLICY_CONFIG.eligibility.minIncome) {
    violations.push('Income below minimum threshold');
  }

  // 3. Risk Band Check
  if (riskClassification.riskBand === 'VERY_HIGH') {
    violations.push('Risk band outside acceptable tolerance');
  }

  // 4. Consent Check
  if (!customerProfile.consentGiven) {
    violations.push('Verbal consent not recorded');
  }

  return {
    passed: violations.length === 0,
    violations
  };
}

module.exports = { evaluatePolicy, POLICY_CONFIG };
