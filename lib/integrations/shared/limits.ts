export const PRO_GITHUB_REPO_SELECTION_LIMIT = 1;

export function githubRepoSelectionLimitForTier(tier: string) {
  return tier === "pro" ? PRO_GITHUB_REPO_SELECTION_LIMIT : 0;
}
