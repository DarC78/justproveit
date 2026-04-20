import { API_BASE_URL, fetchJson } from "@/lib/auth";

const BASE_PATH = "/justproveit/admin/marketing";

export type FacebookOAuthPage = {
  id: string;
  name: string;
  tasks?: string[];
  category?: string | null;
};

export type FacebookOAuthPayload = {
  success?: boolean;
  userAccessToken?: string;
  tokenExpiresAtUtc?: string | null;
  scopes?: string[];
  pages?: FacebookOAuthPage[];
};

export type FacebookConnection = {
  Id: string;
  PageId?: string;
  PageName?: string;
  ProfileKey?: string;
  ProfileName?: string;
  TokenExpiresAtUtc?: string | null;
  IsEnabled?: boolean;
  UpdatedAtUtc?: string;
  AudienceDescription?: string | null;
  DefaultLinkUrl?: string | null;
  DailyPostTarget?: number | null;
  ScheduledCount?: number;
  PublishedCount?: number;
};

export type ScheduledFacebookPost = {
  Id: string;
  SocialConnectionId?: string | null;
  SocialProfileName?: string | null;
  PageId?: string | null;
  PageName?: string | null;
  CustomTitle?: string | null;
  PostText?: string;
  LinkUrl?: string | null;
  ImageUrl?: string | null;
  ScheduledForUtc?: string | null;
  PublishStatus?: string;
  ApprovalStatus?: string;
  SourceTitle?: string | null;
  SourceUrl?: string | null;
};

export type PublishedFacebookPost = {
  Id: string;
  SocialConnectionId?: string | null;
  SocialProfileName?: string | null;
  PageId?: string | null;
  PageName?: string | null;
  ProviderPostId?: string | null;
  PublishedText?: string;
  PublishedAtUtc?: string;
  Status?: string;
  SyncStatus?: string | null;
  LikesCount?: number | null;
  CommentsCount?: number | null;
  ReactionsCount?: number | null;
  SharesCount?: number | null;
  EngagedUsersCount?: number | null;
  MediaViewsCount?: number | null;
  LastSyncedAtUtc?: string | null;
  LastSyncError?: string | null;
};

export type FacebookDashboard = {
  success?: boolean;
  tenant?: {
    key?: string;
    name?: string;
  };
  summary?: {
    connectedPages?: number;
    scheduledPosts?: number;
    publishedPosts?: number;
    likes?: number;
    comments?: number;
    reactions?: number;
    shares?: number;
    engagedUsers?: number;
    mediaViews?: number;
  };
  connections?: FacebookConnection[];
  scheduledPosts?: ScheduledFacebookPost[];
  publishedPosts?: PublishedFacebookPost[];
};

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

export function getApiOrigin() {
  return new URL(API_BASE_URL).origin;
}

export function getFacebookMarketingAuthUrl(token: string) {
  return fetchJson<{ success?: boolean; authUrl?: string }>(
    `${BASE_PATH}/facebook/auth-url`,
    {
      headers: authHeaders(token),
    },
  );
}

export function connectFacebookMarketingPage(
  token: string,
  payload: {
    pageId: string;
    pageName: string;
    userAccessToken: string;
    profileName?: string;
    audienceDescription?: string;
    defaultLinkUrl?: string;
    dailyPostTarget?: number;
  },
) {
  return fetchJson<{ success?: boolean }>(`${BASE_PATH}/facebook/pages/connect`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function getFacebookMarketingDashboard(token: string) {
  return fetchJson<FacebookDashboard>(`${BASE_PATH}/facebook/dashboard`, {
    headers: authHeaders(token),
  });
}
