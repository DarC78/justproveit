const { handleProxy } = require("../shared/stripeInstallmentsProxy");

module.exports = async function stripeInstallmentsOverdueCustomers(context, req) {
  await handleProxy(context, req, {
    endpointEnvName: "AZURE_STRIPE_OVERDUE_CUSTOMERS_URL",
    allowedQueryKeys: ["accountName", "daysLate", "email", "limit"],
  });
};
