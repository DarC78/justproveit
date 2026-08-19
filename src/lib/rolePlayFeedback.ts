import { fetchJson, TENANT_KEY } from "@/lib/auth";

export type RolePlayFeedbackStatus = "yes" | "partial" | "no" | "na";
export type RolePlayParticipantRole = "agent" | "client" | "observer";
export type RolePlayFeedbackGroup = "A" | "B";
export type RolePlayFeedbackEmailScope = "scenario" | "group";

export type RolePlayFeedbackItem = {
  id: string;
  label: string;
  status: RolePlayFeedbackStatus;
};

export type RolePlayFeedbackScenario = {
  id: string;
  title: string;
  group: RolePlayFeedbackGroup;
  participantRole: RolePlayParticipantRole;
  feedbackItems: RolePlayFeedbackItem[];
  notes?: string;
};

export type RolePlayFeedbackSummary = {
  totalItems: number;
  completedItems: number;
  missingItems: number;
  yes: number;
  partial: number;
  no: number;
  notApplicable: number;
  scorePercent: number;
};

export type RolePlayFeedbackPayload = {
  tenantKey?: string;
  source: "pension-role-play-feedback";
  feedbackGroup: RolePlayFeedbackGroup;
  emailScope: RolePlayFeedbackEmailScope;
  scenarioId?: string;
  agentName: string;
  agentEmail: string;
  reviewerName: string;
  reviewerEmail?: string;
  sessionDate: string;
  scenarios: RolePlayFeedbackScenario[];
  summary: RolePlayFeedbackSummary;
  summaryText: string;
  strengths?: string;
  improvements?: string;
  overallNotes?: string;
  domain: string;
  pageUrl: string;
  referrer?: string;
};

export type RolePlayFeedbackEmailResponse = {
  success?: boolean;
  emailSent?: boolean;
  message?: string | null;
  result?: string | null;
  reportId?: string | null;
  emailError?: string | null;
};

export async function sendRolePlayFeedbackEmail(
  token: string,
  payload: RolePlayFeedbackPayload,
) {
  const response = await fetchJson<RolePlayFeedbackEmailResponse>(
    "/justproveit/admin/role-play-feedback/email",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        tenantKey: TENANT_KEY,
        ...payload,
      }),
    },
  );

  if (response.success === false || response.emailSent === false) {
    throw new Error(
      response.emailError ||
        response.message ||
        "Feedback-ul a fost salvat, dar emailul nu a fost trimis.",
    );
  }

  if (response.success !== true && response.emailSent !== true) {
    throw new Error("Backend-ul nu a confirmat trimiterea feedback-ului.");
  }

  return response;
}
