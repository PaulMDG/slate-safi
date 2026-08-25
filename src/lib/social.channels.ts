/** Client-safe catalogue of every channel we can store API access for. */

export type ChannelKeySpec = {
  name: string;
  label: string;
  hint?: string;
};

export type ChannelSpec = {
  id: string;
  label: string;
  /** Publishing adapters exist for these; the rest store keys for later. */
  publishing: boolean;
  docs: string;
  keys: ChannelKeySpec[];
};

export const CHANNELS: ChannelSpec[] = [
  {
    id: "x",
    label: "X / Twitter",
    publishing: true,
    docs: "developer.x.com — create an app, then generate a user access token with tweet.write.",
    keys: [
      { name: "X_ACCESS_TOKEN", label: "Access token", hint: "OAuth 2.0 user token" },
      { name: "X_ACCESS_SECRET", label: "Access secret", hint: "Optional (OAuth 1.0a apps)" },
    ],
  },
  {
    id: "instagram",
    label: "Instagram",
    publishing: true,
    docs: "developers.facebook.com — Instagram Graph API on a Business/Creator account.",
    keys: [
      { name: "INSTAGRAM_ACCESS_TOKEN", label: "Access token" },
      { name: "INSTAGRAM_USER_ID", label: "Instagram user ID" },
    ],
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    publishing: true,
    docs: "linkedin.com/developers — Share on LinkedIn product, w_member_social scope.",
    keys: [
      { name: "LINKEDIN_ACCESS_TOKEN", label: "Access token" },
      { name: "LINKEDIN_AUTHOR_URN", label: "Author URN", hint: "urn:li:person:… or urn:li:organization:…" },
    ],
  },
  {
    id: "facebook",
    label: "Facebook Page",
    publishing: false,
    docs: "developers.facebook.com — Page access token with pages_manage_posts.",
    keys: [
      { name: "FACEBOOK_PAGE_TOKEN", label: "Page access token" },
      { name: "FACEBOOK_PAGE_ID", label: "Page ID" },
    ],
  },
  {
    id: "youtube",
    label: "YouTube",
    publishing: false,
    docs: "console.cloud.google.com — YouTube Data API v3 OAuth client.",
    keys: [
      { name: "YOUTUBE_ACCESS_TOKEN", label: "Access token" },
      { name: "YOUTUBE_CHANNEL_ID", label: "Channel ID" },
    ],
  },
  {
    id: "tiktok",
    label: "TikTok",
    publishing: false,
    docs: "developers.tiktok.com — Content Posting API (app review required).",
    keys: [
      { name: "TIKTOK_ACCESS_TOKEN", label: "Access token" },
      { name: "TIKTOK_OPEN_ID", label: "Open ID" },
    ],
  },
  {
    id: "threads",
    label: "Threads",
    publishing: false,
    docs: "developers.facebook.com — Threads API, linked to the Instagram account.",
    keys: [
      { name: "THREADS_ACCESS_TOKEN", label: "Access token" },
      { name: "THREADS_USER_ID", label: "Threads user ID" },
    ],
  },
];

export const CHANNEL_BY_ID: Record<string, ChannelSpec> = Object.fromEntries(
  CHANNELS.map((c) => [c.id, c]),
);

export const ALL_CREDENTIAL_KEYS = CHANNELS.flatMap((c) => c.keys.map((k) => k.name));

/** Keys that must all be present before a channel counts as connected. */
export const REQUIRED_KEYS: Record<string, string[]> = {
  x: ["X_ACCESS_TOKEN"],
  instagram: ["INSTAGRAM_ACCESS_TOKEN", "INSTAGRAM_USER_ID"],
  linkedin: ["LINKEDIN_ACCESS_TOKEN", "LINKEDIN_AUTHOR_URN"],
  facebook: ["FACEBOOK_PAGE_TOKEN", "FACEBOOK_PAGE_ID"],
  youtube: ["YOUTUBE_ACCESS_TOKEN", "YOUTUBE_CHANNEL_ID"],
  tiktok: ["TIKTOK_ACCESS_TOKEN", "TIKTOK_OPEN_ID"],
  threads: ["THREADS_ACCESS_TOKEN", "THREADS_USER_ID"],
};
