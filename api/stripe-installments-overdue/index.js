const { handleProxy } = require("../shared/stripeInstallmentsProxy");

module.exports = async function stripeInstallmentsOverdue(context, req) {
  await handleProxy(context, req, {
    endpointEnvName: "AZURE_STRIPE_OVERDUE_PAYMENTS_URL",
    allowedQueryKeys: ["accountName", "daysLate", "email", "limit", "status"],
  });
};
