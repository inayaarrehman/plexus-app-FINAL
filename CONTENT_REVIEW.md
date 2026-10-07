# Content review list (internal)

Plexus content was reviewed in October 2026 by AI-assisted review against standard medical teaching. This was not a complete expert review. Corrections live in `src/data/contentCorrections.js` (ids unchanged). The entries below still need a person with clinical expertise to look at them.

## Pulled from play (status needs_review)

- **Diseases named after geographic locations** (connectionBank:bank-expert-04): Decide whether to keep both place-name categories; if both stay, make sure they never appear in the same puzzle or swap tiles so they do not overlap. Issues: Near-duplicate of bank-migrated-sys-mixed-0001-L1 ("Diseases named after places"): three of four tiles are identical (Rocky Mountain spotted fever, Lyme disease, West Nile). Labeled expert, but the reasoning is simple place-name recognition; lowered to medium.
- **A compensatory response that creates its own measurable abnormality** (connectionBank:bank-expert-07): Consider narrowing the title (e.g. "Compensation that shows up as a second blood gas or sodium abnormality") or making sure no other primary disturbance appears in the same puzzle. Medical content of the four tiles is accurate. Issues: Title is very broad: many common concepts also fit (e.g. hypoxemia causing secondary polycythemia, hypocalcemia causing secondary hyperparathyroidism, any primary respiratory acid-base disorder with renal compensation).

## Flagged, left unchanged

- **Diseases named after places** (connectionBank:bank-migrated-sys-mixed-0001-L1): Near-duplicate of bank-expert-04 (three shared tiles); see that entry.
- **Inherited/acquired hypercoagulable states** (connectionBank:bank-migrated-sys-mixed-0001-L4): Difficulty "expert" seems high for standard thrombophilia recall, but left unchanged because migrated L1-L4 sets appear to map one category per difficulty level.
- **Obligate intracellular organisms** (connectionBank:bank-migrated-sys-micro-0001-L4): Coxiella burnetii can now be grown in cell-free (axenic) media, though boards still list it as obligate intracellular; acceptable for board-level play. Difficulty "expert" is high for standard recall, but left unchanged because migrated L1-L4 sets appear to map one category per difficulty level.
- **Signs of appendicitis** (connectionBank:bank-migrated-sys-mixed-0002-L1): connectionType is "language", but this is a clinical knowledge category; if retyped, nearMisses will be needed.
- **Signs of hypocalcemia** (connectionBank:bank-migrated-sys-mixed-0002-L3): connectionType is "language", but this is a clinical knowledge category; if retyped, nearMisses will be needed.
- **Findings in cardiac tamponade** (connectionBank:bank-migrated-sys-mixed-0002-L4): connectionType is "language", but this is a clinical knowledge category; if retyped, nearMisses will be needed.
- **Conditions associated with berry aneurysms** (connectionBankExtra:bank-ext-037): Marfan syndrome as a berry aneurysm risk is a classic board association, though the evidence is weaker than for ADPKD; left as is
- **Causes of respiratory acidosis** (migratedBankCategories:bank-migrated-sys-renal-0001-L4): Difficulty "expert" seems high for classic respiratory acidosis causes; left as is to keep the puzzle ladder.
- **Named brainstem syndromes** (migratedBankCategories:bank-migrated-sys-neuro-0001-L4): connectionType is "language" though this is a knowledge category; no nearMisses written per rules.

## Known gaps

- Some clinical sign categories are typed `language` (Mixed-0002 signs: appendicitis, meningeal irritation, hypocalcemia, tamponade; named brainstem syndromes). They have no curated near misses, so they are used only in Mini Connections and Daily boards, not in 3-Minute rounds that need distractors. Retype them and add near misses to bring them back.
- A few difficulty labels look generous (migrated L4 sets, some connectionBankExtra "expert" entries, "Causes of respiratory acidosis"). They were kept to preserve each puzzle's one-per-tier structure.
- Fixes to tiles in `systemPuzzles.js` and early authored Dailies were applied as overlays; a player who saved a Systems puzzle mid-solve before this update sees the corrected terms when the group is revealed.
- Near misses were written for the 3-Minute mode and checked only for not repeating the category's own tiles. They should be spot-checked, starting with the most played categories.

## Sources opened during the review

- https://peir.path.uab.edu/wiki/IPLab:Lab_10:Blastomycosis
- https://www.ajnr.org/content/ajnr/37/8/1422.full.pdf
- https://pro.dermnetnz.org/topics/severe-cutaneous-adverse-reaction
- https://www.aafp.org/pubs/afp/issues/2019/0715/p82.html
- https://medlineplus.gov/genetics/condition/leigh-syndrome
- https://www.statpearls.com/point-of-care/31464
