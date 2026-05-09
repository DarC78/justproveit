import { handleStripeInstallmentsProxy } from "@/lib/server/stripeInstallmentsProxy";
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return handleStripeInstallmentsProxy(req, res, {
    endpointEnvName: "AZURE_STRIPE_OVERDUE_PAYMENTS_URL",
    allowedQueryKeys: ["accountName", "daysLate", "email", "limit", "status"],
  });
}
