import assert from "node:assert";
import { describe, it } from "node:test";
import { PRESETS } from "./presets.ts";
import { QINGYUN_BASE_URL, QINGYUN_SERVICE_URL } from "./qingyun-provider.ts";

describe("provider presets", () => {
  it("uses Qingyun Juhui instead of the legacy JOJO presets", () => {
    const preset = PRESETS.find((item) => item.id === "qingyun-juhui");

    assert.deepStrictEqual(preset, {
      id: "qingyun-juhui",
      name: "青云聚汇中转站",
      websiteUrl: QINGYUN_SERVICE_URL,
      apiKeyUrl: QINGYUN_SERVICE_URL,
      category: "aggregator",
      baseUrl: QINGYUN_BASE_URL,
      protocol: "responses",
      model: "gpt-5.5",
    });
    assert.equal(PRESETS.some((item) => item.id.startsWith("jojocode")), false);
  });
});
