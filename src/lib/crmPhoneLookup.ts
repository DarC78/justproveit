type Query = Record<string, string | string[] | undefined>;

export function crmPhoneLookup(query: Query): string {
  const value = (key: string) => {
    const raw = query[key];
    return String(Array.isArray(raw) ? raw[0] || "" : raw || "").trim();
  };
  const phone = value("phone") || value("phoneNumber") || value("telefon");
  const dnis = value("phoneDNIS");
  if (!phone || !dnis) return phone || dnis;

  const isOurNumber = (candidate: string) => {
    const digits = candidate.replace(/\D/g, "");
    return ["7447707829", "07447707829", "447447707829", "00447447707829"].includes(digits);
  };
  return [phone, dnis].find(candidate => !isOurNumber(candidate)) || "";
}
