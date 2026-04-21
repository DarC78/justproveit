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
  PostingBriefDocument?: string | null;
  GenerationCommand?: string | null;
  AudienceDescription?: string | null;
  DefaultLinkUrl?: string | null;
  DailyPostTarget?: number | null;
  CreatedCount?: number;
  ScheduledCount?: number;
  PublishedCount?: number;
};

export type FacebookLiveConnection = {
  connectionId: string;
  pageId?: string | null;
  pageName?: string | null;
  profileName?: string | null;
  fanCount?: number;
  followersCount?: number;
  pageLink?: string | null;
  pictureUrl?: string | null;
  latestPostAtUtc?: string | null;
  error?: string | null;
};

export type FacebookLivePagePost = {
  id: string;
  connectionId?: string | null;
  pageId?: string | null;
  pageName?: string | null;
  profileName?: string | null;
  message?: string | null;
  createdTimeUtc?: string | null;
  permalinkUrl?: string | null;
  pictureUrl?: string | null;
  statusType?: string | null;
  likesCount?: number | null;
  commentsCount?: number | null;
  reactionsCount?: number | null;
  sharesCount?: number | null;
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
  CreatedAtUtc?: string | null;
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
    createdPosts?: number;
    scheduledPosts?: number;
    publishedPosts?: number;
    likes?: number;
    comments?: number;
    reactions?: number;
    shares?: number;
    engagedUsers?: number;
    mediaViews?: number;
    followers?: number;
    fans?: number;
    livePosts?: number;
  };
  connections?: FacebookConnection[];
  liveConnections?: FacebookLiveConnection[];
  recentPagePosts?: FacebookLivePagePost[];
  createdPosts?: ScheduledFacebookPost[];
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
    userAccessToken?: string;
    accessToken?: string;
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

export function saveFacebookContentSettings(
  token: string,
  payload: {
    pageId: string;
    postingBriefDocument?: string;
    generationCommand?: string;
  },
) {
  return fetchJson<{ success?: boolean }>(`${BASE_PATH}/facebook/pages/settings`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function generateFacebookDrafts(
  token: string,
  payload: {
    pageId: string;
    draftCount: number;
  },
) {
  return fetchJson<{ success?: boolean; drafted?: number }>(`${BASE_PATH}/facebook/drafts/generate`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function syncFacebookAdPosts(token: string) {
  return fetchJson<{
    success?: boolean;
    processedAccounts?: number;
    matchedAds?: number;
    importedPosts?: number;
  }>(`${BASE_PATH}/facebook/ads/posts/sync`, {
    method: "POST",
    headers: authHeaders(token),
  });
}

export function syncFacebookComments(token: string) {
  return fetchJson<{
    success?: boolean;
    processedPosts?: number;
    items?: Array<{ status?: string; syncedComments?: number }>;
  }>(`${BASE_PATH}/facebook/comments/sync`, {
    method: "POST",
    headers: authHeaders(token),
  });
}
