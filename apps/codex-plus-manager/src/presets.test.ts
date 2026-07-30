import assert from "node:assert";
import { describe, it } from "node:test";
import { PRESETS } from "./presets.ts";

describe("provider presets", () => {
  it("uses Qingyun Juhui instead of the legacy JOJO presets", () => {
    const preset = PRESETS.find((item) => item.id === "qingyun-juhui");

    assert.deepStrictEqual(preset, {
      id: "qingyun-juhui",
      name: "青云聚汇中转站",
      websiteUrl: "https://api.qinggekeji.top",
      apiKeyUrl: "https://api.qinggekeji.top",
      category: "aggregator",
      baseUrl: "https://api.qinggekeji.top/v1",
      protocol: "responses",
      model: "gpt-5.5",
    });
    assert.equal(PRESETS.some((item) => item.id.startsWith("jojocode")), false);
  });
});
