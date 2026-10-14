# Plexus new library: activation report

Daily switches to the new library on **2026-10-10** (players' local date). Earlier dates keep the existing Daily.

## Content

| | Count |
|---|---|
| Active connections (eligible, unique, not held) | 647 |
| ...served on a published board | 640 |
| Held: medical / source review | 14 |
| Held: possible duplicate awaiting decision | 23 |
| Consolidated into a canonical relationship | 8 |
| Human verified | 0 |

Review labels of active connections: AI_REVIEWED_PASS 476, AI_REVISION_CHECKED 160, AI_REVIEWED_REVISED 11 (OpenEvidence AI review; none relabelled as human verified).

## Systems starter boards

| Subject | Published | Shortfall |
|---|---|---|
| Cardiology | 5 | 0 |
| Pulmonary | 4 | 1 |
| Renal | 5 | 0 |
| Neurology | 5 | 0 |
| GI | 5 | 0 |
| Endocrine | 5 | 0 |
| Heme/Onc | 5 | 0 |
| MSK | 5 | 0 |
| Reproductive | 5 | 0 |
| Psychiatry | 5 | 0 |
| Microbiology | 5 | 0 |
| Immunology | 5 | 0 |
| Dermatology | 5 | 0 |
| Pharmacology | 3 | 2 |
| Biochemistry/Genetics | 5 | 0 |
| Genetics | 5 | 0 |

Total published: 77. Held: 0.

### Flags reviewed and cleared (not silently)
- **biochemistry-genetics-starter-4** (Claude (AI board review), 2026-10-13): Reviewer note satisfied: no competing neurotransmitter-deficiency group is on the board.
  - flag: PLX-BCH-077 board instruction to check against the other groups: "Avoid a competing neurotransmitter-deficiency category on the same board."
- **microbiology-starter-3** (Claude (AI board review), 2026-10-13): The Parvovirus B19 name overlap is a tempting link, not ambiguity: the tile is a virus, not a clinical syndrome.
  - flag: "Naked DNA virus groups" / "Parvovirus B19 clinical syndromes": tile "Parvovirus B19" is named in "Parvovirus B19 clinical syndromes"'s title or explanation
- **msk-starter-5** (Claude (AI board review), 2026-10-13): Reviewer note satisfied: neither navicular nor sesamoids appear on the board.
  - flag: MSK-035 board instruction to check against the other groups: "Board overlap: navicular and sesamoids are additional high-risk sites - avoid as distractors."
- **renal-starter-2** (Claude (AI board review), 2026-10-13): Reviewer note satisfied: no Valsalva-maneuver category is on the board.
  - flag: NEPH-027 board instruction to check against the other groups: "Board overlap: any Valsalva-maneuver category (ambiguity 1)."
- **pharmacology-starter-1** (Claude (AI board review), 2026-10-13): Gs/Gq share wording but membership is textbook-distinct; no adrenergic-receptor group is present for beta-1/beta-2 to compete with; no extra phase II member (glutathione, amino acid) appears as a stray tile.
  - flag: "Gq-coupled receptors" / "Gs-coupled receptors": both are about coupled receptor
  - flag: PHARM-001 board instruction to check against the other groups: "Glutathione and amino-acid conjugation are other valid members; a 5th-member board tile could blur this category."
  - flag: PHARM-005 board instruction to check against the other groups: "BOARD OVERLAP: beta-1/beta-2 also fit an adrenergic-receptor category."
- **pharmacology-starter-2** (Claude (AI board review), 2026-10-13): No sympathomimetic toxidrome group is present, so mydriasis/tachycardia are unambiguous; each cholinergic/anticholinergic sign sits in its only fitting toxidrome on this board.
  - flag: PHARM-008 board instruction to check against the other groups: "BOARD OVERLAP: each sign individually appears in other toxidromes."
  - flag: PHARM-009 board instruction to check against the other groups: "BOARD OVERLAP: mydriasis and tachycardia also occur in sympathomimetic toxicity."
- **pharmacology-starter-3** (Claude (AI board review), 2026-10-13): Sotalol fits its nonselective beta-blocker group and there is no class III group on the board; no antiseizure-drug group exists to compete with the inducers; carbachol is absent, so no fifth muscarinic agonist appears.
  - flag: PHARM-002 board instruction to check against the other groups: "BOARD OVERLAP: carbamazepine, phenobarbital, phenytoin also fit an antiseizure-drug category; rifampin does not."
  - flag: PHARM-006 board instruction to check against the other groups: "Carbachol is another valid member (board note)."
  - flag: PHARM-013 board instruction to check against the other groups: "BOARD OVERLAP: sotalol also fits class III antiarrhythmics; its added K-channel activity does not negate its beta-blockade."
- **psychiatry-starter-1** (Claude (AI board review), 2026-10-13): No anticipation/affiliation/self-assertion decoys appear; the schizophrenia group has no competing psychosis-diagnosis group on the board.
  - flag: PSY-001 board instruction to check against the other groups: "Board caution: anticipation, affiliation, self-assertion are also mature defenses and make strong decoys."
  - flag: PSY-006 board instruction to check against the other groups: "Board overlap: schizoaffective, brief psychotic, schizophreniform, and substance-induced psychosis share these; do not present as diagnostic of schizophrenia."
- **psychiatry-starter-5** (Claude (AI board review), 2026-10-13): Only one antipsychotic class group is present, so shared EPS risk causes no conflict; escitalopram is absent; no serotonin syndrome group is present to compete with NMS findings.
  - flag: PSY-012 board instruction to check against the other groups: "Board caution: escitalopram is the S-enantiomer of citalopram, so the pair are near-duplicates and could be contested as distinct tiles; keep them on separate boards if possible."
  - flag: PSY-018 board instruction to check against the other groups: "Shared high EPS risk is a board-overlap consideration."
  - flag: PSY-023 board instruction to check against the other groups: "Board overlap: fever, altered mental status, and autonomic instability also occur in serotonin syndrome—lead-pipe rigidity (vs clonus/hyperreflexia) is the differentiating tile."
- **pulmonary-starter-1** (Claude (AI board review), 2026-10-13): PULM-017 pleural warning: no competing pleural category exists on this board, so the instruction is respected. PULM-013 air-trapping overlap: no other group contains air-trapping disorders. PULM-003 carcinoid/LCNEC overlap: no carcinoid or LCNEC group or tile is present.
  - flag: PULM-017 board instruction to check against the other groups: "BOARD-LEVEL OVERLAP WARNING: three tiles (plaques, benign effusion, mesothelioma) are pleural and could be grouped as ''asbestos pleural disease'' on a 16-tile board; pair with care and avoid a competing pleural category."
  - flag: PULM-013 board instruction to check against the other groups: "Board overlap: ''air trapping disorders.'' Added refs: Stanojevic et al., ERS/ATS 2022;"
  - flag: PULM-003 board instruction to check against the other groups: "Board overlap: these markers also stain carcinoid and LCNEC."
- **pulmonary-starter-4** (Claude (AI board review), 2026-10-13): PULM-011 tissue-hypoxia overlap: the PULM-010 mechanisms all lower PaO2, so the 'despite normal arterial oxygen tension' title excludes them and a careful player can separate the two oxygen groups.
  - flag: PULM-011 board instruction to check against the other groups: "Board overlap: broader ''causes of tissue hypoxia.'' Added refs: Henretig et al., NEJM 2019;"
- **reproductive-starter-3** (Claude (AI board review), 2026-10-13): Reviewer note satisfied: the unopposed-estrogen group is the only endometrial-risk group on the board.
  - flag: REPRO-015 board instruction to check against the other groups: "Board caution: do not place a separate endometrial-cancer-risk group on the same board."
- **reproductive-starter-4** (Claude (AI board review), 2026-10-13): No gestational trophoblastic disease or quad-screen group is on the board.
  - flag: REPRO-007 board instruction to check against the other groups: "Board overlap: mole/choriocarcinoma also fit gestational trophoblastic disease, and trisomy 21 fits quad-screen findings; avoid these competing groups on the same board."

## Daily

- Launch-ready Daily boards: **83** (53 with no flags, 30 flagged and cleared on review).
- Runway: 2026-10-10 to 2026-12-31 with no relationship repeated.
- Boards waiting for review (not scheduled): 0. Rejected on review: 12. Connections left over (no compatible board yet): 2.
- Exhaustion policy: after 2026-12-31, the Daily replays the same reviewed boards in the same order, one per day, under new dates. Nothing is regenerated, so no unreviewed board appears. Importing more content before then extends the new schedule instead.

### Daily boards reviewed
- **nd-002** cleared (Claude (AI board review), 2026-10-13): PLX-HEM-004: no warm-AIHA group. MICRO-058: no nephrotoxic/ototoxic category. PULM-001: no antineoplastic category. REPRO-025: no epididymo-orchitis group.
  - MICRO-058 Aminoglycoside antibiotics: Gentamicin · Tobramycin · Amikacin · Streptomycin
  - PLX-HEM-004 Cold-antibody hemolysis associations: Mycoplasma pneumoniae infection · Epstein-Barr virus infection · Waldenstrom macroglobulinemia · Chronic lymphocytic leukemia
  - PULM-001 Drugs associated with pulmonary fibrosis: Bleomycin · Amiodarone · Nitrofurantoin · Busulfan
  - REPRO-025 Bacterial pathogens of infectious epididymitis: Chlamydia trachomatis · Neisseria gonorrhoeae · Escherichia coli · Pseudomonas aeruginosa
- **nd-005** cleared (Claude (AI board review), 2026-10-13): MSK-005: no RA group on board. PLX-BCH-011: no Mn-SOD tile. PLX-BCH-012: no extra NADPH-using tiles outside the group.
  - MSK-005 Classic radiographic changes of osteoarthritis: Nonuniform (asymmetric) joint-space loss · Subchondral sclerosis · Marginal osteophytes · Subchondral cysts
  - PLX-BCH-011 Enzymes requiring copper: Cytochrome c oxidase · Tyrosinase · Lysyl oxidase · Superoxide dismutase 1
  - PLX-BCH-012 Enzymes that use NADPH: Glutathione reductase · HMG-CoA reductase · Fatty acid synthase · NADPH oxidase
  - PLX-HEM-061 Monoclonal light-chain disease associations: Bence Jones proteinuria · Myeloma cast nephropathy · AL amyloidosis · Abnormal kappa/lambda ratio
- **nd-008** cleared (Claude (AI board review), 2026-10-13): GI-024: no secondary iron overload group. NEPH-003: no ototoxicity category.
  - CARD-052 Typical changes during dynamic exercise: Increased heart rate · Increased contractility · Increased venous return · Reduced systemic vascular resistance
  - ENDO-042 Glucose-lowering agents associated with weight loss: Metformin · Dapagliflozin · Exenatide · Liraglutide
  - GI-024 Iron studies in hereditary hemochromatosis: Increased serum iron · Increased ferritin · Increased transferrin saturation · Reduced TIBC
  - NEPH-003 Loop diuretics: Furosemide · Torsemide · Bumetanide · Ethacrynic acid
- **nd-009** cleared (Claude (AI board review), 2026-10-13): PLX-BCH-036: no RNA/protein methylation tiles. PLEXUS-GEN-012: no xeroderma pigmentosum or other instability group.
  - MICRO-060 Fluoroquinolone topoisomerase inhibitors: Ciprofloxacin · Levofloxacin · Moxifloxacin · Ofloxacin
  - NEU-047 Parinaud (dorsal midbrain) syndrome clues: Vertical (up) gaze palsy · Light-near dissociation · Convergence-retraction nystagmus · Obstructive hydrocephalus
  - PLEXUS-GEN-012 Bloom syndrome associations: Short stature · Long narrow face · Photosensitive facial (butterfly) telangiectatic erythema · Markedly increased cancer risk
  - PLX-BCH-036 Processes using SAM methyl donation: Creatine synthesis · Epinephrine synthesis · Phosphatidylcholine synthesis · DNA methylation
- **nd-012** cleared (Claude (AI board review), 2026-10-13): MSK-020: no small round blue cell tumor group. GI-052: neurologic dysfunction tile does not fit other groups. PLEXUS-GEN-019: no overlap found.
  - GI-052 Extraintestinal manifestations of Whipple disease: Migratory arthralgias · Culture-negative endocarditis · Lymphadenopathy · Neurologic dysfunction
  - MICRO-021 Invasive pulmonary aspergillosis clues: CT halo sign · Positive galactomannan · Hemoptysis in an immunocompromised host · Pulmonary nodules with cavitation
  - MSK-020 Classic Ewing sarcoma clues: Diaphyseal lesion · Onion-skin periosteal reaction · Small round blue cells · EWSR1-FLI1 fusion
  - PLEXUS-GEN-019 Respiratory and related findings in cystic fibrosis: Recurrent pulmonary infections · Thick airway secretions · Nasal polyps · Digital clubbing
- **nd-013** cleared (Claude (AI board review), 2026-10-13): NEPH-028: no other RTA/NAGMA category on board.
  - IMM-024 Selective IgA deficiency associations: Low IgA with preserved IgG / IgM · Giardia-associated diarrhea · False-negative tTG-IgA testing · Anaphylactic transfusion reactions
  - NEPH-028 Normal-anion-gap metabolic acidosis associations: Diarrhea · Acetazolamide · Distal renal tubular acidosis · Pancreatic fistula
  - PLX-BCH-045 Familial hyperchylomicronemia clinical clues: Eruptive xanthomas · Recurrent pancreatitis · Hepatosplenomegaly · Creamy plasma supernatant
  - PLX-HEM-010 Typical laboratory pattern of hemolysis: Elevated LDH · Unconjugated hyperbilirubinemia · Low haptoglobin · Reticulocytosis
- **nd-014** cleared (Claude (AI board review), 2026-10-13): NEU-024: generic overlap note; only Stapes/otosclerosis tempts, resolvable. MICRO-005: no clostridial-toxin disease group. MSK-034: Ottawa tiles are correct landmarks.
  - CARD-050 Second pharyngeal arch cartilage derivatives: Stapes · Styloid process · Stylohyoid ligament · Lesser horn of hyoid
  - MICRO-005 Spore-forming obligate anaerobic bacilli: Clostridium tetani · Clostridium botulinum · Clostridium perfringens · Clostridioides difficile
  - MSK-034 Bony tenderness sites in the Ottawa ankle-foot rules: Posterior edge or tip of lateral malleolus · Posterior edge or tip of medial malleolus · Base of the fifth metatarsal · Navicular
  - NEU-024 Causes of conductive hearing loss: Cerumen impaction · Otitis media · Otosclerosis · Tympanic membrane perforation
- **nd-015** cleared (Claude (AI board review), 2026-10-13): NEPH-024: no hypercalcemia or erythrocytosis group. PLX-BCH-068: no threonine/tryptophan tiles. PHARM-011 (x2): no alfuzosin/silodosin or BPH-treatment category.
  - IMM-018 Live attenuated viral vaccines: MMR vaccine · Varicella vaccine · Rotavirus vaccine · Yellow fever vaccine
  - NEPH-024 Renal cell carcinoma paraneoplastic mediators: PTH-related peptide · Erythropoietin · ACTH · Renin
  - PHARM-011 Alpha-1 adrenergic antagonists: Prazosin · Terazosin · Doxazosin · Tamsulosin
  - PLX-BCH-068 Amino acids whose catabolism feeds pyruvate: Alanine · Glycine · Serine · Cysteine
- **nd-016** cleared (Claude (AI board review), 2026-10-13): NEU-049: no EPS or hyperprolactinemia group competes with the pathway tiles. GI-064: no antacid group on the board. PLEXUS-GEN-002: title says 'topoisomerases' (not one isoform) and no other group uses anthracyclines as distractors.
  - GI-064 Osmotic laxatives: Magnesium hydroxide · Sorbitol · Polyethylene glycol · Lactulose
  - GI-066 Clues to congenital indirect inguinal hernia: Patent processus vaginalis · Lateral to inferior epigastric vessels · Entry through the deep (internal) inguinal ring · Communicating hydrocele association
  - NEU-049 Major dopaminergic pathways: Mesolimbic · Mesocortical · Nigrostriatal · Tuberoinfundibular
  - PLEXUS-GEN-002 Anticancer drugs targeting topoisomerases: Irinotecan · Topotecan · Etoposide · Doxorubicin
- **nd-017** cleared (Claude (AI board review), 2026-10-13): PLX-BCH-069: no glutamate tile. MSK-010: no biologic/JAK DMARD tiles.
  - MICRO-055 Carbapenem antibiotics: Meropenem · Imipenem · Ertapenem · Doripenem
  - MSK-010 Conventional synthetic DMARDs used in RA: Methotrexate · Hydroxychloroquine · Sulfasalazine · Leflunomide
  - PLX-BCH-069 Amino acids feeding alpha-ketoglutarate through glutamate: Arginine · Proline · Histidine · Glutamine
  - PLX-HEM-005 Drugs associated with immune hemolytic anemia: Penicillin · Cephalosporins · Rifampin · Methyldopa
- **nd-018** cleared (Claude (AI board review), 2026-10-13): ENDO-002 (x2): label correctly includes ACTH; no separate glycoprotein-hormone set. NEU-002: spasticity redundancy is internal to the UMN group. REPRO-023: title specifies estrogen-containing methods.
  - ENDO-002 Anterior pituitary hormones targeting other endocrine glands: TSH · ACTH · FSH · LH
  - GI-041 Complications of acute pancreatitis: Pancreatic pseudocyst · Hypocalcemia · ARDS · DIC
  - NEU-002 Upper motor neuron examination signs: Hyperreflexia · Spasticity · Pronator drift · Extensor plantar response
  - REPRO-023 Category 4 contraindications to combined (estrogen-containing) hormonal contraception: Migraine with aura · Acute deep venous thrombosis · Prior stroke · Coronary artery disease
- **nd-019** cleared (Claude (AI board review), 2026-10-13): PLX-BCH-079: no Hunter syndrome tile. NEPH-030: no hypocalcemia group. PLEXUS-GEN-029: no Patau group.
  - CARD-009 Important adverse effects of ACE inhibitors: Dry cough · Angioedema · Hyperkalemia · Fetal toxicity
  - NEPH-030 Phosphate-elevating conditions: Renal failure · Hypoparathyroidism · Tumor lysis syndrome · Rhabdomyolysis
  - PLEXUS-GEN-029 Edwards syndrome physical findings: Prominent occiput · Clenched hands with overlapping fingers · Rocker-bottom feet · Low-set ears
  - PLX-BCH-079 Lysosomal storage diseases treated with enzyme replacement: Fabry disease · Gaucher disease · Hurler syndrome · Pompe disease
- **nd-020** cleared (Claude (AI board review), 2026-10-13): MSK-002: no HLA-B27 or enthesitis group. GI-059: no competing systemic-inflammatory category. PLX-HEM-037: protein S absent, no conflict. NEU-058: no competing TAC group.
  - GI-059 Extraintestinal manifestations of inflammatory bowel disease: Sacroiliitis · Uveitis · Erythema nodosum · Pyoderma gangrenosum
  - MSK-002 Seronegative spondyloarthritides: Ankylosing spondylitis · Psoriatic arthritis · Reactive arthritis · IBD-associated (enteropathic) spondyloarthritis
  - NEU-058 Cluster headache ipsilateral cranial autonomic signs: Lacrimation · Rhinorrhea · Nasal congestion · Miosis (partial Horner)
  - PLX-HEM-037 Inherited venous-thrombophilia mechanisms: Antithrombin deficiency · Factor V Leiden · Prothrombin G20210A mutation · Protein C deficiency
- **nd-025** cleared (Claude (AI board review), 2026-10-13): PLEXUS-GEN-014: paired format is a style caution, no ambiguity. NEPH-010: no other glomerular-lesion group. MSK-022: no MPA/EGPA group. NEU-034: clean.
  - MSK-022 Granulomatosis with polyangiitis clues: Saddle nose deformity · Chronic sinusitis · Cavitating pulmonary nodules · Pauci-immune glomerulonephritis
  - NEPH-010 Secondary membranous nephropathy associations: Hepatitis B infection · Systemic lupus erythematosus · Solid malignancy · Penicillamine exposure
  - NEU-034 Mechanisms of ischemic stroke: In-situ thrombosis · Arterial embolism · Small-vessel (lacunar) occlusion · Systemic hypoperfusion
  - PLEXUS-GEN-014 Blot techniques and their targets: Southern blot - DNA · Northern blot - RNA · Western blot - protein · Southwestern blot - DNA-binding proteins
- **nd-027** cleared (Claude (AI board review), 2026-10-13): MSK-011: minocycline is within the lupus group; no competing culprit tiles elsewhere. DERM-004 (x2): no bullous impetigo group.
  - DERM-004 Staphylococcal scalded skin syndrome clues: Exfoliative toxin · Desmoglein 1 cleavage · Positive Nikolsky sign · Mucosal sparing
  - GI-065 5-HT3 receptor antagonist antiemetics: Ondansetron · Granisetron · Dolasetron · Palonosetron
  - MSK-011 Medications classically linked to drug-induced lupus: Hydralazine · Minocycline · Isoniazid · Methyldopa
  - PLX-BCH-010 Drugs that disrupt microtubule function: Mebendazole · Griseofulvin · Colchicine · Vincristine
- **nd-029** cleared (Claude (AI board review), 2026-10-13): Birefringence pair: both descriptors sit inside MSK-006 itself, so they are redundant within one group but create no cross-group ambiguity. CPPD caution about not appearing 'as if independent' is not violated by another group. Shiga pair: makes MICRO-002 easy but is not an ambiguity.
  - DERM-014 Rhino-orbital mucormycosis clues: Necrotic nasal or palatal eschar · Broad pauciseptate hyphae · Wide-angle branching · Amphotericin B
  - MICRO-002 Bacterial toxins that inhibit host protein synthesis: Diphtheria toxin · Pseudomonas exotoxin A · Shiga toxin (Shigella dysenteriae) · Shiga-like toxin / Stx (EHEC)
  - MSK-006 CPP crystal arthritis diagnostic clues: Rhomboid crystals · Weak positive birefringence · Chondrocalcinosis · Blue when aligned parallel to the compensator
  - PLX-BCH-074 Proteins supporting long-chain fatty acid mitochondrial entry: Fatty acyl-CoA synthetase · CPT I · Carnitine-acylcarnitine translocase · CPT II
- **nd-030** cleared (Claude (AI board review), 2026-10-13): PSY-009: no 'nutritional deficiencies' tile. ENDO-020: no hyperparathyroidism group. GI-006: no Down syndrome tile. NEU-050: tangle/tau redundancy not present on this board.
  - ENDO-020 Classic clinical consequences of hypercalcemia: Nephrolithiasis · Constipation · Bone pain · Neuropsychiatric disturbances
  - GI-006 Conditions associated with macroglossia: Acromegaly · Hypothyroidism · Amyloidosis · Beckwith-Wiedemann syndrome
  - NEU-050 Alzheimer disease neuropathology clues: Extracellular amyloid-beta plaques · Intracellular neurofibrillary tangles · Hirano bodies · Cerebral amyloid angiopathy
  - PSY-009 Clinical clues to anorexia-related undernutrition: Lanugo · Amenorrhea · Osteoporosis · Bradycardia
- **nd-032** cleared (Claude (AI board review), 2026-10-13): MSK-021: no PMR group. DERM-007: no zoster-complications group. GI-048: somatostatinoma triad plus weight loss is distinct.
  - DERM-007 Clinical forms of VZV infection: Varicella · Shingles · Herpes zoster ophthalmicus · Ramsay Hunt syndrome
  - GI-048 Somatostatinoma syndrome manifestations: Diabetes mellitus · Cholelithiasis · Steatorrhea · Weight loss
  - MSK-021 Giant cell arteritis cranial clues: New temporal headache · Jaw claudication · Transient monocular vision loss · Scalp tenderness
  - NEU-059 Idiopathic intracranial hypertension clues: Papilledema · Pulsatile tinnitus · Abducens (CN VI) palsy · Elevated CSF opening pressure
- **nd-036** cleared (Claude (AI board review), 2026-10-13): PSY-004: no acute stress disorder group. GI-004: no separate Crohn or UC tile.
  - CARD-027 Classic patent ductus arteriosus clues: Continuous infraclavicular murmur · Wide pulse pressure · Aorta-to-pulmonary artery flow · Indomethacin-induced ductal closure
  - GI-004 Systemic diseases associated with recurrent oral ulcers: Behcet disease · Celiac disease · Inflammatory bowel disease · Systemic lupus erythematosus
  - PLX-BCH-015 Glycogen storage diseases with hepatic involvement: Von Gierke disease · Cori disease · Andersen disease · Hers disease
  - PSY-004 Core PTSD symptom domains: Intrusive re-experiencing · Trauma-cue avoidance · Negative mood and cognition · Hyperarousal
- **nd-037** cleared (Claude (AI board review), 2026-10-13): IMM-001: no primary-lymphoid group on board. MSK-028: adductor magnus not present as a competing tile.
  - IMM-001 Secondary lymphoid tissues: Spleen · Lymph nodes · Peyer's patches · Tonsils
  - MICRO-044 HPV-associated squamous carcinoma sites: Cervix · Anus · Penis · Oropharynx
  - MSK-028 Hip extensor muscles: Gluteus maximus · Long head of biceps femoris · Semimembranosus · Semitendinosus
  - NEU-023 Retrochiasmal sites causing homonymous visual field loss: Optic tract · Lateral geniculate nucleus · Meyer loop · Primary visual cortex
- **nd-041** cleared (Claude (AI board review), 2026-10-13): MSK-026: obturator externus/pectineus not on board. CARD-023: no separate tricuspid-endocarditis group.
  - CARD-023 Classic tricuspid regurgitation associations: Lower sternal holosystolic murmur · Murmur louder on inspiration · Raised jugular venous pressure · Tricuspid infection in injection drug use
  - MICRO-025 Pneumocystis pneumonia associations: CD4 count below 200 cells/uL · Progressive exertional dyspnea · Bilateral ground-glass lung opacities · TMP-SMX prophylaxis
  - MSK-026 Muscles supplied by the obturator nerve: Adductor longus · Adductor brevis · Gracilis · Adductor part of adductor magnus
  - NEU-005 Cranial nerves with medially located somatic motor nuclei: Oculomotor nerve · Trochlear nerve · Abducens nerve · Hypoglossal nerve
- **nd-042** cleared (Claude (AI board review), 2026-10-13): Tile-in-text flags (Folate deficiency, Increased homocysteine, shared homocysteine subject): tempting but lab-pattern tiles are not causes and cause tiles are not lab findings, so placement is unique. NEPH-009: no collapsing-FSGS group. GI-008: diagnostic caveat only. PLX-BCH-013: no extra homocysteine-elevating causes on board.
  - GI-008 Classic achalasia findings: Loss of inhibitory myenteric neurons · Impaired LES relaxation · Bird-beak narrowing · Dysphagia to solids and liquids
  - NEPH-009 Secondary FSGS associations: HIV infection · Heroin exposure · Interferon therapy · Sickle cell disease
  - PLX-BCH-013 Causes of elevated homocysteine: Folate deficiency · Vitamin B12 deficiency · Cystathionine beta-synthase deficiency · MTHFR deficiency
  - PLX-HEM-028 Folate-deficiency laboratory pattern: Increased homocysteine · Normal methylmalonic acid · Megaloblastic anemia · Hypersegmented neutrophils
- **nd-043** cleared (Claude (AI board review), 2026-10-13): PLEXUS-GEN-011 generic overlap check: no real conflict found. NEU-003 ALS note: no ALS/UMN group on the board, so fasciculations/atrophy are unambiguous.
  - ENDO-030 Molecular and diagnostic associations of neuroblastoma: MYCN amplification · Elevated urinary VMA · Elevated urinary HVA · Homer Wright rosettes
  - MICRO-032 Visceral leishmaniasis diagnostic associations: Sandfly exposure · Amastigotes in macrophages · Hepatosplenomegaly · Pancytopenia
  - NEU-003 Lower motor neuron lesion findings: Fasciculations · Muscle atrophy · Hyporeflexia · Fibrillation potentials on EMG
  - PLEXUS-GEN-011 Fanconi anemia associations: Bone marrow failure · Skeletal abnormalities · Cafe-au-lait macules · Acute myeloid leukemia risk
- **nd-044** cleared (Claude (AI board review), 2026-10-13): MSK-004 overlap note: none of cyclosporine, pyrazinamide-alternatives or ethambutol appear in other groups (pyrazinamide is in its own group); no conflict. PLX-BCH-067 threonine note: threonine does not appear anywhere on the board.
  - GI-023 Therapies that reduce copper burden in Wilson disease: Penicillamine · Trientine · Zinc salts · Low-copper diet
  - MSK-004 Medications that can promote hyperuricemia: Thiazide diuretics · Pyrazinamide · Low-dose aspirin · Niacin
  - PLX-BCH-002 Vitamin K-dependent clotting factors: Factor II · Factor VII · Factor IX · Factor X
  - PLX-BCH-067 Amino acids that are both glucogenic and ketogenic: Isoleucine · Phenylalanine · Tyrosine · Tryptophan
- **nd-050** cleared (Claude (AI board review), 2026-10-13): MSK-024: no ANA-positive category on board. ENDO-040: no competing ketoacidosis context; DKA tiles fit uniquely.
  - ENDO-040 Classic clues to diabetic ketoacidosis: Kussmaul respirations · Fruity breath · Ketonemia · Anion gap metabolic acidosis
  - GI-020 Injuries that favor hepatic zone 3: Ischemic hepatitis · Acetaminophen toxicity · Alcohol-related hepatic injury · Halothane hepatotoxicity
  - IMM-031 Delayed cell-mediated immune reactions: Nickel allergic contact dermatitis · Poison ivy dermatitis · Tuberculin skin-test reaction · Candida delayed skin-test reaction
  - MSK-024 Autoimmune rheumatic diseases associated with Raynaud phenomenon: Systemic sclerosis · Systemic lupus erythematosus · Mixed connective tissue disease · Sjogren syndrome
- **nd-057** cleared (Claude (AI board review), 2026-10-13): MSK-017: no esophageal dysmotility tile. PLEXUS-GEN-004: title makes no anticipation claim.
  - GI-031 Unconjugated hyperbilirubinemia from reduced UGT1A1 conjugation: Gilbert syndrome · Crigler-Najjar type I · Atazanavir · Physiologic neonatal jaundice
  - MSK-017 Characteristic limited systemic sclerosis features: Calcinosis cutis · Raynaud phenomenon · Sclerodactyly · Anti-centromere antibodies
  - PLEXUS-GEN-004 Trinucleotide repeat expansion disorders: Fragile X syndrome · Friedreich ataxia · Huntington disease · Myotonic dystrophy type 1
  - PLX-BCH-037 Classic homocystinuria clinical associations: Marfanoid habitus · Downward lens subluxation · Thromboembolism · Intellectual disability
- **nd-060** cleared (Claude (AI board review), 2026-10-13): PLX-HEM-035 TTP overlap: no TTP group on this board, so nothing to clash with. MSK-003 'enteric' qualifier is kept in the title and Chlamydia is absent.
  - MICRO-022 Allergic bronchopulmonary aspergillosis findings: Asthma exacerbations · Elevated IgE · Eosinophilia · Bronchiectasis
  - MSK-003 Enteric triggers of reactive arthritis: Campylobacter · Salmonella · Shigella · Yersinia
  - NEU-038 Epidural hematoma associations: Pterion fracture · Blood between skull and dura · Does not cross suture lines · Possible lucid interval
  - PLX-HEM-035 Shiga-toxin-associated HUS clues: Preceding bloody diarrhea · Microangiopathic hemolytic anemia · Thrombocytopenia · Acute kidney injury
- **nd-063** cleared (Claude (AI board review), 2026-10-13): PHARM-014: only one PDE-5 quartet, no duplicate. CARD-006: no separate class IA group on the board. MICRO-010: EHEC, M. bovis and Coxiella are not on the board, and the dairy tiles are all correct. PLX-BCH-033: no other glucogenic amino acids appear.
  - CARD-006 Antiarrhythmics that can prolong QT: Quinidine · Procainamide · Disopyramide · Sotalol
  - MICRO-010 Bacterial infections linked to unpasteurized dairy: Listeria monocytogenes · Brucella species · Campylobacter jejuni · Yersinia enterocolitica
  - PHARM-014 PDE-5 (phosphodiesterase-5) inhibitors: Sildenafil · Vardenafil · Tadalafil · Avanafil
  - PLX-BCH-033 Carbon sources for gluconeogenesis: Lactate · Alanine · Glycerol · Propionyl-CoA
- **nd-064** cleared (Claude (AI board review), 2026-10-13): GI-001: no midgut/hindgut category. DERM-011: no tinea versicolor tile.
  - DERM-011 Dermatophyte infections named by site: Tinea corporis · Tinea capitis · Tinea pedis · Tinea manuum
  - GI-001 Foregut-derived digestive organs: Esophagus · Stomach · Liver · Pancreas
  - NEU-035 Language-dominant MCA cortical targets: Broca area · Wernicke area · Angular gyrus · Lateral primary motor cortex (face/arm)
  - PLX-HEM-017 Sources of chronic iron-loss anemia: Menorrhagia · Peptic ulcer bleeding · Hookworm infection · Bleeding gastrointestinal malignancy
- **nd-074** cleared (Claude (AI board review), 2026-10-13): PLX-BCH-047: no trypsinogen or pepsinogen tile. DERM-003 (x2): no Kawasaki/TSS group, so strawberry tongue is unique. PLEXUS-GEN-009: no NER/MMR distractors. NEU-016: no botulism group.
  - DERM-003 Classic scarlet fever findings: Sandpaper-textured rash · Pastia lines · Circumoral pallor · Strawberry tongue
  - NEU-016 Ocular and bulbar myasthenia gravis symptoms: Ptosis · Diplopia · Dysphagia · Dysarthria
  - PLEXUS-GEN-009 Base excision repair participants: DNA glycosylase · AP endonuclease · DNA polymerase beta · DNA ligase
  - PLX-BCH-047 Pancreatic zymogens activated by trypsin: Chymotrypsinogen · Proelastase · Procarboxypeptidase A · Procarboxypeptidase B
- Rejected GI-014, GI-016, IMM-027, PLX-HEM-036 (Claude (AI board review), 2026-10-13): 'Marked hypergastrinemia' (Features of Zollinger-Ellison syndrome) also fits 'Consequences of parietal-cell autoimmunity' (achlorhydria in autoimmune atrophic gastritis drives marked hypergastrinemia, a high-yield fact)
- Rejected CARD-035, ENDO-030, MICRO-016, PLX-BCH-018 (Claude (AI board review), 2026-10-13): 'Progressive hearing loss' (Classic findings of osteogenesis imperfecta) also fits 'Late congenital-syphilis stigmata' (CN VIII deafness), and 'Sensorineural deafness' can occur in OI, so the two hearing-loss tiles are near-interchangeable
- Rejected CARD-036, IMM-002, NEU-038, PLX-HEM-052 (Claude (AI board review), 2026-10-13): 'Marked neutrophilia' (Findings of leukocyte adhesion deficiency type 1) also fits 'Chronic myeloid-leukemia clues' (marked neutrophilic leukocytosis is a classic CML presentation)
- Rejected GI-063, MICRO-054, MICRO-062, PLX-BCH-061 (Claude (AI board review), 2026-10-13): 'Isoniazid' (Classic initial RIPE tuberculosis drugs) also fits 'Contributors to niacin deficiency' (isoniazid-induced B6 depletion is a textbook cause of pellagra, and 'Vitamin B6 deficiency' is already on that group)
- Rejected ENDO-021, IMM-014, MICRO-022, NEU-012 (Claude (AI board review), 2026-10-13): 'Elevated IgE' (ABPA findings) also fits 'IgE-associated immune events' 'Type I hypersensitivity' (IgE-associated immune events) also fits 'Allergic bronchopulmonary aspergillosis findings' (ABPA is a type I/III hypersensitivity), so the two tiles can be swapped and both groups stay valid
- Rejected MICRO-010, MSK-003, NEU-003, PLX-BCH-076 (Claude (AI board review), 2026-10-13): 'Campylobacter jejuni' and 'Yersinia enterocolitica' (Unpasteurized dairy) fit 'Enteric triggers of reactive arthritis' exactly as well as 'Campylobacter' and 'Yersinia', which are interchangeable with them 'Campylobacter' and 'Yersinia' (Reactive arthritis) equally fit 'Bacterial infections linked to unpasteurized dairy' 'Salmonella' (Reactive arthritis) is also a classic raw-milk pathogen
- Rejected CARD-006, PHARM-014, PLX-BCH-033, PLX-BCH-066 (Claude (AI board review), 2026-10-13): PLX-BCH-033 note ('keep other glucogenic amino acids off the board') is violated: Serine, Threonine, Asparagine and Glutamine (Polar uncharged amino acids) are all glucogenic and fit 'Carbon sources for gluconeogenesis' alongside Alanine; glutamine in particular is a major gluconeogenic substrate
- Rejected GI-064, IMM-035, PLEXUS-GEN-002, PLX-HEM-035 (Claude (AI board review), 2026-10-13): 'Microvascular thrombosis' (Hyperacute graft rejection clues) is the defining lesion of Shiga-toxin HUS (thrombotic microangiopathy) and fits 'Shiga-toxin-associated HUS clues' as well, while 'Acute kidney injury' (HUS) fits hyperacute rejection of a kidney graft, giving a defensible swap
- Rejected GI-066, MICRO-032, NEU-049, PLEXUS-GEN-011 (Claude (AI board review), 2026-10-13): 'Pancytopenia' (Visceral leishmaniasis) is the defining feature of Fanconi anemia and fits 'Fanconi anemia associations' as well, while 'Bone marrow failure' (Fanconi) is near-synonymous and VL causes marrow involvement, so the two tiles are interchangeable
- Rejected ENDO-021, IMM-014, MICRO-022, NEU-038 (Claude (AI board review), 2026-10-13): 'Elevated IgE' (ABPA findings) also fits 'IgE-associated immune events', and 'Type I hypersensitivity' (IgE-associated immune events) also fits 'Allergic bronchopulmonary aspergillosis findings' (ABPA is a type I/III hypersensitivity); swapping the two gives a second defensible partition
- Rejected CARD-006, MICRO-054, PLX-BCH-033, PLX-BCH-066 (Claude (AI board review), 2026-10-13): 'Serine', 'Threonine', 'Asparagine' and 'Glutamine' (Polar uncharged amino acids) are all glucogenic amino acids and fit 'Carbon sources for gluconeogenesis' (glutamine is a major gluconeogenic substrate) alongside 'Alanine' PLX-BCH-033 instruction to keep other glucogenic amino acids off the board is violated by the polar uncharged group
- Rejected IMM-035, MICRO-010, MSK-003, PLX-HEM-035 (Claude (AI board review), 2026-10-13): 'Campylobacter' and 'Yersinia' (Enteric triggers of reactive arthritis) are the same organisms as 'Campylobacter jejuni' and 'Yersinia enterocolitica' (unpasteurized dairy), so each pair can be swapped freely between the two groups 'Salmonella' (reactive arthritis) also fits 'Bacterial infections linked to unpasteurized dairy' (raw milk is a classic Salmonella source)

## Systems expansion from released Dailies

- 49 expansion boards are scheduled. Each is released on the same date as the Daily that supplied its last connection, never earlier.
  - Cardiology: 7 (first on 2026-10-19)
  - Neurology: 6 (first on 2026-10-23)
  - GI: 4 (first on 2026-10-25)
  - Endocrine: 4 (first on 2026-10-27)
  - Heme/Onc: 8 (first on 2026-10-22)
  - Microbiology: 9 (first on 2026-10-18)
  - Immunology: 3 (first on 2026-11-03)
  - Dermatology: 3 (first on 2026-11-07)
  - Biochemistry/Genetics: 5 (first on 2026-10-20)
- Connections still waiting in subject queues at the end of the runway: 136.
- These boards intentionally reuse released Daily connections. That is separate from timed-mode overlap, which is excluded below.

## Timed library (3 Minutes and Race)

- Timed entries before activation: 206 verified.
- Removed as confirmed equivalents of new-library connections: 11.
- Temporarily excluded (unresolved overlap with an active new-library connection): 40.
- Served: 156. Timed entries sharing one canonical relationship: 9 (never both in one session).

  - bank-ext-001 "Fat-soluble vitamins": confirmed, same relationship as a new-library connection
  - bank-ext-020 "Drugs that slow AV nodal conduction": confirmed, same relationship as a new-library connection
  - bank-ext-024 "Consequences of portal hypertension": confirmed, same relationship as a new-library connection
  - bank-ext-114 "Inherited hyperbilirubinemia syndromes": confirmed, same relationship as a new-library connection
  - bank-ext-104 "Rotator cuff muscles": confirmed, same relationship as a new-library connection
  - bank-migrated-sys-renal-0002-L1 "Nephrotic syndrome findings": confirmed, same relationship as a new-library connection
  - bank-migrated-sys-neuro-0002-L1 "Features of Parkinson disease": confirmed, same relationship as a new-library connection
  - bank-medium-02 "Gq-coupled receptors": confirmed, same relationship as a new-library connection
  - bank-ext-098 "Positive symptoms of schizophrenia": confirmed, same relationship as a new-library connection
  - bank-ext-063 "Adverse effects of lithium": confirmed, same relationship as a new-library connection
  - bank-ext-062 "Drugs causing pulmonary fibrosis": confirmed, same relationship as a new-library connection
  - bank-ext-086 "Lysosomal storage diseases": temporary, unresolved overlap with PLX-BCH-079, which is now active
  - bank-ext-050 "Findings in tetralogy of Fallot": temporary, unresolved overlap with CARD-001, which is now active
  - bank-medium-16 "Causes of high-output heart failure": temporary, unresolved overlap with CARD-002, which is now active
  - bank-migrated-sys-cardio-0002-L4 "Causes of a widened pulse pressure": temporary, unresolved overlap with CARD-002, which is now active
  - bank-ext-051 "Causes of restrictive cardiomyopathy": temporary, unresolved overlap with CARD-012, which is now active
  - bank-migrated-sys-mixed-0002-L4 "Findings in cardiac tamponade": temporary, unresolved overlap with CARD-034, which is now active
  - bank-easy-14 "Causes of secondary hypertension": temporary, unresolved overlap with CARD-044, which is now active
  - bank-easy-04 "Granulomatous infections with necrotizing (caseating) granulomas": temporary, unresolved overlap with DERM-018, which is now active
  - bank-ext-110 "Features of psoriasis": temporary, unresolved overlap with DERM-029, which is now active
  - bank-migrated-sys-mixed-0002-L3 "Signs of hypocalcemia": temporary, unresolved overlap with ENDO-019, which is now active
  - bank-ext-082 "Conditions associated with pheochromocytoma": temporary, unresolved overlap with ENDO-029, which is now active
  - bank-ext-023 "Features of carcinoid syndrome": temporary, unresolved overlap with GI-056, which is now active
  - bank-ext-115 "Hereditary colorectal cancer syndromes": temporary, unresolved overlap with GI-062, which is now active
  - bank-migrated-sys-biochem-0001-L4 "Trinucleotide repeat disorders": temporary, unresolved overlap with PLEXUS-GEN-004, which is now active
  - bank-ext-058 "Causes of microangiopathic hemolytic anemia": temporary, unresolved overlap with PLX-HEM-011, which is now active
  - bank-ext-002 "Live attenuated vaccines": temporary, unresolved overlap with IMM-018, which is now active
  - bank-ext-061 "Type III hypersensitivity diseases": temporary, unresolved overlap with IMM-030, which is now active
  - bank-ext-032 "Organisms causing atypical pneumonia": temporary, unresolved overlap with MICRO-009, which is now active
  - bank-migrated-sys-micro-0001-L2 "Dimorphic fungi": temporary, unresolved overlap with MICRO-018, which is now active
  - bank-easy-05 "HLA-B27-associated spondyloarthropathies": temporary, unresolved overlap with MSK-002, which is now active
  - bank-ext-103 "Seronegative spondyloarthropathies": temporary, unresolved overlap with MSK-002, which is now active
  - bank-ext-105 "Radiographic findings in osteoarthritis": temporary, unresolved overlap with MSK-005, which is now active
  - bank-ext-066 "Features of sarcoidosis": temporary, unresolved overlap with MSK-018, which is now active
  - bank-ext-081 "Causes of renal papillary necrosis": temporary, unresolved overlap with NEPH-018, which is now active
  - bank-ext-054 "Drugs causing acute interstitial nephritis": temporary, unresolved overlap with NEPH-019, which is now active
  - bank-migrated-sys-renal-0001-L2 "Causes of non-anion gap metabolic acidosis": temporary, unresolved overlap with NEPH-028, which is now active
  - bank-ext-034 "Upper motor neuron signs": temporary, unresolved overlap with NEU-002, which is now active
  - bank-ext-035 "Lower motor neuron signs": temporary, unresolved overlap with NEU-003, which is now active
  - bank-medium-01 "Gs-coupled receptors (increased cAMP)": temporary, unresolved overlap with PHARM-005, which is now active
  - bank-migrated-sys-pharm-0002-L3 "Muscarinic antagonist effect": temporary, unresolved overlap with PHARM-009, which is now active
  - bank-ext-097 "Selective serotonin reuptake inhibitors (SSRIs)": temporary, unresolved overlap with PSY-012, which is now active
  - bank-ext-099 "Benzodiazepines": temporary, unresolved overlap with PSY-015, which is now active
  - bank-ext-100 "Extrapyramidal symptoms of antipsychotics": temporary, unresolved overlap with PSY-019, which is now active
  - bank-ext-030 "Features of neuroleptic malignant syndrome": temporary, unresolved overlap with PSY-023, which is now active
  - bank-medium-06 "Neural crest derivatives": temporary, unresolved overlap with REPRO-002, which is now active
  - bank-ext-094 "Ovarian germ cell tumors": temporary, unresolved overlap with REPRO-017, which is now active
  - bank-easy-12 "Obstructive lung diseases": temporary, unresolved overlap with PULM-013, which is now active
  - bank-migrated-sys-pulm-0001-L1 "Obstructive lung diseases": temporary, unresolved overlap with PULM-013, which is now active
  - bank-ext-053 "Findings in tension pneumothorax": temporary, unresolved overlap with PULM-020, which is now active
  - bank-easy-02 "QT-prolonging drugs": temporary, revised content overlaps CARD-005 (1 shared tiles, uncertain)

