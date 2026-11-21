const { activateSaleConsultationSchedule } = require("../shared/saleConsultationStripe");

module.exports = async function saleConsultationActivateSchedule(context, req) {
  await activateSaleConsultationSchedule(context, req);
};
