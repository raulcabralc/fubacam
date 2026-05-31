const DEFAULT_COOLDOWN_MS = 60_000;

let cooldownUntil = 0;

export const isHenrikRateLimited = () => Date.now() < cooldownUntil;

export const getHenrikRateLimitDelayMs = () => Math.max(cooldownUntil - Date.now(), 0);

export const markHenrikRateLimited = (response?: Response) => {
  const retryAfter = response?.headers.get("retry-after");
  const retryAfterMs = retryAfter ? Number(retryAfter) * 1000 : undefined;
  const cooldownMs = retryAfterMs && Number.isFinite(retryAfterMs) ? retryAfterMs : DEFAULT_COOLDOWN_MS;
  cooldownUntil = Math.max(cooldownUntil, Date.now() + cooldownMs);
};

export const getHenrikRateLimitMessage = () =>
  `Henrik API rate limit reached. Cooling down for ${Math.ceil(getHenrikRateLimitDelayMs() / 1000)}s.`;
