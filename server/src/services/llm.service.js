const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const ASSESSMENT_SCHEMA = {
  description: "Loan risk assessment based on conversation and KYC data",
  type: "object",
  properties: {
    customerProfile: {
      type: "object",
      properties: {
        employmentType: { type: "string", enum: ["salaried", "self_employed", "business", "freelancer", "retired", "unknown"] },
        estimatedIncome: { type: "number" },
        incomeConfidence: { type: "number" },
        loanPurpose: { type: "string" },
        purposeCategory: { type: "string", enum: ["home", "vehicle", "education", "personal", "business", "medical", "other"] },
        consentGiven: { type: "boolean" }
      },
      required: ["employmentType", "estimatedIncome", "loanPurpose", "purposeCategory", "consentGiven"]
    },
    riskClassification: {
      type: "object",
      properties: {
        riskBand: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "VERY_HIGH"] },
        riskScore: { type: "number" },
        redFlags: { type: "array", items: { type: "string" } },
        rationale: { type: "string" }
      },
      required: ["riskBand", "riskScore", "rationale"]
    }
  },
  required: ["customerProfile", "riskClassification"]
};

async function generateRiskAssessment(sessionData) {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      // Note: responseSchema is supported in newer SDK versions, otherwise we prompt for JSON
    }
  });

  const prompt = `
    You are an expert financial underwriting analyst. Analyzed the provided session data which includes:
    1. Full transcript of the onboarding video call.
    2. Computer vision estimated age.
    3. Geolocation and device signals.

    SESSION DATA:
    ${JSON.stringify(sessionData, null, 2)}

    RULES:
    - Extract employment, income, and purpose from the transcript.
    - Validate consent was explicitly given.
    - Assign a riskScore (0-100, 100 is best/safest).
    - Map riskScore to bands: 80-100 (LOW), 50-79 (MEDIUM), 30-49 (HIGH), 0-29 (VERY_HIGH).
    - Flag any inconsistencies (e.g., claimed age vs estimated age mismatch).

    Output the assessment in valid JSON matching this schema:
    ${JSON.stringify(ASSESSMENT_SCHEMA, null, 2)}
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
  } catch (err) {
    console.error('LLM Service Error:', err);
    throw err;
  }
}

module.exports = { generateRiskAssessment };
