# Plexus new library: pending review queue

Generated 2026-10-08T07:00:01.015Z. Staging only; the library is not active and the live app is unchanged.

| Category | Open |
|---|---|
| Medical / source holds | 2 |
| Duplicate decisions (new library) | 1 |
| Timed-library overlaps | 9 to decide, 2 recorded |
| Board ambiguity reviews | 1 |
| Blocked boards | 0 |
| Difficulty calibration warnings | 1 |

## 1. Medical / source holds
### PLX-BCH-009 · Agents using retrograde axonal transport (Biochemistry/Genetics, AI_REVIEWED_REVISED)
Tiles: Tetanus toxin · Herpes simplex virus · Poliovirus · Rabies virus

Issue: The corrected tile (Tetanus toxin, replacing Clostridium tetani) is supported only by the outside citation in Notes (Yen and Thwaites, Lancet 2019). The row still cites Bootcamp Cell Biology > Cytoskeleton p. 8, and Notes say that source names the organism. Confirm the correction and add the supporting reference to the Source field, or record that the mismatch is accepted.

### DERM-034 · Glomus tumor clues (Dermatology, AI_REVIEWED_REVISED)
Tiles: Painful subungual lesion · Red-blue nodule · Glomus body origin · Cold hypersensitivity

Issue: Tile 4 was changed by the review from the source's "Thermoregulatory smooth muscle" to "Cold hypersensitivity", a new clinical feature supported by outside references in Notes (Lee et al, J Hand Surg Eur Vol 2009; Chen et al, JAMA Otolaryngol 2017). The row still cites Bootcamp Vascular Tumors > Glomus Tumor p. 110 only. Confirm the new tile and add the supporting reference to Source, or record that this is accepted (same question as PLX-BCH-009).

## 2. Duplicate decisions (new library)
### Classic Marfan syndrome associations  /  Marfan syndrome associations
possible duplicate (held). Shared relationship: both are "findings / associations of marfan syndrome".

| | PLX-BCH-031 (new, Biochemistry/Genetics) | CARD-017 (new, Cardiology) |
|---|---|---|
| Title | Classic Marfan syndrome associations | Marfan syndrome associations |
| Tile 1 | Arachnodactyly | Fibrillin-1 defect |
| Tile 2 | Upward lens subluxation | Upward lens displacement |
| Tile 3 | Aortic dissection | Aortic root enlargement |
| Tile 4 | Pectus deformity | Mitral valve prolapse |
| Status | AI_REVIEWED_PASS | AI_REVIEWED_PASS |

Held until decided: CARD-017.
Decide: decisions.json → pairs → "CARD-017 | PLX-BCH-031": "same" or "distinct"

## 3. Timed-library overlaps
### Fat-soluble vitamins  /  Fat-soluble vitamins
same relationship as a timed entry (timed entry to be excluded at activation). Shared relationship: both are "fat soluble vitamin"; 4 of 4 tiles identical; tile wording 100% the same.

| | PLX-BCH-008 (new, Biochemistry/Genetics) | bank-ext-001 (timed, Biochemistry/Genetics) |
|---|---|---|
| Title | Fat-soluble vitamins | Fat-soluble vitamins |
| Tile 1 | Vitamin A | Vitamin A |
| Tile 2 | Vitamin D | Vitamin D |
| Tile 3 | Vitamin E | Vitamin E |
| Tile 4 | Vitamin K | Vitamin K |
| Status | AI_REVIEWED_PASS | verified |

Decide: no decision needed unless you disagree

### Storage diseases with enzyme replacement described in the source  /  Lysosomal storage diseases
possible repeat of a timed entry. Shared relationship: "storage disease enzyme replacement" vs "lysosomal storage disease"; 3 of 4 tiles identical; tile wording 63% the same.

| | PLX-BCH-079 (new, Biochemistry/Genetics) | bank-ext-086 (timed, Biochemistry/Genetics) |
|---|---|---|
| Title | Storage diseases with enzyme replacement described in the source | Lysosomal storage diseases |
| Tile 1 | Fabry disease | Tay-Sachs disease |
| Tile 2 | Gaucher disease | Gaucher disease |
| Tile 3 | Hurler syndrome | Fabry disease |
| Tile 4 | Pompe disease | Hurler syndrome |
| Status | AI_REVIEWED_PASS | verified |

Decide: decisions.json → pairs → "PLX-BCH-079 | bank-ext-086": "same" (exclude timed entry at activation) or "distinct"

### The four defects in tetralogy of Fallot  /  Findings in tetralogy of Fallot
possible repeat of a timed entry. Shared relationship: "defect tetralogy fallot" vs "findings / associations of tetralogy fallot"; 2 of 4 tiles identical; tile wording 82% the same.

