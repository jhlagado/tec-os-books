---
title: Stepping through code, registers and the stack
parent: TBUG
nav_order: 2
nav_group: First session
---

# 2. Stepping through code, registers and the stack

Stepping through `HELLO.COM` proved you could watch registers change while the console stayed untouched, but you still had to remember which instruction lived at `0103h`. On a real bug that mental map collapses quickly. A routine returns to the wrong address, a loop runs one time too many or a `POP` pulls back the wrong pair. To catch those mistakes you need the disassembled instructions and the live stack right in front of you.

## A six-byte stack target

Still on drive B (`B:WORK>`), open `STEP.ASM` in `TED` (`ted step.asm`), type these six bytes of Z80 code, save with `^S` and quit with `^Q`:

```asm
        ORG $0100
START:  LD HL,$1234
        PUSH HL
TAKE:   POP DE
        RET
```

Assemble it with `tas step` so `STEP.COM` and `STEP.TBG` land on drive B. If you run `step` on its own, nothing prints and `B:WORK>` comes right back. All of its work happens inside the CPU and on the stack, which gives you a quiet, clean target where every instruction alters one visible piece of state.

Launch it under TBUG:

```text
B:WORK>tbug step
```

TBUG stops before the first instruction and opens Code, with `>→0100 LD HL,1234` under the `START:` label.

## Five views and direct jumps

Eighty character cells cannot fit registers, disassembly, stack, memory and symbols at once, so TBUG splits them into five views:

1. **`C` · Code** disassembles instructions around `PC`. Every stop opens here.
2. **`R` · Registers** shows `PC`, `SP`, the six 16-bit pairs, flags and the stop code.
3. **`Y` · Symbols** lists the program's global labels whenever a matching `.TBG` file is present.
4. **`S` · Stack** lists four 16-bit words starting at `SP`.
5. **`M` · Memory** displays sixteen raw bytes as four rows of four.

Pressing `C`, `R`, `Y`, `S` or `M` jumps directly to that view from any inspection screen. `Tab` also cycles forward in that order, from Memory back round to Code, and `Shift+Tab` cycles backward. Without a matching `.TBG` file, `Tab` passes Symbols by. Each switch flashes the view's name (`CODE`, `STACK`, `MEMORY`) on the bottom row for about half a second before its real fourth row returns. Any key pressed during that flash clears the title immediately and acts at once, so you never wait on the banner once you know the layout.

![C, R, Y, S and M jump directly to Code, Registers, Symbols, Stack and Memory while Tab and Shift+Tab cycle through them in that order. F8 steps into, F7 steps over and F6 steps out.](/images/tbug/views.svg)

You can also drill straight into a related view. In Registers, the arrow keys move `>` across the grid. Hit `Enter` on `PC` to open Code at the stopped instruction, or `Enter` on `SP` to open Stack. `Esc` steps back one level to where you came from. To leave TBUG at any time, press `Q` and confirm `Quit TBUG? Y/N` with `Y` or `Q`.

## Reading disassembled code

From the entry stop of `STEP`, still in Code, tap `F8` (`Fn+8`) once. `LD HL,$1234` runs and `PC` moves to `0103`. Code keeps its window while `PC` stays inside it, so `>→` simply moves down a row:

```text
START:
  0100 LD HL,1234
>→0103 PUSH HL
  0104 POP DE
```

`STEP.TBG` also names `0104` as `TAKE:`, but a label row never takes the bottom row, so it waits until the window scrolls. Press `Left`. It puts `PC` on Code's top row, and `TAKE:` appears right above `0104`:

<!-- Tecos 8c12c9f with TBUG 167f7f0, starter card e2f124e9: TECOS=<checkout> node scripts/tbug-capture.mjs --card tbug.img '>b:' '>tas step' '!tbug step' F8 left down down S F8 Enter Esc C F8 R F5 Q Y, where tbug.img holds this book's HELLO.ASM, STEP.ASM and FILL.ASM on B. The LCD after F8 and Left. -->
```text
>→0103 PUSH HL
TAKE:
  0104 POP DE
  0105 RET
```

Press `Down` twice and `>` moves on to `0105` while `→` stays on `0103`, because browsing never moves `PC`.

Without a `.TBG` file, `0104 POP DE` sits directly below `0103 PUSH HL`. Numbers in Code are hexadecimal with no `$` prefix. Two dedicated marker columns keep selection and execution separate so neither ever hides the other: `>` in column 1 marks the row you are browsing, and `→` in column 2 marks `PC`. On `0103`, both sit together as `>→0103 PUSH HL`.

`Up` and `Down` move `>` through decoded instructions and scroll freely before or after `PC` without changing where the program stopped. Near `PC`, stepping backwards lands cleanly on instruction starts. Farther back, TBUG works out instruction boundaries from the preceding bytes. Whenever you have scrolled away and want to snap straight back to `PC`, press `Left`: it brings `>` back to `PC` and puts `PC` on the top row.

Long instructions that run past twenty columns end with `>` at the right edge. `Shift+Right` pans the text sideways to reveal the rest (marking the left edge with `<`), and `Shift+Left` pans back. `Up` and `Down` carry that sideways offset from line to line while any other key resets it.

