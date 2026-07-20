import type { NextApiRequest, NextApiResponse } from "next";
import pensionCalculatorPurchaseSms from "../../../../api/pension-calculator-purchase-sms";

type AzureFunctionResponse = {
  status?: number;
  headers?: Record<string, string>;
  body?: unknown;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("allow", "POST");
    res.status(405).json({ success: false, smsSent: false, error: "Method not allowed." });
    return;
  }

  const context: { res?: AzureFunctionResponse } = {};
  await pensionCalculatorPurchaseSms(context, {
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