| | CARD-001 (new, Cardiology) | bank-ext-050 (timed, Cardiology) |
|---|---|---|
| Title | The four defects in tetralogy of Fallot | Findings in tetralogy of Fallot |
| Tile 1 | Pulmonary outflow stenosis | Pulmonary stenosis |
| Tile 2 | Aorta overriding the septum | Right ventricular hypertrophy |
| Tile 3 | Ventricular septal defect | Overriding aorta |
| Tile 4 | Right ventricular hypertrophy | Ventricular septal defect |
| Status | AI_REVIEWED_PASS | verified |

Decide: decisions.json → pairs → "CARD-001 | bank-ext-050": "same" (exclude timed entry at activation) or "distinct"

### Classic causes of high-output heart failure  /  Causes of high-output heart failure
possible repeat of a timed entry. Shared relationship: both are "causes of high output heart failure"; 2 of 4 tiles identical; tile wording 67% the same.

| | CARD-002 (new, Cardiology) | bank-medium-16 (timed, Cardiology) |
|---|---|---|
| Title | Classic causes of high-output heart failure | Causes of high-output heart failure |
| Tile 1 | Thiamine deficiency | Severe anemia |
| Tile 2 | Severe anemia | Thyrotoxicosis |
| Tile 3 | Hyperthyroidism | Arteriovenous fistula |
| Tile 4 | Arteriovenous fistula | Thiamine deficiency (beriberi) |
| Status | AI_REVIEWED_PASS | verified |

Decide: decisions.json → pairs → "CARD-002 | bank-medium-16": "same" (exclude timed entry at activation) or "distinct"

### Classic causes of high-output heart failure  /  Causes of a widened pulse pressure
possible repeat of a timed entry. Shared relationship: "causes of high output heart failure" vs "causes of widened pulse pressure"; 3 of 4 tiles identical.

| | CARD-002 (new, Cardiology) | bank-migrated-sys-cardio-0002-L4 (timed, Cardiology) |
|---|---|---|
| Title | Classic causes of high-output heart failure | Causes of a widened pulse pressure |
| Tile 1 | Thiamine deficiency | Aortic regurgitation |
| Tile 2 | Severe anemia | Hyperthyroidism |
| Tile 3 | Hyperthyroidism | Severe anemia |
| Tile 4 | Arteriovenous fistula | Arteriovenous fistula |
| Status | AI_REVIEWED_PASS | verified |

Decide: decisions.json → pairs → "CARD-002 | bank-migrated-sys-cardio-0002-L4": "same" (exclude timed entry at activation) or "distinct"

### Drugs that slow AV nodal conduction  /  Drugs that slow AV nodal conduction
same relationship as a timed entry (timed entry to be excluded at activation). Shared relationship: both are "drug slow av nodal conduction"; 3 of 4 tiles identical; tile wording 60% the same.

| | CARD-007 (new, Cardiology) | bank-ext-020 (timed, Pharmacology) |
|---|---|---|
| Title | Drugs that slow AV nodal conduction | Drugs that slow AV nodal conduction |
| Tile 1 | Verapamil | Adenosine |
| Tile 2 | Diltiazem | Diltiazem |
| Tile 3 | Metoprolol | Metoprolol |
| Tile 4 | Digoxin | Digoxin |
| Status | AI_REVIEWED_PASS | verified |

Decide: no decision needed unless you disagree

### Conditions that can produce restrictive cardiomyopathy  /  Causes of restrictive cardiomyopathy
possible repeat of a timed entry. Shared relationship: both are "causes of restrictive cardiomyopathy"; 1 of 4 tiles identical.

| | CARD-012 (new, Cardiology) | bank-ext-051 (timed, Cardiology) |
|---|---|---|
| Title | Conditions that can produce restrictive cardiomyopathy | Causes of restrictive cardiomyopathy |
| Tile 1 | Cardiac amyloidosis | Amyloidosis |
| Tile 2 | Hemochromatosis | Hemochromatosis |
| Tile 3 | Cardiac sarcoidosis | Sarcoidosis |
| Tile 4 | Chest irradiation | Endomyocardial fibrosis |
| Status | AI_REVIEWED_PASS | verified |

Decide: decisions.json → pairs → "CARD-012 | bank-ext-051": "same" (exclude timed entry at activation) or "distinct"

### Classic cardiac tamponade findings  /  Findings in cardiac tamponade
possible repeat of a timed entry. Shared relationship: both are "findings / associations of cardiac tamponade"; 1 of 4 tiles identical.

