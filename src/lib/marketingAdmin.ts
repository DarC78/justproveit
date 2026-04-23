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
  adAccounts?: FacebookAdAccountOption[];
};

export type FacebookAdAccountOption = {
  id: string;
  name: string;
  accountStatus?: string | number | null;
  currency?: string | null;
  timeZoneName?: string | null;
};

export type FacebookConnectedAdAccount = {
  Id: string;
  TenantId?: string;
  AccountId?: string;
  AccountName?: string;
  Currency?: string | null;
  TimeZoneName?: string | null;
  TokenExpiresAtUtc?: string | null;
  IsEnabled?: boolean;
  UpdatedAtUtc?: string | null;
};

export type FacebookComment = {
  Id: string;
  SocialConnectionId?: string | null;
  ProviderCommentId?: string | null;
  ParentProviderCommentId?: string | null;
  CommentText?: string | null;
  CommenterName?: string | null;
  CommenterProviderUserId?: string | null;
  CommenterProfilePictureUrl?: string | null;
  CommentUrl?: string | null;
  IsHidden?: boolean | null;
  LikeCount?: number | null;
  ReplyCount?: number | null;
  CreatedAtProviderUtc?: string | null;
  LastSyncedAtUtc?: string | null;
  ReplyStatus?: string | null;
  RepliedAtUtc?: string | null;
  LastReplyError?: string | null;
  ProviderPostId?: string | null;
  PublishedAtUtc?: string | null;
  PublishedPostExcerpt?: string | null;
  SocialProfileName?: string | null;
  TenantKey?: string | null;
  TenantName?: string | null;
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
  VideoUrl?: string | null;
  MediaAssetId?: string | null;
  CreatedAtUtc?: string | null;
  ScheduledForUtc?: string | null;
  PublishStatus?: string;
  ApprovalStatus?: string;
  SourceTitle?: string | null;
  SourceUrl?: string | null;
};

export type MarketingMediaTag = {
  id: string;
  key: string;
  label: string;
};

export type MarketingMediaAsset = {
  Id: string;
  TenantId?: string;
  Title: string;
  MediaType: "image" | "video";
  AssetUrl: string;
  ThumbnailUrl?: string | null;
  Description?: string | null;
  IsActive?: boolean;
  CreatedAtUtc?: string | null;
  UpdatedAtUtc?: string | null;
  Tags?: MarketingMediaTag[];
};

