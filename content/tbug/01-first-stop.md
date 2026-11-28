---
title: The resident workbench and your first stop
parent: TBUG
nav_order: 1
nav_group: First session
---

# 1. The resident workbench and your first stop

A debugger makes the most sense on a program whose normal output you already know. Start with a tiny greeting program: write it in `TED`, assemble it with `TAS` and run it straight from the prompt. Once you have seen it print and vanish in an instant, load the exact same binary under TBUG and slow it down to one instruction at a time.

## Build and run a baseline

Make sure `TBUG.SVC` and `TBUG.HLP` sit on drive A alongside `TED.COM` and `TAS.COM`. Switch to drive B so your own files stay on the working volume:

```text
A:SYSTEM>b:
B:WORK>
```

When you type a bare command on drive B, Tecos checks drive B first and then falls back to drive A, for `.COM` programs and for services such as `TBUG.SVC`. You can run `ted`, `tas` and `tbug` directly from `B:WORK>` without typing `a:` in front of them, and your source and `.COM` files stay right on drive B without `b:` either. Tecos takes commands in any case; this book types them in lowercase.

Open a new source file called `HELLO.ASM`:

```text
B:WORK>ted hello.asm
```

`TED` clears the console and shows the filename and cursor position on the bottom row. Enter this nine-byte program and its message string, using two leading spaces so every line sits cleanly inside 40 columns:

```asm
  ORG $0100

START: LD DE,MSG
  LD C,9
  CALL $0005
  RET

MSG: DB "Hello from Tecos",13,10,"$"
```

Save with `^S`. Once `Saved` appears on the status row, quit with `^Q` to return to `B:WORK>`.

Assemble `HELLO.ASM` into a `.COM` executable:

<!-- Tecos 4c555ff with TBUG 1215559, starter card 48a9309f: TECOS=<checkout> node scripts/tbug-capture.mjs --card tbug.img '>b:' '>tas hello' '>hello' '!tbug hello' r F8 F8 F5 q y '>services', where tbug.img holds this book's HELLO.ASM, STEP.ASM and FILL.ASM on B. Console text; TAS's progress mark is overwritten. -->
```text
B:WORK>tas hello
HELLO.COM written
```

Beside `HELLO.COM`, `TAS` also writes `HELLO.TBG` containing your labels. TBUG loads that symbol file automatically when it matches the `.COM` image, which Chapter 5 looks at in detail.

Run the program normally first so you have a baseline:

<!-- Tecos 4c555ff with TBUG 1215559, starter card 48a9309f: TECOS=<checkout> node scripts/tbug-capture.mjs --card tbug.img '>b:' '>tas hello' '>hello', where tbug.img holds this book's HELLO.ASM, STEP.ASM and FILL.ASM on B. Console text. -->
```text
B:WORK>hello
Hello from Tecos

B:WORK>
```

Four Z80 instructions just ran in a fraction of a millisecond. `LD DE,MSG` pointed `DE` at the greeting at `0109h`. `LD C,9` selected BDOS string print. `CALL $0005` handed control to Tecos to write every character up to `$`, and `RET` returned to the prompt. All you saw was the finished line.

## Resident memory and the LCD

Ordinary `.COM` programs load at `0100h` and grow upwards into free RAM. Resident services load from the top down, right below the Tecos ROM at `C000h`, and lower the address stored at `0006h` so transient programs stay underneath them.

On the starter card, `SHELL.SVC` is already loaded at boot. TBUG fits beside it: TBUG takes 33 pages of 256 bytes, about 8 KiB, and the shell 9. If your card loads other services at boot and Tecos answers `TBUG?`, unload one of them to make room.

![TBUG is loaded at the top of RAM below the ROM and uses only the 20 × 4 character LCD and matrix keyboard while the program keeps the console.](/images/tbug/first-stop.svg)

Once resident, TBUG survives warm boots and works transparently alongside the rest of the computer. Whenever a debugged program stops, TBUG draws on the 20 × 4 character LCD and reads the matrix keyboard. Your console stays untouched, so any text or graphics your program draws remains exactly where the program put it.

## Catch the first stop

Start `HELLO` under TBUG from drive B:

```text
B:WORK>tbug hello
```

`tbug hello` loads TBUG from drive A, if it is not resident already, and hands `hello` back to the command processor. That loads `HELLO.COM` at `0100h` itself, and TBUG catches the launch before the first instruction runs. On the console the command processor echoes the line it runs, `B:WORK>HELLO`, and no greeting follows. On the LCD, TBUG opens the stop in Code, its disassembly view, with `TBUG Tab F1 Help` on the bottom row for a moment:

<!-- Tecos 4c555ff with TBUG 1215559, starter card 48a9309f: TECOS=<checkout> node scripts/tbug-capture.mjs --card tbug.img '>b:' '>tas hello' '>hello' '!tbug hello' r F8 F8 F5 q y '>services', where tbug.img holds this book's HELLO.ASM, STEP.ASM and FILL.ASM on B. The LCD's four rows at the first stop. -->
```text
START:
>→0100 LD DE,0109
  0103 LD C,09
  TBUG Tab F1 Help
```

