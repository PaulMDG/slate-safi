import { PLATFORMS, type Platform } from "./social.captions";

/** Client-safe automation helpers: link tagging + analytics aggregation. */

export type AutomationSettings = {
  id?: string;
  auto_publish_films: boolean;
  auto_publish_posts: boolean;
  platforms: string[];
  delay_minutes: number;
  evergreen_enabled: boolean;
  evergreen_interval_days: number;
  evergreen_platforms: string[];
  daily_cap: number;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
};

export const DEFAULT_AUTOMATION: AutomationSettings = {
  auto_publish_films: true,
  auto_publish_posts: true,
  platforms: ["x", "instagram", "linkedin"],
  delay_minutes: 5,
  evergreen_enabled: false,
  evergreen_interval_days: 21,
  evergreen_platforms: ["x", "instagram"],
  daily_cap: 6,
  utm_source: "social",
  utm_medium: "organic",
  utm_campaign: "slate-safi",
};

export function validPlatforms(list: string[] | null | undefined): Platform[] {
  const allowed = new Set<string>(PLATFORMS);
  return (list ?? []).filter((p): p is Platform => allowed.has(p));
}

/** Adds UTM tags so website analytics can attribute traffic per platform. */
export function taggedLink(
  url: string,
  platform: Platform,
  settings: Pick<AutomationSettings, "utm_source" | "utm_medium" | "utm_campaign">,
) {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("utm_source", settings.utm_source || platform);
    parsed.searchParams.set("utm_medium", settings.utm_medium || "organic");
    parsed.searchParams.set("utm_campaign", settings.utm_campaign || "slate-safi");
    parsed.searchParams.set("utm_content", platform);
    return parsed.toString();
  } catch {
    return url;
  }
}

export type PostLike = {
  id: string;
  platform: string;
  status: string;
  posted_at: string | null;
  scheduled_for: string | null;
  created_at: string;
  source_type: string;
  attempts: number;
};

export type MetricLike = {
  post_id: string;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
};

export type PlatformStats = {
  platform: Platform;
  queued: number;
  posted: number;
  failed: number;
  impressions: number;
  engagements: number;
  clicks: number;
  engagementRate: number;
  clickRate: number;
};

export type SocialAnalytics = {
  totals: {
    posted: number;
    queued: number;
    failed: number;
    impressions: number;
    engagements: number;
    clicks: number;
    engagementRate: number;
    successRate: number;
    postedLast30: number;
    automated: number;
  };
  perPlatform: PlatformStats[];
  timeline: { date: string; posted: number }[];
  topPosts: { id: string; platform: string; impressions: number; engagements: number }[];
};

function rate(part: number, whole: number) {
  return whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0;
}

export function buildAnalytics(posts: PostLike[], metrics: MetricLike[]): SocialAnalytics {
  const byPost = new Map(metrics.map((m) => [m.post_id, m]));
  const engage = (m: MetricLike) => m.likes + m.comments + m.shares;

  const perPlatform: PlatformStats[] = PLATFORMS.map((platform) => {
    const rows = posts.filter((p) => p.platform === platform);
    const stats = rows.reduce(
      (acc, row) => {
        if (row.status === "posted") acc.posted += 1;
        else if (row.status === "failed") acc.failed += 1;
        else if (row.status === "scheduled" || row.status === "draft" || row.status === "posting")
          acc.queued += 1;
        const m = byPost.get(row.id);
        if (m) {
          acc.impressions += m.impressions;
          acc.engagements += engage(m);
          acc.clicks += m.clicks;
        }
        return acc;
      },
      { queued: 0, posted: 0, failed: 0, impressions: 0, engagements: 0, clicks: 0 },
    );
    return {
      platform,
      ...stats,
      engagementRate: rate(stats.engagements, stats.impressions),
      clickRate: rate(stats.clicks, stats.impressions),
    };
  });

  const posted = perPlatform.reduce((n, p) => n + p.posted, 0);
  const failed = perPlatform.reduce((n, p) => n + p.failed, 0);
  const queued = perPlatform.reduce((n, p) => n + p.queued, 0);
  const impressions = perPlatform.reduce((n, p) => n + p.impressions, 0);
  const engagements = perPlatform.reduce((n, p) => n + p.engagements, 0);
  const clicks = perPlatform.reduce((n, p) => n + p.clicks, 0);

  const days = 14;
  const timeline = Array.from({ length: days }, (_, i) => {
    const day = new Date(Date.now() - (days - 1 - i) * 86_400_000);
    const key = day.toISOString().slice(0, 10);
    return {
      date: key,
      posted: posts.filter((p) => (p.posted_at ?? "").slice(0, 10) === key).length,
    };
  });

  const topPosts = posts
    .map((p) => {
      const m = byPost.get(p.id);
      return {
        id: p.id,
        platform: p.platform,
        impressions: m?.impressions ?? 0,
        engagements: m ? engage(m) : 0,
      };
    })
    .sort((a, b) => b.engagements - a.engagements || b.impressions - a.impressions)
    .slice(0, 5);

  return {
    totals: {
      posted,
      queued,
      failed,
      impressions,
      engagements,
      clicks,
      engagementRate: rate(engagements, impressions),
      successRate: rate(posted, posted + failed),
      postedLast30: posts.filter(
        (p) => p.posted_at && new Date(p.posted_at).getTime() > Date.now() - 30 * 86_400_000,
      ).length,
      automated: posts.filter((p) => p.source_type !== "manual").length,
    },
    perPlatform,
    timeline,
    topPosts,
  };
}