| | CARD-034 (new, Cardiology) | bank-migrated-sys-mixed-0002-L4 (timed, Mixed / Step Review) |
|---|---|---|
| Title | Classic cardiac tamponade findings | Findings in cardiac tamponade |
| Tile 1 | Low blood pressure | Pulsus paradoxus |
| Tile 2 | Distended neck veins | Electrical alternans |
| Tile 3 | Quiet heart sounds | Beck's triad |
| Tile 4 | Pulsus paradoxus | Low-voltage QRS on ECG |
| Status | AI_REVIEWED_PASS | verified |

Decide: decisions.json → pairs → "CARD-034 | bank-migrated-sys-mixed-0002-L4": "same" (exclude timed entry at activation) or "distinct"

### Infectious associations of erythema nodosum  /  Granulomatous infections with necrotizing (caseating) granulomas
possible repeat of a timed entry. Shared relationship: "findings / associations of infectious erythema nodosum" vs "granulomatous infection necrotizing caseating granuloma"; 3 of 4 tiles identical.

| | DERM-018 (new, Dermatology) | bank-easy-04 (timed, Microbiology) |
|---|---|---|
| Title | Infectious associations of erythema nodosum | Granulomatous infections with necrotizing (caseating) granulomas |
| Tile 1 | Coccidioidomycosis | Tuberculosis |
| Tile 2 | Histoplasmosis | Histoplasmosis |
| Tile 3 | Tuberculosis | Coccidioidomycosis |
| Tile 4 | Streptococcal infection | Nontuberculous mycobacterial infection |
| Status | AI_REVIEWED_PASS | needs_review |

Decide: decisions.json → pairs → "DERM-018 | bank-easy-04": "same" (exclude timed entry at activation) or "distinct"

### Psoriasis clinical associations  /  Features of psoriasis
possible repeat of a timed entry. Shared relationship: both are "findings / associations of psoriasis"; 2 of 4 tiles identical.

| | DERM-029 (new, Dermatology) | bank-ext-110 (timed, Dermatology) |
|---|---|---|
| Title | Psoriasis clinical associations | Features of psoriasis |
| Tile 1 | Silvery plaques | Silvery scale |
| Tile 2 | Auspitz sign | Auspitz sign |
| Tile 3 | Nail pitting | Nail pitting |
| Tile 4 | Psoriatic arthritis | Extensor-surface plaques |
| Status | AI_REVIEWED_PASS | verified |

Decide: decisions.json → pairs → "DERM-029 | bank-ext-110": "same" (exclude timed entry at activation) or "distinct"

### Hereditary syndromes associated with pheochromocytoma  /  Conditions associated with pheochromocytoma
possible repeat of a timed entry. Shared relationship: "findings / associations of hereditary syndrome pheochromocytoma" vs "causes of + findings / associations of pheochromocytoma"; 3 of 4 tiles identical; tile wording 80% the same.

| | ENDO-029 (new, Endocrine) | bank-ext-082 (timed, Endocrine) |
|---|---|---|
| Title | Hereditary syndromes associated with pheochromocytoma | Conditions associated with pheochromocytoma |
| Tile 1 | Neurofibromatosis type 1 | MEN2A |
| Tile 2 | Von Hippel-Lindau syndrome | MEN2B |
| Tile 3 | MEN2A | Von Hippel-Lindau disease |
| Tile 4 | MEN2B | Neurofibromatosis type 1 |
| Status | AI_REVIEWED_PASS | verified |

Decide: decisions.json → pairs → "ENDO-029 | bank-ext-082": "same" (exclude timed entry at activation) or "distinct"

## 4. Board ambiguity reviews
### biochemistry-genetics-starter-5 (Biochemistry/Genetics)
- PLX-BCH-050 Classic alkaptonuria associations [easy]: Ochronosis · Black urine after standing · Elevated homogentisate · Arthritis
- PLX-BCH-044 Extrahepatic tissues that can oxidize ketone bodies [medium]: Heart · Brain · Skeletal muscle · Renal cortex
- PLX-BCH-070 Processes supported by peroxisomes [medium]: Very-long-chain fatty acid beta-oxidation · Branched-chain fatty acid alpha-oxidation · Hydrogen peroxide detoxification · Plasmalogen synthesis
- PLX-BCH-077 Aromatic L-amino acid decarboxylase deficiency clues [hard]: Oculogyric crises · Hypotonia · Autonomic dysfunction · Developmental delay
- Flag: PLX-BCH-077 board instruction to check against the other groups: "Avoid a competing neurotransmitter-deficiency category on the same board."
- Clear: decisions.json → boards → "biochemistry-genetics-starter-5": "cleared:4b155f2b"

## 5. Blocked boards
None.
## 6. Difficulty calibration warnings
Separate from medical and ambiguity issues. These do not block a board.

- PLX-BCH-071 Levels of protein structure [easy] on biochemistry-genetics-starter-1: "Intentionally introductory category; may be too transparent for a Hard puzzle."
