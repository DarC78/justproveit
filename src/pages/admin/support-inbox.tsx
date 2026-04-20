import { useAuth } from "@/context/AuthContext";
import {
  addCustomerEmail,
  addPhoneToAzureQueue,
  CustomerContextResponse,
  GenericReportsConfig,
  GmailLabel,
  getCustomerContext,
  getGenericReportsConfig,
  getGmailLabels,
  getGmailProfile,
  getMessage,
  getRecentMessages,
  GmailProfile,
  markMessageRead,
  markThreadState,
  recordStageOneClosed,
  ReplyTemplate,
  searchMessagesByEmail,
  searchGmail,
  sendGenericUpdateEmail,
  sendGmailReply,
  SupportMessage,
  trashMessage,
  trashThread,
  updateMessageLabels,
} from "@/lib/genericReports";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

type LoadStatus = "idle" | "loading" | "ready" | "error";
type SourceMode = "cached" | "live" | "merged";

const ACTIONABLE_MESSAGE_LIMIT = 20;
const DEFAULT_MAILBOX_EMAIL = "oz@proveitweb.co.uk";
const DONE_NO_REPLY_LABEL_NAME = "Done - No Reply Needed";
const DONE_ANSWERED_LABEL_NAME = "Done - Answered";
const POSITIVE_DECISION_STORAGE_PREFIX = "justproveit:genericreports:positive-decisions";
const CODE_REPLY_TEMPLATES: ReplyTemplate[] = [
  {
    key: "felicitari",
    label: "felicitari",
    sortOrder: 10,
    plainText: `Buna ziua,

Felicitari! Finantatorul v-a retinut complaint-ul, prin urmare sunteti in primul val care isi va recupera banii. 

Sunt 3 spete pentru care se recupereaza banii. Una se cheama DCA cealalta. Alta in care comisionul era mai mare de 35% din dobanda. Si cea de-a treia speta in care exista o relatie de unu la unu intre dealer si finantaror. 

In 30 Martie 2026 FCA a comunicat toate formulele de calcul. Finantatorii au 3 luni sa isi puna la punct sistemele informatice (adica pana pe 30 iunie). Dupa aceasta data incep sa trimita deciziile. Au maxim 3 luni (adica pana pe 30 Septembrie), sa rezolve plangerile. 

Prin emailul lor va confirma ca au retinut complaint-ul. Cand mai primiti vreo notificare de la ei o sa va rog sa ne spuneti. 
Este foarte important ca ati depasit aceasta etapa inainte sa inceapa schema de compensare. Asta inseamna ca veti fi in primul val de ramburs. 

https://www.fca.org.uk/news/statements/fca-confirms-motor-finance-redress-scheme

Avem un program prin care puteti castiga cateva sute de lire pe luna. Noi vom infiinta o pagina pe site-ul nostru cu testimoniale de la clientii nostrii. Cand cineva intra la noi pe site, vede si da click pe testimonialul dvs, si devine client, atunci dumneavoastra primiti £35. Pentru fiecare persoana.

Mai mult, in fiecare luna avem o tombola iar un testimonial va castiga £50.

Daca ati vrea sa participati tot ce aveti de facut este sa ne lasati un testimonial scris asupra interactiunii cu firma noastra si sa atasati o poza dupa decizia dvs. (acoperiti-va datele personale).

Sincer, chiar daca nu ati dori sa participati, tot am aprecia foarte mult feedback-ul dumneavoastra sincer. Suntem o echipa tanara si la inceput de drum si avem nevoie de sustinerea clientilor nostrii.

Puteti sa il lasati aici: https://uk.trustpilot.com/review/proveitweb.co.uk

Pentru orice alte intrebari va stam la dispozitie.


Cu respect,
Echipa de suport ProveIt
`,
  },
  {
    key: "atiSemnatCmc",
    label: "atiSemnatCmc",
    sortOrder: 20,
    plainText: `Buna ziua,

Acest email nu este de la finantator, ci de la o firma de avocatura. Sa intelegem ca ati aplicat si cu o alta firma de recuperari? Mare atentie ca in acest fel puteti ajunge sa platiti in doua parti. Mai mult, in aceste circumstante unii finantatori aleg sa discute direct cu firma de avocatura si sa nu va raspunda la email-uri. 

Aveti aici un video in care dl. Adrian arata cat de usor si inselator este procesul de aplicare cu o firma de avocatura: https://youtu.be/3wwhwmA1MdY

Cel mai bine este sa clarificati de ce v-au trimis acest email si sa intelegeti daca aveti claim-ul deschis si cu ei. 

Daca aveti un claim deschis si cu ei, in general taxa lor este de 50% din ceea ce se recupereaza. 

Noi va putem ajuta sa incercati sa inchideti contractul cu ei, dar in primul rand o sa va rog sa clarificati situatia cu ei. 

Toate cele bune,
Echipa Proveit`,
  },
  {
    key: "cancelCmc",
    label: "cancelCmc",
    sortOrder: 30,
    plainText: `Buna ziua,

Trimiteti un email catre <email CMC> cu urmatorul continut (completati-va datele dvs):

Subject: Cancellation of Contract Due to Lack of Transparency and Misleading Practices

Dear sir/madam,
I am writing to formally request the immediate cancellation of the contract I recently signed with your company regarding the recovery of extra interest related to the car finance mis selling scandal. This cancellation should happen without any penalties.

After further consideration, I have identified several issues with the way the contract was presented and agreed upon:

Please provide an evidence where I signed the contract with yourself. I remember signing for a FREE check. I don't recall any contract for you to represent me. I don't exclude that in your terms and conditions it might have been such a contract. However, at the point of sale where I sighed and entered my details there were only details about the free check.

Lack of Transparency Regarding Commission: At no point during our initial discussions or in the documents provided was the commission your company charges communicated in a clear and transparent manner (as FCA mandates). I only became aware of the significant commission after signing the contract, which I find unacceptable. Can you provide an evidence that the commissions were clearly explained when I signed the free check. Clearly on that page I don't remember seeing any commissions.

As English is not my native language, I feel like I was in a very vulnerable position when going through your website. Again, I was under the impression that I was signing for a free check. This is based on the Ad that I've seen and also the website pages. I think FCA mandates that you need to identify and treat differently vulnerable customers, such as the ones for which English is not the native language, such as in my case.

Misleading Information During the Signing Process: I was under the impression that I was merely submitting an enquiry to explore the possibility of recovering extra interest. However, I later discovered that I had unwittingly signed a legally binding contract. This misrepresentation is deeply concerning and not something I would expect from a reputable company regulated by FCA and SAR.

Can you present the screen where I signed the contract? I am sure on that screen it was mentioned only the fact that I am doing a free check, nothing in relation to signing of a contract. 

Untransparent Ways of Working: The overall approach your company has taken - ranging from the initial communication to the lack of clarity in your processes - has been opaque and far from what I consider to be good business practice. This has eroded my trust in your services.

FCA mandates that a claims management company should identify if a customer signed with two or more companies. Due to your website being so misleading, and the fees not being clearly explained on the website, and the fact that I was under the impression this is a FREE check, I went through multiple companies such as yours.

On their page, FCA mandates very clearly that in the process for car finance mis selling scandal one doesn't need to use a CMC. Moreover, a claims management company should identify if the user applied with multiple companies, just because is so easy and deceiving. In my case there was no verification, no question if I applied before or not! Not a single step has been taken to prevent me to apply with multiple companies. 

Given the above points, I believe it is in both of our interests to terminate this agreement immediately and with no penalty. I am determined to seek justice on this matter as far as the law allows me and using all authorities, including FCA, FOS and SAR.

Please confirm in writing that the contract has been cancelled and that no further action will be taken by your company on my behalf. Moreover, please confirm that at any point I will not be liable for any costs to you.

I would appreciate a prompt response to this email to avoid any further complications.

Thank you for your understanding.


Sincerely,
[Numele intreg]
[Adresa]
[Data nasterii]`,
  },
  {
    key: "justUpdate",
    label: "justUpdate",
    sortOrder: 40,
    plainText: `Buna ziua,

Acesta este doar un update de la firma de finantare. Nu trebuie sa faceti nimic deocamdata. 

Sistemul nostru v-a emis si un email de update de la noi din sistem, cu stadiul dosarului si pasii urmatori. 

Emailul a fost trimis de pe adresa suport@justproveit.co.uk . O sa va rog sa cautati si in spam daca nu il gasiti in inbox. 

Daca mai sunt intreabari, va stam la dispozitie.

Cu stima, 
Echipa de suport ProveIt`,
  },
  {
    key: "queryNoAnswer",
    label: "queryNoAnswer",
    sortOrder: 50,
    plainText: `Buna ziua,

FCA a clarificat pe 30 Martie toate detaliile schemei. 

Din ce intelegem noi, pare ca finantatorul nu v-a raspuns la nici un email. 

In 99% din aceste cazuri, clientul nostru a semnat online cu o firma de avocatura, iar finantatorul a ales sa discute doar cu firma de avocatura si sa nu raspunda la email-uri.

Nu este o problema, putem rezolva. Dar este important sa stim daca asta este cazul, si denumirea firmei de avocatura. 

Puteti urmati acest video si sa cautati daca aveti un claim deschis si cu o firma de avocatura: https://youtu.be/3wwhwmA1MdY ?

Daca aveti ceva de genul asta, va rog sa ne spuneti denumirea firmei de avocatura.

Cu stima, 
Echipa de suport ProveIt`,
  },
  {
    key: "autoACK",
    label: "autoACK",
    sortOrder: 60,
    plainText: `Buna ziua,

Multumim pentru informare. Finantatorul v-a trimis un auto reply, ceea ce inseamna ca a confirmat ca ati demarat procesul de recuperare. 

Va rugam sa ne spuneti cand va mai trimite un alt email. 

Ca o nota separata, puteti urmati acest video si sa cautati daca aveti un claim deschis si cu o firma de avocatura: https://youtu.be/3wwhwmA1MdY ?

Cateodata sunt website-uri super inelatoare. 

Daca aveti ceva de genul asta, va rog sa ne spuneti denumirea firmei de avocatura si noi vom incerca sa va scoatem din contractul cu ei. 

Cu stima, 
Echipa de suport ProveIt`,
  },
  {
    key: "statusUpdate",
    label: "statusUpdate",
    sortOrder: 70,
    plainText: `Buna ziua,

Ar fi trebuit sa fi primit un email din sistem (suport@justproveit.co.uk). O sa va rog sa verificati si in spam. 

In acel email vedeti exact stadiul dosarului, si pasii urmatori.

Daca sunt intrebari, va stam la dispozitie. 

Cu stima, 
Echipa de suport ProveIt`,
  },
];

