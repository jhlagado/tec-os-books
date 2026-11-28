---
title: Breakpoints, running to a target and catching live programs
parent: TBUG
nav_order: 3
nav_group: Using TBUG
---

# 3. Breakpoints, running to a target and catching live programs

Single-stepping gets you through six instructions. The moment a program fills a table, clears a screen or loops a hundred times before hitting the broken line, tapping `F8` stops being practical. You want the Z80 running at full speed right up to the spot you want to inspect and halting cleanly there.

TBUG gives you three ways to catch a full-speed program, moving from the lightest touch to the widest reach: a disposable one-shot run to a line, persistent breakpoints and breaking into a live program at its next OS call.

## Run freely or stop once at a line

From Registers, Stack, Memory or Labels, pressing `F5` (`Fn+5` on the TEC-1G) lets the program run freely until exit or a breakpoint. In Code, `F5` has a handy twist that saves you from setting and clearing throwaway breakpoints.

When `>` sits on the same row as `→` (`PC`), `F5` runs freely. Scroll `>` off `PC` onto another instruction and press `F5` instead, and TBUG places an invisible temporary stop on that row and runs to it. Once the CPU halts there, the temporary stop vanishes with no `□` mark left behind. Any persistent breakpoint sitting along the way still fires first.

That single habit makes jumping past a loop effortless: scroll `>` to the instruction right after `DJNZ`, hit `F5` and land there in one move. Watch the flip side too. If `F5` in Code stops sooner than you expected, check whether `>` had been scrolled away from `→`. `P` puts `>` back on `PC` so `F5` runs freely again.

## Persistent breakpoints

When you want to stop at the same line on every pass through a loop or every call to a routine, set a persistent breakpoint with `Space`.

Start `tbug step` from `B:WORK>`. The stop opens in Code, with `>` and `→` together on `0100 LD HL,1234`. Move `>` down twice to `0104 POP DE`, leaving `→` back at `0100`:

<!-- Tecos 4c555ff with TBUG 1215559, starter card 48a9309f: TECOS=<checkout> node scripts/tbug-capture.mjs --card tbug.img '>b:' '>tas step' '!tbug step' down down Space R F5 C, where tbug.img holds this book's HELLO.ASM, STEP.ASM and FILL.ASM on B. The LCD after the second down. -->
```text
START:
 →0100 LD HL,1234
  0103 PUSH HL
> 0104 POP DE
```

Press `Space`. A hollow box `□` appears in column 2 beside `0104`, and the top row reports `BP SET 0104` in place of the label:

<!-- Tecos 4c555ff with TBUG 1215559, starter card 48a9309f: TECOS=<checkout> node scripts/tbug-capture.mjs --card tbug.img '>b:' '>tas step' '!tbug step' down down Space R F5 C, where tbug.img holds this book's HELLO.ASM, STEP.ASM and FILL.ASM on B. The LCD after Space. -->
```text
BP SET 0104
 →0100 LD HL,1234
  0103 PUSH HL
>□0104 POP DE
```

`Space` toggles breakpoints in Code and in Labels. Elsewhere, TBUG prints `Select in Code first`. Pressing `Space` a second time on a marked row clears the breakpoint and prints `BP REMOVED 0104`.

Jump back to Registers with `R` and press `F5`. The Z80 runs `LD HL,$1234` and `PUSH HL` at full speed and halts right before `POP DE`:

<!-- Tecos 4c555ff with TBUG 1215559, starter card 48a9309f: TECOS=<checkout> node scripts/tbug-capture.mjs --card tbug.img '>b:' '>tas step' '!tbug step' down down Space R F5 C, where tbug.img holds this book's HELLO.ASM, STEP.ASM and FILL.ASM on B. The LCD after F5. -->
```text
>PC 0104  SP 8CFC BP
 AF 0000  BC 0000 SY
 DE 0000  HL 1234 ..
 IX 0000  IY 0000 ..
```

`BP` on row 1 confirms a breakpoint hit. `HL` already holds `1234` and `SP` has already dropped to `8CFC`, proving `PUSH HL` ran while `POP DE` is still waiting. Press `C` to view Code and column 2 on `0104` now shows a solid block `█`, meaning `PC` is stopped on a user breakpoint.

## Patching and restoring with `RST 30h`

A Z80 has no hardware breakpoint registers, so TBUG patches RAM while the program runs. Pressing `Space` at `0104h` records the address and saves its original opcode byte (`D1h` for `POP DE`). While stopped, RAM stays completely untouched so Code and Memory show the real bytes.

When you press `F5`, TBUG writes `F7h` (`RST 30h`, also called `RST 6`) over the first byte at `0104h` and starts the CPU. When execution hits `0104h`, `RST 30h` jumps straight into TBUG's trap handler. TBUG saves every register, writes the original `D1h` byte back into `0104h`, leaves the breakpoint registered in its table and draws the LCD with `BP`.

![Pressing Space registers 0104h and saves D1h. While running under F5, TBUG patches 0104h with F7h (RST 30h). On trap, TBUG restores D1h and stops with BP.](/images/tbug/breakpoint.svg)

That mechanism explains two limits you will run into:

- **Inside the `.COM` only:** Breakpoints must lie inside the loaded program image. Trying to set one in ROM or outside the `.COM` prints `Not in the COM`.
- **Eight slots:** Up to eight user breakpoints can be active at once. A ninth prints `BP FULL (8)` until you toggle one off with `Space`.

Because TBUG restores the original opcode at every stop, stepping past a breakpoint with `F8` or continuing with `F5` runs the real instruction cleanly and sets the trap again automatically.

## Breaking into a running program

Sometimes you hit `F5` and realise the program has wandered into an endless loop with no breakpoint ahead of it. Hold `Ctrl+Esc` while the program runs. The same works while `F7` steps over a call, while `F6` steps out and while `F5` runs to a line, so a step over a call that loops on the BDOS can be stopped too.

TBUG catches the program at its next call to Tecos through `0005h` (the BDOS entry) before that call executes. The LCD stops at `PC 0005`, with the caller's return address sitting at the top of Stack. From there you can press `S` to see which routine called the BDOS, jump to Code with `C`, inspect registers or plant a breakpoint. Press `F5` to continue right into the OS call.

Two boundaries limit `Ctrl+Esc`:

- **Buffered line input:** While a program sits inside a BDOS line read (function 10), Tecos owns the keyboard and ignores `Ctrl+Esc`. Finish the line with `Enter`, then hold `Ctrl+Esc`, and TBUG stops at the program's next BDOS call.
- **Tight CPU loops:** Any program printing, reading a file or polling the console hits `0005h` and stops straight away. A pure calculation loop that never calls `0005h` cannot be caught this way. Set a breakpoint inside the loop and run again.

![Three ways to stop a running program: one-shot F5 off PC, persistent Space breakpoints and Ctrl+Esc at the next BDOS call.](/images/tbug/stop-paths.svg)

_Checked against Tecos `4c555ff` with TBUG `1215559`, on the starter card in the emulated TEC-1G, 28 November 2026._
