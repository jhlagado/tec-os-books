---
title: Debugging with labels and symbols
parent: TBUG
nav_order: 5
nav_group: Using TBUG
---

# 5. Debugging with labels and symbols

Hexadecimal addresses are fine on a ten-byte loop. Once a program grows past a few routines, every edit near the top of your source shifts every address below it after reassembly, and checking `014Dh` against a listing breaks your stride right when you are closing in on a bug.

`TAS` writes a companion `NAME.TBG` symbol file beside every `NAME.COM` it assembles. Symbol support is built right into `TBUG.SVC`, so whenever a matching `.TBG` file sits beside the `.COM` file, TBUG loads your labels automatically with no extra service to install.

## Verifying `.TBG` symbol files

Stale symbols are worse than none. Edit `FILL.ASM` and copy over a fresh `FILL.COM` without updating `FILL.TBG`, and old labels would land in the middle of the wrong instructions.

Each time TBUG stops a program at launch, it checks for a `NAME.TBG` file beside `NAME.COM` and reads its trailing header record. That header holds the image's end address and a 16-bit checksum of every byte in the assembled image. TBUG sums the loaded image in RAM and checks both numbers.

![TAS writes NAME.TBG beside NAME.COM. TBUG checks the end address and image checksum at launch, enabling SY, Code labels and the Labels view on L when both match.](/images/tbug/symbols-load.svg)

When both match, symbols turn on and `SY` lights up at the right end of row 2 in Registers:

<!-- Tecos 4c555ff with TBUG 1215559, starter card 48a9309f: TECOS=<checkout> node scripts/tbug-capture.mjs --card tbug.img '>b:' '>tas fill' '!tbug fill' R F8 F8 F8 F8 C L R Tab L F B Enter F X Enter Esc, where tbug.img holds this book's HELLO.ASM, STEP.ASM and FILL.ASM on B. The LCD after R at the entry stop. -->
```text
>PC 0100  SP 8CFE ST
 AF 0000  BC 0000 SY
 DE 0000  HL 0000 ..
 IX 0000  IY 0000 ..
```

When the `.TBG` file is absent or stale, TBUG ignores it quietly, `SY` stays off and debugging continues in raw hex until you reassemble with `TAS`.

## Labels in Code

Start `tbug fill` from `B:WORK>`, press `R` and tap `F8` (`Fn+8`) four times (`LD HL,BUF`, `LD B,4`, `LD (HL),B`, `INC HL`) so `PC` lands on `0107h`. Press `C` to jump to Code:

<!-- Tecos 4c555ff with TBUG 1215559, starter card 48a9309f: TECOS=<checkout> node scripts/tbug-capture.mjs --card tbug.img '>b:' '>tas fill' '!tbug fill' R F8 F8 F8 F8 C L R Tab L F B Enter F X Enter Esc, where tbug.img holds this book's HELLO.ASM, STEP.ASM and FILL.ASM on B. The LCD after C. -->
```text
>→0107 DJNZ FILL
  0109 RET
BUF:
  010A INC B
```

Three details jump out on those four lines:

- **Label rows:** Any label defined at an address sits on its own row right above it (`START:`, `FILL:`, `BUF:`), while the instruction below keeps its hex address.
- **Named jumps, calls and indirects:** Branch targets (`DJNZ FILL`), calls and bracketed addresses (`(nn)`) show label names when a match exists. Immediate 16-bit loads like `LD HL,010A` stay numeric because a 16-bit literal could be a plain constant like `$1234` rather than an address.
- **Data still disassembles:** On row 4, `010A INC B` sits right under `BUF:`. The `04h` you just stored in `BUF` happens to be the Z80 opcode for `INC B`. Seeing `BUF:` directly above `010A` tells you at once that those bytes are your data buffer, not code.

## The fifth view: Labels and symbols

Whenever TBUG matches a `.TBG` file, a fifth view, **Labels**, becomes active. It lists the program's labels and symbols, an `EQU` among them, though in a program like this one they are all labels. Jump straight to it with `L` (or with `Tab` from Registers) on `FILL`:

<!-- Tecos 4c555ff with TBUG 1215559, starter card 48a9309f: TECOS=<checkout> node scripts/tbug-capture.mjs --card tbug.img '>b:' '>tas fill' '!tbug fill' R F8 F8 F8 F8 C L R Tab L F B Enter F X Enter Esc, where tbug.img holds this book's HELLO.ASM, STEP.ASM and FILL.ASM on B. The LCD after L; Tab from Registers shows the same. -->
```text
>0100 START
 0105 FILL
 010A BUF
```

Labels lists them in ascending address order. `Up` and `Down` move `>` through the list. Hit `Enter` to open Code at that label without disturbing `PC` (`Esc` brings you back to Labels), press `A` to open Memory at its address, or press `Space` to toggle a breakpoint straight on that label's address without visiting Code first.

On a longer program, `F` finds a label by name. TBUG asks `Find:` on the bottom row. Type the start of a name, up to eight letters and digits, and press `Enter`: TBUG selects the first label in the list that starts that way, on the top row. `Backspace` rubs out a character and `Esc` cancels. There is no `_` key, so type only the part of a name before an underscore. Typing `B` finds `BUF` here:

<!-- Tecos 4c555ff with TBUG 1215559, starter card 48a9309f: TECOS=<checkout> node scripts/tbug-capture.mjs --card tbug.img '>b:' '>tas fill' '!tbug fill' R F8 F8 F8 F8 C L R Tab L F B Enter F X Enter Esc, where tbug.img holds this book's HELLO.ASM, STEP.ASM and FILL.ASM on B. The LCD after F, B and Enter. -->
```text
>010A BUF
```

When nothing starts that way, TBUG says `No label`. On a large program the search takes a few seconds.

_Checked against Tecos `4c555ff` with TBUG `1215559`, on the starter card in the emulated TEC-1G, 28 November 2026._
