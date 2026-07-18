const STRIPE_API_BASE_URL = "https://api.stripe.com";
const SERVICE_KEY = "saleconsultation";
const SERVICE_NAME = "Simulare pensionare internationala";
const DISPLAY_PRICE_PENCE = 9700;
const DEFAULT_INITIAL_TOP_UP_PENCE = 2650;
const DEFAULT_MONTHLY_PRICE_PENCE = 2350;

async function createSaleConsultationSetupSession(context, req) {
  const stripeKey = getStripeSecretKey();

  if (!stripeKey) {
    context.res = json(500, { error: "Stripe secret key is not configured." });
    return;
  }

  try {
    const body = readJsonBody(req);
    const fullName = cleanText(body.fullName || body.name, 120);
    const email = cleanText(body.email, 180).toLowerCase();
    const phone = cleanText(body.phone, 80);

    if (!fullName || !email || !phone) {
      context.res = json(400, { error: "Numele, emailul si telefonul sunt obligatorii." });
      return;
    }

    const siteUrl = getSiteUrl(req);
    const capturedAtUtc = new Date().toISOString();
    const contactMetadata = buildMetadata({
      fullName,
      email,
      phone,
      sourcePage: `${siteUrl}/saleconsultation`,
      leadStatus: "checkout_started",
      capturedAtUtc,
    });
    const customer = await createCapturedCustomer(stripeKey, {
      fullName,
      email,
      phone,
      metadata: contactMetadata,
    });
    const metadata = buildMetadata({
      fullName,
      email,
      phone,
      sourcePage: `${siteUrl}/saleconsultation`,
      leadStatus: "checkout_session_created",
      stripeCustomerId: customer.id,
      capturedAtUtc,
    });

    const session = await stripePost(stripeKey, "/v1/checkout/sessions", {
      mode: "setup",
      currency: "gbp",
      customer: customer.id,
      payment_method_types: ["card"],
      locale: "ro",
      success_url: `${siteUrl}/saleconsultation?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/saleconsultation?checkout=cancelled`,
      metadata,
      setup_intent_data: { metadata },
    });

    context.res = json(200, {
      id: session.id,
      url: session.url,
    });
  } catch (error) {
    context.res = json(readStatus(error), { error: readErrorMessage(error) });
  }
}

async function createCapturedCustomer(stripeKey, options) {
  return stripePost(stripeKey, "/v1/customers", {
    name: options.fullName,
    email: options.email,
    phone: options.phone,
    metadata: options.metadata,
  });
}

