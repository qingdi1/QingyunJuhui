import assert from "node:assert";
import { describe, it } from "node:test";
import {
  QINGYUN_BASE_URL,
  QINGYUN_PROFILE_ID,
  findQingyunProfile,
  findQingyunProfileForKey,
  mergeQingyunFetchedModels,
  pruneQingyunWindowMaps,
  qingyunProfileIdForKey,
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
  modelWindows: "",
  modelVlm: "",
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

  it("replaces a retired existing model with the preferred gateway model", () => {
    const merged = mergeQingyunFetchedModels(
      profile({ model: "gpt-4o", testModel: "gpt-4o" }),
      ["gpt-4o", "gpt-5.5"],
    );

    assert.equal(merged.model, "gpt-5.5");
    assert.equal(merged.testModel, "gpt-5.5");
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

  it("derives a stable profile id from the key without exposing it", () => {
    const idA = qingyunProfileIdForKey("  sk-key-a  ");
    const idB = qingyunProfileIdForKey("sk-key-a");
    const idC = qingyunProfileIdForKey("sk-key-b");

    assert.equal(idA, idB);
    assert.notEqual(idA, idC);
    assert.ok(idA.startsWith("qingyun-juhui-"));
    assert.ok(!idA.includes("sk-key"));
    assert.equal(idA.length, "qingyun-juhui-".length + 16);
  });

  it("finds the Qingyun profile for a key by derived id or legacy fixed id", () => {
    const key = "sk-key-a";
    const derived = profile({ id: qingyunProfileIdForKey(key), apiKey: key });
    const legacy = profile({ apiKey: key });

    assert.equal(findQingyunProfileForKey([profile({ id: "other" }), derived], key), derived);
    assert.equal(findQingyunProfileForKey([profile({ id: "other" }), legacy], key), legacy);
    assert.equal(findQingyunProfileForKey([derived, legacy], key), derived);
    assert.equal(findQingyunProfileForKey([derived], "sk-other-key"), null);
  });

  it("keeps different-key Qingyun cards and migrates the legacy fixed-id card for the same key", () => {
    const legacy = profile({ id: QINGYUN_PROFILE_ID, apiKey: "sk-key-a" });
    const nextA = profile({ id: qingyunProfileIdForKey("sk-key-a"), apiKey: "sk-key-a" });
    const nextB = profile({ id: qingyunProfileIdForKey("sk-key-b"), apiKey: "sk-key-b" });

    const withA = upsertQingyunProfile([legacy], nextA);
    assert.deepStrictEqual(withA, [nextA]);

    const withAB = upsertQingyunProfile(withA, nextB);
    assert.deepStrictEqual(withAB, [nextB, nextA]);
  });

  it("prunes model windows and vlm entries for models no longer in the list", () => {
    const pruned = pruneQingyunWindowMaps(
      profile({
        modelList: "gpt-5.6\nretired-model",
        modelWindows: JSON.stringify({ "gpt-5.6": "1M", "retired-model": "128K" }),
        modelVlm: JSON.stringify({ "gpt-5.6": "vlm", "retired-model": "strip" }),
      }),
      "gpt-5.6",
    );

    assert.equal(pruned.modelWindows, JSON.stringify({ "gpt-5.6": "1M" }));
    assert.equal(pruned.modelVlm, JSON.stringify({ "gpt-5.6": "vlm" }));
  });
});
