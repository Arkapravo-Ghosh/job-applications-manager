import { test } from "node:test";
import assert from "node:assert/strict";
import { ghostingDeadline, ghostingSettingsSchema, GHOSTING_PRESETS, presetForDuration, DEFAULT_GHOSTING_SETTINGS } from "../src/lib/ghosting";

const date = (value: string) => new Date(value);
const duration = { years: 0, months: 0, weeks: 0, days: 0 };
for (const [label, baseline, units, expected] of [
  ["month end", "2026-01-31T10:20:30.123Z", { months: 1 }, "2026-02-28T10:20:30.123Z"],
  ["leap month", "2024-01-31T10:20:30.123Z", { months: 1 }, "2024-02-29T10:20:30.123Z"],
  ["leap year", "2024-02-29T10:20:30.123Z", { years: 1 }, "2025-02-28T10:20:30.123Z"],
  ["combined units", "2024-02-29T10:20:30.123Z", { years: 1, months: 1, weeks: 2, days: 3 }, "2025-04-15T10:20:30.123Z"],
  ["combined months clamp once", "2024-02-29T10:20:30.123Z", { years: 1, months: 1 }, "2025-03-29T10:20:30.123Z"],
  ["DST-independent weeks", "2026-03-07T10:20:30.123Z", { weeks: 1 }, "2026-03-14T10:20:30.123Z"],
] as const) {
  test(label, () => assert.equal(ghostingDeadline(date(baseline), { ...duration, ...units }).toISOString(), expected));
}
for (const preset of GHOSTING_PRESETS) {
  test(`preset ${preset.label} is valid and round-trips`, () => {
    assert.equal(ghostingSettingsSchema.safeParse({ ...preset, enabled: true }).success, true);
    assert.equal(presetForDuration(preset), preset.value);
  });
}
test("defaults are off and three months", () => {
  assert.equal(DEFAULT_GHOSTING_SETTINGS.enabled, false);
  assert.equal(presetForDuration(DEFAULT_GHOSTING_SETTINGS), "3m");
});
for (const invalid of [
  { ...duration }, { ...duration, days: -1 }, { ...duration, days: 0.5 },
  { ...duration, days: NaN }, { ...duration, days: Infinity },
  { ...duration, years: 9999 }, { ...duration, days: "7" },
]) {
  test(`rejects invalid duration ${JSON.stringify(invalid)}`, () => {
    assert.equal(ghostingSettingsSchema.safeParse({ ...invalid, enabled: true }).success, false);
  });
}
test("custom duration can combine units", () => {
  assert.equal(presetForDuration({ ...duration, months: 1, weeks: 2 }), "custom");
});
