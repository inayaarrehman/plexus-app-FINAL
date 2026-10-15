# Difficulty rubric (October 2026)

The standard every Plexus difficulty label is judged against. The audience is a
medical student preparing for a first board exam (USMLE Step 1 level), playing
on a phone without notes.

A label describes **how hard it is to see that these four tiles belong
together**, on their own. How the other three groups on a board compete with a
group is handled separately when the board is built (see "On a board" below).

## The four labels

### Easy
All of these hold:
- The connection is a classic, heavily taught association: a well-known list,
  mnemonic, triad or table that most students recall on sight.
- It is plain recall. Spotting it needs no telling apart of look-alikes and no
  reasoning from a mechanism.
- Every tile uses its best-known name.
- No tile would plausibly be put into a different, well-known group by a
  typical student.

### Medium
- Standard exam knowledge, but finding the group takes one step: linking the
  tiles to a shared cause, effect, drug class, organism, pathway or finding.
- Or a classic list where one or two tiles are less familiar, or one tile has
  a well-known pull toward another group.
- Look-alike discrimination at this level is mild: the right four are clear
  once the link is seen.

### Hard
At least one of these, and the connection is still standard curriculum:
- It needs telling look-alikes apart (several tiles could belong to two
  familiar groups, and only the specific link decides).
- It needs reasoning from a mechanism rather than recall of a list.
- It rests on less commonly taught facts, or tiles named by a less familiar
  term (an eponym, an older name, a lab or histology description).

### Expert
Both of these:
- It meets the Hard criteria, and
- it adds a second layer: niche or second-order material (a detail most
  students would not have met), or a group where two or more tiles strongly
  pull toward other well-known groups, or reasoning in two steps.

Expert is rare. If in doubt between Hard and Expert, choose Hard.

## How the label is computed

`scripts/library/boards.mjs` (`difficultyScore`, `difficultyTier`):

| Signal | Source | Effect |
|---|---|---|
| Audience recognition 1 to 5 | content audit (`audit/difficulty-audit.json`, `audit/rerate.json`) | base score |
| Reasoning | same audit | recall +0, look-alike discrimination +0.5, mechanism +0.75 |
| Tiles not under their best-known name | second rating (`audit/difficulty-second-rating.json`) | +0.25 each, at most +0.5 |
| Wording that gives the group away (a numbered series, a shared word stem) | same audit, `series` / `shared-stem` | −0.5 |

Cut points: below 1.75 Easy, below 2.75 Medium, below 3.75 Hard, 3.75 and up
Expert.

Then three rules, checked at build time:
1. **Easy is recall only.** A group that needs discrimination or mechanism
   reasoning is at least Medium.
2. **Expert must be confirmed.** A computed Expert stays Expert only when the
   second rating also says Hard or Expert; otherwise it is Hard.
3. **Owner decisions win.** `audit/difficulty-overrides.json` sets a label for
   a connection outright, after review.

## Ratings must agree

A second, independent AI rating (`audit/difficulty-second-rating.json`) judges
every connection against this rubric without seeing the first audit. A label
is **confirmed** when the computed label and the second rating land on the
same tier and the score is not within 0.25 of a cut point.

Otherwise a third independent rating (`audit/difficulty-third-rating.json`)
is asked. When it matches one of the other two, that majority sets the label
(**majority**). The **review queue** (`audit/difficulty-review.md`,
`audit/difficulty-review-queue.json`) holds the rest:
- all three ratings differ, or
- the three ratings span two tiers or more (listed first).

A queued connection ships with the majority rating, or the middle one when
all three differ, until you
decide it: add it to `audit/difficulty-overrides.json` and run activation.

## On a board

Each group's label on a Daily or Systems board starts from its own score and
moves for how the board plays: +0.5 for each tile that tempts toward another
group (at most +1), +0.5 when its tile kind is shared with other groups, −1
when its wording isolates it. The board label may differ from the group's own
label by at most one step. Groups are shown easiest to hardest.

Boards already released keep their colour order (players may have a saved
game in progress); only their labels are updated. A later group reads easier
than an earlier one only where the one-step rule requires it.

On October 15 2026 every Daily and Systems board was rebuilt under these labels
(content epoch `2026-10-labels`, with the owner's agreement while they were the
only player) and every new board passed an AI fairness review.

All of this is an estimate from content and AI ratings, not player data.