export default function SupportInboxPage() {
  const router = useRouter();
  const { status, token, user, isAdmin, requireAdmin, logout } = useAuth();
  const [gateStatus, setGateStatus] = useState<LoadStatus>("loading");
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("idle");
  const [actionStatus, setActionStatus] = useState("");
  const [error, setError] = useState("");
  const [config, setConfig] = useState<GenericReportsConfig | null>(null);
  const [gmailProfile, setGmailProfile] = useState<GmailProfile | null>(null);
  const [gmailLabels, setGmailLabels] = useState<GmailLabel[]>([]);
  const [templates, setTemplates] = useState<ReplyTemplate[]>([]);
  const [source, setSource] = useState<SourceMode>("merged");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [phoneSearch, setPhoneSearch] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
  const [customerContext, setCustomerContext] =
    useState<CustomerContextResponse | null>(null);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState("");
  const [replyText, setReplyText] = useState("");
  const [lastSentEmailStatus, setLastSentEmailStatus] = useState("");
  const visibleMessages = useMemo(
    () => messages.slice(0, ACTIONABLE_MESSAGE_LIMIT),
    [messages],
  );

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.key === selectedTemplateKey),
    [selectedTemplateKey, templates],
  );

  const selectedCustomer = useMemo(
    () => buildCustomerView(customerContext),
    [customerContext],
  );
  const selectedRecipient = selectedMessage ? getReplyRecipient(selectedMessage) : "";
  const selectedThreadKey = selectedMessage ? getThreadKey(selectedMessage) : "";
  const selectedContextEmail = selectedMessage ? buildContextEmail(selectedMessage) : "";
  const selectedContextKey = selectedMessage
    ? `${getGmailMessageId(selectedMessage) || getMessageId(selectedMessage, 0)}:${selectedContextEmail}`
    : "";

  async function loadRecent() {
    if (!token) {
      return;
    }

    setLoadStatus("loading");
    setError("");

    try {
      const response = await getRecentMessages(token, {
        source,
        limit: ACTIONABLE_MESSAGE_LIMIT,
        actionableOnly: true,
        afterDate: formatDateForApi(startDate),
        beforeDate: formatExclusiveEndDateForApi(endDate),
      });
      const nextMessages = response.messages ?? [];
      setMessages(nextMessages);
      setSelectedMessage(nextMessages[0] ?? null);
      setCustomerContext(null);
      setLoadStatus("ready");
      setActionStatus(formatActionableLoadStatus(response, nextMessages.length));
    } catch (loadError) {
      setLoadStatus("error");
      setError(readError(loadError));
    }
  }

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (status === "anonymous") {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    async function verifyAccess() {
      if (!isAdmin) {
        setGateStatus("error");
        setError("Admin access required.");
        return;
      }

      const result = await requireAdmin();
      if (!cancelled) {
        setGateStatus(result.allowed ? "ready" : "error");
        setError(result.allowed ? "" : result.error ?? "Admin access required.");
      }
    }

    verifyAccess();

    return () => {
      cancelled = true;
    };
  }, [isAdmin, requireAdmin, router, status]);

  useEffect(() => {
    if (gateStatus !== "ready" || !token) {
      return;
    }

    const accessToken = token;
    let cancelled = false;

    async function bootstrap() {
      setLoadStatus("loading");
      setError("");

      try {
        const [
          nextConfig,
          nextProfile,
          labelsResponse,
        ] = await Promise.all([
          getGenericReportsConfig(accessToken),
          getGmailProfile(accessToken),
          getGmailLabels(accessToken),
        ]);

        if (cancelled) {
          return;
        }

        setConfig(nextConfig);
        setGmailProfile(nextProfile);
        setGmailLabels(labelsResponse.labels ?? []);
        setTemplates(CODE_REPLY_TEMPLATES);

        const recentResponse = await getRecentMessages(accessToken, {
          source: "merged",
          limit: ACTIONABLE_MESSAGE_LIMIT,
          actionableOnly: true,
        });

        if (!cancelled) {
          const nextMessages = recentResponse.messages ?? [];
          setMessages(nextMessages);
          setSelectedMessage(nextMessages[0] ?? null);
          setCustomerContext(null);
          setLoadStatus("ready");
          setActionStatus(formatActionableLoadStatus(recentResponse, nextMessages.length));
        }
      } catch (bootstrapError) {
        if (!cancelled) {
          setLoadStatus("error");
          setError(readError(bootstrapError));
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [gateStatus, token]);

  useEffect(() => {
    if (!token || !selectedMessage) {
      return;
    }

    const accessToken = token;
    const email = selectedContextEmail;
    if (!email) {
      return;
    }

    let cancelled = false;

    async function loadContext() {
      try {
        const context = await getCustomerContext(accessToken, email);
        if (!cancelled) {
          setCustomerContext(
            applyStoredPositiveDecision(context, email, config?.mailboxEmail),
          );
        }
      } catch (contextError) {
        if (!cancelled) {
          setCustomerContext(null);
          setActionStatus(`Customer context unavailable: ${readError(contextError)}`);
        }
      }
    }

    loadContext();

    return () => {
      cancelled = true;
    };
  }, [config?.mailboxEmail, selectedContextEmail, selectedContextKey, selectedMessage, token]);

  useEffect(() => {
    if (!token || !selectedMessage || selectedTemplateKey) {
      return;
    }

    const accessToken = token;
    const recipient = getReplyRecipient(selectedMessage);
    if (!recipient) {
      return;
    }

    let cancelled = false;

    async function loadLastSentEmail() {
      setLastSentEmailStatus(`Searching last email sent to ${recipient}...`);
      setReplyText(`Searching Gmail for the last email sent to ${recipient}...`);

      try {
        const lastEmail = await findLastSentEmailToRecipient(accessToken, recipient);
        if (cancelled) {
          return;
        }

        if (lastEmail) {
          setReplyText(formatLastSentEmailForReplyBox(lastEmail, recipient));
          setLastSentEmailStatus(`Loaded last email sent to ${recipient}.`);
        } else {
          setReplyText(`No previous Gmail email found from support to ${recipient}.`);
          setLastSentEmailStatus(`No previous support email found for ${recipient}.`);
        }
      } catch (lastEmailError) {
        if (!cancelled) {
          const message = readError(lastEmailError);
          setReplyText(`Unable to load the last email sent by support: ${message}`);
          setLastSentEmailStatus(`Unable to load last support email: ${message}`);
        }
      }
    }

    loadLastSentEmail();

    return () => {
      cancelled = true;
    };
  }, [selectedMessage, selectedTemplateKey, token]);

  function handleSelectMessage(message: SupportMessage) {
    const recipient = getReplyRecipient(message);
    setSelectedMessage(message);
    setCustomerContext(null);
    setSelectedTemplateKey("");
    setReplyText(recipient ? "" : "No valid recipient found for this client.");
    setLastSentEmailStatus("");
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || !searchEmail.trim()) {
      return;
    }

    setLoadStatus("loading");
    setError("");

    try {
      const response = await searchMessagesByEmail(token, searchEmail.trim(), 100);
      const nextMessages = response.messages ?? [];
      setMessages(nextMessages);
      setSelectedMessage(nextMessages[0] ?? null);
      setCustomerContext(null);
      setLoadStatus("ready");
      setActionStatus(`Found ${nextMessages.length} messages for ${searchEmail.trim()}.`);
    } catch (searchError) {
      setLoadStatus("error");
      setError(readError(searchError));
    }
  }

  function handlePhoneSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionStatus(
      `Phone search is not available yet. LaunchingStack returns 501 for ${phoneSearch.trim() || "this phone number"}.`,
    );
  }

  function handleApplyTemplate(templateKey: string) {
    setSelectedTemplateKey(templateKey);
    const template = templates.find((item) => item.key === templateKey);
    setLastSentEmailStatus("");
    setReplyText(renderTemplateText(template, selectedMessage, selectedCustomer));
  }

  async function handleSendReply() {
    if (!token || !selectedMessage) {
      return;
    }

    const recipient = getReplyRecipient(selectedMessage);
    const subject = buildReplySubject(selectedMessage);
    const trimmedReply = replyText.trim();
    const selectedMessageId = getGmailMessageId(selectedMessage);

    if (!recipient || !trimmedReply) {
      setActionStatus("Select a message and write a reply before sending.");
      return;
    }

    if (!selectedMessageId) {
      setActionStatus("No Gmail message id found for the selected email.");
      return;
    }

    const answeredLabel = findGmailLabelByName(gmailLabels, DONE_ANSWERED_LABEL_NAME);
    if (!answeredLabel) {
      setActionStatus(
        `Gmail label "${DONE_ANSWERED_LABEL_NAME}" was not found. Refresh the inbox after creating it in Gmail.`,
      );
      return;
    }

    if (!confirmAction("Send this reply and move the email to Done - Answered?")) {
      return;
    }

    await runAction(`Sending reply and moving email to ${DONE_ANSWERED_LABEL_NAME}...`, async () => {
      const headers = buildReplyHeaders(selectedMessage);
      const templateKey = selectedTemplate?.key ?? "";
      const replyBodyText = buildClassicReplyBody(
        selectedMessage,
        trimmedReply,
        customerContext,
      );
      const replyBodyHtml = buildClassicReplyHtml(
        selectedMessage,
        trimmedReply,
        customerContext,
      );
      const result = await sendGmailReply(token, {
        to: recipient,
        bcc:
          templateKey === config?.stageOneTemplateKey
            ? config?.felicitariBccEmail
            : "",
        subject,
        text: replyBodyText,
        html: replyBodyHtml,
        threadId: selectedMessage.threadId ?? selectedMessage.externalThreadId ?? "",
        inReplyTo: headers.inReplyTo,
        references: headers.references,
        metadata: {
          templateKey,
          source: "genericreports_admin",
        },
      });

      await markMessageRead(token, selectedMessageId);
      await updateMessageLabels(token, selectedMessageId, {
        addLabelIds: [answeredLabel.id],
        removeLabelIds: ["INBOX"],
      });
      await markThreadState(token, "replied", {
        threadKey: selectedThreadKey || `message:${selectedMessageId}`,
        recipientEmail: recipient,
        subject,
      });

      if (templateKey === config?.stageOneTemplateKey) {
        const customerEmail = getPrimaryCustomerEmail(
          selectedCustomer,
          buildContextEmail(selectedMessage),
        );
        const eventAt = new Date().toISOString();

        if (customerEmail) {
          if (!hasPositiveDecision(selectedCustomer)) {
            await recordStageOneClosed(token, {
              customerEmail,
              customerName: getCustomerName(selectedCustomer, customerEmail),
              eventAt,
              sourceRecordId: `felicitari-template:${customerEmail}:${eventAt}`,
              sourceParentId: selectedThreadKey || `message:${selectedMessageId}`,
              sourceSystem: "genericreports_admin_felicitari",
              sourceRecordType: "felicitari_template_sent",
              templateKey,
              mailboxEmail: config?.mailboxEmail ?? "oz@proveitweb.co.uk",
              description: "Positive decision recorded after felicitari template send",
              matchedTemplateFrom: "genericreports_admin_felicitari_template",
              metadata: {
                gmailMessageId: result.id ?? "",
                threadKey: selectedThreadKey,
                selectedSubject: selectedMessage.subject ?? "",
              },
            });
          }

          addStoredPositiveDecisionEmail(config?.mailboxEmail, customerEmail);
          setCustomerContext(markCustomerContextPositiveDecision(customerContext));
          const refreshedContext = await getCustomerContext(token, customerEmail).catch(
            () => null,
          );
          if (refreshedContext) {
            setCustomerContext(
              markCustomerContextPositiveDecision(
                applyStoredPositiveDecision(
                  refreshedContext,
                  customerEmail,
                  config?.mailboxEmail,
                ),
              ),
            );
          }
        }

        const customerPhone = getCustomerPhone(selectedCustomer);
        if (customerPhone) {
          await addPhoneToAzureQueue(token, {
            phone: customerPhone,
            queueId: config.felicitariAzureQueueId,
            reason: "felicitari-template-sent",
          });
        }
      }

      const stateKeys = getThreadStateKeys(selectedMessage);
      removeMessagesFromInbox(stateKeys);
      setReplyText("");
      return `Reply sent${result.id ? `: ${result.id}` : ""} and email moved to ${DONE_ANSWERED_LABEL_NAME}.`;
    });
  }

  async function handleSkip() {
    if (!token || !selectedMessage) {
      return;
    }

    const selectedMessageId = getGmailMessageId(selectedMessage);
    if (!selectedMessageId) {
      setActionStatus("No Gmail message id found for the selected email.");
      return;
    }

    const doneLabel = findGmailLabelByName(gmailLabels, DONE_NO_REPLY_LABEL_NAME);
    if (!doneLabel) {
      setActionStatus(
        `Gmail label "${DONE_NO_REPLY_LABEL_NAME}" was not found. Refresh the inbox after creating it in Gmail.`,
      );
      return;
    }

    if (!confirmAction("Mark this email as no reply needed and remove it from the inbox?")) {
      return;
    }

    await runAction(`Moving email to ${DONE_NO_REPLY_LABEL_NAME}...`, async () => {
      await markMessageRead(token, selectedMessageId);
      await updateMessageLabels(token, selectedMessageId, {
        addLabelIds: [doneLabel.id],
        removeLabelIds: ["INBOX"],
      });
      await markThreadState(token, "skipped", {
        threadKey: selectedThreadKey || `message:${selectedMessageId}`,
        senderEmail: getReplyRecipient(selectedMessage),
        subject: selectedMessage.subject ?? "",
      });
      const stateKeys = getThreadStateKeys(selectedMessage);
      removeMessagesFromInbox(stateKeys);
      return `Email marked read and moved to ${DONE_NO_REPLY_LABEL_NAME}.`;
    });
  }

  async function handleTrash() {
    if (!token || !selectedMessage) {
      return;
    }

    if (!confirmAction("Move this email thread to Gmail trash?")) {
      return;
    }

    await runAction("Moving to trash...", async () => {
      if (selectedMessage.threadId || selectedMessage.externalThreadId) {
        await trashThread(
          token,
          selectedMessage.threadId ?? selectedMessage.externalThreadId ?? "",
        );
      } else {
        await trashMessage(
          token,
          selectedMessage.messageId ?? selectedMessage.externalMessageId ?? "",
        );
      }

      removeMessagesFromInbox(getThreadStateKeys(selectedMessage));

      return "Moved to Gmail trash.";
    });
  }

  function removeMessagesFromInbox(stateKeys: string[]) {
    setMessages((currentMessages) => {
      const nextMessages = currentMessages.filter(
        (message) => !hasAnyThreadStateKey(getThreadStateKeys(message), new Set(stateKeys)),
      );
      setSelectedMessage((currentSelected) => {
        if (
          currentSelected &&
          !hasAnyThreadStateKey(getThreadStateKeys(currentSelected), new Set(stateKeys))
        ) {
          return currentSelected;
        }

        return nextMessages[0] ?? null;
      });
      return nextMessages;
    });
    setCustomerContext(null);
  }

  async function handleGenericUpdate() {
    if (!token || !selectedMessage || !selectedCustomer) {
      return;
    }

    const recipient = getReplyRecipient(selectedMessage);
    if (!recipient) {
      setActionStatus("No recipient found for this customer.");
      return;
    }

    if (!confirmAction("Send the generic update email to this customer?")) {
      return;
    }

    await runAction("Sending generic update...", async () => {
      await sendGenericUpdateEmail(token, {
        to: recipient,
        customerName: getCustomerName(selectedCustomer, recipient),
        customerSinceLabel: getCustomerString(selectedCustomer, [
          "customerSinceLabel",
          "customerSince",
        ]),
        statusLabel: getCustomerString(selectedCustomer, ["statusLabel", "status"]),
      });
      return "Generic update sent.";
    });
  }

  async function handlePositiveDecision() {
    if (!token || !selectedMessage || !selectedCustomer) {
      return;
    }

    const fallbackEmail = buildContextEmail(selectedMessage);
    const customerEmail = getPrimaryCustomerEmail(selectedCustomer, fallbackEmail);
    if (!customerEmail) {
      setActionStatus("No customer email found for this message.");
      return;
    }

    if (!confirmAction("Record Decizie Pozitiva for this customer?")) {
      return;
    }

    if (hasPositiveDecision(selectedCustomer)) {
      addStoredPositiveDecisionEmail(config?.mailboxEmail, customerEmail);
      setCustomerContext(markCustomerContextPositiveDecision(customerContext));
      setActionStatus("Customer already has Decizie Pozitiva recorded.");
      return;
    }

    await runAction("Recording Decizie Pozitiva...", async () => {
      const eventAt = new Date().toISOString();
      await recordStageOneClosed(token, {
        customerEmail,
        customerName: getCustomerName(selectedCustomer, customerEmail),
        eventAt,
        sourceRecordId: `manual-stage-one:${customerEmail}:${eventAt}`,
        sourceParentId: selectedThreadKey,
        sourceSystem: "genericreports_admin_manual",
        sourceRecordType: "positive_decision_button",
        templateKey: "buttonUpdateDeciziePoz",
        mailboxEmail: config?.mailboxEmail ?? "oz@proveitweb.co.uk",
        description: "Positive decision manually marked from GenericReports",
        matchedTemplateFrom: "genericreports_admin_manual_button",
        metadata: {
          threadKey: selectedThreadKey,
          selectedSubject: selectedMessage.subject ?? "",
        },
      });
      addStoredPositiveDecisionEmail(config?.mailboxEmail, customerEmail);
      setCustomerContext(markCustomerContextPositiveDecision(customerContext));
      const refreshedContext = await getCustomerContext(token, customerEmail).catch(() => null);
      if (refreshedContext) {
        setCustomerContext(
          markCustomerContextPositiveDecision(
            applyStoredPositiveDecision(
              refreshedContext,
              customerEmail,
              config?.mailboxEmail,
            ),
          ),
        );
      }
      return "Decizie Pozitiva recorded.";
    });
  }

  async function handleAddCustomerEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || !selectedMessage || !selectedCustomer) {
      return;
    }

    const emailToAdd = newCustomerEmail.trim().toLowerCase();
    if (!isValidEmail(emailToAdd)) {
      setActionStatus("Enter a valid email address to add to this customer.");
      return;
    }

    const customerEmail = getPrimaryCustomerEmail(
      selectedCustomer,
      buildContextEmail(selectedMessage),
    );
    if (!customerEmail) {
      setActionStatus("No customer email found for the selected customer.");
      return;
    }

    if (getCustomerEmails(selectedCustomer).includes(emailToAdd)) {
      setActionStatus(`${emailToAdd} is already listed for this customer.`);
      setNewCustomerEmail("");
      return;
    }

    await runAction(`Adding ${emailToAdd} to customer...`, async () => {
      const response = await addCustomerEmail(token, {
        customerEmail,
        newEmail: emailToAdd,
        source: "genericreports_admin",
        metadata: {
          threadKey: selectedThreadKey,
          selectedSubject: selectedMessage.subject ?? "",
        },
      });

      const refreshedContext = await getCustomerContext(token, customerEmail).catch(
        () => null,
      );
      const addedEmails = getAddedCustomerEmails(response, emailToAdd);

      if (refreshedContext) {
        setCustomerContext(addEmailsToCustomerContext(refreshedContext, addedEmails));
      } else if (isCustomerContextResponse(response)) {
        setCustomerContext(addEmailsToCustomerContext(response, addedEmails));
      } else {
        setCustomerContext(addEmailsToCustomerContext(customerContext, addedEmails));
      }

      setNewCustomerEmail("");
      return `Added ${emailToAdd} to customer.`;
    });
  }

  async function runAction(
    loadingMessage: string,
    action: () => Promise<string>,
  ) {
    setActionStatus(loadingMessage);
    setError("");

    try {
      const message = await action();
      setActionStatus(message);
    } catch (actionError) {
      setActionStatus("");
      setError(readError(actionError));
    }
  }

  async function handleLogout() {
    await logout();
    await router.push("/login");
  }

  return (
    <>
      <Head>
        <title>Support Inbox | JustProveIt Admin</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main className="min-h-screen bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link href="/admin" className="text-lg font-extrabold tracking-tight">
                Just<span className="text-emerald-700">ProveIt</span>
              </Link>
              <h1 className="mt-1 text-2xl font-extrabold">Support Inbox</h1>
              <p className="text-sm text-slate-600">
                {user?.email ?? "Admin"} · {config?.mailboxEmail ?? "GenericReports"}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/admin"
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-center text-sm font-bold text-slate-800 hover:bg-slate-100"
              >
                Admin home
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] px-4 py-6">
          {gateStatus === "loading" ? (
            <StatusPanel message="Checking admin access..." />
          ) : null}

          {gateStatus === "error" ? (
            <StatusPanel tone="error" message={error || "Admin access required."} />
          ) : null}

          {gateStatus === "ready" ? (
            <>
              <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="grid gap-3 xl:grid-cols-[1fr_auto_auto_auto]">
                    <form className="flex gap-2" onSubmit={handleSearch}>
                      <input
                        type="email"
                        value={searchEmail}
                        onChange={(event) => setSearchEmail(event.target.value)}
                        placeholder="Search by customer email"
                        className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
                      />
                      <button
                        type="submit"
                        className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800"
                      >
                        Search
                      </button>
                    </form>

                    <form className="flex gap-2" onSubmit={handlePhoneSearch}>
                      <input
                        type="tel"
                        value={phoneSearch}
                        onChange={(event) => setPhoneSearch(event.target.value)}
                        placeholder="Phone search unavailable"
                        className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
                      />
                      <button
                        type="submit"
                        className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-950 hover:bg-amber-100"
                      >
                        Check
                      </button>
                    </form>

                    <select
                      value={source}
                      onChange={(event) => setSource(event.target.value as SourceMode)}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold"
                    >
                      <option value="cached">Cached</option>
                      <option value="live">Live</option>
                      <option value="merged">Merged</option>
                    </select>

                    <button
                      type="button"
                      onClick={loadRecent}
                      className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100"
                    >
                      Refresh
                    </button>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Start date
                      <input
                        type="date"
                        value={startDate}
                        onChange={(event) => setStartDate(event.target.value)}
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-900"
                      />
                    </label>
                    <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      End date
                      <input
                        type="date"
                        value={endDate}
                        onChange={(event) => setEndDate(event.target.value)}
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-900"
                      />
                    </label>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <SummaryTile
                    title="Gmail"
                    value={
                      gmailProfile?.connected
                        ? gmailProfile.emailAddress
                        : "Not connected"
                    }
                  />
                  <SummaryTile
                    title="Messages"
                    value={`${visibleMessages.length} visible`}
                    detail={`${messages.length} loaded`}
                  />
                </div>
              </section>

              {error ? <StatusPanel tone="error" message={error} /> : null}
              {actionStatus ? <StatusPanel message={actionStatus} /> : null}

              <section className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr_380px]">
                <MessageList
                  messages={visibleMessages}
                  selectedMessage={selectedMessage}
                  loadStatus={loadStatus}
                  onSelect={handleSelectMessage}
                />

                <MessagePreview message={selectedMessage} />

                <CustomerPanel
                  customer={selectedCustomer}
                  context={customerContext}
                  selectedMessage={selectedMessage}
                  newEmail={newCustomerEmail}
                  onNewEmailChange={setNewCustomerEmail}
                  onAddEmail={handleAddCustomerEmail}
                  onGenericUpdate={handleGenericUpdate}
                  onPositiveDecision={handlePositiveDecision}
                />
              </section>

              <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-extrabold">Reply</h2>
                      <p className="text-sm text-slate-600">
                        To: {selectedRecipient || "Select a message first"}
                      </p>
                    </div>
                    <select
                      value={selectedTemplateKey}
                      onChange={(event) => handleApplyTemplate(event.target.value)}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold"
                    >
                      <option value="">Choose template</option>
                      {templates.map((template) => (
                        <option key={template.key} value={template.key}>
                          {getTemplateLabel(template)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <textarea
                    value={replyText}
                    onChange={(event) => setReplyText(event.target.value)}
                    rows={12}
                    className="mt-4 w-full rounded-md border border-slate-300 px-3 py-3 text-sm leading-6 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
                    placeholder="Write a reply or choose a template."
                  />
                  {lastSentEmailStatus ? (
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      {lastSentEmailStatus}
                    </p>
                  ) : null}
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <h2 className="text-lg font-extrabold">Actions</h2>
                  <div className="mt-4 grid gap-3">
                    <ActionButton onClick={handleSendReply} disabled={!selectedMessage}>
                      Send reply
                    </ActionButton>
                    <ActionButton
                      onClick={handleSkip}
                      disabled={!selectedMessage}
                      tone="warning"
                    >
                      Ignore
                    </ActionButton>
                    <ActionButton
                      onClick={handleTrash}
                      disabled={!selectedMessage}
                      tone="danger"
                    >
                      Delete / trash
                    </ActionButton>
                  </div>
                </div>
              </section>
            </>
          ) : null}
        </div>
      </main>
    </>
  );
}

function MessageList({
  messages,
  selectedMessage,
  loadStatus,
  onSelect,
}: {
  messages: SupportMessage[];
  selectedMessage: SupportMessage | null;
  loadStatus: LoadStatus;
  onSelect: (message: SupportMessage) => void;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <h2 className="text-lg font-extrabold">Messages</h2>
        <p className="text-sm text-slate-600">
          {loadStatus === "loading" ? "Loading..." : `${messages.length} actionable`}
        </p>
      </div>
      <div className="max-h-[720px] overflow-y-auto">
        {messages.length ? (
          messages.map((message, index) => {
            const selected = getMessageId(message, index) === getMessageId(selectedMessage, 0);
            return (
              <button
                type="button"
                key={getMessageId(message, index)}
                onClick={() => onSelect(message)}
                className={`block w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-emerald-50 ${
                  selected ? "bg-emerald-50" : "bg-white"
                }`}
              >
                <p className="truncate text-sm font-extrabold">
                  {message.fromDisplayName || message.fromEmail || message.from || "Unknown sender"}
                </p>
                <p className="mt-1 truncate text-sm text-slate-800">
                  {message.subject || "(no subject)"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatDisplayDate(message.sentAtUtc ?? message.date ?? message.createdAtUtc)}
                </p>
              </button>
            );
          })
        ) : (
          <p className="p-4 text-sm text-slate-600">No messages to show.</p>
        )}
      </div>
    </section>
  );
}

function MessagePreview({ message }: { message: SupportMessage | null }) {
  const html = message?.bodyHtml?.trim();
  const text = message?.body?.trim() || message?.snippet?.trim() || "";

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <h2 className="text-lg font-extrabold">
          {message?.subject || "Select a message"}
        </h2>
        {message ? (
          <dl className="mt-3 grid gap-2 text-sm text-slate-600">
            <MetaLine label="From" value={message.from ?? message.fromEmail ?? ""} />
            <MetaLine label="To" value={message.to ?? ""} />
            <MetaLine label="Date" value={formatDisplayDate(message.sentAtUtc ?? message.date)} />
          </dl>
        ) : null}
      </div>

      <div className="p-4">
        {message ? (
          <>
            {html ? (
              <iframe
                title="Email body"
                sandbox=""
                srcDoc={html}
                className="h-[520px] w-full rounded-md border border-slate-200 bg-white"
              />
            ) : (
              <pre className="max-h-[520px] whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-800">
                {text || "No email body available."}
              </pre>
            )}

            {message.attachments?.length ? (
              <div className="mt-4">
                <h3 className="text-sm font-extrabold">Attachments</h3>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {message.attachments.map((attachment) => (
                    <li key={`${attachment.attachmentId}-${attachment.filename}`}>
                      {attachment.filename || "Attachment"} · {attachment.mimeType || "file"}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-slate-600">Choose an email from the list.</p>
        )}
      </div>
    </section>
  );
}

function CustomerPanel({
  customer,
  context,
  selectedMessage,
  newEmail,
  onNewEmailChange,
  onAddEmail,
  onGenericUpdate,
  onPositiveDecision,
}: {
  customer: Record<string, unknown> | null;
  context: CustomerContextResponse | null;
  selectedMessage: SupportMessage | null;
  newEmail: string;
  onNewEmailChange: (value: string) => void;
  onAddEmail: (event: FormEvent<HTMLFormElement>) => void;
  onGenericUpdate: () => void;
  onPositiveDecision: () => void;
}) {
  const email = selectedMessage ? buildContextEmail(selectedMessage) : "";
  const customerEmailsText = customer ? getCustomerEmailsText(customer) : "-";
  const relatedEmailsText =
    customer && context ? getRelatedCustomerEmailsText(customer, context) : "-";

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <h2 className="text-lg font-extrabold">Customer</h2>
        <p className="text-sm text-slate-600">{email || "No customer selected"}</p>
        <div className="mt-3 grid gap-2">
          <ActionButton
            onClick={onGenericUpdate}
            disabled={!selectedMessage || !customer}
          >
            Trimite Update General
          </ActionButton>
          <ActionButton
            onClick={onPositiveDecision}
            disabled={!selectedMessage || !customer}
            tone="danger"
          >
            Update DB Decizie Pozitiva
          </ActionButton>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {customer ? (
          <>
            <form onSubmit={onAddEmail} className="rounded-md border border-slate-200 p-3">
              <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Add customer email
                <input
                  type="email"
                  value={newEmail}
                  onChange={(event) => onNewEmailChange(event.target.value)}
                  placeholder="new@email.co.uk"
                  className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
                />
              </label>
              <button
                type="submit"
                className="mt-2 w-full rounded-md bg-emerald-700 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-800"
              >
                Add email
              </button>
            </form>
            <CustomerMetric
              title="Name"
              value={getCustomerName(customer, email) || "Unknown"}
            />
            <CustomerMetric
              title="Status"
              value={getCustomerString(customer, ["statusLabel", "status"]) || "-"}
            />
            <CustomerMetric
              title="Customer since"
              value={
                getCustomerString(customer, ["customerSinceLabel", "customerSince"]) ||
                "-"
              }
            />
            <CustomerMetric
              title="Phone"
              value={getCustomerPhone(customer) || "-"}
            />
            <CustomerMetric
              title="Positive decision"
              value={hasPositiveDecision(customer) ? "Yes" : "No"}
            />
            <CustomerMetric
              title="Customer email"
              value={customerEmailsText}
            />
            <CustomerMetric
              title="Other emails related to this customer"
              value={relatedEmailsText}
            />
            <CustomerMetric
              title="Number of services"
              value={getCustomerString(customer, ["numberOfCars", "numberOfServices"]) || "-"}
            />
            <CustomerMetric
              title="Number of emails"
              value={getCustomerString(customer, ["totalEmails", "numberOfEmails"]) || "-"}
            />
            <CustomerMetric
              title="Finance companies"
              value={joinCaseValues(customer, ["financeCompany", "company", "lender"])}
            />
            <CustomerMetric
              title="Car registrations"
              value={joinCaseValues(customer, ["carReg", "registration", "vrm"])}
            />
            <CustomerMetric
              title="Payments"
              value={summarizePayments(customer)}
            />
          </>
        ) : context ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Customer context returned, but no recognised customer object was
              found.
            </p>
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-950">
              Top-level keys: {Object.keys(context).join(", ") || "none"}
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            Customer context loads when you select a message.
          </p>
        )}
      </div>
    </section>
  );
}

function SummaryTile({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <p className="mt-2 break-words text-base font-extrabold">{value}</p>
      {detail ? <p className="mt-1 text-sm text-slate-600">{detail}</p> : null}
    </div>
  );
}

function StatusPanel({
  message,
  tone = "info",
}: {
  message: string;
  tone?: "info" | "error";
}) {
  return (
    <div
      className={`mt-4 rounded-lg border p-4 text-sm font-semibold ${
        tone === "error"
          ? "border-red-200 bg-red-50 text-red-900"
          : "border-slate-200 bg-white text-slate-700"
      }`}
    >
      {message}
    </div>
  );
}

function MetaLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[64px_1fr] gap-2">
      <dt className="font-bold">{label}</dt>
      <dd className="break-words">{value || "-"}</dd>
    </div>
  );
}

function CustomerMetric({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-900">
        {value || "-"}
      </p>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  tone = "default",
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "default" | "danger" | "warning";
}) {
  const toneClass =
    tone === "danger"
      ? "bg-red-900 text-white hover:bg-red-950"
      : tone === "warning"
        ? "border border-amber-500 bg-amber-100 text-amber-900 hover:bg-amber-200"
        : "bg-emerald-700 text-white hover:bg-emerald-800";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:border-transparent disabled:bg-slate-200 disabled:text-slate-500 ${toneClass}`}
    >
      {children}
    </button>
  );
}

function findGmailLabelByName(labels: GmailLabel[], name: string) {
  const normalizedName = normalizeGmailLabelName(name);
  return labels.find((label) => normalizeGmailLabelName(label.name) === normalizedName);
}

function normalizeGmailLabelName(name: string) {
  return name.trim().toLowerCase();
}

function getMessageId(message: SupportMessage | null, index: number) {
  return (
    message?.id ??
    message?._id ??
    message?.messageId ??
    message?.externalMessageId ??
    `${message?.threadId ?? "message"}-${index}`
  );
}

function formatActionableLoadStatus(
  response: { source?: string; messages?: SupportMessage[]; scannedCount?: number; hasMore?: boolean },
  visibleCount: number,
) {
  const sourceLabel = response.source ?? "merged";
  const scanned =
    typeof response.scannedCount === "number"
      ? ` from ${response.scannedCount} scanned`
      : "";
  const more = response.hasMore ? " More may be available." : "";

  return `Loaded ${Math.min(visibleCount, ACTIONABLE_MESSAGE_LIMIT)} actionable ${sourceLabel} messages${scanned}.${more}`;
}

function getThreadKey(message: SupportMessage) {
  const threadId = message.threadId ?? message.externalThreadId;
  if (threadId) {
    return `thread:${threadId}`;
  }

  const messageId =
    message.messageId ??
    message.internetMessageId ??
    message.externalMessageId ??
    message.id ??
    message._id;
  return messageId ? `message:${messageId}` : "";
}

function getThreadStateKeys(message: SupportMessage) {
  const keys = new Set<string>();
  const threadId = message.threadId ?? message.externalThreadId;
  const messageId = getGmailMessageId(message) ?? message.internetMessageId;

  addThreadStateKeyVariants(keys, threadId, "thread");
  addThreadStateKeyVariants(keys, messageId, "message");

  return Array.from(keys);
}

function getGmailMessageId(message: SupportMessage) {
  return (
    message.messageId ??
    message.externalMessageId ??
    message.id ??
    message._id ??
    ""
  );
}

function readStoredPositiveDecisionEmails(mailboxEmail?: string) {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(
      getPositiveDecisionStorageKey(mailboxEmail),
    );
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

function addStoredPositiveDecisionEmail(
  mailboxEmail: string | undefined,
  email: string,
) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return;
  }

  const emails = new Set(readStoredPositiveDecisionEmails(mailboxEmail));
  emails.add(normalizedEmail);

  try {
    window.localStorage.setItem(
      getPositiveDecisionStorageKey(mailboxEmail),
      JSON.stringify(Array.from(emails)),
    );
  } catch {
    // Browser storage is a fallback only; LaunchingStack remains the source of truth.
  }
}

function hasStoredPositiveDecisionEmail(
  mailboxEmail: string | undefined,
  email: string,
) {
  const normalizedEmail = email.trim().toLowerCase();
  return Boolean(
    normalizedEmail &&
      readStoredPositiveDecisionEmails(mailboxEmail).includes(normalizedEmail),
  );
}

function getPositiveDecisionStorageKey(mailboxEmail?: string) {
  return `${POSITIVE_DECISION_STORAGE_PREFIX}:${mailboxEmail ?? DEFAULT_MAILBOX_EMAIL}`;
}

function addThreadStateKeyVariants(
  keys: Set<string>,
  value: string | undefined,
  prefix: "thread" | "message",
) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return;
  }

  keys.add(trimmed);
  keys.add(`${prefix}:${trimmed}`);
}

function hasAnyThreadStateKey(keys: string[], stateKeys: Set<string>) {
  return keys.some((key) => stateKeys.has(key));
}

function confirmAction(message: string) {
  if (typeof window === "undefined") {
    return true;
  }

  return window.confirm(message);
}

function getReplyRecipient(message: SupportMessage) {
  return (
    message.fromEmail ??
    parseEmailAddress(message.from ?? "") ??
    parseEmailAddress(message.replyTo ?? "") ??
    ""
  );
}

function buildContextEmail(message: SupportMessage) {
  return getReplyRecipient(message).toLowerCase();
}

function parseEmailAddress(value: string) {
  const match = value.match(/<([^>]+)>/);
  const candidate = (match?.[1] ?? value).trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate) ? candidate : "";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim().toLowerCase());
}

function buildReplySubject(message: SupportMessage) {
  const subject = message.subject?.trim() || "(no subject)";
  return /^re:/i.test(subject) ? subject : `Re: ${subject}`;
}

function buildReplyHeaders(message: SupportMessage) {
  const headers = getRawMessageHeaders(message);
  const inReplyTo =
    message.messageId ??
    message.internetMessageId ??
    getHeaderValueCaseInsensitive(headers, "Message-ID") ??
    "";
  const references = buildReplyReferencesHeader(headers, inReplyTo);

  return { inReplyTo, references };
}

function getRawMessageHeaders(message: SupportMessage) {
  const rawHeaders = getRecord(message.rawJson, "headers");
  return { ...(rawHeaders ?? {}), ...(message.headers ?? {}) } as Record<
    string,
    string
  >;
}

function getHeaderValueCaseInsensitive(
  headers: Record<string, string>,
  headerName: string,
) {
  const key = Object.keys(headers).find(
    (name) => name.toLowerCase() === headerName.toLowerCase(),
  );
  return key ? headers[key] : "";
}

function buildReplyReferencesHeader(
  headers: Record<string, string>,
  messageId: string,
) {
  const existingReferences = getHeaderValueCaseInsensitive(headers, "References");
  const parts = existingReferences.split(/\s+/).filter(Boolean);

  if (!messageId) {
    return parts.join(" ");
  }

  return parts.includes(messageId) ? parts.join(" ") : [...parts, messageId].join(" ");
}

async function findLastSentEmailToRecipient(token: string, recipient: string) {
  const addressTerm = buildGmailAddressQueryTerm(recipient);
  const queries = [
    `in:sent to:${addressTerm} -in:drafts`,
    `from:oz@proveitweb.co.uk to:${addressTerm} -in:drafts`,
  ];

  for (const query of queries) {
    const searchResult = await searchGmail(token, {
      query,
      maxResults: 10,
      pageToken: "",
    });
    const refs = searchResult.messages ?? [];
    const fullMessages = await Promise.all(
      refs.map(async (message) => {
        const messageId = message.id ?? message.messageId ?? message.externalMessageId;

        if (!messageId) {
          return hasUsableMessagePreview(message) ? message : null;
        }

        const fullMessage = await getMessage(token, messageId).catch(() => null);
        return fullMessage ?? (hasUsableMessagePreview(message) ? message : null);
      }),
    );
    const matchingMessages = fullMessages
      .filter((message): message is SupportMessage => Boolean(message))
      .filter((message) => {
        const from = parseEmailAddress(message.from ?? message.fromEmail ?? "");
        return !from || from === "oz@proveitweb.co.uk";
      })
      .sort(
        (left, right) =>
          getMessageTimestamp(right) - getMessageTimestamp(left),
      );

    if (matchingMessages[0]) {
      return matchingMessages[0];
    }
  }

  return null;
}

function buildGmailAddressQueryTerm(email: string) {
  return email.trim().toLowerCase().replaceAll('"', "");
}

function hasUsableMessagePreview(message: SupportMessage) {
  return Boolean(
    message.from ||
      message.fromEmail ||
      message.subject ||
      message.date ||
      message.sentAtUtc ||
      message.createdAtUtc ||
      message.internalDate ||
      message.snippet ||
      message.body ||
      message.bodyHtml,
  );
}

function getMessageTimestamp(message: SupportMessage) {
  const internalDate = Number(message.internalDate);
  if (Number.isFinite(internalDate) && internalDate > 0) {
    return internalDate;
  }

  const value = message.sentAtUtc ?? message.createdAtUtc ?? message.date ?? "";
  const timestamp = value ? new Date(value).getTime() : 0;
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function formatLastSentEmailForReplyBox(message: SupportMessage, recipient: string) {
  const sentAt = formatDisplayDate(
    message.sentAtUtc ?? message.createdAtUtc ?? message.date,
  );
  const body = stripHtml(message.body || message.bodyHtml || message.snippet || "");

  return [
    `Last email sent to ${recipient}`,
    `Date: ${sentAt}`,
    `Subject: ${message.subject || "(no subject)"}`,
    "",
    body || "No email body available.",
    "",
    "Choose a template or replace this text before sending a new reply.",
  ].join("\n");
}

function buildClassicReplyBody(
  message: SupportMessage,
  replyText: string,
  context: CustomerContextResponse | null,
) {
  const quotedThread = buildQuotedThreadText(message, context);
  return quotedThread ? `${replyText}\n\n${quotedThread}` : replyText;
}

function buildClassicReplyHtml(
  message: SupportMessage,
  replyText: string,
  context: CustomerContextResponse | null,
) {
  const replyHtml = plainTextToHtml(replyText);
  const quotedThreadHtml = buildQuotedThreadHtml(message, context);
  return quotedThreadHtml ? `${replyHtml}${quotedThreadHtml}` : replyHtml;
}

function buildQuotedThreadText(
  selectedMessage: SupportMessage,
  context: CustomerContextResponse | null,
) {
  const threadMessages = getSelectedThreadMessages(selectedMessage, context);
  if (!threadMessages.length) {
    return "";
  }

  return threadMessages
    .map((message) => {
      const body = getMessagePlainText(message);
      return [
        buildReplyHeaderLine(message),
        body ? quoteEmailBody(body) : "> (No email body available.)",
      ].join("\n");
    })
    .join("\n\n");
}

function buildQuotedThreadHtml(
  selectedMessage: SupportMessage,
  context: CustomerContextResponse | null,
) {
  const threadMessages = getSelectedThreadMessages(selectedMessage, context);
  if (!threadMessages.length) {
    return "";
  }

  return threadMessages
    .map((message) => {
      const bodyHtml = message.bodyHtml?.trim();
      const fallbackBody = escapeHtml(getMessagePlainText(message)).replace(/\n/g, "<br>");
      return [
        buildReplyHeaderLineHtml(message),
        `<blockquote style="margin:0 0 0 12px;padding-left:12px;border-left:2px solid #d0d7de;">${
          bodyHtml || fallbackBody || "(No email body available.)"
        }</blockquote>`,
      ].join("");
    })
    .join("");
}

function getSelectedThreadMessages(
  selectedMessage: SupportMessage,
  context: CustomerContextResponse | null,
) {
  const selectedThreadId = selectedMessage.threadId ?? selectedMessage.externalThreadId ?? "";
  const contextMessages = extractMessagesFromCustomerContext(context);
  const threadMessages = selectedThreadId
    ? contextMessages.filter(
        (message) =>
          (message.threadId ?? message.externalThreadId ?? "") === selectedThreadId,
      )
    : [];
  const messages = threadMessages.length ? threadMessages : [selectedMessage];
  const seen = new Set<string>();

  return messages
    .filter((message, index) => {
      const key = getMessageId(message, index);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .sort((left, right) => getMessageTimestamp(left) - getMessageTimestamp(right));
}

function extractMessagesFromCustomerContext(
  context: CustomerContextResponse | null,
) {
  const conversations = getArray(getRecord(context, "customer"), "conversations") ?? [];

  return conversations.flatMap((conversation) => {
    const conversationRecord = conversation as Record<string, unknown>;
    const conversationThreadId = String(
      conversationRecord.externalThreadId ?? conversationRecord.threadId ?? "",
    );
    const messages = getArray(conversationRecord, "messages") ?? [];

    return messages.map((message) => {
      const messageRecord = message as Record<string, unknown>;
      const rawJson = getRecord(messageRecord, "rawJson");
      return {
        ...messageRecord,
        rawJson: rawJson ?? undefined,
        externalThreadId: String(
          messageRecord.externalThreadId ??
            messageRecord.threadId ??
            rawJson?.threadId ??
            conversationThreadId,
        ),
        threadId: String(
          messageRecord.threadId ??
            messageRecord.externalThreadId ??
            rawJson?.threadId ??
            conversationThreadId,
        ),
      } as SupportMessage;
    });
  });
}

function buildReplyHeaderLine(message: SupportMessage) {
  const from = message.from ?? message.fromEmail ?? "Unknown sender";
  const date = formatDisplayDate(message.sentAtUtc ?? message.createdAtUtc ?? message.date);
  return `On ${date}, ${from} wrote:`;
}

function buildReplyHeaderLineHtml(message: SupportMessage) {
  return `<p style="margin:16px 0 8px;color:#4b5563;">${escapeHtml(
    buildReplyHeaderLine(message),
  )}</p>`;
}

function getMessagePlainText(message: SupportMessage) {
  return (
    message.bodyText?.trim() ||
    message.body?.trim() ||
    stripHtml(message.bodyHtml ?? "") ||
    message.snippet?.trim() ||
    ""
  );
}

function quoteEmailBody(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => `> ${line}`)
    .join("\n");
}

function renderTemplateText(
  template: ReplyTemplate | undefined,
  message: SupportMessage | null,
  customer: Record<string, unknown> | null,
) {
  if (!template) {
    return "";
  }

  const raw =
    template.plainText ?? template.text ?? template.body ?? stripHtml(template.html ?? "");
  const fallbackEmail = message ? buildContextEmail(message) : "";
  const firstName = getCustomerName(customer, fallbackEmail).split(" ")[0];

  return raw
    .replaceAll("{{firstName}}", firstName)
    .replaceAll("{firstName}", firstName)
    .replaceAll("{{customerName}}", getCustomerName(customer, firstName))
    .replaceAll("{{email}}", message ? buildContextEmail(message) : "");
}

function getTemplateLabel(template: ReplyTemplate) {
  return template.label ?? template.name ?? template.title ?? template.key;
}

function stripHtml(value: string) {
  return value.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " ").trim();
}

function plainTextToHtml(value: string) {
  return value
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDisplayDate(value?: string) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(value?: string) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateForApi(value: string) {
  return value ? value.replaceAll("-", "/") : undefined;
}

function formatExclusiveEndDateForApi(value: string) {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(`${value}T00:00:00`);
  parsed.setDate(parsed.getDate() + 1);
  return [
    parsed.getFullYear(),
    String(parsed.getMonth() + 1).padStart(2, "0"),
    String(parsed.getDate()).padStart(2, "0"),
  ].join("/");
}

function getCustomerString(
  customer: Record<string, unknown> | null,
  keys: string[],
) {
  if (!customer) {
    return "";
  }

  for (const key of keys) {
    const value = customer[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function getPrimaryCustomerEmail(
  customer: Record<string, unknown> | null,
  fallbackEmail = "",
) {
  return (
    getCustomerString(customer, [
      "primaryEmail",
      "email",
      "customerEmail",
      "userEmail",
      "leadEmail",
      "normalizedEmail",
    ]) || fallbackEmail
  ).toLowerCase();
}

function markCustomerContextPositiveDecision(
  context: CustomerContextResponse | null,
) {
  if (!context) {
    return context;
  }

  const nextContext = { ...context };
  const result =
    getRecord(nextContext, "result") ??
    getRecord(nextContext, "replyContext") ??
    getRecord(nextContext, "customerReplyContext") ??
    getRecord(nextContext, "azureContext") ??
    nextContext;
  const customer =
    getRecord(result, "customer") ??
    getRecord(nextContext, "customer") ??
    getRecord(result, "data");

  if (customer) {
    customer.hasPositiveDecision = true;
    customer.positiveDecision = true;
    customer.stageOneClosed = true;
    customer.statusLabel = getCustomerString(customer, ["statusLabel"]) || "Decizie Pozitiva";
  }

  return nextContext;
}

function applyStoredPositiveDecision(
  context: CustomerContextResponse | null,
  email: string,
  mailboxEmail?: string,
) {
  return hasStoredPositiveDecisionEmail(mailboxEmail, email)
    ? markCustomerContextPositiveDecision(context)
    : context;
}

function addEmailsToCustomerContext(
  context: CustomerContextResponse | null,
  emails: string[],
) {
  if (!context) {
    return context;
  }

  const nextContext = { ...context };
  const customer = getMutableCustomerRecord(nextContext);

  if (customer) {
    const existingManualEmails = getStringArray(customer.manuallyAddedCustomerEmails);
    customer.manuallyAddedCustomerEmails = Array.from(
      new Set([...existingManualEmails, ...emails]),
    );
    customer.customerEmails = collectCustomerEmails(customer);
  }

  return nextContext;
}

function getAddedCustomerEmails(response: unknown, fallbackEmail: string) {
  const record =
    response && typeof response === "object"
      ? (response as Record<string, unknown>)
      : {};
  const responseNewEmail =
    typeof record.newEmail === "string" ? record.newEmail.trim().toLowerCase() : "";

  return Array.from(
    new Set(
      [responseNewEmail, fallbackEmail.trim().toLowerCase()].filter(
        (email) => email && isValidEmail(email),
      ),
    ),
  );
}

function getMutableCustomerRecord(context: CustomerContextResponse) {
  const result =
    getRecord(context, "result") ??
    getRecord(context, "replyContext") ??
    getRecord(context, "customerReplyContext") ??
    getRecord(context, "azureContext") ??
    context;

  return (
    getRecord(result, "customer") ??
    getRecord(context, "customer") ??
    getRecord(result, "data")
  );
}

function isCustomerContextResponse(value: unknown): value is CustomerContextResponse {
  return Boolean(
    value &&
      typeof value === "object" &&
      ("customer" in value || "result" in value || "support" in value),
  );
}

function buildCustomerView(context: CustomerContextResponse | null) {
  if (!context) {
    return null;
  }

  const result =
    getRecord(context, "result") ??
    getRecord(context, "replyContext") ??
    getRecord(context, "customerReplyContext") ??
    getRecord(context, "azureContext") ??
    context;
  const support =
    getRecord(context, "support") ??
    getRecord(context, "supportResult") ??
    getRecord(context, "supportMailboxView") ??
    getRecord(context, "supportView") ??
    getRecord(result, "support") ??
    {};
  const customer = mergeCustomerRecords([
    findCustomerLikeRecord(context),
    getRecord(context, "customer"),
    getRecord(result, "data"),
    getRecord(result, "customer"),
  ]);

  if (!customer) {
    return null;
  }

  const summary = getRecord(result, "summary") ?? getRecord(context, "summary") ?? {};
  const carFinanceCases =
    getArray(result, "carFinanceCases") ??
    getArray(context, "carFinanceCases") ??
    getArray(customer, "carFinanceCases") ??
    [];
  const successfulPayments =
    getArray(result, "successfulPayments") ??
    getArray(context, "successfulPayments") ??
    getArray(customer, "successfulPayments") ??
    [];
  const supportConversations =
    getArray(getRecord(support, "customer") ?? {}, "conversations") ??
    getArray(support, "conversations") ??
    [];
  const totalEmails = supportConversations.reduce((sum, conversation) => {
    if (!conversation || typeof conversation !== "object") {
      return sum;
    }

    return sum + (Number((conversation as Record<string, unknown>).messageCount) || 0);
  }, 0);
  const firstDate = getCustomerString(summary, ["firstDate", "customerStartedAt"]);
  const numberOfCars = Number(summary.numberOfCars);

  const primaryEmail = getCustomerString(customer, [
    "primaryEmail",
    "email",
    "customerEmail",
  ]);

  return {
    ...customer,
    carFinanceCases,
    successfulPayments,
    customerSinceLabel:
      getCustomerString(customer, ["customerSinceLabel", "customerSince"]) ||
      formatShortDate(firstDate),
    statusLabel:
      getCustomerString(customer, ["statusLabel", "commercialStatus", "status"]) ||
      "-",
    phoneNumber: getCustomerPhoneFromSources(result, support),
    hasPositiveDecision: hasPositiveDecision(customer),
    totalEmails: String(totalEmails || getCustomerString(customer, ["totalEmails"]) || "0"),
    numberOfCars: Number.isFinite(numberOfCars)
      ? String(numberOfCars)
      : getCustomerString(customer, ["numberOfCars", "numberOfServices"]) || "0",
    customerEmails: collectCustomerEmails(customer, primaryEmail),
  };
}

function mergeCustomerRecords(records: Array<Record<string, unknown> | null>) {
  const validRecords = records.filter(
    (record): record is Record<string, unknown> => Boolean(record),
  );

  if (!validRecords.length) {
    return null;
  }

  const merged = Object.assign({}, ...validRecords);

  ["customerEmails", "aliases", "manuallyAddedCustomerEmails"].forEach((key) => {
    merged[key] = Array.from(
      new Set(validRecords.flatMap((record) => getStringArray(record[key]))),
    );
  });

  return merged;
}

function getRecord(source: unknown, key: string) {
  if (!source || typeof source !== "object") {
    return null;
  }

  const value = (source as Record<string, unknown>)[key];
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function getArray(source: unknown, key: string) {
  if (!source || typeof source !== "object") {
    return null;
  }

  const value = (source as Record<string, unknown>)[key];
  return Array.isArray(value) ? value : null;
}

function findCustomerLikeRecord(source: unknown): Record<string, unknown> | null {
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return null;
  }

  const record = source as Record<string, unknown>;
  const hasCustomerFields = [
    "primaryEmail",
    "displayName",
    "commercialStatus",
    "customerName",
    "email",
  ].some((key) => typeof record[key] === "string" && record[key]);

  if (hasCustomerFields) {
    return record;
  }

  for (const value of Object.values(record)) {
    const nested = findCustomerLikeRecord(value);
    if (nested) {
      return nested;
    }
  }

  return null;
}

function getCustomerName(customer: Record<string, unknown> | null, fallback = "") {
  return (
    getCustomerString(customer, [
      "customerName",
      "displayName",
      "fullName",
      "name",
      "firstName",
    ]) || fallback
  );
}

function getCustomerPhone(customer: Record<string, unknown> | null) {
  const direct = getCustomerString(customer, ["phoneNumber", "phone", "mobile"]);
  if (direct) {
    return direct;
  }

  const phones = customer?.phones;
  return Array.isArray(phones) && typeof phones[0] === "string" ? phones[0] : "";
}

function getCustomerPhoneFromSources(...sources: unknown[]) {
  for (const source of sources) {
    const phones = collectPhoneValues(source);
    const first = Array.from(phones)[0];
    if (first) {
      return first;
    }
  }

  return "";
}

function collectPhoneValues(value: unknown, phoneSet = new Set<string>()) {
  if (!value) {
    return phoneSet;
  }

  if (typeof value === "string") {
    const normalized = value.replace(/[^\d+]/g, "");
    if (normalized.length >= 10 && normalized.length <= 14) {
      phoneSet.add(value.trim());
    }
    return phoneSet;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectPhoneValues(item, phoneSet));
    return phoneSet;
  }

  if (typeof value === "object") {
    Object.values(value).forEach((item) => collectPhoneValues(item, phoneSet));
  }

  return phoneSet;
}

function getCustomerEmailsText(customer: Record<string, unknown>) {
  const maxVisibleEmails = 7;
  const emails = getCustomerEmails(customer);
  if (!emails.length) {
    return "-";
  }

  const visibleEmails = emails.slice(0, maxVisibleEmails);
  const hiddenCount = emails.length - visibleEmails.length;
  return hiddenCount > 0
    ? `${visibleEmails.join("; ")}; ..... (${hiddenCount} more emails)`
    : visibleEmails.join("; ");
}

function getRelatedCustomerEmailsText(
  customer: Record<string, unknown>,
  context: CustomerContextResponse,
) {
  const customerEmails = new Set(getCustomerEmails(customer));
  const relatedEmails = Array.from(collectEmailValues(context))
    .filter((email) => !customerEmails.has(email))
    .filter((email) => isUsefulRelatedEmail(email))
    .sort((left, right) => left.localeCompare(right));

  return relatedEmails.length ? relatedEmails.join("; ") : "-";
}

function getCustomerEmails(customer: Record<string, unknown>) {
  const values = customer.customerEmails;
  if (!Array.isArray(values)) {
    return [];
  }

  return getStringArray(values);
}

function collectCustomerEmails(
  customer: Record<string, unknown>,
  primaryEmail = "",
) {
  const emails = new Set<string>();
  const trustedCustomerEmails = new Set<string>();

  addEmailCandidate(emails, primaryEmail);
  [
    "primaryEmail",
    "email",
    "customerEmail",
    "userEmail",
    "leadEmail",
    "normalizedEmail",
  ].forEach((key) => addEmailCandidate(emails, customer[key]));

  [
    "customerEmails",
    "aliases",
    "manuallyAddedCustomerEmails",
  ].forEach((key) => {
    getStringArray(customer[key]).forEach((email) =>
      addEmailCandidate(trustedCustomerEmails, email),
    );
  });

  return Array.from(
    new Set([
      ...Array.from(emails).filter((email) => !isInternalEmail(email)),
      ...trustedCustomerEmails,
    ]),
  )
    .sort((left, right) => left.localeCompare(right));
}

function collectEmailValues(value: unknown, emailSet = new Set<string>()) {
  if (!value) {
    return emailSet;
  }

  if (typeof value === "string") {
    const matches = value.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) ?? [];
    matches.forEach((match) => emailSet.add(match.toLowerCase()));
    return emailSet;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectEmailValues(item, emailSet));
    return emailSet;
  }

  if (typeof value === "object") {
    Object.values(value).forEach((item) => collectEmailValues(item, emailSet));
  }

  return emailSet;
}

function getStringArray(value: unknown) {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
    : [];
}

function addEmailCandidate(emailSet: Set<string>, value: unknown) {
  if (typeof value !== "string") {
    return;
  }

  const match = value.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  if (match) {
    emailSet.add(match[0].toLowerCase());
  }
}

function isInternalEmail(email: string) {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  return domain === "proveitweb.co.uk" || domain === "justproveit.co.uk";
}

function isUsefulRelatedEmail(email: string) {
  if (!isValidEmail(email) || isInternalEmail(email)) {
    return false;
  }

  const [localPart, domain = ""] = email.toLowerCase().split("@");
  if (domain === "mail.gmail.com") {
    return false;
  }

  if (localPart.length <= 3 && /^[a-z0-9+._-]+$/.test(localPart)) {
    return false;
  }

  return true;
}

function hasPositiveDecision(customer: Record<string, unknown>) {
  return Boolean(
    customer.hasPositiveDecision ||
      customer.positiveDecision ||
      customer.stageOneClosed ||
      getCustomerString(customer, ["statusLabel", "status"])
        .toLowerCase()
        .includes("decizie"),
  );
}

function joinCaseValues(customer: Record<string, unknown>, keys: string[]) {
  const cases = customer.carFinanceCases;
  if (!Array.isArray(cases)) {
    return "-";
  }

  const values = new Set<string>();
  cases.forEach((item) => {
    if (!item || typeof item !== "object") {
      return;
    }

    keys.forEach((key) => {
      const value = (item as Record<string, unknown>)[key];
      if (typeof value === "string" && value.trim()) {
        values.add(value.trim());
      }
    });
  });

  return values.size ? Array.from(values).join(", ") : "-";
}

function summarizePayments(customer: Record<string, unknown>) {
  const payments = customer.successfulPayments;
  if (!Array.isArray(payments) || !payments.length) {
    return "-";
  }

  const paymentLines = payments.map(formatPaymentLine).filter(Boolean);
  return paymentLines.length ? paymentLines.join("; ") : "-";
}

function formatPaymentLine(payment: unknown) {
  if (!payment || typeof payment !== "object") {
    return "";
  }

  const record = payment as Record<string, unknown>;
  const date =
    formatPaymentDate(
      readFirstValue(record, [
        "paymentDate",
        "paidAt",
        "paidAtUtc",
        "createdAt",
        "createdAtUtc",
        "date",
        "paymentDateUtc",
      ]),
    ) || "Date unknown";
  const amount = formatPaymentAmount(
    readFirstValue(record, [
      "amount",
      "amountGbp",
      "paymentAmount",
      "paidAmount",
      "grossAmount",
      "total",
      "value",
    ]),
  );

  return amount ? `${date} - ${amount}` : `${date} - amount unknown`;
}

function readFirstValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && String(value).trim()) {
      return value;
    }
  }

  return "";
}

function formatPaymentDate(value: unknown) {
  if (!value) {
    return "";
  }

  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatPaymentAmount(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  if (typeof value === "string" && value.includes("£")) {
    return value.trim();
  }

  const amount =
    typeof value === "number"
      ? value
      : Number(String(value).replace(/[£,\s]/g, ""));

  if (!Number.isFinite(amount)) {
    return String(value).trim();
  }

  return `£${amount.toLocaleString("en-GB", {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

function readError(error: unknown) {
  return error instanceof Error ? error.message : "Request failed.";
}