Scroll one row past `0105 RET` and you will see `0106 NOP`. A Z80 keeps code and data in the same flat address space, so a disassembler keeps turning whatever bytes follow your program into instructions. Zeros come out as `NOP`, and in `HELLO.COM` the `'H'` (`48h`) of `"Hello from Tecos"` comes out as `LD C,B`. Keeping track of where your code ends keeps trailing bytes from throwing you off.

## Watching the stack move

With `PUSH HL` lined up at `0103h`, press `S` to open Stack:

<!-- Tecos 8c12c9f with TBUG 167f7f0, starter card e2f124e9: TECOS=<checkout> node scripts/tbug-capture.mjs --card tbug.img '>b:' '>tas step' '!tbug step' F8 left down down S F8 Enter Esc C F8 R F5 Q Y, where tbug.img holds this book's HELLO.ASM, STEP.ASM and FILL.ASM on B. The LCD after S. -->
```text
>SP 8DFE  9102
    8E00  36C3
    8E02  01E6
    8E04  0042
```

Stack displays four 16-bit words starting at `SP`. That top word, `9102` at `8DFEh`, is the exit address TBUG pushed before starting `STEP.COM` so `RET` lands back inside TBUG. Your exact address depends on the build and resident services, so keep an eye on your own starting `SP`.

You do not need to switch back to Registers to step. Tap `F8` right here in Stack and watch `PUSH HL` execute in place:

<!-- Tecos 8c12c9f with TBUG 167f7f0, starter card e2f124e9: TECOS=<checkout> node scripts/tbug-capture.mjs --card tbug.img '>b:' '>tas step' '!tbug step' F8 left down down S F8 Enter Esc C F8 R F5 Q Y, where tbug.img holds this book's HELLO.ASM, STEP.ASM and FILL.ASM on B. The LCD after the F8 in Stack. -->
```text
>SP 8DFC  1234
    8DFE  9102
    8E00  36C3
    8E02  01E6
```

On a Z80, the stack grows downwards. Pushing a 16-bit pair subtracts two from `SP` and stores the value at the new lower address. `SP` dropped from `8DFE` to `8DFC`, `1234` appeared on row 1 and TBUG's return address `9102` slid down to row 2. Whenever `SP` moves, Stack resets `>` to the top slot so pushes and pops jump out at you.

Now hit `Enter` on that top slot to open Memory at `8DFCh`:

<!-- Tecos 8c12c9f with TBUG 167f7f0, starter card e2f124e9: TECOS=<checkout> node scripts/tbug-capture.mjs --card tbug.img '>b:' '>tas step' '!tbug step' F8 left down down S F8 Enter Esc C F8 R F5 Q Y, where tbug.img holds this book's HELLO.ASM, STEP.ASM and FILL.ASM on B. The LCD after Enter. -->
```text
8DFC>34 12 02 91 FIX
8E00 C3 36 E6 01
8E04 42 00 4F BB
8E08 AE 00 DD 03
```

The first two bytes read `34 12`, not `12 34`. Because the Z80 is little-endian, the low byte (`34h`) sits at the lower address (`8DFCh`) and the high byte (`12h`) sits above it (`8DFDh`). Stack pairs those bytes back into 16-bit words because `PUSH`, `POP`, `CALL` and `RET` work on words. Memory shows raw bytes in ascending address order. Both views read the exact same RAM through two different lenses.

![F8 executes PUSH HL, moving SP down two bytes from 8DFEh to 8DFCh. Stack displays the word 1234 while Memory displays the bytes in address order as 34 12.](/images/tbug/stack-step.svg)

Hit `Esc` to step back to Stack, then press `C` to return to Code, where `→` now sits on `0104 POP DE`. Tap `F8` to execute the pop, then press `R` to return to Registers. `DE` holds `1234`, `HL` still holds `1234` and `SP` has returned to `8DFE`. Press `F5` to let `RET` end `STEP.COM` (`PC ----`, `SP 8E00`, `EX`), then `Q` and `Y` to return to `B:WORK>`.

## Stepping into, over and out of calls

Tapping `F8` one instruction at a time works on six bytes, not when your code calls a print helper or the BDOS. Stepping into a routine that formats a string would trap you in hundreds of instructions you already trust. TBUG places three stepping scopes side by side on `F8`, `F7` and `F6` (`Fn+8`, `Fn+7` and `Fn+6` on the TEC-1G):

- **`F8` (Step Into):** Executes one instruction. On a `CALL` inside your program, TBUG stops at the routine's first instruction so you can trace inside it.
- **`F7` (Step Over):** Runs a `CALL` at full speed until it returns and stops on the instruction right after the `CALL`. On any other instruction, it acts just like `F8`.
- **`F6` (Step Out):** Steps over nested calls until a `RET` lifts `SP` above its starting value, counting steps along the bottom row. If a routine loops for a long time before returning, any key interrupts the trace and hands control back.

`F5` to `F8` all wait for every key to be released before resuming the CPU. That release guard prevents a debugger keypress from leaking into a program polling the matrix keyboard.

_Checked against Tecos `8c12c9f` with TBUG `167f7f0`, on the starter card in the emulated TEC-1G, 28 November 2026._