async function activateSaleConsultationSchedule(context, req) {
  const stripeKey = getStripeSecretKey();

  if (!stripeKey) {
    context.res = json(500, { error: "Stripe secret key is not configured." });
    return;
  }

  try {
    const body = readJsonBody(req);
    const sessionId = cleanText(body.sessionId, 120);

    if (!sessionId || !sessionId.startsWith("cs_")) {
      context.res = json(400, { error: "Stripe Checkout session id is invalid." });
      return;
    }

    const session = await stripeGet(stripeKey, `/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
      expand: ["setup_intent"],
    });

    if (session.status !== "complete") {
      context.res = json(409, { error: "Stripe Checkout session is not complete yet." });
      return;
    }

    if (session.metadata && session.metadata.service && session.metadata.service !== SERVICE_KEY) {
      context.res = json(400, { error: "Stripe Checkout session is not for this service." });
      return;
    }

    const customerId = readStripeId(session.customer);
    const setupIntent = await getSetupIntent(stripeKey, session.setup_intent);
    const paymentMethodId = readStripeId(setupIntent.payment_method);

    if (!customerId || !paymentMethodId) {
      context.res = json(409, {
        error: "Stripe did not return a customer and payment method for this setup session.",
      });
      return;
    }

    await updateCustomerDefaultPaymentMethod(stripeKey, customerId, paymentMethodId, session);

    const prices = await getSchedulePrices(stripeKey, sessionId);
    const schedule = await createSubscriptionSchedule(stripeKey, {
      session,
      customerId,
      paymentMethodId,
      monthlyPriceId: prices.monthlyPriceId,
      setupFeePriceId: prices.setupFeePriceId,
    });
    const firstInvoice = await settleFirstInvoice(stripeKey, schedule.subscription, sessionId);

    context.res = json(200, {
      ok: true,
      checkoutSessionId: session.id,
      customerId,
      subscriptionScheduleId: schedule.id,
      subscriptionId: schedule.subscription || null,
      firstInvoiceId: firstInvoice ? firstInvoice.id : null,
      firstInvoiceStatus: firstInvoice ? firstInvoice.status : null,
    });
  } catch (error) {
    context.res = json(readStatus(error), { error: readErrorMessage(error) });
  }
}

async function getSetupIntent(stripeKey, setupIntent) {
  if (setupIntent && typeof setupIntent === "object") {
    return setupIntent;
  }

  const setupIntentId = readStripeId(setupIntent);

  if (!setupIntentId) {
    return {};
  }

  return stripeGet(stripeKey, `/v1/setup_intents/${encodeURIComponent(setupIntentId)}`);
}

async function updateCustomerDefaultPaymentMethod(stripeKey, customerId, paymentMethodId, session) {
  const metadata = session.metadata || {};
  const params = {
    invoice_settings: { default_payment_method: paymentMethodId },
    metadata: {
      saleconsultation_last_checkout_session: session.id,
      saleconsultation_service: SERVICE_KEY,
      saleconsultation_payment_status: "checkout_complete",
    },
  };

  if (metadata.email) {
    params.email = metadata.email;
  }

  if (metadata.fullName) {
    params.name = metadata.fullName;
  }

  if (metadata.phone) {
    params.phone = metadata.phone;
  }

  await stripePost(stripeKey, `/v1/customers/${encodeURIComponent(customerId)}`, params);
}

async function getSchedulePrices(stripeKey, sessionId) {
  const monthlyPriceId =
    process.env.STRIPE_SALECONSULTATION_MONTHLY_PRICE_ID ||
    process.env.SALECONSULTATION_MONTHLY_PRICE_ID ||
    "";
  const setupFeePriceId =
    process.env.STRIPE_SALECONSULTATION_SETUP_FEE_PRICE_ID ||
    process.env.SALECONSULTATION_SETUP_FEE_PRICE_ID ||
    "";

  if (monthlyPriceId && setupFeePriceId) {
    return { monthlyPriceId, setupFeePriceId };
  }

  const productName = process.env.SALECONSULTATION_PRODUCT_NAME || SERVICE_NAME;
  const monthlyAmount = readPositiveInteger(
    process.env.STRIPE_SALECONSULTATION_MONTHLY_AMOUNT_PENCE ||
      process.env.SALECONSULTATION_MONTHLY_AMOUNT_PENCE,
    DEFAULT_MONTHLY_PRICE_PENCE,
  );
  const setupFeeAmount = readPositiveInteger(
    process.env.STRIPE_SALECONSULTATION_SETUP_FEE_AMOUNT_PENCE ||
      process.env.SALECONSULTATION_SETUP_FEE_AMOUNT_PENCE,
    DEFAULT_INITIAL_TOP_UP_PENCE,
  );

  const createdMonthlyPriceId =
    monthlyPriceId ||
    (
      await stripePost(
        stripeKey,
        "/v1/prices",
        {
          currency: "gbp",
          unit_amount: monthlyAmount,
          recurring: { interval: "month" },
          product_data: { name: productName },
          metadata: {
            service: SERVICE_KEY,
            component: "monthly_recurring",
            display_price_pence: String(DISPLAY_PRICE_PENCE),
          },
        },
        `saleconsultation-monthly-price-${sessionId}`,
      )
    ).id;

  const createdSetupFeePriceId =
    setupFeePriceId ||
    (
      await stripePost(
        stripeKey,
        "/v1/prices",
        {
          currency: "gbp",
          unit_amount: setupFeeAmount,
          product_data: { name: `${productName} - initial top-up` },
          metadata: {
            service: SERVICE_KEY,
            component: "initial_top_up",
            display_price_pence: String(DISPLAY_PRICE_PENCE),
          },
        },
        `saleconsultation-setup-fee-price-${sessionId}`,
      )
    ).id;

  return {
    monthlyPriceId: createdMonthlyPriceId,
    setupFeePriceId: createdSetupFeePriceId,
  };
}

async function createSubscriptionSchedule(stripeKey, options) {
  const metadata = buildMetadata({
    checkoutSessionId: options.session.id,
    customerEmail: options.session.customer_details && options.session.customer_details.email,
    source: SERVICE_KEY,
  });

  return stripePost(
    stripeKey,
    "/v1/subscription_schedules",
    {
      customer: options.customerId,
      start_date: "now",
      end_behavior: "cancel",
      default_settings: {
        collection_method: "charge_automatically",
        default_payment_method: options.paymentMethodId,
        description: SERVICE_NAME,
      },
      metadata,
      phases: [
        {
          duration: { interval: "month", interval_count: 1 },
          collection_method: "charge_automatically",
          default_payment_method: options.paymentMethodId,
          items: [{ price: options.monthlyPriceId, quantity: 1 }],
          add_invoice_items: [{ price: options.setupFeePriceId, quantity: 1 }],
          metadata: {
            service: SERVICE_KEY,
            phase: "initial_payment",
          },
        },
        {
          duration: { interval: "month", interval_count: 2 },
          collection_method: "charge_automatically",
          default_payment_method: options.paymentMethodId,
          items: [{ price: options.monthlyPriceId, quantity: 1 }],
          metadata: {
            service: SERVICE_KEY,
            phase: "remaining_payments",
          },
        },
      ],
    },
    `saleconsultation-schedule-${options.session.id}`,
  );
}

async function settleFirstInvoice(stripeKey, subscriptionId, sessionId) {
  if (!subscriptionId) {
    return null;
  }

  const invoices = await stripeGet(stripeKey, "/v1/invoices", {
    subscription: subscriptionId,
    limit: 3,
  });
  const invoice =
    Array.isArray(invoices.data) &&
    (invoices.data.find((item) => item.status === "draft") ||
      invoices.data.find((item) => item.status === "open") ||
      invoices.data.find((item) => item.status === "paid"));

  if (!invoice) {
    return null;
  }

  if (invoice.status === "paid" || Number(invoice.amount_remaining || 0) <= 0) {
    return invoice;
  }

  const finalizedInvoice =
    invoice.status === "draft"
      ? await stripePost(
          stripeKey,
          `/v1/invoices/${encodeURIComponent(invoice.id)}/finalize`,
          {},
          `saleconsultation-finalize-first-invoice-${sessionId}`,
        )
      : invoice;

  if (finalizedInvoice.status === "paid" || Number(finalizedInvoice.amount_remaining || 0) <= 0) {
    return finalizedInvoice;
  }

  return stripePost(
    stripeKey,
    `/v1/invoices/${encodeURIComponent(finalizedInvoice.id)}/pay`,
    {},
    `saleconsultation-pay-first-invoice-${sessionId}`,
  );
}

async function stripeGet(stripeKey, path, params) {
  const query = params ? encodeForm(params).toString() : "";
  const suffix = query ? `${path.includes("?") ? "&" : "?"}${query}` : "";
  return stripeRequest(stripeKey, "GET", `${path}${suffix}`);
}

async function stripePost(stripeKey, path, params, idempotencyKey) {
  return stripeRequest(stripeKey, "POST", path, params || {}, idempotencyKey);
}

async function stripeRequest(stripeKey, method, path, params, idempotencyKey) {
  const headers = {
    authorization: `Bearer ${stripeKey}`,
  };
  const options = { method, headers };

  if (idempotencyKey) {
    headers["idempotency-key"] = idempotencyKey;
  }

  if (method !== "GET") {
    headers["content-type"] = "application/x-www-form-urlencoded";
    options.body = encodeForm(params || {}).toString();
  }

  const response = await fetch(`${STRIPE_API_BASE_URL}${path}`, options);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(readStripeError(payload, "Stripe request failed."));
    error.status = response.status;
    throw error;
  }

  return payload;
}

function encodeForm(params) {
  const searchParams = new URLSearchParams();
  appendFormValue(searchParams, "", params);
  return searchParams;
}

function appendFormValue(searchParams, key, value) {
  if (value === undefined || value === null || value === "") {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      appendFormValue(searchParams, `${key}[${index}]`, item);
    });
    return;
  }

  if (typeof value === "object") {
    for (const [childKey, childValue] of Object.entries(value)) {
      appendFormValue(searchParams, key ? `${key}[${childKey}]` : childKey, childValue);
    }
    return;
  }

  searchParams.append(key, String(value));
}

function buildMetadata(values) {
  return {
    service: SERVICE_KEY,
    display_price_pence: String(DISPLAY_PRICE_PENCE),
    requested_schedule: "50_now_23_50_month_2_23_50_month_3_cancel",
    ...Object.fromEntries(
      Object.entries(values)
        .map(([key, value]) => [key, cleanText(value, 450)])
        .filter(([, value]) => value),
    ),
  };
}

function readJsonBody(req) {
  if (!req.body) {
    return {};
  }

  if (typeof req.body === "object") {
    return req.body;
  }

  try {
    return JSON.parse(req.body);
  } catch {
    return {};
  }
}

function getStripeSecretKey() {
  return process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET || "";
}

function getSiteUrl(req) {
  const configured = process.env.SALECONSULTATION_SITE_URL || process.env.JUSTPROVEIT_SITE_URL || "";

  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  const forwardedHost = req.headers["x-forwarded-host"] || req.headers["X-Forwarded-Host"];
  const host = forwardedHost || req.headers.host || req.headers.Host || "www.justproveit.co.uk";
  const forwardedProto = req.headers["x-forwarded-proto"] || req.headers["X-Forwarded-Proto"] || "https";

  return `${forwardedProto}://${host}`.replace(/\/+$/, "");
}

function readStripeId(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object" && typeof value.id === "string") {
    return value.id;
  }

  return "";
}

function cleanText(value, maxLength) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function readPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function readStripeError(payload, fallback) {
  if (payload && typeof payload === "object") {
    if (payload.error && typeof payload.error.message === "string") {
      return payload.error.message;
    }

    if (typeof payload.message === "string") {
      return payload.message;
    }
  }

  return fallback;
}

function readErrorMessage(error) {
  return error instanceof Error ? error.message : "Unexpected payment error.";
}

function readStatus(error) {
  return Number.isInteger(error && error.status) ? error.status : 500;
}

function json(status, body) {
  return {
    status,
    headers: {
      "content-type": "application/json",
    },
    body,
  };
}

module.exports = {
  activateSaleConsultationSchedule,
  createSaleConsultationSetupSession,
};
