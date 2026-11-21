const { createSaleConsultationSetupSession } = require("../shared/saleConsultationStripe");

module.exports = async function saleConsultationCreateSetupSession(context, req) {
  await createSaleConsultationSetupSession(context, req);
};
