import {describe, expect, it} from "vitest";
import {JsonStreamDecoder} from "../../src/rpc/jsonStream";

const bytes = (value: string): Uint8Array => new TextEncoder().encode(value);

describe("JsonStreamDecoder", () => {
  it("decodes concatenated values split at arbitrary boundaries", () => {
    const decoder = new JsonStreamDecoder();
    expect(decoder.push(bytes(" {\"a\":\"x}"))).toEqual([]);
    expect(decoder.push(bytes("y\"}[1,{\"b\":2}]"))).toEqual([{a: "x}y"}, [1, {b: 2}]]);
  });
});
