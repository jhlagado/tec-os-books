---
title: Reference, diagnostics and building TBUG
parent: TBUG
nav_order: 6
nav_group: Reference
---

# 6. Reference, diagnostics and building TBUG

All TBUG controls, screen indicators, fault messages and build commands sit here for quick lookup.

## Keys at a glance

On the TEC-1G matrix keyboard, `Fn+1` and `Fn+5` through `Fn+8` send `F1` and `F5` through `F8`.

| Key | Action |
| --- | --- |
| `C` / `R` / `L` / `S` / `M` | Jump straight to Code, Registers, Labels, Stack or Memory. `M` opens Memory where you last left it, at `PC` the first time. |
| `Tab` / `Shift+Tab` | Cycle forward or backward through the views: Code, Registers, Labels (with a matching `.TBG`), Stack, Memory, then back to Code. Every stop opens in Code. |
| `F5` (`Fn+5`) | Run until exit or a breakpoint. In Code with `>` off `PC`, run once to the selected line with no breakpoint left behind. |
| `F6` (`Fn+6`) | Step Out: trace over calls until `RET` lifts `SP` above its starting value. Row 4 counts steps and any key stops it. |
| `F7` (`Fn+7`) | Step Over: run a `CALL` or a restart to the instruction after it as one step. |
| `F8` (`Fn+8`) | Step Into: run one instruction, stopping at the entry of a local `CALL` or of `RST 08h` to `RST 28h`. `RST 0`, `RST 30h` and `RST 38h` are stepped over. |
| `Space` | Toggle a breakpoint on the selected row in Code or Labels (up to eight inside the `.COM`). |
| `Ctrl+Esc` (held) | Break in while running, including during `F7`, `F6` and `F5` to a line: stop before the next BDOS call at `0005h`. `F5` continues into the call. |
| `P` | Put `PC` back: in Code, `PC` on the top row and selected; in Registers, the `PC` field; in Memory, the byte at `PC`. |
| `A` | Open Memory at the address the selection gives: in Code, the instruction's own address; in Registers, the pair's value; in Labels, the label's address; in Stack, the slot's word; in Memory, the two bytes at the cursor, low byte first. |
| `G` | Prompt for a hex address (`Backspace` rubs out a digit, `Esc` cancels). Jumps Memory in Memory, or Code elsewhere. |
| `E` / `Enter` | Edit, in Registers and Memory. In Registers, `Set HL:` (for `HL`) asks for a new hex value. In Memory, each pair of hex digits writes a byte at once and advances; `Enter` or `Esc` leaves edit mode. |
| `Enter` | Elsewhere, follow or open: in Code, follows a jump or call target; in Stack, opens Memory at the slot; in Labels, opens Code at the label. |
| `B` / `D` / `H` / `X` / `Y` | In Memory, jump to the byte at the saved `BC`, `DE`, `HL`, `IX` or `IY`. Press again to jump to the register's new value. |
| `F` | In Labels, `Find:` the first label whose name starts with what you type (up to eight letters and digits). `No label` if none does. |
| `Esc` | Cancel a prompt, an edit or the quit question first. Otherwise go back to where you were before your last jump: `Enter`, `A`, `G`, `P`, a label opened from Labels or a register key in Memory. TBUG remembers four. With nothing remembered, `Esc` does nothing. |
| `Q` | Prompt `Quit TBUG? Y/N`. Press `Y` or `Q` to quit and return to CP/M; any other key stays. |
| `F1` (`Fn+1`) | Help for the current view from `TBUG.HLP`. `Right`/`Left` turn pages and `F1` or `Esc` closes it. |

`F5` to `F8` all wait for every key to be released before resuming the program so the keypress never reaches the program. No key repeats: each press, arrows included, acts once however long it is held. Each view switch flashes the view's name briefly on the bottom row.

## Arrow keys by view

| View | Arrow behaviour |
| --- | --- |
| Registers | Arrows move `>` around the register grid. |
| Code | `Up`/`Down` move `>` through decoded instructions and scroll freely before or after `PC`. Long rows end with `>`: on such a row `Right` shows more of it, four columns at a time, and `Left` goes back, with the same instruction selected. On other rows `Left` and `Right` do nothing. |
| Stack | `Up`/`Down` select one of the four slots. Whenever `SP` moves, selection returns to the top slot. |
| Memory | `Up`/`Down` move `>` by one four-byte row, scrolling at the top and bottom edges (`Ctrl+Up`/`Ctrl+Down` jump sixteen bytes). `Left`/`Right` move the byte cursor. Clamps at `0000h` and `FFFFh`. |
| Labels | `Up`/`Down` select a label in ascending address order. |

