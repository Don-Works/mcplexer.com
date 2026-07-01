import { config } from "@/lib/config";

// getLatestVersion resolves the latest published GitHub Release tag (e.g.
// "v0.5.0") so the site can show the current version WITHOUT a redeploy on
// every release. Fetched server-side with ISR: revalidated hourly and cached
// between requests, so it's effectively free and always fresh. Returns null on
// any failure (rate limit, network, no releases) — callers should render
// nothing rather than a stale/placeholder version.
export async function getLatestVersion(): Promise<string | null> {
  const repoPath = config.githubUrl.replace(/^https?:\/\/github\.com\//, "");
  try {
    const res = await fetch(
      `https://api.github.com/repos/${repoPath}/releases/latest`,
      {
        headers: { Accept: "application/vnd.github+json" },
        // Revalidate at most once an hour; GitHub's unauthenticated rate limit
        // (60/hr/IP) is ample at this cadence.
        next: { revalidate: 3600 },
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { tag_name?: string };
    return data.tag_name?.trim() || null;
  } catch {
    return null;
  }
}