export type MarketingMediaUploadPayload = {
  title: string;
  mediaType: "image" | "video";
  file: File;
  thumbnailUrl?: string;
  description?: string;
  tags?: string;
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
    connectedAdAccounts?: number;
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
  adAccounts?: FacebookConnectedAdAccount[];
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

export function connectFacebookMarketingAdAccount(
  token: string,
  payload: {
    accountId: string;
    accountName: string;
    userAccessToken?: string;
    accessToken?: string;
    currency?: string;
    timeZoneName?: string;
  },
) {
  return fetchJson<{ success?: boolean }>(`${BASE_PATH}/facebook/ad-accounts/connect`, {
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
    mediaAssetId?: string;
  },
) {
  return fetchJson<{ success?: boolean; drafted?: number }>(`${BASE_PATH}/facebook/drafts/generate`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function generateManualFacebookDrafts(
  token: string,
  payload: {
    pageId: string;
    draftCount: number;
    operatorSpecs: string;
    mediaAssetId?: string;
  },
) {
  return fetchJson<{ success?: boolean; drafted?: number }>(
    `${BASE_PATH}/facebook/drafts/manual-generate`,
    {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    },
  );
}

export function queueManualFacebookDrafts(
  token: string,
  payload: {
    pageId: string;
    draftIds: string[];
  },
) {
  return fetchJson<{ success?: boolean; queued?: number }>(
    `${BASE_PATH}/facebook/drafts/queue-random`,
    {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    },
  );
}

export function scheduleManualFacebookDrafts(
  token: string,
  payload: {
    scheduleMode: "queue" | "fixed";
    scheduledForUtc?: string;
    items: Array<{
      draftId: string;
      pageId: string;
    }>;
  },
) {
  return fetchJson<{ success?: boolean; scheduled?: number }>(
    `${BASE_PATH}/facebook/drafts/schedule`,
    {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    },
  );
}

export function deleteFacebookDraft(token: string, draftId: string) {
  return fetchJson<{ success?: boolean }>(`${BASE_PATH}/facebook/drafts/${encodeURIComponent(draftId)}/delete`, {
    method: "POST",
    headers: authHeaders(token),
  });
}

export function unscheduleFacebookDraft(token: string, draftId: string) {
  return fetchJson<{ success?: boolean }>(
    `${BASE_PATH}/facebook/drafts/${encodeURIComponent(draftId)}/unschedule`,
    {
      method: "POST",
      headers: authHeaders(token),
    },
  );
}

export function importManualFacebookDrafts(
  token: string,
  payload: {
    pageId: string;
    sourceLabel?: string;
    promptContextSummary?: string;
    posts: Array<{
      customTitle?: string;
      postText: string;
      linkUrl?: string;
      imageUrl?: string;
      mediaAssetId?: string;
      reasoning?: string;
      modelName?: string;
    }>;
    mediaAssetId?: string;
  },
) {
  return fetchJson<{ success?: boolean; imported?: number }>(
    `${BASE_PATH}/facebook/drafts/import`,
    {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    },
  );
}

export function getMarketingMediaAssets(token: string, mediaType?: "image" | "video") {
  const suffix = mediaType ? `?mediaType=${encodeURIComponent(mediaType)}` : "";
  return fetchJson<{ success?: boolean; assets?: MarketingMediaAsset[] }>(
    `${BASE_PATH}/media-library/assets${suffix}`,
    {
      headers: authHeaders(token),
    },
  );
}

export function saveMarketingMediaAsset(
  token: string,
  payload: {
    title: string;
    mediaType: "image" | "video";
    assetUrl: string;
    thumbnailUrl?: string;
    description?: string;
    tagNames?: string[];
  },
) {
  return fetchJson<{ success?: boolean; asset?: MarketingMediaAsset }>(
    `${BASE_PATH}/media-library/assets`,
    {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    },
  );
}

export async function uploadMarketingMediaAsset(token: string, payload: MarketingMediaUploadPayload) {
  const formData = new FormData();
  formData.set("title", payload.title);
  formData.set("mediaType", payload.mediaType);
  formData.set("file", payload.file);
  if (payload.thumbnailUrl) {
    formData.set("thumbnailUrl", payload.thumbnailUrl);
  }
  if (payload.description) {
    formData.set("description", payload.description);
  }
  if (payload.tags) {
    formData.set("tags", payload.tags);
  }

  const response = await fetch(`${API_BASE_URL}${BASE_PATH}/media-library/assets/upload`, {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error((data && typeof data === "object" && "error" in data && typeof data.error === "string" ? data.error : null) || response.statusText || "Upload failed.");
  }

  return data as { success?: boolean; asset?: MarketingMediaAsset };
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

export function getFacebookMarketingComments(
  token: string,
  options?: {
    socialConnectionId?: string;
    replyStatus?: string;
    limit?: number;
  },
) {
  const params = new URLSearchParams();
  if (options?.socialConnectionId) {
    params.set("socialConnectionId", options.socialConnectionId);
  }
  if (options?.replyStatus) {
    params.set("replyStatus", options.replyStatus);
  }
  if (options?.limit) {
    params.set("limit", String(options.limit));
  }

  const suffix = params.size ? `?${params.toString()}` : "";
  return fetchJson<{ success?: boolean; comments?: FacebookComment[] }>(
    `${BASE_PATH}/facebook/comments${suffix}`,
    {
      headers: authHeaders(token),
    },
  );
}
