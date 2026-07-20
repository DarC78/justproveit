const PURCHASE_SMS_TEXT = `Felicitari pentru ca doriti sa vedeti exact cand iesiti la pensie in Romania si in alte tari in care ati mai muncit. 

Aveti aici link-ul pentru serviciul nostru: https://www.proveitweb.co.uk/saleconsultation

Costul serviciului este de £50 astazi. Daca va puteti pensiona in urmatorii 2 ani, mai platiti £47 sub forma a doua rate, una luna urmatoare si una cealalta luna. Ratele sunt in valoare de £23.5 (prin urmare inca £47 in total). Dupa cum va spuneam, daca nu va puteti pensiona in urmatorii 2 ani nu mai aveti nimic de plata. 

Serviciul nostru costa in:
1 - Simulare pe cazul dvs. sa vedeti exact cand iesiti la pensie in Romania, si cand iesiti in fiecare din tarile in care ati mai muncit. 
2 - Va raspundem la orice intrebare in cadrul simularii.
3 - Va facem o programare cu dl. Adrian Defta pentru a va clarifica orice alte intrebari ati avea. 

Mai mult, in urmatoarele 30 de zile puteti intreba orice.`;

module.exports = async function pensionCalculatorPurchaseSms(context, req) {
  try {
    const body = readJsonBody(req);
    const phone = cleanPhone(body.phone);
    const fullName = cleanText(body.fullName || body.name, 140);
    const email = cleanText(body.email, 180).toLowerCase();

    if (!phone) {
      context.res = json(400, {
        success: false,
        smsSent: false,
        error: "Completeaza telefonul.",
      });
      return;
    }

    if (!isValidPhone(phone)) {
      context.res = json(400, {
        success: false,
        smsSent: false,
        error: "Telefon invalid.",
      });
      return;
    }

    const metadata = {
      tenantKey: cleanText(body.tenantKey, 80) || "justproveit",
      source: cleanText(body.source, 120) || "ro-pension-calculator-sms-cumparare",
      fullName,
      email,
      phoneLast6: phone.replace(/\D/g, "").slice(-6),
      pageUrl: cleanText(body.pageUrl, 500),
      referrer: cleanText(body.referrer, 500),
      requestedAtUtc: new Date().toISOString(),
    };
    const result = await sendSms({
      to: phone,
      message: PURCHASE_SMS_TEXT,
      metadata,
    });

    context.res = json(200, {
      success: true,
      smsSent: true,
      provider: result.provider,
      messageId: result.messageId || null,
    });
  } catch (error) {
    context.res = json(readStatus(error), {
      success: false,
      smsSent: false,
      error: readErrorMessage(error),
    });
  }
};

async function sendSms(message) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_FROM_NUMBER) {
    throw Object.assign(new Error("Twilio SMS sender is not configured."), {
      status: 500,
    });
  }

  const params = new URLSearchParams({
    To: message.to,
    From: process.env.TWILIO_FROM_NUMBER,
    Body: message.message,
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(process.env.TWILIO_ACCOUNT_SID)}/Messages.json`,
    {
      method: "POST",
      headers: {
        authorization: `Basic ${Buffer.from(
          `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`,
        ).toString("base64")}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    },
  );
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw Object.assign(
      new Error(readPayloadError(payload) || response.statusText || "Twilio SMS request failed."),
      { status: response.status || 502 },
    );
  }

  return {
    provider: "twilio",
    messageId: payload?.sid || null,
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

function cleanText(value, maxLength) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanPhone(value) {
  return String(value || "")
    .replace(/[^\d+]/g, "")
    .replace(/(?!^)\+/g, "")
    .slice(0, 30);
}

function isValidPhone(phone) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

function readPayloadError(payload) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  if (typeof payload.error === "string") {
    return payload.error;
  }

  if (payload.error && typeof payload.error === "object" && typeof payload.error.message === "string") {
    return payload.error.message;
  }

  if (typeof payload.message === "string") {
    return payload.message;
  }

  if (Array.isArray(payload.errors) && payload.errors[0]?.message) {
    return payload.errors[0].message;
  }

  return "";
}

function readErrorMessage(error) {
  return error instanceof Error ? error.message : "SMS-ul nu a putut fi trimis.";
}

function readStatus(error) {
  if (error && typeof error === "object" && "status" in error) {
    const status = Number(error.status);
    if (status >= 400 && status < 600) {
      return status;
    }
  }

  return 500;
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
