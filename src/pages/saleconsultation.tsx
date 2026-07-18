import Head from "next/head";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

const SITE_URL = "https://www.justproveit.co.uk";
const PAGE_URL = `${SITE_URL}/saleconsultation`;
const SERVICE_NAME = "Simulare Varsta Pensie Internationala";
const DISPLAY_PRICE = "£97";
const INITIAL_PAYMENT = "£50";
const MONTHLY_PAYMENT = "£23.50";
const CONTACT_STORAGE_KEY = "jpi-saleconsultation-contact";

type PaymentStatus = "idle" | "loading" | "success" | "error";
type SaleConsultationContact = {
  fullName: string;
  email: string;
  phone: string;
};

export default function SaleConsultationPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [contactLoaded, setContactLoaded] = useState(false);

  useEffect(() => {
    const storedContact = readStoredContact();
    if (storedContact.fullName) {
      setFullName(storedContact.fullName);
    }
    if (storedContact.email) {
      setEmail(storedContact.email);
    }
    if (storedContact.phone) {
      setPhone(storedContact.phone);
    }
    setContactLoaded(true);

    const params = new URLSearchParams(window.location.search);
    const checkoutStatus = params.get("checkout");
    const sessionId = params.get("session_id");

    if (checkoutStatus === "cancelled") {
      setPaymentStatus("error");
      setPaymentMessage("Plata a fost anulată. Poți încerca din nou oricând.");
      return;
    }

    if (checkoutStatus !== "success" || !sessionId) {
      return;
    }

    let cancelled = false;

    async function activateSchedule() {
      setPaymentStatus("loading");
      setPaymentMessage("Confirmăm plata și activăm planul de plată.");

      try {
        const response = await fetch("/api/saleconsultation/activate-schedule", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(readApiError(payload, "Nu am putut activa plata."));
        }

        if (!cancelled) {
          setPaymentStatus("success");
          setPaymentMessage("Mulțumim. Plata a fost confirmată și consultația a fost activată.");
          window.history.replaceState({}, "", "/saleconsultation");
        }
      } catch (error) {
        if (!cancelled) {
          setPaymentStatus("error");
          setPaymentMessage(error instanceof Error ? error.message : "Nu am putut activa plata.");
        }
      }
    }

    activateSchedule();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!contactLoaded) {
      return;
    }

    saveStoredContact({ fullName, email, phone });
  }, [contactLoaded, fullName, email, phone]);

  async function handleCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const contact = {
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
    };

    saveStoredContact(contact);

    if (!acceptedTerms) {
      setPaymentStatus("error");
      setPaymentMessage("Trebuie să acceptați termenii și condițiile înainte de plată.");
      return;
    }

    setPaymentStatus("loading");
    setPaymentMessage("Pregătim plata securizată prin Stripe.");

    try {
      const response = await fetch("/api/saleconsultation/create-setup-session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(contact),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.url) {
        throw new Error(readApiError(payload, "Nu am putut porni plata securizată."));
      }

      window.location.assign(payload.url);
    } catch (error) {
      setPaymentStatus("error");
      setPaymentMessage(error instanceof Error ? error.message : "Nu am putut porni plata securizată.");
    }
  }

  return (
    <>
      <Head>
        <title>Simulare pensionare internațională | JustProveIt</title>
        <meta
          name="description"
          content="Consultație telefonică în limba română pentru românii care au muncit în UK, România sau alte țări și vor să înțeleagă când se pot pensiona."
        />
        <link rel="canonical" href={PAGE_URL} />
        <meta httpEquiv="content-language" content="ro-GB" />
        <meta name="robots" content="index,follow,max-image-preview:large" />
      </Head>

      <div className="min-h-screen bg-white text-slate-950">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-lg font-extrabold tracking-normal">
              Just<span className="text-emerald-700">ProveIt</span>
            </Link>
          </div>
        </header>

        <main>
          <section className="relative min-h-[640px] overflow-hidden bg-slate-950 text-white">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-cover bg-center opacity-55"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1800&q=80')",
              }}
            />
            <div className="absolute inset-0 bg-slate-950/50" />
            <div className="relative mx-auto grid min-h-[640px] max-w-6xl items-center gap-8 px-4 py-12 lg:grid-cols-[minmax(0,1fr)_380px]">
              <div className="max-w-3xl">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-200">
                  Află când poți accesa pensia internațională
                </p>
                <h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-normal md:text-6xl">
                  Simulare pensionare internațională
                </h1>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-100">
                  Ai muncit în două sau mai multe țări? Află când poți ieși la pensie în fiecare țară și exact
                  procedura de urmat în fiecare țară! Nu fă greșeli care te pot costa pensia ta!
                </p>
                <div className="mt-7 grid gap-3 text-sm font-bold sm:grid-cols-3">
                  <span className="border-l-4 border-emerald-300 bg-white/10 px-4 py-3 backdrop-blur">
                    Consultație telefonică în română
                  </span>
                  <span className="border-l-4 border-sky-300 bg-white/10 px-4 py-3 backdrop-blur">
                    Raport personalizat în cazul tău pe email
                  </span>
                  <span className="border-l-4 border-amber-300 bg-white/10 px-4 py-3 backdrop-blur">
                    Fără date bancare sau parole
                  </span>
                </div>
              </div>

              <form
                id="checkout"
                onSubmit={handleCheckout}
                className="rounded-lg border border-white/30 bg-white p-5 text-slate-950 shadow-xl"
              >
                <p className="inline-flex rounded-md bg-slate-950 px-3 py-2 text-sm font-bold text-white">
                  Plată securizată prin Stripe
                </p>
                <p className="mt-3 text-sm font-extrabold text-slate-950">{SERVICE_NAME}</p>
                <p className="mt-1 text-sm font-bold text-emerald-700">Pay now {INITIAL_PAYMENT}</p>
                <button
                  type="submit"
                  disabled={paymentStatus === "loading"}
                  className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-md bg-emerald-700 px-5 text-sm font-extrabold uppercase tracking-normal text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {paymentStatus === "loading" ? "Se pregătește plata..." : `Pay now ${INITIAL_PAYMENT}`}
                </button>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Prima plată este {INITIAL_PAYMENT}. Doar dacă vă puteți pensiona mai devreme de doi ani, încă două
                  plăți lunare de {MONTHLY_PAYMENT}! Dacă nu, nu mai plătiți nimic!
                </p>

                <label className="mt-4 block">
                  <span className="text-sm font-bold">Nume complet</span>
                  <input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    autoComplete="name"
                    required
                    className="mt-1 h-11 w-full rounded-md border border-slate-300 px-3 text-sm shadow-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
                <label className="mt-3 block">
                  <span className="text-sm font-bold">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    required
                    className="mt-1 h-11 w-full rounded-md border border-slate-300 px-3 text-sm shadow-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
                <label className="mt-3 block">
                  <span className="text-sm font-bold">Telefon</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    autoComplete="tel"
                    required
                    className="mt-1 h-11 w-full rounded-md border border-slate-300 px-3 text-sm shadow-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </label>

                <label className="mt-4 flex gap-3 text-sm leading-6 text-slate-700">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(event) => setAcceptedTerms(event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
                  />
                  <span>
                    Am citit și sunt de acord cu{" "}
                    <a
                      href="https://www.proveitweb.co.uk/termsandconditions"
                      className="font-bold text-emerald-700 underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      termenii și condițiile
                    </a>
                    .
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={paymentStatus === "loading"}
                  className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-md bg-emerald-700 px-5 text-sm font-extrabold uppercase tracking-normal text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {paymentStatus === "loading" ? "Se pregătește plata..." : `Pay now ${INITIAL_PAYMENT}`}
                </button>

                {paymentMessage ? (
                  <p
                    aria-live="polite"
                    className={`mt-3 text-sm font-bold ${
                      paymentStatus === "success" ? "text-emerald-700" : paymentStatus === "error" ? "text-red-700" : "text-slate-700"
                    }`}
                  >
                    {paymentMessage}
                  </p>
                ) : null}
              </form>
            </div>
          </section>

          <section className="border-b border-slate-200 bg-emerald-50">
            <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 md:grid-cols-3">
              <Metric title="Linie dedicată" value="în limba română" />
              <Metric title="5.000+" value="români ajutați" />
              <Metric title="Apel" value="30 min - 2 ore" />
            </div>
          </section>

          <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.55fr)]">
            <div>
              <SectionTitle eyebrow="Ce facem pentru tine" title="Primești claritate înainte să iei decizii despre pensie" />
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <Feature title="Afli scenariile de pensionare">
                  Discutăm anii lucrați în fiecare țară și îți explicăm când te-ai putea pensiona în fiecare sistem.
                </Feature>
                <Feature title="Analizăm opțiunile tale">
                  Verificăm ce poate însemna pensionarea anticipată, pensionarea treptată și pensia din mai multe state.
                </Feature>
                <Feature title="Răspundem la întrebări">
                  Ai o consultație telefonică fără limită strictă de timp, ca să poți întreba tot ce contează. Și încă
                  1-2 luni după îți răspundem la orice întrebare.
                </Feature>
                <Feature title="Nu cerem date sensibile">
                  Nu avem nevoie de NINO, pașaport, cont bancar sau parole. Tu controlezi toate datele personale.
                </Feature>
              </div>
            </div>

            <aside className="rounded-lg border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-2xl font-extrabold tracking-normal">Cât costă?</h2>
              <p className="mt-3 text-4xl font-extrabold text-emerald-700">{DISPLAY_PRICE}</p>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                Prima plată este {INITIAL_PAYMENT}. Doar dacă vă puteți pensiona mai devreme de doi ani, încă două
                plăți lunare de {MONTHLY_PAYMENT}. Dacă nu, nu mai plătiți nimic.
              </p>
              <p className="mt-4 rounded-md border border-emerald-200 bg-white p-4 text-sm font-bold leading-7 text-emerald-700">
                Garanție: dacă nu vă puteți pensiona în următorii 2 ani, plătiți doar {INITIAL_PAYMENT}.
              </p>
              <a
                href="#checkout"
                className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-extrabold text-white hover:bg-emerald-800"
              >
                Mergi la plată
              </a>
            </aside>
          </section>

          <section className="bg-slate-950 text-white">
            <div className="mx-auto max-w-6xl px-4 py-12">
              <SectionTitle eyebrow="De ce contează" title="Mulți români pierd ani de contribuții fără să știe" inverted />
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {[
                  ["4,2 ani", "În medie, românii care au muncit afară pot pierde ani de contribuții neclarificate."],
                  ["2+ pensii", "Cei care au muncit în mai multe țări pot avea drepturi în sisteme diferite."],
                  [
                    "Fără drumuri",
                    "Consultația se face telefonic, fără birouri, cozi sau deplasări inutile. Mai mult, afli cum să îți depui dosarul de pensie fără să te deplasezi în România sau în altă țară.",
                  ],
                ].map(([title, text]) => (
                  <div key={title} className="rounded-lg border border-white/15 bg-white/10 p-5">
                    <p className="text-3xl font-extrabold text-emerald-200">{title}</p>
                    <p className="mt-3 text-sm leading-7 text-slate-100">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-4 py-12">
            <SectionTitle eyebrow="Asistență continuă" title="Un apel telefonic în care analizăm situația ta" />
            <div className="mt-5 max-w-3xl space-y-4 text-base leading-8 text-slate-700">
              <p>
                În cadrul consultației îți realizăm o simulare personalizată de pensionare și îți explicăm ce informații
                trebuie să verifici pentru fiecare țară în care ai muncit.
              </p>
              <p>
                Afli când te poți pensiona, ce pensie ai putea primi și ce opțiuni ai la dispoziție, inclusiv
                pensionarea anticipată acolo unde este posibil.
              </p>
              <p>
                Pe lângă simularea completă, îți răspundem la întrebări în timpul apelului, astfel încât să ai claritate
                asupra următorilor pași.
              </p>
            </div>
          </section>
        </main>

        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-sm text-slate-700 md:grid-cols-2">
            <div>
              <strong className="text-lg text-slate-950">
                Just<span className="text-emerald-700">ProveIt</span>
              </strong>
              <p className="mt-2">Ajutăm comunitatea să înțeleagă drepturile și opțiunile disponibile.</p>
            </div>
            <div>
              <strong className="text-slate-950">Contact</strong>
              <p className="mt-2">+44 7447 707829</p>
              <p>adriandefta@proveitweb.co.uk</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

function SectionTitle({
  eyebrow,
  title,
  inverted = false,
}: {
  eyebrow: string;
  title: string;
  inverted?: boolean;
}) {
  return (
    <div>
      <p className={`text-sm font-extrabold uppercase tracking-[0.14em] ${inverted ? "text-emerald-200" : "text-emerald-700"}`}>
        {eyebrow}
      </p>
      <h2 className={`mt-2 text-3xl font-extrabold tracking-normal ${inverted ? "text-white" : "text-slate-950"}`}>
        {title}
      </h2>
    </div>
  );
}

function Feature({ title, children }: { title: string; children: string }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-extrabold tracking-normal">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-700">{children}</p>
    </article>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-white p-4">
      <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-700">{title}</p>
      <p className="mt-1 text-xl font-extrabold tracking-normal text-slate-950">{value}</p>
    </div>
  );
}

function readStoredContact(): SaleConsultationContact {
  if (typeof window === "undefined") {
    return { fullName: "", email: "", phone: "" };
  }

  try {
    const raw = window.localStorage.getItem(CONTACT_STORAGE_KEY);
    if (!raw) {
      return { fullName: "", email: "", phone: "" };
    }

    const parsed = JSON.parse(raw) as Partial<SaleConsultationContact>;
    return {
      fullName: cleanStoredContactValue(parsed.fullName, 120),
      email: cleanStoredContactValue(parsed.email, 180),
      phone: cleanStoredContactValue(parsed.phone, 80),
    };
  } catch {
    return { fullName: "", email: "", phone: "" };
  }
}

function saveStoredContact(contact: SaleConsultationContact) {
  if (typeof window === "undefined") {
    return;
  }

  const storedContact = {
    fullName: cleanStoredContactValue(contact.fullName, 120),
    email: cleanStoredContactValue(contact.email, 180),
    phone: cleanStoredContactValue(contact.phone, 80),
  };

  try {
    if (!storedContact.fullName && !storedContact.email && !storedContact.phone) {
      window.localStorage.removeItem(CONTACT_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(storedContact));
  } catch {
    // Ignore storage failures so checkout is not blocked by browser privacy settings.
  }
}

function cleanStoredContactValue(value: unknown, maxLength: number) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function readApiError(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (typeof record.error === "string" && record.error.trim()) {
      return record.error;
    }
    if (typeof record.message === "string" && record.message.trim()) {
      return record.message;
    }
  }

  return fallback;
}
