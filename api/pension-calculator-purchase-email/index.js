const PURCHASE_EMAIL_SUBJECT = "Simulare pensionare internationala";
const PURCHASE_EMAIL_TEXT = `Buna ziua, 

Felicitari pentru ca doriti sa vedeti exact cand iesiti la pensie in Romania si in alte tari in care ati mai muncit. 

Aveti aici link-ul pentru serviciul nostru: https://www.proveitweb.co.uk/saleconsultation

Costul serviciului este de £50 astazi. Daca va puteti pensiona in urmatorii 2 ani, mai platiti £47 sub forma a doua rate, una luna urmatoare si una cealalta luna. Ratele sunt in valoare de £23.5 (prin urmare inca £47 in total). Dupa cum va spuneam, daca nu va puteti pensiona in urmatorii 2 ani nu mai aveti nimic de plata. 

Serviciul nostru costa in:
1 - Simulare pe cazul dvs. sa vedeti exact cand iesiti la pensie in Romania, si cand iesiti in fiecare din tarile in care ati mai muncit. 
2 - Va raspundem la orice intrebare in cadrul simularii.
3 - Va facem o programare cu dl. Adrian Defta pentru a va clarifica orice alte intrebari ati avea. 

Mai mult, in urmatoarele 30 de zile puteti intreba orice. 

O zi buna, 
Adrian Defta`;

module.exports = async function pensionCalculatorPurchaseEmail(context, req) {
  try {
    const body = readJsonBody(req);
    const email = cleanText(body.email, 180).toLowerCase();
    const fullName = cleanText(body.fullName || body.name, 140);
    const phone = cleanText(body.phone, 80);

    if (!email) {
      context.res = json(400, {
        success: false,
        emailSent: false,
        error: "Completeaza emailul.",
      });
      return;
    }

    if (!isValidEmail(email)) {
      context.res = json(400, {
        success: false,
        emailSent: false,
        error: "Email invalid.",
      });
      return;
    }

    const metadata = {
      tenantKey: cleanText(body.tenantKey, 80) || "justproveit",
      source: cleanText(body.source, 120) || "ro-pension-calculator-email-cumparare",
      fullName,
      email,
      phone,
      pageUrl: cleanText(body.pageUrl, 500),
      referrer: cleanText(body.referrer, 500),
      requestedAtUtc: new Date().toISOString(),
    };
    const html = plainTextToHtml(PURCHASE_EMAIL_TEXT);
    const result = await sendEmail({
      to: email,
      subject: PURCHASE_EMAIL_SUBJECT,
      text: PURCHASE_EMAIL_TEXT,
      html,
      metadata,
    });

    context.res = json(200, {
      success: true,
      emailSent: true,
      provider: result.provider,
      messageId: result.messageId || null,
    });
  } catch (error) {
    context.res = json(readStatus(error), {
      success: false,
      emailSent: false,
      error: readErrorMessage(error),
    });
  }
};

async function sendEmail(message) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    throw Object.assign(new Error("Resend email sender is not configured."), {
      status: 500,
    });
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL,
      to: [message.to],
      subject: message.subject,
      text: message.text,
      html: message.html,
      tags: [
        {
          name: "source",
          value: "ro-pension-calculator-email-cumparare",
        },
      ],
    }),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw Object.assign(
      new Error(readPayloadError(payload) || response.statusText || "Resend email request failed."),
      { status: response.status || 502 },
    );
  }

  return {
    provider: "resend",
    messageId: payload?.id || null,
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

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function plainTextToHtml(text) {
  return `<p>${escapeHtml(text).replace(/\n{2,}/g, "</p><p>").replace(/\n/g, "<br />")}</p>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
  return error instanceof Error ? error.message : "Emailul nu a putut fi trimis.";
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
