# Timed bank: Split, Sequence, Missing Step

`plexus_timed_bank_ai_reviewed.json` is the supplied bank (60 Split, 30
Sequence, 30 Missing Step). Every item is AI_REVIEWED_PASS. It has not been
verified by a person, and the app never labels it human verified.

## Import

    npm run import:timed-arrows            # validate and write src/data/timedArrowsBank.js
    npm run import:timed-arrows -- --check # exit 1 if the app data is out of date
    npm run test:timed-bank                # data, shuffling, repeats, Race, scoring

The importer checks every item first. If anything fails, it prints
`content_id: reason` for each problem and writes nothing. It never drops an
item or changes an answer. Output is sorted by content id, so running it again
on the same file changes nothing.

What the app gets: prompt, clinical context, topic, systems, difficulty, the
answer key, the full step and choice text, and the explanations (whole round,
plus per tile, step and choice). The full gameplay fields are used. The audit's
abbreviated answer summaries are not.

What stays here and never ships: source titles and pages, reviewer notes,
source caveats, review focus and adaptation notes.

## In the game

- 3 Minutes: imported rounds are mixed in with the curated Split and chain
  rounds, in proportion to pool size.
- Race (live, server scored): at most one Split, one Chain and one Complete the
  Chain per race. The rounds come from the race code, so both players get the
  same items, order and shuffles. Race rounds follow the race difficulty curve,
  so only the rated imported items are used there.
- Sequence and Missing Step versions of a chain share `arrows:<concept_id>`.
  That one key blocks the second format for the rest of a session (and in a
  race). It also goes into the device's recent list, so the chain is passed
  over next session while other chains remain.
- Answers are matched by stable tile, step and choice ids, so shuffling never
  changes the key.
