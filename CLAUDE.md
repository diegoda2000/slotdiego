# CLAUDE.md

Guidance for Claude Code (and other AI assistants) working in this repository.

## What this repository is

`slotdiego` is a single-file hobby project: a Windows console slot machine game
called **"The BADRooM"**, written in C#. The reels are drawn as PNG images over
the console window using GDI+, and the symbols are bathroom items (toothbrush,
nail clipper, wet towel, deodorant, comb, hair dryer, shampoo).

The entire repository is:

```
slotdiego/
├── slot          # the only source file — C# source, no file extension
└── CLAUDE.md     # this file
```

There is **no** project file, solution, build script, package manifest, test
suite, CI configuration, README, or `.gitignore`. Git history is a single
commit (`Add files via upload`) on `main`.

## Read this before changing anything

The repository is an early draft, not a working program. Do not assume it
builds — it does not. Four things are broken or missing, and they matter for
almost any task you are asked to do:

1. **`slot` is not valid C#.** Lines 113–163 contain leftover chat-transcript
   text pasted into the middle of the `SlotMachine` class: a Spanish sentence
   (`De acuerdo. Después del método Play, ...`) followed by a ```` ```csharp ````
   fence at line 115 and a closing ```` ``` ```` fence at line 163. The code
   *inside* the fence (`IsSpecialGame`, `PlaySpecialGame`) is real and belongs
   in the class; only the prose line and the two fence lines are junk. Removing
   those three lines is what makes the file parse.
2. **There is no entry point.** No `Main`, no `Program` class. `SlotMachine` is
   never instantiated and `Play()` is never called.
3. **There is no project file.** Nothing tells a compiler the target framework,
   the output type, or that `System.Drawing` is referenced.
4. **The symbol images do not exist.** The constructor calls
   `Image.FromFile` on `toothbrush.png`, `nailclipper.png`, `wettowel.png`,
   `deodorant.png`, `comb.png`, `dryer.png`, and `shampoo.png`, relative to the
   working directory. None are in the repo, so the constructor throws
   `FileNotFoundException` even after the file compiles.

If a task implies "run it" or "test my change", say plainly that the project
does not build yet and either fix the blockers above as part of the work or ask
whether to. Do not report a change as verified when nothing was compiled.

## Making it buildable

If asked to get the project running, this is the shortest honest path. Treat it
as a proposal to confirm rather than something to do unprompted, since it adds
files the owner may want named differently.

```bash
# 1. Strip the transcript artifacts (lines 113, 115, 163) from `slot`
# 2. Rename/copy to a compilable name and add a project file
```

`System.Drawing` plus `kernel32.dll!GetConsoleWindow` makes this
**Windows-only**. On modern .NET the package is `System.Drawing.Common` and it
throws on non-Windows platforms, so the project must target
`net8.0-windows` (or similar) and set `<UseWindowsForms>` or reference
`System.Drawing.Common` explicitly. Targeting .NET Framework 4.x is the other
option and is closer to what the code was written against.

Note also that drawing onto the console window's HWND is inherently fragile:
anything that repaints the console (resize, scroll, focus change) erases the
reels, and `Console.SetBufferSize` / `SetWindowSize` throw on the sizes this
code computes in some terminals. A real fix is a WinForms/WPF window rather
than a console HWND. Flag this if asked to make the rendering reliable; do not
silently rewrite the rendering approach when asked for something smaller.

## Code map — `slot`

Namespace `Casino`, one class `SlotMachine`, one nested `private static class
NativeMethods`.

**Fields (lines 8–23)** — all configuration lives in private fields with
`_camelCase` names, initialized inline: 5 reels (`_tapesCount`) of 5 rows
(`_tapeLength`), 50×50 px cells, 10 px spacing, a 100 px title band, the
`_title` string, title fonts/colors/shadow, the parallel `_symbols` /
`_symbolFiles` arrays, the loaded `_symbolImages`, a shared `_random`, and
`_maxPrize = 32500`.

**`SlotMachine()`** — loads every PNG into `_symbolImages`, sizes the console
buffer and window from the field values, hides the cursor, then draws the
shadowed title and fills each reel with symbol index 0.

**`Play()`** — the main loop. For each reel, spins 50 iterations, each drawing a
random symbol and sleeping 50 ms, keeping the last-drawn symbol in `result[i]`.
Then branches: `IsSpecialGame(result)` → `PlaySpecialGame`, otherwise
`CalculatePrize` → `ShowPrizeMessage`.

**`IsSpecialGame(string[])`** — true when at least 3 reels landed on
`_symbols[0]` (`"toothbrush"`, referred to in comments as the "toilet paper"
symbol — the comments are out of date with the symbol list).

**`PlaySpecialGame(Graphics, string[])`** — shows the `SSHHHitBonus!` banner,
then re-rolls only the reels that landed on `_symbols[0]`, drawing from indices
`1..Length-1` so the bonus symbol cannot repeat. Recomputes and shows the prize.

**`CalculatePrize(string[])`** — for each symbol from index 1 upward, counts
occurrences in `result`; any symbol appearing 3+ times adds `_maxPrize / count`.
Note the inversion: more matches means a *smaller* per-symbol award
(5 of a kind pays 6500, 3 of a kind pays 10833). If that is a bug, point it out
before changing it — it may be intentional, and it is the sort of rule the
owner should decide on.

**`ShowPrizeMessage` / `ShowSpecialGameMessage`** — centered `DrawString` calls
into a rectangle below the reels; the bonus banner sleeps 2 s.

**`GetConsoleWindow()`** — wraps the P/Invoke and throws
`InvalidOperationException("No console window")` on a null handle.

## Conventions to follow

These are drawn from the existing file — match them rather than imposing a
different house style.

- **Language:** C#, Allman braces, 4-space indent, `_camelCase` private fields,
  `PascalCase` methods. Explicit types throughout — no `var`.
- **Line endings:** the file is **CRLF**, UTF-8, no BOM. Preserve CRLF when
  editing; do not normalize the whole file to LF, as that turns any diff into a
  full-file rewrite.
- **Comments:** the code is heavily commented, roughly one comment per
  statement, in English. Some comments contradict the code (the "toilet paper"
  references). Keep the density if extending existing methods; fix stale
  comments you touch.
- **No dependency injection or interfaces.** Configuration is hardcoded in
  fields. If adding a setting, add a field alongside the others.
- **Parallel arrays.** `_symbols`, `_symbolFiles`, and `_symbolImages` are index-
  aligned, and index 0 is special-cased as the bonus trigger throughout. Any
  change to the symbol list must keep all three arrays in the same order and
  keep the bonus symbol at index 0 (or update every `_symbols[0]` reference and
  the `_random.Next(1, ...)` lower bound in `PlaySpecialGame`).
- **Spanish is fine in conversation.** The repository owner writes in Spanish;
  respond in the language they use. Code, identifiers, and comments in `slot`
  are English — keep them English.

## Git workflow

- Default branch is `main`.
- Work happens on feature branches; push with
  `git push -u origin <branch-name>`.
- Do not open a pull request unless explicitly asked.
- Do not force-push or rewrite `main`.

## Scope discipline

This is one 262-line file with obvious rough edges — it is tempting to "fix
everything". Don't. Do the task that was asked, mention the adjacent problems
you noticed in a sentence, and let the owner decide. The exception is the
build blockers in the section above: those legitimately stand between the
codebase and any change that can be verified, so surface them every time.
