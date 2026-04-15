const BASE_RATE = 10.5; // Base annual percentage rate

function calculateOffers(assessment, application) {
  const { customerProfile, riskClassification } = assessment;
  const { riskBand } = riskClassification;
  const { purposeCategory, estimatedIncome } = customerProfile;

  // 1. Calculate Risk Premium
  const riskPremiums = {
    'LOW': 0,
    'MEDIUM': 2.5,
    'HIGH': 5.5,
    'VERY_HIGH': 15.0
  };
  const rate = BASE_RATE + (riskPremiums[riskBand] || 0);

  // 2. Capacity Calculation (Max 50% FOIR)
  const maxEMI = estimatedIncome * 0.5;
  
  // 3. Generate tenure options: 12, 24, 36 months
  const tenures = [12, 24, 36];
  
  const offers = tenures.map(months => {
    const monthlyRate = (rate / 100) / 12;
    // P = EMI * (1 - (1+r)^-n) / r
    const maxAmount = maxEMI * (1 - Math.pow(1 + monthlyRate, -months)) / monthlyRate;
    
    // Round to nearest 5000
    const roundedAmount = Math.floor(maxAmount / 5000) * 5000;

    return {
      tenure: months,
      amount: roundedAmount,
      interestRate: rate.toFixed(1),
      emi: Math.round(maxEMI),
      processingFee: Math.round(roundedAmount * 0.02)
    };
  });

  return offers;
}

module.exports = { calculateOffers };
