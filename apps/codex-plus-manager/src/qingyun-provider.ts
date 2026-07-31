export const QINGYUN_PROFILE_ID = "qingyun-juhui";
export const QINGYUN_PROFILE_NAME = "青云聚汇";
export const QINGYUN_SERVICE_URL = "https://api.qinggekeji.top";
export const QINGYUN_BASE_URL = `${QINGYUN_SERVICE_URL}/v1`;

export type QingyunProfileFields = {
  id: string;
  name: string;
  model: string;
  baseUrl: string;
  upstreamBaseUrl: string;
  apiKey: string;
  protocol: "responses" | "chatCompletions";
  relayMode: string;
  officialMixApiKey: boolean;
  testModel: string;
  modelList: string;
};

export function isQingyunProfile(profile: Pick<QingyunProfileFields, "id" | "baseUrl" | "upstreamBaseUrl">): boolean {
  if (profile.id === QINGYUN_PROFILE_ID) return true;
  return [profile.baseUrl, profile.upstreamBaseUrl].some((url) => {
    const normalized = url.trim().replace(/\/+$/, "");
    return normalized === QINGYUN_SERVICE_URL || normalized === QINGYUN_BASE_URL;
  });
}

export function findQingyunProfile<T extends QingyunProfileFields>(profiles: T[]): T | null {
  return profiles.find((profile) => profile.id === QINGYUN_PROFILE_ID)
    ?? profiles.find(isQingyunProfile)
    ?? null;
}

export function qingyunProfilePatch(
  apiKey: string,
  protocol: QingyunProfileFields["protocol"] = "responses",
): Partial<QingyunProfileFields> {
  return {
    name: QINGYUN_PROFILE_NAME,
    baseUrl: QINGYUN_BASE_URL,
    upstreamBaseUrl: QINGYUN_BASE_URL,
    apiKey: apiKey.trim(),
    protocol,
    relayMode: "pureApi",
    officialMixApiKey: false,
  };
}

export function mergeQingyunFetchedModels<T extends QingyunProfileFields>(profile: T, fetchedModels: string[]): T {
  const fetched = uniqueModels(fetchedModels);
  if (!fetched.length) return profile;

  const existingLines = profile.modelList
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const existingBySlug = new Map(existingLines.map((line) => [modelSlug(line), line]));
  const modelList = fetched
    .map((model) => existingBySlug.get(modelSlug(model)) ?? model)
    .join("\n");
  const currentModel = modelSlug(profile.model);
  // Prefer models known to be enabled by the Qingyun gateway. An older profile
  // may still contain a retired model which would make the first doctor check
  // fail even though the key and endpoint are valid.
  const selectedModel = ["gpt-5.5", "codex-auto-review"].find((model) => fetched.includes(model))
    ?? (fetched.includes(currentModel) ? currentModel : fetched[0]);

  return {
    ...profile,
    model: selectedModel,
    testModel: selectedModel,
    modelList,
  };
}

export function upsertQingyunProfile<T extends QingyunProfileFields>(profiles: T[], profile: T): T[] {
  return [profile, ...profiles.filter((item) => item.id !== profile.id)];
}

function uniqueModels(models: string[]): string[] {
  const seen = new Set<string>();
  return models
    .map((model) => model.trim())
    .filter((model) => {
      if (!model || seen.has(model)) return false;
      seen.add(model);
      return true;
    });
}

function modelSlug(model: string): string {
  return model.trim().replace(/\[\d+(?:[KkMm])?\]$/, "");
}