## LCD indicators and commands

- **Stop codes (Registers row 1, right):** `ST` for an initial stop or step, `BP` for a breakpoint and `EX` for exit (`PC` reads `----`).
- **Labels badge (Registers row 2, right):** `SY` when TBUG matched `NAME.TBG` beside the `.COM`.
- **Flags (Registers rows 3–4, right):** Row 3 holds `Z` and `C`. Row 4 holds `S` and `P`. Clear flags appear as `.`.
- **Code column 2:** `→` marks `PC`, `□` marks a user breakpoint and `█` marks `PC` stopped on a breakpoint.
- **Memory tag (row 1, right):** `FIX`, since Memory always sits at an address of its own, or `EDT` in byte edit mode (`3_` shows a pending first digit).

| Command | Effect |
| --- | --- |
| `tbug name [tail]` | Load TBUG if it is not resident, then hand `name [tail]` back to the command processor, which loads `NAME.COM` at `0100h`. TBUG stops it before its first instruction. Tecos finds `TBUG.SVC` on the current drive or on A, as it finds a `.COM`. |
| `tbug` | Show `TBUG 0.3 ready` and how to start a program. Loads nothing. |
| `unload tbug` | Remove the resident TBUG service and free its upper RAM. |

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| Tecos prints `TBUG?` | `TBUG.SVC` is not on the current drive or on A. Put it on A, where the starter card keeps it. If it is there, free upper RAM by unloading another service. |
| `F1` prints `No help: TBUG.HLP` | Copy `TBUG.HLP` beside `TBUG.SVC` or onto drive A. |
| `Space` prints `Select in Code first` | Press `C` (or `L`), move `>` onto an instruction or label and press `Space`. |
| Code does not show the stopped instruction | Press `P` in Code: it brings `>` back to `PC` on the top row. |
| `F5` stopped unexpectedly early | In Code, `F5` runs to the selected row when `>` is off `PC`. Press `P` first to run freely. |
| `Space` prints `Not in the COM` | Breakpoints and one-shot `F5` targets must lie inside the loaded `.COM` image. |
| `Space` prints `BP FULL (8)` | Eight breakpoints are active. Toggle an existing one off with `Space` first. |
| An edit in Memory prints `Not writable` or `End of range` | Only program memory (`0100h` up to the lowest resident service) can be edited. |
| Memory stays still while a register changes | Memory never follows a register. Press the register's key (`B`, `D`, `H`, `X` or `Y`) again after the step. |
| `F6` runs for a long time | Press any key to stop the trace. A routine with a long loop before `RET` takes many steps. |
| `Ctrl+Esc` does not stop a running program | It breaks at the next BDOS call (`0005h`), while the program runs and during `F7`, `F6` or `F5` to a line. A tight loop that never calls the OS needs a breakpoint. During a line read, finish the line with `Enter`, then hold `Ctrl+Esc`, and TBUG stops at the next BDOS call. |
| `SY` is absent and Code shows no labels | Reassemble with `TAS` so `NAME.TBG` matches `NAME.COM` and sits beside it on the same drive. |
| After `tbug name`, the LCD shows `TBUG needs ABI 5.3` | The ROM lacks `COMVEC`, the word that hands a launch to TBUG. Update to Tecos ABI 5.3 or later. |
| `Esc` does nothing | Nothing is left to go back to. Press `Q` to quit. |
| `F` prints `No label` | No label starts with what you typed. Type only the part of a name before any underscore. |
| The LCD's bottom row shows `TBUG: no COM NAME` | `NAME.COM` was not found. Check the program's name and drive, and that it fits the TPA. |

## Building TBUG from source

TBUG lives in its own repository, [`jhlagado/tbug`](https://github.com/jhlagado/tbug). Clone it beside `tas` (`jhlagado/tas`), `ted` (`jhlagado/ted`) and `tec-os`, run `npm ci` in `tas`, then run `npm run build` in `tbug`. The build writes two files:

- `build/TBUG.SVC`: the resident LCD debugger with built-in symbol support
- `build/TBUG.HLP`: the context-sensitive help pages opened by `F1`

Copy both files to drive A of your Tecos card. TBUG needs Tecos ABI 5.3 or later, whose `COMVEC` word hands each launch to TBUG.

[TBUG source](https://github.com/jhlagado/tbug) ·
[Origo P8 test evidence](https://github.com/jhlagado/origo/tree/main/studies/p8-tbg/evidence)

_Checked against Tecos `4c555ff` with TBUG `1215559`, on the starter card in the emulated TEC-1G, 28 November 2026._
