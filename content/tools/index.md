---
title: The tools
aside: false
sidebar: false
---

# The tools

TEC-OS comes with a core toolkit. Every volume that goes on A: carries it,
so whichever volume is on A: you can edit, assemble, run and debug a
program.

| Tool | File | What it does | Where to learn it |
| --- | --- | --- | --- |
| The shell | `SHELL.SVC` | Adds `CD`, `COPY`, `DEL`, `DIR` and other commands to the prompt | [TEC-OS book, chapters 1 to 8](../tec-os/01-first-session.md) |
| TED | `TED.COM` | Edits text, and builds and runs a program | [Make a small program](../tec-os/02-make-a-small-program.md) |
| TAS | `TAS.COM` | Assembles Z80 source into a `.COM` program | [Make a small program](../tec-os/02-make-a-small-program.md) and [Call TEC-OS](../tec-os/09-call-tec-os.md) |
| TBUG | `TBUG.SVC`, `TBUG.HLP` | Stops a program and shows its registers, stack and memory on the LCD | [The TBUG book](../tbug/index.md) |

Two more tools are for particular readers:

| Tool | File | What it does | Where to learn it |
| --- | --- | --- | --- |
| BAZ and BAZC | `BAZ.COM`, `BAZC.COM`, `BAZC.RTL` | BAZ runs a BASIC program as you write it; BAZC compiles a finished one into a faster `.COM` file | [Build a BASIC program](../tec-os/03-build-a-basic-program.md), with BAZC |
| MON3 | `MON3.SVC` | Runs TEC-1G programs written for the MON-3 monitor | [Programs on the starter card](../tec-os/appendix-j-command-reference.md#programs-on-the-starter-card) |

Books on TED, on Z80 programming with TAS, on BASIC and on MON3 are being
written. They will appear on the [library shelf](../index.md) as each is
ready.

You can try every tool without a board in the
[TEC-OS Viewer](https://jhlagado.github.io/tec-os-viewer/).
