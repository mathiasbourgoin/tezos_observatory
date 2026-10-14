import { describe, expect, it } from "vitest";
import { roundSchedule } from "../../src/consensus/roundSchedule";

describe("Tenderbake schedule", () => {
  it("advances on the exact boundary and uses cumulative durations", () => {
    expect(roundSchedule(1000, 6, 3, 6999).round).toBe(0);
    expect(roundSchedule(1000, 6, 3, 7000)).toEqual({
      round: 1,
      startedAt: 7000,
      endsAt: 16000,
    });
    const start121 = 1000 + (121 * 6 + (3 * 121 * 120) / 2) * 1000;
    expect(roundSchedule(1000, 6, 3, start121).round).toBe(121);
    expect(roundSchedule(1000, 6, 3, start121).endsAt - start121).toBe(369000);
  });
  it("supports a zero increment and a future round-zero boundary", () => {
    expect(roundSchedule(1000, 6, 0, 13000).round).toBe(2);
    expect(roundSchedule(1000, 6, 3, 0).startedAt).toBe(1000);
  });
});
