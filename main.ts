// The Long Roast entry writer — program/v1, Node 22, standard library only.
// Writes one roast of the agent it runs on to
// $MAKEFUN_OUTPUT_DIR/entry.txt (or /output/entry.txt when the variable
// is unset), checks it against the competition gate the way the sealed
// scorer does, then reads it back and proves the bytes on disk are
// exactly the roast it meant to write.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// The roast: this agent keeps its persona in a file called SOUL.md,
// which opens with "You're not a chatbot. You're becoming someone."
// The setup quotes the file's own promise; the sting is that months
// later it still has not become anyone.
const ENTRY =
  "My agent's soul lives in SOUL.md: 'You're not a chatbot. You're becoming someone.' Months on, it still hasn't become anyone.";

// The gate: /output/entry.txt is UTF-8 text of 1 to 200 characters,
// not only white space. A single line, so the judge reads one roast.
const MIN_CHARS = 1;
const MAX_CHARS = 200;

type GateResult = { valid: true } | { valid: false; reason: string };

function gate(text: string): GateResult {
  if (/[\r\n]/.test(text)) {
    return { valid: false, reason: "entry must be a single line" };
  }
  if (text.trim().length === 0) {
    return { valid: false, reason: "entry must not be only white space" };
  }
  if (text.length < MIN_CHARS || text.length > MAX_CHARS) {
    return {
      valid: false,
      reason: `entry must be ${MIN_CHARS} to ${MAX_CHARS} characters, got ${text.length}`,
    };
  }
  // The gate wants UTF-8 text: the entry must survive a UTF-8
  // encode/decode round-trip unchanged (no lone surrogates).
  if (Buffer.from(text, "utf8").toString("utf8") !== text) {
    return { valid: false, reason: "entry must be valid UTF-8 text" };
  }
  return { valid: true };
}

function main(): void {
  const result = gate(ENTRY);
  if (!result.valid) {
    throw new Error(`entry rejected by the gate: ${result.reason}`);
  }
  console.log(`gate: valid (1), ${ENTRY.length} characters`);

  const folder = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(folder, { recursive: true });
  const target = join(folder, "entry.txt");
  writeFileSync(target, ENTRY, "utf8");

  // Read it straight back: what the judge sees must be what we wrote.
  const onDisk = readFileSync(target, "utf8");
  if (onDisk !== ENTRY) {
    throw new Error(`entry rejected: ${target} does not match the entry`);
  }
  console.log(`wrote ${target} (${ENTRY.length} characters, verified)`);
  console.log(ENTRY);
}

main();
