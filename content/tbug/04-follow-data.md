---
title: Following and editing data in memory
parent: TBUG
nav_order: 4
nav_group: Using TBUG
---

# 4. Following and editing data in memory

Registers hold counters and pointers, while most of your program's real state sits in RAM buffers, strings and tables. When a loop writes one byte too far or copies a string backwards, staring at a fixed address stops helping the moment the pointer moves on. You want Memory locked onto the register walking the buffer, and sometimes you want to patch a register or byte right in live RAM to test a fix before going back to `TED`.

## A buffer-filling target

On drive B, open `FILL.ASM` (`ted fill.asm`), enter this ten-byte loop, save with `^S` and quit with `^Q`:

```asm
        ORG $0100
START:  LD HL,BUF
        LD B,4
FILL:   LD (HL),B
        INC HL
        DJNZ FILL
        RET
BUF:    DS 4
```

Assemble it and bring it up in TBUG:

<!-- Tecos 4c555ff with TBUG 1215559, starter card 48a9309f: TECOS=<checkout> node scripts/tbug-capture.mjs --card tbug.img '>b:' '>tas fill' '!tbug fill' R F8 down down right Enter F8 F8 F8 C down F5 M G 1 0 A Enter, where tbug.img holds this book's HELLO.ASM, STEP.ASM and FILL.ASM on B. Console text; TAS's progress mark is overwritten. -->
```text
B:WORK>tas fill
FILL.COM written

B:WORK>tbug fill

B:WORK>FILL
```

`FILL.COM` points `HL` at the four-byte `BUF` reservation at `010Ah`, loads `4` into `B` and loops four times. Each pass stores `B` at `(HL)`, advances `HL` and decrements `B` with `DJNZ`. At `RET`, `BUF` should hold `04 03 02 01`.

## A Memory window that stays put

Memory shows sixteen bytes as four rows of four. Each row starts with its four-digit hex address, `>` marks the selected byte and the top right corner reads `FIX`: Memory sits at an address of its own and stays there as you step. Only you move it, with `G`, with `A`, with `P` (the byte at `PC`) or with a register key, and each of those moves it once. The first time you open Memory with `M`, it opens at `PC`; after that, `M` opens it where you left it.

Try it on `FILL`. At the entry stop (`PC 0100`), press `R` for Registers and tap `F8` (`Fn+8`) once to run `LD HL,BUF`. `PC` moves to `0103` and `HL` becomes `010A`, the address of `BUF`.

In Registers, move `>` onto `HL` (`Down` twice, `Right` once) and press `A`. Memory opens at `010Ah`, the value in `HL`:

<!-- Tecos 4c555ff with TBUG 1215559, starter card 48a9309f: TECOS=<checkout> node scripts/tbug-capture.mjs --card tbug.img '>b:' '>tas fill' '!tbug fill' R F8 down down right A F8 F8 F8 H C down F5 M G 1 0 A Enter, where tbug.img holds this book's HELLO.ASM, STEP.ASM and FILL.ASM on B. The LCD after A on HL. -->
```text
010A>00 00 00 00 FIX
010E 00 00 00 00
0112 00 00 00 00
0116 00 00 00 00
```

Tap `F8` twice. `LD B,4` loads the counter, then `LD (HL),B` writes `04` right under the cursor at `010Ah`:

<!-- Tecos 4c555ff with TBUG 1215559, starter card 48a9309f: TECOS=<checkout> node scripts/tbug-capture.mjs --card tbug.img '>b:' '>tas fill' '!tbug fill' R F8 down down right A F8 F8 F8 H C down F5 M G 1 0 A Enter, where tbug.img holds this book's HELLO.ASM, STEP.ASM and FILL.ASM on B. The LCD after the second F8 in Memory. -->
```text
010A>04 00 00 00 FIX
010E 00 00 00 00
0112 00 00 00 00
0116 00 00 00 00
```

Tap `F8` once more for `INC HL`. `HL` moves on to `010Bh`, but Memory stays at `010Ah`, because it never follows a register. Press `H` to move it to the byte at `HL`'s new value:

