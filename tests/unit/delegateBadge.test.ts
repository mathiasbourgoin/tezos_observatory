import {describe, expect, it} from "vitest";
import {delegateBadge} from "../../src/view/delegateBadge";

describe("delegateBadge", () => {
  it("does not interpret a missing value as forbidden", () => {
    expect(delegateBadge(undefined).label).toBe("unavailable");
  });

  it("renders explicit forbidden and eligible states", () => {
    expect(delegateBadge({delegate: "tz1a", eligibility: "forbidden"}).label).toBe("FORBIDDEN");
    expect(delegateBadge({delegate: "tz1b", eligibility: "eligible"}).label).toBe("eligible");
  });
});
