#!/usr/bin/env node
// The TBUG book's capture: drives Tecos's own machine model through a TBUG
// session and prints the 20 x 4 LCD after each TBUG key, as the book's screens
// show it. TBUG reads the matrix itself, so each key is held for a fixed time
// (0.1 s), let go, and the LCD is read 2 s later, after a view's title clears.
// After the Tecos session's book capture, made general.
//
//   TECOS=../tec-os node scripts/tbug-capture.mjs [--card IMAGE] STEP...
//
// TECOS names a Tecos checkout built with npm run build && npm run media.
// The card is its dist/starter.img unless --card names another. Each STEP is:
//
//   >LINE   LINE typed at the prompt with Return; waits for the next prompt
//   !LINE   LINE typed with Return; waits for TBUG's first stop on the LCD
//   KEY     a TBUG key: a letter, F1 to F10, up, down, left, right, Tab,
//           BackTab, Esc, Enter or Space
//
// The LCD shows the arrow, the hollow box and the solid block as 7Eh, DBh and
// FFh; they print as →, □ and █.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

if (!process.env.TECOS) throw new Error("set TECOS to a built Tecos checkout");
const TECOS = resolve(process.env.TECOS);
const from = (path) => import(pathToFileURL(resolve(TECOS, path)).href);
const { boot } = await from("test/lib/fixtures.mjs");
const { lcdRows } = await from("test/lib/mon3.mjs");
const { getMatrixCombosForAscii } = await from("node_modules/@jhlagado/debug80-runtime/dist/platforms/tec1g/matrix-keymap.js");

const args = process.argv.slice(2);
let card = resolve(TECOS, "dist/starter.img");
if (args[0] === "--card") { args.shift(); card = resolve(args.shift()); }
const image = new Uint8Array(readFileSync(card));
const m = boot(image, { tms: true, matrix: true, width: 40 });

const run = (n) => { const t = m.cycles + n; m.runUntil(() => m.cycles >= t, n + 100_000, "time"); };
const glyph = (c) => ({ 0x7e: "→", 0xdb: "□", 0xff: "█" })[c.charCodeAt(0)] ?? c;
const lcd = () => lcdRows(m).map((r) => [...r].map(glyph).join("").trimEnd());
let mark = 0;
const consoleSince = () => { const t = m.text(mark).replace(/\r/g, ""); mark = m.output.length; return t; };
const show = (what) => {
  const text = consoleSince();
  console.log(`--- ${what}`);
  if (text.trim()) console.log(text.replace(/\n+$/, "").split("\n").map((l) => `console| ${l}`).join("\n"));
  for (const r of lcd()) console.log(r);
};

const key = (ch) => {
  const c = getMatrixCombosForAscii(ch.charCodeAt(0)).find((x) => !x.capsLock && x.modifier !== "alt");
  return { row: c.row, col: c.col, mod: { shift: 0, ctrl: 1, fn: 2 }[c.modifier] };
};
const ARROW = { up: 3, down: 4, left: 5, right: 6 };
const press = (name) => {
  let k;
  if (/^F\d+$/.test(name)) k = { ...key(String(Number(name.slice(1)) % 10)), mod: 2 };
  else if (ARROW[name] !== undefined) k = { row: 0, col: ARROW[name] };
  else if (name === "Tab") k = key("\t");
  else if (name === "BackTab") k = { ...key("\t"), mod: 0 };
  else if (name === "Esc") k = key("\x1b");
  else if (name === "Enter") k = key("\r");
  else if (name === "Space") k = key(" ");
  else if (name.length === 1) k = key(name.toLowerCase());
  else throw new Error(`unknown key ${name}`);
  if (k.mod !== undefined) m.tec1g.applyMatrixKey(0, k.mod, true);
  m.tec1g.applyMatrixKey(k.row, k.col, true);
  run(400_000);
  m.tec1g.applyMatrixKey(k.row, k.col, false);
  if (k.mod !== undefined) m.tec1g.applyMatrixKey(0, k.mod, false);
  run(9_200_000);
  show(name);
};

for (const step of args) {
  if (step.startsWith(">")) {
    m.typeMatrix(`${step.slice(1)}\r`);
    m.runUntil(() => m.ready(), 400_000_000, step);
    run(2_000_000);
    show(step);
  } else if (step.startsWith("!")) {
    m.typeMatrix(`${step.slice(1)}\r`);
    m.runUntil(() => /0100/.test(lcdRows(m).join("")), 400_000_000, `${step}: TBUG's first stop`);
    run(1_000_000);
    show(`${step}: first stop`);
    run(8_000_000);
    show(`${step}: first stop, 2 s later`);
  } else press(step);
}
