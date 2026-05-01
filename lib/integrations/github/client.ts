import type { SelectedResource } from "@/lib/integrations/shared/types";

export type GitHubUser = {
  id: number;
  login: string;
  avatar_url: string | null;
  html_url: string;
  type: string;
};

export type GitHubRepo = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  private: boolean;
  fork: boolean;
  archived: boolean;
  language: string | null;
  pushed_at: string | null;
  updated_at: string | null;
  stargazers_count: number;
  open_issues_count: number;
  has_issues: boolean;
  default_branch: string;
  owner: { login: string };
};

export type RepoOption = {
  id: string;
  name: string;
  fullName: string;
  url: string;
  visibility: "public" | "private";
  language: string | null;
  pushedAt: string | null;
  isStarred: boolean;
  isPinned: boolean;
  contentPotential: "high" | "medium" | "low";
  contentSignals: string[];
  defaultBranch: string;
};

export async function githubGet<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: githubHeaders(token),
  });
  if (res.status === 401 || res.status === 403) {
    throw new GitHubTokenError("GitHub access was revoked or denied.");
  }
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as T;
}

export async function getGitHubUser(token: string) {
  return githubGet<GitHubUser>(token, "/user");
}

export async function listGitHubRepos(token: string): Promise<RepoOption[]> {
  const [repos, starred, pinned] = await Promise.all([
    githubGet<GitHubRepo[]>(
      token,
      "/user/repos?per_page=100&sort=pushed&affiliation=owner,collaborator,organization_member",
    ),
    githubGet<GitHubRepo[]>(token, "/user/starred?per_page=100").catch(() => []),
    listPinnedRepos(token).catch(() => new Set<string>()),
  ]);

  const starredIds = new Set(starred.map((repo) => repo.id));
  const options = repos
    .filter((repo) => !repo.archived)
    .map((repo) => toRepoOption(repo, starredIds.has(repo.id), pinned))
    .sort(compareRepoOptions);

  return options;
}

export function repoOptionToSelectedResource(
  repo: RepoOption,
): SelectedResource {
  return {
    id: repo.id,
    name: repo.name,
    fullName: repo.fullName,
    url: repo.url,
    selectedAt: new Date().toISOString(),
    metadata: {
      visibility: repo.visibility,
      language: repo.language,
      pushedAt: repo.pushedAt,
      defaultBranch: repo.defaultBranch,
      contentPotential: repo.contentPotential,
      contentSignals: repo.contentSignals,
    },
  };
}

export function compareRepoOptions(a: RepoOption, b: RepoOption) {
  const score = (repo: RepoOption) =>
    (repo.isPinned ? 10_000 : 0) +
    (repo.isStarred ? 5_000 : 0) +
    (repo.contentPotential === "high"
      ? 1000
      : repo.contentPotential === "medium"
        ? 500
        : 0) +
    (repo.pushedAt ? new Date(repo.pushedAt).getTime() / 1_000_000_000 : 0);
  return score(b) - score(a);
}

function toRepoOption(
  repo: GitHubRepo,
  isStarred: boolean,
  pinned: Set<string>,
): RepoOption {
  const pushedAt = repo.pushed_at ?? repo.updated_at;
  const daysSincePush = pushedAt
    ? (Date.now() - new Date(pushedAt).getTime()) / 86_400_000
    : Infinity;
  const contentSignals = [
    daysSincePush < 45 ? "recent commits" : null,
    repo.has_issues && repo.open_issues_count > 0 ? "active issues" : null,
    repo.stargazers_count > 0 ? "external interest" : null,
    repo.language ? `${repo.language} codebase` : null,
  ].filter(Boolean) as string[];
  const contentPotential =
    contentSignals.length >= 3 || daysSincePush < 14
      ? "high"
      : contentSignals.length >= 1 || daysSincePush < 90
        ? "medium"
        : "low";

  return {
    id: String(repo.id),
    name: repo.name,
    fullName: repo.full_name,
    url: repo.html_url,
    visibility: repo.private ? "private" : "public",
    language: repo.language,
    pushedAt,
    isStarred,
    isPinned: pinned.has(repo.full_name),
    contentPotential,
    contentSignals,
    defaultBranch: repo.default_branch,
  };
}

async function listPinnedRepos(token: string) {
  const query = `
    query {
      viewer {
        pinnedItems(first: 100, types: REPOSITORY) {
          nodes {
            ... on Repository { nameWithOwner }
          }
        }
      }
    }
  `;
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: githubHeaders(token),
    body: JSON.stringify({ query }),
  });
  if (!res.ok) return new Set<string>();
  const data = (await res.json()) as {
    data?: { viewer?: { pinnedItems?: { nodes?: { nameWithOwner?: string }[] } } };
  };
  return new Set(
    data.data?.viewer?.pinnedItems?.nodes
      ?.map((node) => node.nameWithOwner)
      .filter(Boolean) as string[],
  );
}

function githubHeaders(token: string): Record<string, string> {
  return {
    accept: "application/vnd.github+json",
    authorization: `Bearer ${token}`,
    "x-github-api-version": "2022-11-28",
  };
}

export class GitHubTokenError extends Error {
  readonly code = "GITHUB_TOKEN_REVOKED" as const;
}
