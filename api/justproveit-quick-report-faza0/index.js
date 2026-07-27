const { randomUUID } = require("node:crypto");

const RESEND_API_URL = "https://api.resend.com/emails";
const EXPECTED_CODES = ["MF01", "MF02", "CD07", "FC02", "FC05", "FC07"];
const VALID_FLAGS = new Set(["verde", "galben", "rosu"]);

module.exports = async function justProveItQuickReportFaza0(context, req) {
  try {
    const body = readJsonBody(req);
    const fullName = cleanText(body.fullName, 160);
    const email = cleanText(body.email, 200).toLowerCase();
    const phone = cleanText(body.phone, 80);
    const consentVerbalAt = cleanText(body.consentVerbalAt, 80);
    const results = normalizeResults(body.results);

    if (!fullName || !email || !phone) {
      context.res = json(400, { error: "Completeaza numele, emailul si telefonul clientului." });
      return;
    }

    if (!isValidEmail(email)) {
      context.res = json(400, { error: "Completeaza o adresa de email valida." });
      return;
    }

    if (!consentVerbalAt) {
      context.res = json(400, { error: "Consimtamantul verbal este obligatoriu." });
      return;
    }

    if (results.length !== EXPECTED_CODES.length || !hasExpectedCodes(results)) {
      context.res = json(400, { error: "Raportul trebuie sa contina toate cele 6 verificari completate." });
      return;
    }

    const resendApiKey = process.env.RESEND_API_KEY || "";
    const resendFromEmail = process.env.RESEND_FROM_EMAIL || "";

    if (!resendApiKey || !resendFromEmail) {
      context.res = json(500, {
        success: false,
        emailSent: false,
        emailError: "Resend email sender is not configured.",
        error: "Resend email sender is not configured.",
      });
      return;
    }

    const reportId = `qr_${new Date().toISOString().replace(/[-:.TZ]/g, "")}_${randomUUID().slice(0, 8)}`;
    const emailPayload = buildReportEmail({
      fullName,
      email,
      phone,
      consentVerbalAt,
      results,
      reportId,
      domain: cleanText(body.domain, 120),
      pageUrl: cleanText(body.pageUrl, 500),
      referrer: cleanText(body.referrer, 500),
    });

    await sendResendEmail(resendApiKey, {
      from: resendFromEmail,
      to: [email],
      subject: emailPayload.subject,
      html: emailPayload.html,
      text: emailPayload.text,
      reply_to: process.env.RESEND_REPLY_TO_EMAIL || resendFromEmail,
    });

    context.res = json(200, {
      success: true,
      reportId,
      emailSent: true,
      message: "Raportul a fost trimis pe email.",
    });
  } catch (error) {
    context.log.error(error);
    context.res = json(readStatus(error), { error: readErrorMessage(error) });
  }
};

function normalizeResults(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((result) => ({
      code: cleanText(result && result.code, 20),
      title: cleanText(result && result.title, 180),
      flag: cleanText(result && result.flag, 20),
      output: cleanText(result && result.output, 1200),
      rawAnswer: result && typeof result.rawAnswer === "object" ? result.rawAnswer : {},
    }))
    .filter((result) => result.code && result.title && VALID_FLAGS.has(result.flag) && result.output);
}

function hasExpectedCodes(results) {
  const codes = new Set(results.map((result) => result.code));
  return EXPECTED_CODES.every((code) => codes.has(code));
}

function buildReportEmail({ fullName, email, phone, consentVerbalAt, results, reportId, domain, pageUrl, referrer }) {
  const rowsHtml = results
    .map(
      (result) => `
        <tr>
          <td style="padding:12px;border:1px solid #d9e2ec;font-weight:700;vertical-align:top;">${escapeHtml(result.code)}</td>
          <td style="padding:12px;border:1px solid #d9e2ec;vertical-align:top;">
            <div style="font-weight:700;">${escapeHtml(result.title)}</div>
            <div style="margin-top:4px;text-transform:uppercase;font-size:12px;font-weight:700;color:${flagColor(result.flag)};">${escapeHtml(result.flag)}</div>
            <div style="margin-top:8px;line-height:1.55;">${escapeHtml(result.output)}</div>
          </td>
        </tr>`,
    )
    .join("");

  const rowsText = results
    .map((result) => `${result.code} - ${result.title}\nStatus: ${result.flag.toUpperCase()}\n${result.output}`)
    .join("\n\n");

  const html = `
    <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.55;">
      <p>Buna ziua ${escapeHtml(fullName)},</p>
      <p>Aveti mai jos raportul gratuit JustProveIt cu cele 6 verificari rapide pentru bani pierduti in UK.</p>
      <table style="border-collapse:collapse;width:100%;margin:20px 0;">
        <tbody>${rowsHtml}</tbody>
      </table>
      <p>Raportul este informativ si nu reprezinta sfat financiar reglementat.</p>
      <p>Daca doriti, putem face o radiografie financiara completa si verifica si alte zone unde romanii din UK pot pierde bani, inclusiv beneficii de stat si situatii fiscale.</p>
      <p>O zi buna,<br>JustProveIt</p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
      <p style="font-size:12px;color:#64748b;">
        Report ID: ${escapeHtml(reportId)}<br>
        Email: ${escapeHtml(email)} | Telefon: ${escapeHtml(phone)}<br>
        Consimtamant verbal: ${escapeHtml(consentVerbalAt)}<br>
        ${domain ? `Domeniu: ${escapeHtml(domain)}<br>` : ""}
        ${pageUrl ? `Pagina: ${escapeHtml(pageUrl)}<br>` : ""}
        ${referrer ? `Referrer: ${escapeHtml(referrer)}` : ""}
      </p>
    </div>`;

  const text = `Buna ziua ${fullName},

Aveti mai jos raportul gratuit JustProveIt cu cele 6 verificari rapide pentru bani pierduti in UK.

${rowsText}

Raportul este informativ si nu reprezinta sfat financiar reglementat.

Daca doriti, putem face o radiografie financiara completa si verifica si alte zone unde romanii din UK pot pierde bani, inclusiv beneficii de stat si situatii fiscale.

O zi buna,
JustProveIt

Report ID: ${reportId}
Email: ${email}
Telefon: ${phone}
Consimtamant verbal: ${consentVerbalAt}`;

  return {
    subject: "Raportul tau gratuit JustProveIt",
    html,
    text,
  };
}

async function sendResendEmail(apiKey, payload) {
  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(readResendError(body, response.statusText));
    error.status = response.status || 502;
    throw error;
  }

  return body;
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
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function flagColor(flag) {
  if (flag === "rosu") {
    return "#991b1b";
  }
  if (flag === "galben") {
    return "#92400e";
  }
  return "#065f46";
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function readResendError(payload, fallback) {
  if (payload && typeof payload === "object") {
    if (typeof payload.message === "string") {
      return payload.message;
    }

    if (payload.error && typeof payload.error.message === "string") {
      return payload.error.message;
    }
  }

  return fallback || "Emailul nu a putut fi trimis.";
}

function readErrorMessage(error) {
  return error instanceof Error ? error.message : "Raportul nu a putut fi trimis.";
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
