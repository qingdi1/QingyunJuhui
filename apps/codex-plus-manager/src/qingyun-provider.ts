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
  modelWindows: string;
  modelVlm: string;
};

export function isQingyunProfile(profile: Pick<QingyunProfileFields, "id" | "baseUrl" | "upstreamBaseUrl">): boolean {
  if (profile.id === QINGYUN_PROFILE_ID) return true;
  return [profile.baseUrl, profile.upstreamBaseUrl].some((url) => {
    const normalized = url.trim().replace(/\/+$/, "");
    return normalized === QINGYUN_SERVICE_URL || normalized === QINGYUN_BASE_URL;
  });
}

/// 由 API Key 稳定派生供应商 ID：相同密钥得到相同 ID，不同密钥得到不同 ID。
/// 这样每次用新密钥连接都会生成独立的青云供应商卡并存，同时避免把密钥本身写进 ID。
export function qingyunProfileIdForKey(apiKey: string): string {
  const key = apiKey.trim();
  let fnv = 0x811c9dc5;
  let djb2 = 5381;
  for (let i = 0; i < key.length; i++) {
    const code = key.charCodeAt(i);
    fnv ^= code;
    fnv = (fnv * 0x01000193) >>> 0;
    djb2 = ((djb2 * 33) ^ code) >>> 0;
  }
  const hex = `${fnv.toString(16).padStart(8, "0")}${djb2.toString(16).padStart(8, "0")}`;
  return `${QINGYUN_PROFILE_ID}-${hex}`;
}

export function findQingyunProfile<T extends QingyunProfileFields>(profiles: T[]): T | null {
  return profiles.find((profile) => profile.id === QINGYUN_PROFILE_ID)
    ?? profiles.find(isQingyunProfile)
    ?? null;
}

/// 按密钥定位青云供应商：优先匹配密钥派生的 ID（新卡），
/// 再回退到「端点匹配且密钥相同」的历史卡，保证旧固定 ID 配置能继续复用。
export function findQingyunProfileForKey<T extends QingyunProfileFields>(profiles: T[], apiKey: string): T | null {
  const trimmedKey = apiKey.trim();
  if (!trimmedKey) return null;
  const derivedId = qingyunProfileIdForKey(trimmedKey);
  return profiles.find((profile) => profile.id === derivedId)
    ?? profiles.find((profile) => isQingyunProfile(profile) && profile.apiKey.trim() === trimmedKey)
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

/// 模型同步后裁剪 modelWindows / modelVlm 中已不在 modelList 里的条目，
/// 避免上下文窗口与图片处理配置残留给已下线模型。
export function pruneQingyunWindowMaps<
  T extends Pick<QingyunProfileFields, "modelList" | "modelWindows" | "modelVlm">,
>(profile: T, modelList = profile.modelList): T {
  const retained = new Set(
    modelList
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean),
  );
  const pruneMap = (json: string | undefined): string => {
    let map: Record<string, string> = {};
    try {
      map = JSON.parse(json || "{}") as Record<string, string>;
    } catch {
      return "";
    }
    const pruned: Record<string, string> = {};
    for (const [model, value] of Object.entries(map)) {
      if (retained.has(model)) pruned[model] = value;
    }
    return JSON.stringify(pruned);
  };
  return {
    ...profile,
    modelWindows: pruneMap(profile.modelWindows),
    modelVlm: pruneMap(profile.modelVlm),
  };
}

export function upsertQingyunProfile<T extends QingyunProfileFields>(profiles: T[], profile: T): T[] {
  const trimmedKey = profile.apiKey.trim();
  return [
    profile,
    ...profiles.filter(
      (item) =>
        item.id !== profile.id
        // 同一密钥下的旧固定 ID 卡一并迁走，避免同一账号残留重复卡；
        // 不同密钥的卡各自保留，支持多账号并存。
        && !(item.id === QINGYUN_PROFILE_ID && trimmedKey && item.apiKey.trim() === trimmedKey),
    ),
  ];
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
