import { describe, expect, it } from "vitest";

import {
  extractFaceitMatchId,
  normalizeFaceitMatchLinkForDisplay,
} from "@/lib/faceitMatchId";

const VALID_ID = "1-59d69823-3169-45a8-9973-e9cf825d5588";

describe("extractFaceitMatchId", () => {
  it("accepts a bare FACEIT match ID", () => {
    expect(extractFaceitMatchId(VALID_ID)).toBe(VALID_ID);
  });

  it("accepts a FACEIT room URL (en locale)", () => {
    const url = `https://www.faceit.com/en/cs2/room/${VALID_ID}`;
    expect(extractFaceitMatchId(url)).toBe(VALID_ID);
  });

  it("accepts a FACEIT room URL with query string", () => {
    const url = `https://www.faceit.com/en/cs2/room/${VALID_ID}?from=profile`;
    expect(extractFaceitMatchId(url)).toBe(VALID_ID);
  });

  it("accepts a FACEIT room URL with mixed locale path", () => {
    const url = `https://www.faceit.com/ar/cs2/room/${VALID_ID}`;
    expect(extractFaceitMatchId(url)).toBe(VALID_ID);
  });

  it("normalises input to lowercase", () => {
    const upper = VALID_ID.toUpperCase();
    expect(extractFaceitMatchId(upper)).toBe(VALID_ID);
  });

  it("trims whitespace", () => {
    expect(extractFaceitMatchId(`  ${VALID_ID}  `)).toBe(VALID_ID);
  });

  it("returns null for a plain random string", () => {
    expect(extractFaceitMatchId("not-a-faceit-id")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(extractFaceitMatchId("")).toBeNull();
  });

  it("returns null for a VALORANT match ID format", () => {
    expect(extractFaceitMatchId("NA-1234567890")).toBeNull();
  });

  it("returns null for a URL without a /room/ segment", () => {
    const url = "https://www.faceit.com/en/cs2/championship/overview";
    expect(extractFaceitMatchId(url)).toBeNull();
  });

  it("returns null for a partial UUID that does not start with '1-'", () => {
    const badId = "2-59d69823-3169-45a8-9973-e9cf825d5588";
    expect(extractFaceitMatchId(badId)).toBeNull();
  });
});

describe("normalizeFaceitMatchLinkForDisplay", () => {
  it("accepts a bare FACEIT match ID without creating a URL", () => {
    expect(normalizeFaceitMatchLinkForDisplay(VALID_ID)).toEqual({
      matchId: VALID_ID,
      matchUrl: null,
    });
  });

  it("keeps a sanitized FACEIT room URL for player display", () => {
    const url = `https://www.faceit.com/en/cs2/room/${VALID_ID}?from=profile#chat`;

    expect(normalizeFaceitMatchLinkForDisplay(url)).toEqual({
      matchId: VALID_ID,
      matchUrl: `https://www.faceit.com/en/cs2/room/${VALID_ID}`,
    });
  });

  it("rejects non-FACEIT URLs even if they contain a valid room id", () => {
    const url = `https://example.com/en/cs2/room/${VALID_ID}`;

    expect(normalizeFaceitMatchLinkForDisplay(url)).toBeNull();
  });

  it("rejects malformed display links", () => {
    expect(normalizeFaceitMatchLinkForDisplay("https://www.faceit.com/no-room")).toBeNull();
  });
});
