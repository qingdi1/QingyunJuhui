import assert from "node:assert";
import { describe, it } from "node:test";
import {
  QINGYUN_BASE_URL,
  QINGYUN_PROFILE_ID,
  findQingyunProfile,
  mergeQingyunFetchedModels,
  qingyunProfilePatch,
  upsertQingyunProfile,
  type QingyunProfileFields,
} from "./qingyun-provider.ts";

const profile = (patch: Partial<QingyunProfileFields> = {}): QingyunProfileFields => ({
  id: QINGYUN_PROFILE_ID,
  name: "青云聚汇",
  model: "",
  baseUrl: QINGYUN_BASE_URL,
  upstreamBaseUrl: QINGYUN_BASE_URL,
  apiKey: "",
  protocol: "responses",
  relayMode: "pureApi",
  officialMixApiKey: false,
  testModel: "",
  modelList: "",
  ...patch,
});

describe("Qingyun quick provider", () => {
  it("keeps the endpoint and protocol fixed while trimming the key", () => {
    assert.deepStrictEqual(qingyunProfilePatch("  sk-test  "), {
      name: "青云聚汇",
      baseUrl: QINGYUN_BASE_URL,
      upstreamBaseUrl: QINGYUN_BASE_URL,
      apiKey: "sk-test",
      protocol: "responses",
      relayMode: "pureApi",
      officialMixApiKey: false,
    });
  });

  it("finds an existing Qingyun profile by endpoint", () => {
    const existing = profile({ id: "relay-existing", baseUrl: "https://api.qinggekeji.top/" });
    assert.equal(
      findQingyunProfile([
        profile({ id: "other", baseUrl: "https://example.com/v1", upstreamBaseUrl: "https://example.com/v1" }),
        existing,
      ]),
      existing,
    );
  });

  it("merges fetched models and selects a usable default model", () => {
    const merged = mergeQingyunFetchedModels(
      profile({ model: "missing-model", modelList: "gpt-5.6[1M]" }),
      ["gpt-5.6", "gpt-5.5", "gpt-5.5"],
    );

    assert.equal(merged.model, "gpt-5.5");
    assert.equal(merged.testModel, "gpt-5.5");
    assert.equal(merged.modelList, "gpt-5.6[1M]\ngpt-5.5");
  });

  it("drops retired models while retaining metadata for models still upstream", () => {
    const merged = mergeQingyunFetchedModels(
      profile({ modelList: "retired-model[128K]\ngpt-5.6[1M]" }),
      ["gpt-5.6", "gpt-5.5"],
    );

    assert.equal(merged.modelList, "gpt-5.6[1M]\ngpt-5.5");
  });

  it("upserts the selected Qingyun profile without deleting other Qingyun accounts", () => {
    const oldQingyun = profile({ id: "relay-existing", apiKey: "old" });
    const nextQingyun = profile({ id: "relay-existing", apiKey: "new" });
    const secondQingyun = profile({ id: "relay-second", apiKey: "second" });
    const other = profile({ id: "other", baseUrl: "https://example.com/v1", upstreamBaseUrl: "https://example.com/v1" });
    const result = upsertQingyunProfile([other, oldQingyun, secondQingyun], nextQingyun);

    assert.deepStrictEqual(result, [nextQingyun, other, secondQingyun]);
  });
});
