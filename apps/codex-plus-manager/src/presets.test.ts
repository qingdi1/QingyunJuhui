import assert from "node:assert/strict";
import test from "node:test";

import { PRESETS } from "./presets.ts";
import { QINGYUN_BASE_URL, QINGYUN_SERVICE_URL } from "./qingyun-provider.ts";

test("DeepSeek preset uses the official Responses integration", () => {
  const preset = PRESETS.find((candidate) => candidate.id === "deepseek");
  assert.ok(preset);
  assert.equal(preset.baseUrl, "https://api.deepseek.com/");
  assert.equal(preset.protocol, "responses");
  assert.equal(preset.model, "deepseek-v4-flash");
  assert.deepEqual(preset.modelList, ["deepseek-v4-flash"]);
});

test("Qingyun Juhui replaces the legacy JOJO presets", () => {
  const preset = PRESETS.find((candidate) => candidate.id === "qingyun-juhui");
  assert.deepEqual(preset, {
    id: "qingyun-juhui",
    name: "青云聚汇中转站",
    websiteUrl: QINGYUN_SERVICE_URL,
    apiKeyUrl: QINGYUN_SERVICE_URL,
    category: "aggregator",
    baseUrl: QINGYUN_BASE_URL,
    protocol: "responses",
    model: "gpt-5.5",
  });
  assert.equal(PRESETS.some((candidate) => candidate.id.startsWith("jojocode")), false);
});