The hint then gives way to the next instruction, `0105 CALL 0005`. `F1` (`Fn+1`) opens help for the view you are in at any stop: `Right` and `Left` turn its pages, and `F1` or `Esc` closes it. `→` marks `PC`, the instruction about to run, and `>` marks the row you have selected. `START:` is a label from `HELLO.TBG`, which sits beside `HELLO.COM`. Chapter 2 tours Code properly.

Press `R` to open Registers, the CPU's state:

<!-- Tecos 4c555ff with TBUG 1215559, starter card 48a9309f: TECOS=<checkout> node scripts/tbug-capture.mjs --card tbug.img '>b:' '>tas hello' '>hello' '!tbug hello' r F8 F8 F5 q y '>services', where tbug.img holds this book's HELLO.ASM, STEP.ASM and FILL.ASM on B. The LCD after r. -->
```text
>PC 0100  SP 8CFE ST
 AF 0000  BC 0000 SY
 DE 0000  HL 0000 ..
 IX 0000  IY 0000 ..
```

Every number on the LCD is hexadecimal. Your `SP` value depends on what sits above the TPA, and `SY` appears on row 2 because `HELLO.TBG` sits beside `HELLO.COM`.

## Reading eighty characters of CPU state

A 20 × 4 LCD gives you eighty character cells, so every column earns its keep:

- **Top row:** `PC` is the address of the next instruction (`0100` at entry) and `SP` is the top of the stack. Flush against the right edge sits a two-letter stop code: `ST` for an initial stop or step, `BP` for a breakpoint and `EX` once the program exits.
- **Rows 2 to 4:** The six 16-bit pairs `AF`, `BC`, `DE`, `HL`, `IX` and `IY` sit in two columns, with `>` marking the selected pair.
- **Right edge of rows 2 to 4:** Row 2 shows `SY` when a matching `.TBG` symbol file is loaded and stays blank otherwise. Rows 3 and 4 hold four Z80 flags as letters when set and `.` when clear: `Z` (zero) and `C` (carry) on row 3, `S` (sign) and `P` (parity/overflow) on row 4.

## Step `HELLO.COM` by hand

On the TEC-1G matrix keyboard, `Fn+5` through `Fn+8` send the function keys `F5` through `F8`. Here `F8` (`Fn+8`) steps one instruction into the program and `F5` (`Fn+5`) runs at full speed.

Tap `F8` once and let it go. The Z80 executes `LD DE,MSG` at `0100h` and halts again before `0103h`. On the LCD, `PC` advances to `0103` and `DE` becomes `0109`, the address of `"Hello from Tecos"`. Over on the console, nothing has moved.

Tap `F8` a second time. `LD C,9` runs, moving `PC` to `0105` and setting the low byte of `BC` to `09`:

<!-- Tecos 4c555ff with TBUG 1215559, starter card 48a9309f: TECOS=<checkout> node scripts/tbug-capture.mjs --card tbug.img '>b:' '>tas hello' '>hello' '!tbug hello' r F8 F8 F5 q y '>services', where tbug.img holds this book's HELLO.ASM, STEP.ASM and FILL.ASM on B. The LCD after the second F8. -->
```text
>PC 0105  SP 8CFE ST
 AF 0000  BC 0009 SY
 DE 0109  HL 0000 ..
 IX 0000  IY 0000 ..
```

Both arguments for BDOS function 9 are now sitting in the CPU, with `CALL $0005` lined up next at `0105h`.

Now press `F5` to let the program finish at full speed. `CALL $0005` prints `Hello from Tecos` onto the console just as it did in your standalone run. Then `RET` pops TBUG's exit return address off the stack, raising `SP` from `8CFE` to `8D00`. Instead of vanishing back to CP/M, TBUG catches the exit and shows `>PC ----  SP 8D00 EX` on row 1.

Press `Q` to leave TBUG. The LCD displays `Quit TBUG? Y/N`. Press `Y` or `Q` to confirm (any other key keeps you inside TBUG). Your `B:WORK>` prompt returns on the console, and TBUG stays resident at the top of RAM for the next run: `services` now lists `TBUG 33` above `SHELL 9`. When you want the memory back, `unload tbug` removes it.

Typing `tbug` alone shows how to start a program and loads nothing:

<!-- Tecos 4c555ff with TBUG 1215559, starter card 48a9309f: node tools/capture.mjs --board pico --lcd tbug services. The LCD's four rows; services then lists SHELL 9 alone. -->
```text
TBUG 0.3 ready
tbug name debugs
NAME.COM
unload tbug removes
```

_Checked against Tecos `4c555ff` with TBUG `1215559`, on the starter card in the emulated TEC-1G, 28 November 2026._
