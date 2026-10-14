export class JsonStreamDecoder {
  private readonly decoder = new TextDecoder();
  private buffer = "";
  private start = -1;
  private depth = 0;
  private inString = false;
  private escaped = false;

  push(chunk: Uint8Array, final = false): unknown[] {
    this.buffer += this.decoder.decode(chunk, {stream: !final});
    this.start = -1;
    this.depth = 0;
    this.inString = false;
    this.escaped = false;
    const values: unknown[] = [];
    let consumed = 0;
    for (let index = 0; index < this.buffer.length; index += 1) {
      const character = this.buffer[index];
      if (this.start < 0) {
        if (character === "{" || character === "[") {
          this.start = index;
          this.depth = 1;
        }
        continue;
      }
      if (this.inString) {
        if (this.escaped) this.escaped = false;
        else if (character === "\\") this.escaped = true;
        else if (character === "\"") this.inString = false;
        continue;
      }
      if (character === "\"") this.inString = true;
      else if (character === "{" || character === "[") this.depth += 1;
      else if (character === "}" || character === "]") {
        this.depth -= 1;
        if (this.depth === 0) {
          const end = index + 1;
          values.push(JSON.parse(this.buffer.slice(this.start, end)) as unknown);
          consumed = end;
          this.start = -1;
        }
      }
    }
    if (consumed > 0) {
      this.buffer = this.buffer.slice(consumed);
      if (this.start >= 0) this.start -= consumed;
    }
    if (this.buffer.length > 4_000_000) throw new Error("RPC stream frame exceeds 4 MB");
    return values;
  }
}