<!-- Tecos 4c555ff with TBUG 1215559, starter card 48a9309f: TECOS=<checkout> node scripts/tbug-capture.mjs --card tbug.img '>b:' '>tas fill' '!tbug fill' R F8 down down right A F8 F8 F8 H C down F5 M G 1 0 A Enter, where tbug.img holds this book's HELLO.ASM, STEP.ASM and FILL.ASM on B. The LCD after H. -->
```text
010B>00 00 00 00 FIX
010F 00 00 00 00
0113 00 00 00 00
0117 00 00 00 00
```

`B`, `D`, `H`, `X` and `Y` in Memory each jump to the byte at the saved `BC`, `DE`, `HL`, `IX` or `IY`. Press the key again after a step to jump to the register's new value.

![A on HL opens Memory at 010Ah. After INC HL, Memory stays at 010Ah until H moves it to 010Bh. Editing is restricted to program memory between 0100h and the lowest resident service.](/images/tbug/memory-follow.svg)

Now finish the loop in one move using the one-shot run from Chapter 3. Press `C` to jump to Code, scroll `>` down to `0109 RET` and press `F5`. The remaining three passes run at full speed and halt before `RET`.

Press `M` to open Memory where you left it, press `G`, type `10A` and press `Enter`. Memory moves to `010Ah`, and the top row reads `04 03 02 01`.

## Moving around and following pointers

Memory gives you byte, row and 16-byte movement without silently wrapping across the ends of the 64 KiB address space:

- **`Left` / `Right`** walk the `>` cursor byte by byte, moving across row edges automatically.
- **`Up` / `Down`** move the `>` cursor by one row (four bytes), scrolling once you pass the top or bottom row.
- **`Ctrl+Up` / `Ctrl+Down`** jump sixteen bytes at a time.
- **`G`** opens a hex address prompt (`Backspace` rubs out a digit, `Esc` cancels). In Memory, `G` jumps Memory to that fixed address. Elsewhere, `G` opens Code there.

Scrolling stops cleanly at `0000h` and `FFFFh`.

`A` and `Enter` follow addresses across views:

- **`A`**, in any view, opens Memory at the address the selection gives. In Code, that is the selected instruction's own address, so on `JP 1234h` it shows the jump's bytes. In Registers, it is the selected pair's value. In Labels, it is the label's address. In Stack, it is the word held in the selected slot. In Memory, it is the two bytes at the cursor, read low byte first: on `34 12` at `4000h`, `A` goes to `1234h`.
- In **Code**, `Enter` on a jump or call (`JP`, `JR`, `DJNZ`, `CALL`) opens Code at the target address.
- In **Stack**, `Enter` on any slot opens Memory at that slot's address.
- In **Labels**, `Enter` opens Code at the label.

`Esc` goes back to where you were before each of these jumps, and before `G`, `P` or a register key in Memory. TBUG remembers the last four. Arrows, `Tab` and the view letters are not remembered, and with nothing remembered `Esc` does nothing.

## Editing live registers and RAM

Inspecting state shows what went wrong. Changing state live lets you test a fix on the spot without leaving TBUG to rebuild.

In **Registers**, highlight any pair with the arrows and press `E` or `Enter`. TBUG asks for the value, as `Set HL:` for `HL`. Type the new hexadecimal value and hit `Enter` (`Esc` cancels). You can force a loop counter down to `1` to watch the last pass, flip a flag in `AF` to force a branch or aim `HL` at a test buffer.

In **Memory**, put `>` on a byte and press `E` or `Enter`. The top right tag switches to `EDT` so hex keys write bytes instead of running commands. After the first digit, TBUG shows the half-typed byte with an underscore, like `3_`. Type the second digit and TBUG writes the byte immediately and steps the cursor to the next address, with no `Enter` needed between bytes. Typing `3E2AC9` writes three consecutive bytes and leaves `>` on the fourth.

`Enter` or `Esc` leaves edit mode. `Esc` drops any unfinished first digit, and every completed byte you wrote is kept.

One safety fence guards `EDT` mode: TBUG only writes inside program memory, from `0100h` up to the lowest resident service. Page zero (`0000h–00FFh`), TBUG itself and ROM are off limits. Trying to write there prints `Not writable` or `End of range` and leaves the byte alone so a stray hex digit cannot knock the debugger out from under you.

_Checked against Tecos `4c555ff` with TBUG `1215559`, on the starter card in the emulated TEC-1G, 28 November 2026._
