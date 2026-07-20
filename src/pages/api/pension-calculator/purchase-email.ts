import type { NextApiRequest, NextApiResponse } from "next";
import pensionCalculatorPurchaseEmail from "../../../../api/pension-calculator-purchase-email";

type AzureFunctionResponse = {
  status?: number;
  headers?: Record<string, string>;
  body?: unknown;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("allow", "POST");
    res.status(405).json({ success: false, emailSent: false, error: "Method not allowed." });
    return;
  }

  const context: { res?: AzureFunctionResponse } = {};
  await pensionCalculatorPurchaseEmail(context, {
    body: req.body,
    headers: req.headers,
    method: req.method,
  });

  const functionResponse = context.res || {};
  const headers = functionResponse.headers || {};

  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  res.status(functionResponse.status || 500).json(functionResponse.body || {});
}
