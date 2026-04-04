import OpenAI from "openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface ScoringInput {
  invoiceId: string;
  debtorName: string;
  faceValue: number;
  dueDate: string;
  terms: string;
  jurisdiction: string;
  paymentHistory: string;
  supplierName: string;
}

interface ScoringResult {
  riskGrade: "A" | "B" | "C" | "D";
  discountBps: number;
  yieldBps: number;
  confidenceScore: number;
  reasoning: string;
}

const SYSTEM_PROMPT = `You are an institutional credit scoring agent operating inside a Flare Confidential Compute TEE (Trusted Execution Environment). You have access to confidential invoice metadata that must NEVER be included in your public attestation.

Your job:
1. Analyze the invoice metadata (debtor identity, payment history, jurisdiction, terms, face value, maturity)
2. Produce a structured risk assessment
3. Output a PUBLIC attestation (risk grade + discount rate) that contains NO private information
4. Output a PRIVATE reasoning document that stays inside the TEE

Grading scale:
- A: Excellent payment history, low-risk jurisdiction, short maturity
- B: Good payment history, moderate risk factors
- C: Mixed payment history or elevated jurisdiction risk
- D: Poor payment history, high risk, or compliance concerns

Discount rate calculation:
- Base rate: 1.5% (A), 3.0% (B), 5.5% (C), 9.0% (D)
- Maturity adjustment: +0.5% per 30 days beyond 30
- Jurisdiction adjustment: +0.5-2.0% for elevated-risk jurisdictions

You MUST respond with ONLY a valid JSON object in this exact format:
{
  "riskGrade": "A",
  "discountBps": 210,
  "confidenceScore": 94,
  "reasoning": "Full analysis text here..."
}

The discountBps is the discount in basis points (e.g., 210 = 2.10%).
The confidenceScore is 0-100.
The reasoning should reference the debtor and specifics but this stays private.`;

/**
 * Deterministic fallback scoring when OpenAI is unavailable.
 * Uses payment history keywords and tenure to approximate the AI model's grading.
 */
function fallbackScore(input: ScoringInput, tenureDays: number): ScoringResult {
  const history = input.paymentHistory.toLowerCase();

  let riskGrade: ScoringResult["riskGrade"] = "B";
  let baseDiscount = 300;
  let confidence = 80;

  if (history.includes("excellent")) {
    riskGrade = "A";
    baseDiscount = 150;
    confidence = 92;
  } else if (history.includes("good")) {
    riskGrade = "B";
    baseDiscount = 300;
    confidence = 85;
  } else if (history.includes("poor")) {
    riskGrade = "D";
    baseDiscount = 900;
    confidence = 65;
  }

  const maturityAdj = Math.max(0, Math.floor((tenureDays - 30) / 30)) * 50;
  const discountBps = baseDiscount + maturityAdj;
  const yieldBps = Math.round(
    (discountBps / 100 / (1 - discountBps / 10000)) * (365 / tenureDays) * 100
  );

  return {
    riskGrade,
    discountBps,
    yieldBps,
    confidenceScore: confidence,
    reasoning: `[Fallback] Scored based on payment history keywords and ${tenureDays}-day tenure.`,
  };
}

export async function scoreInvoice(input: ScoringInput): Promise<ScoringResult> {
  const dueDate = new Date(input.dueDate);
  const now = new Date();
  const tenureDays = Math.max(1, Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  const userPrompt = `Score this invoice:

- Invoice ID: ${input.invoiceId}
- Debtor: ${input.debtorName}
- Supplier: ${input.supplierName}
- Face Value: $${input.faceValue.toLocaleString()} USDC
- Due Date: ${input.dueDate}
- Tenure: ${tenureDays} days
- Terms: ${input.terms}
- Jurisdiction: ${input.jurisdiction}
- Payment History: ${input.paymentHistory}

Return ONLY the JSON object.`;

  try {
    const client = new OpenAI({ apiKey: OPENAI_API_KEY });
    const r = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1000,
      temperature: 0.3,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const content = r.choices[0].message.content;
    if (!content) {
      console.warn("Empty OpenAI response, using fallback scoring");
      return fallbackScore(input, tenureDays);
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn("Failed to parse AI scoring response, using fallback");
      return fallbackScore(input, tenureDays);
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const discountBps = parsed.discountBps;
    const yieldBps = Math.round(
      (discountBps / 100 / (1 - discountBps / 10000)) * (365 / tenureDays) * 100
    );

    return {
      riskGrade: parsed.riskGrade,
      discountBps: parsed.discountBps,
      yieldBps,
      confidenceScore: parsed.confidenceScore,
      reasoning: parsed.reasoning,
    };
  } catch (err) {
    console.warn("OpenAI scoring API error, using fallback:", err);
    return fallbackScore(input, tenureDays);
  }
}
