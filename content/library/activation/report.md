# Plexus new library: activation report

Daily switches to the new library on **2026-10-17** (players' local date). Earlier dates keep the existing Daily.

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

## Difficulty rebuild

- Content epoch: **2026-10-labels**. Saved puzzle progress from an earlier epoch is cleared on each device (src/utils/contentEpoch.js).
- Revisions applied (independent AI check, not human verified): 160; wording-only copy edits: 45; stale (skipped): 0.
- Board target per board: 1 approachable, 2 moderate, 1 challenging (content/library/board-config.json overrides). Estimates only.
- Boards whose estimated mix meets the target: 123 of 209. Boards with a recorded fairness review pass: 209 of 209. Boards rejected on review and never formed again: 59.
- Shortage: 1 Daily boards have no group estimated as challenging; the library has too few connections that need real reasoning to give every board one.

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
- **biochemistry-genetics-starter-5** (Claude (AI board review), 2026-10-15): No other neurotransmitter-deficiency group is on the board; Pompe-related hypotonia is a finding tile and does not fit a group of disease names.
  - flag: PLX-BCH-077 board instruction to check against the other groups: "Avoid a competing neurotransmitter-deficiency category on the same board."
- **microbiology-starter-3** (Claude (AI board review), 2026-10-13): The Parvovirus B19 name overlap is a tempting link, not ambiguity: the tile is a virus, not a clinical syndrome.
  - flag: "Parvovirus B19 clinical syndromes" / "Naked DNA virus groups": tile "Parvovirus B19" is named in "Parvovirus B19 clinical syndromes"'s title or explanation
- **msk-starter-5** (Claude (AI board review), 2026-10-15): Navicular and sesamoids are not on the board, and no other group competes for the fracture sites.
  - flag: MSK-035 board instruction to check against the other groups: "Board overlap: navicular and sesamoids are additional high-risk sites - avoid as distractors."
- **renal-starter-2** (Claude (AI board review), 2026-10-13): Reviewer note satisfied: no Valsalva-maneuver category is on the board.
  - flag: NEPH-027 board instruction to check against the other groups: "Board overlap: any Valsalva-maneuver category (ambiguity 1)."
- **pharmacology-starter-1** (Claude (AI board review), 2026-10-13): Gs/Gq share wording but membership is textbook-distinct; no adrenergic-receptor group is present for beta-1/beta-2 to compete with; no extra phase II member (glutathione, amino acid) appears as a stray tile.
  - flag: "Gq-coupled receptors" / "Gs-coupled receptors": both are about coupled receptor
  - flag: PHARM-001 board instruction to check against the other groups: "Glutathione and amino-acid conjugation are other valid members; a 5th-member board tile could blur this category."
  - flag: PHARM-005 board instruction to check against the other groups: "BOARD OVERLAP: beta-1/beta-2 also fit an adrenergic-receptor category."
- **pharmacology-starter-2** (Claude (AI board review), 2026-10-13): No sympathomimetic toxidrome group is present, so mydriasis/tachycardia are unambiguous; each cholinergic/anticholinergic sign sits in its only fitting toxidrome on this board.
  - flag: PHARM-009 board instruction to check against the other groups: "BOARD OVERLAP: mydriasis and tachycardia also occur in sympathomimetic toxicity."
  - flag: PHARM-008 board instruction to check against the other groups: "BOARD OVERLAP: each sign individually appears in other toxidromes."
- **pharmacology-starter-3** (Claude (AI board review), 2026-10-13): Sotalol fits its nonselective beta-blocker group and there is no class III group on the board; no antiseizure-drug group exists to compete with the inducers; carbachol is absent, so no fifth muscarinic agonist appears.
  - flag: PHARM-006 board instruction to check against the other groups: "Carbachol is another valid member (board note)."
  - flag: PHARM-002 board instruction to check against the other groups: "BOARD OVERLAP: carbamazepine, phenobarbital, phenytoin also fit an antiseizure-drug category; rifampin does not."
  - flag: PHARM-013 board instruction to check against the other groups: "BOARD OVERLAP: sotalol also fits class III antiarrhythmics; its added K-channel activity does not negate its beta-blockade."
- **psychiatry-starter-1** (Claude (AI board review), 2026-10-15): No anticipation, affiliation or self-assertion tiles and no serotonin syndrome group are on the board, so neither caution applies.
  - flag: PSY-001 board instruction to check against the other groups: "Board caution: anticipation, affiliation, self-assertion are also mature defenses and make strong decoys."
  - flag: PSY-023 board instruction to check against the other groups: "Board overlap: fever, altered mental status, and autonomic instability also occur in serotonin syndrome—lead-pipe rigidity (vs clonus/hyperreflexia) is the differentiating tile."
- **psychiatry-starter-3** (Claude (AI board review), 2026-10-15): Escitalopram is absent, there is no competing EPS-risk group, and no other psychotic-disorder group competes for the positive symptoms.
  - flag: PSY-006 board instruction to check against the other groups: "Board overlap: schizoaffective, brief psychotic, schizophreniform, and substance-induced psychosis share these; do not present as diagnostic of schizophrenia."
  - flag: PSY-012 board instruction to check against the other groups: "Board caution: escitalopram is the S-enantiomer of citalopram, so the pair are near-duplicates and could be contested as distinct tiles; keep them on separate boards if possible."
  - flag: PSY-018 board instruction to check against the other groups: "Shared high EPS risk is a board-overlap consideration."
- **pulmonary-starter-1** (Claude (AI board review), 2026-10-15): No carcinoid or LCNEC group is on the board, so the marker overlap does not apply.
  - flag: PULM-003 board instruction to check against the other groups: "Board overlap: these markers also stain carcinoid and LCNEC."
- **pulmonary-starter-3** (Claude (AI board review), 2026-10-15): There is no competing pleural, air-trapping or general tissue-hypoxia group; the asbestos fibrosis tile is parenchymal and does not fit the extrapulmonary neuromuscular group.
  - flag: PULM-011 board instruction to check against the other groups: "Board overlap: broader ''causes of tissue hypoxia.'' Added refs: Henretig et al., NEJM 2019;"
  - flag: PULM-013 board instruction to check against the other groups: "Board overlap: ''air trapping disorders.'' Added refs: Stanojevic et al., ERS/ATS 2022;"
  - flag: PULM-017 board instruction to check against the other groups: "BOARD-LEVEL OVERLAP WARNING: three tiles (plaques, benign effusion, mesothelioma) are pleural and could be grouped as ''asbestos pleural disease'' on a 16-tile board; pair with care and avoid a competing pleural category."
- **reproductive-starter-4** (Claude (AI board review), 2026-10-15): There are no endometrial-cancer, GTD or quad-screen groups on the board; preeclampsia and trauma tiles stay in their own groups.
  - flag: REPRO-007 board instruction to check against the other groups: "Board overlap: mole/choriocarcinoma also fit gestational trophoblastic disease, and trisomy 21 fits quad-screen findings; avoid these competing groups on the same board."
  - flag: REPRO-015 board instruction to check against the other groups: "Board caution: do not place a separate endometrial-cancer-risk group on the same board."

## Daily

- Launch-ready Daily boards: **83** (54 with no flags, 29 flagged and cleared on review).
- Runway: 2026-10-17 to 2027-01-07 with no relationship repeated.
- Boards waiting for review (not scheduled): 0. Rejected on review: 27. Connections left over (no compatible board yet): 2.
- Exhaustion policy: after 2027-01-07, the Daily replays the same reviewed boards in the same order, one per day, under new dates. Nothing is regenerated, so no unreviewed board appears. Importing more content before then extends the new schedule instead.

### Daily boards reviewed
- **nd-001** cleared (Claude (AI board review), 2026-10-15): No RNA/protein methylation, ALS, or hyperparathyroidism groups are present; hyporeflexia is not a classic stones/bones/groans/overtones tile.
  - DERM-021 Atopic dermatitis biology: Filaggrin barrier dysfunction · Th2-predominant inflammation · IL-4 and IL-13 · Elevated IgE
  - ENDO-020 Classic clinical consequences of hypercalcemia: Nephrolithiasis · Constipation · Bone pain · Neuropsychiatric disturbances
  - NEU-003 Lower motor neuron lesion findings: Fasciculations · Muscle atrophy · Hyporeflexia · Fibrillation potentials on EMG
  - PLX-BCH-036 Processes using SAM methyl donation: Creatine synthesis · Epinephrine synthesis · Phosphatidylcholine synthesis · DNA methylation
- **nd-003** cleared (Claude (AI board review), 2026-10-15): No other TAC, Kawasaki/TSS, or small round blue cell group is present; rhinorrhea/congestion vs recurrent sinusitis is only thematic.
  - DERM-003 Classic scarlet fever findings: Sandpaper-textured rash · Pastia lines · Circumoral pallor · Strawberry tongue
  - MSK-020 Classic Ewing sarcoma clues: Diaphyseal lesion · Onion-skin periosteal reaction · Small round blue cells · EWSR1-FLI1 fusion
  - NEU-058 Cluster headache ipsilateral cranial autonomic signs: Lacrimation · Rhinorrhea · Nasal congestion · Miosis (partial Horner)
  - PLX-BCH-022 Findings associated with primary ciliary dyskinesia: Bronchiectasis · Recurrent sinusitis · Chronic otitis media · Male infertility
- **nd-005** cleared (Claude (AI board review), 2026-10-15): Tau/tangle redundancy is confined to the Alzheimer group and only one tangle tile is present; no esophageal dysmotility tile is on the board.
  - IMM-028 X-linked inborn errors of immunity: BTK-related agammaglobulinemia · CD40L-deficient hyper-IgM syndrome · Wiskott-Aldrich syndrome · FOXP3-related IPEX
  - MSK-017 Characteristic limited systemic sclerosis features: Calcinosis cutis · Raynaud phenomenon · Sclerodactyly · Anti-centromere antibodies
  - NEU-050 Alzheimer disease neuropathology clues: Extracellular amyloid-beta plaques · Intracellular neurofibrillary tangles · Hirano bodies · Cerebral amyloid angiopathy
  - PLX-BCH-042 Classic Pompe disease clues: Macroglossia · Hypertrophic cardiomyopathy · Proximal myopathy · Glycogen-filled lysosomes
- **nd-006** cleared (Claude (AI board review), 2026-10-15): No antacid group is present; PDE-5 quartet appears once; EHEC, M. bovis and Coxiella are not on the board.
  - GI-064 Osmotic laxatives: Magnesium hydroxide · Sorbitol · Polyethylene glycol · Lactulose
  - MICRO-010 Bacterial infections linked to unpasteurized dairy: Listeria monocytogenes · Brucella species · Campylobacter jejuni · Yersinia enterocolitica
  - PHARM-014 PDE-5 (phosphodiesterase-5) inhibitors: Sildenafil · Vardenafil · Tadalafil · Avanafil
  - PLX-HEM-048 DNA-crosslinking cytotoxic agents: Busulfan · Cyclophosphamide · Ifosfamide · Cisplatin
- **nd-007** cleared (Claude (AI board review), 2026-10-15): Chlamydia, primary lymphoid organs and bullous impetigo are absent; the dopamine-pathway note is content only.
  - DERM-004 Staphylococcal scalded skin syndrome clues: Exfoliative toxin · Desmoglein 1 cleavage · Positive Nikolsky sign · Mucosal sparing
  - IMM-001 Secondary lymphoid tissues: Spleen · Lymph nodes · Peyer's patches · Tonsils
  - MSK-003 Enteric triggers of reactive arthritis: Campylobacter · Salmonella · Shigella · Yersinia
  - NEU-049 Major dopaminergic pathways: Mesolimbic · Mesocortical · Nigrostriatal · Tuberoinfundibular
- **nd-011** cleared (Claude (AI board review), 2026-10-15): No xeroderma pigmentosum/chromosomal-instability, collapsing glomerulopathy, or anticipation group is present.
  - IMM-024 Selective IgA deficiency associations: Low IgA with preserved IgG / IgM · Giardia-associated diarrhea · False-negative tTG-IgA testing · Anaphylactic transfusion reactions
  - NEPH-009 Secondary FSGS associations: HIV infection · Heroin exposure · Interferon therapy · Sickle cell disease
  - PLEXUS-GEN-004 Trinucleotide repeat expansion disorders: Fragile X syndrome · Friedreich ataxia · Huntington disease · Myotonic dystrophy type 1
  - PLEXUS-GEN-012 Bloom syndrome associations: Short stature · Long narrow face · Photosensitive facial (butterfly) telangiectatic erythema · Markedly increased cancer risk
- **nd-013** cleared (Claude (AI board review), 2026-10-15): Glutamate is not on the board; histidine vs histamine is a fair red herring since one is an amino acid and the other a neurotransmitter.
  - CARD-020 Classic chronic aortic regurgitation findings: Wide pulse pressure · Corrigan pulse · de Musset sign · Early diastolic decrescendo murmur
  - PLEXUS-GEN-011 Fanconi anemia associations: Bone marrow failure · Skeletal abnormalities · Cafe-au-lait macules · Acute myeloid leukemia risk
  - PLX-BCH-016 Neurotransmitters formed through B6-dependent decarboxylation: GABA · Histamine · Dopamine · Serotonin
  - PLX-BCH-069 Amino acids feeding alpha-ketoglutarate through glutamate: Arginine · Proline · Histidine · Glutamine
- **nd-015** cleared (Claude (AI board review), 2026-10-15): No other glucogenic amino acids or Down syndrome tile; the ANA-positive overlap describes the same four tiles, so it does not compete.
  - GI-006 Conditions associated with macroglossia: Acromegaly · Hypothyroidism · Amyloidosis · Beckwith-Wiedemann syndrome
  - MSK-024 Autoimmune rheumatic diseases associated with Raynaud phenomenon: Systemic sclerosis · Systemic lupus erythematosus · Mixed connective tissue disease · Sjogren syndrome
  - PLX-BCH-002 Vitamin K-dependent clotting factors: Factor II · Factor VII · Factor IX · Factor X
  - PLX-BCH-033 Carbon sources for gluconeogenesis: Lactate · Alanine · Glycerol · Propionyl-CoA
- **nd-018** cleared (Claude (AI board review), 2026-10-15): No Patau group, biologic DMARDs or JAK inhibitors are on the board.
  - MICRO-063 Azoles blocking fungal 14-alpha-demethylase: Fluconazole · Itraconazole · Voriconazole · Posaconazole
  - MSK-010 Conventional synthetic DMARDs used in RA: Methotrexate · Hydroxychloroquine · Sulfasalazine · Leflunomide
  - NEU-054 Dementia with Lewy bodies clues: Fluctuating cognition · Recurrent visual hallucinations · Parkinsonism · Antipsychotic (neuroleptic) sensitivity
  - PLEXUS-GEN-029 Edwards syndrome physical findings: Prominent occiput · Clenched hands with overlapping fingers · Rocker-bottom feet · Low-set ears
- **nd-019** cleared (Claude (AI board review), 2026-10-15): Gastrinoma is not a tile, and 'MEN1 association' is a feature, not a tumor type, so it stays with Zollinger-Ellison; VIPoma and somatostatinoma cause achlorhydria, not acid excess.
  - GI-016 Features of Zollinger-Ellison syndrome: Marked hypergastrinemia · Excess gastric acid secretion · Refractory peptic ulcers · MEN1 association
  - GI-045 Functional pancreatic neuroendocrine tumor types: Insulinoma · Glucagonoma · VIPoma · Somatostatinoma
  - PLX-BCH-045 Familial hyperchylomicronemia clinical clues: Eruptive xanthomas · Recurrent pancreatitis · Hepatosplenomegaly · Creamy plasma supernatant
  - PLX-HEM-043 Tumors associated with psammoma bodies: Papillary thyroid carcinoma · Meningioma · Serous papillary ovarian carcinoma · Mesothelioma
- **nd-022** cleared (Claude (AI board review), 2026-10-15): No glycoprotein-hormone, botulism, or broad nutritional-deficiency tiles are present; amenorrhea relates to low FSH/LH but is a clinical sign, not a hormone.
  - ENDO-002 Anterior pituitary hormones targeting other endocrine glands: TSH · ACTH · FSH · LH
  - NEU-016 Ocular and bulbar myasthenia gravis symptoms: Ptosis · Diplopia · Dysphagia · Dysarthria
  - PLX-HEM-050 Tumor-associated signaling kinases: BCR-ABL1 · BRAF · JAK2 · HER2
  - PSY-009 Clinical clues to anorexia-related undernutrition: Lanugo · Amenorrhea · Osteoporosis · Bradycardia
- **nd-023** cleared (Claude (AI board review), 2026-10-15): No Hunter syndrome, zoster-complications group or separate Crohn/UC tile; lichen planus causes oral lesions but is mucocutaneous, not a systemic disease.
  - DERM-007 Clinical forms of VZV infection: Varicella · Shingles · Herpes zoster ophthalmicus · Ramsay Hunt syndrome
  - GI-004 Systemic diseases associated with recurrent oral ulcers: Behcet disease · Celiac disease · Inflammatory bowel disease · Systemic lupus erythematosus
  - MICRO-050 Hepatitis C extrahepatic associations: Mixed cryoglobulinemia · Membranoproliferative glomerulonephritis · Porphyria cutanea tarda · Lichen planus
  - PLX-BCH-079 Lysosomal storage diseases treated with enzyme replacement: Fabry disease · Gaucher disease · Hurler syndrome · Pompe disease
- **nd-026** cleared (Claude (AI board review), 2026-10-15): No acute stress disorder or hypertonia tile appears, so the PTSD and spasticity notes don't cause any conflict, and the four domains are far apart.
  - CARD-037 Complications of myocardial infarction: Ventricular arrhythmia · Papillary muscle rupture · Interventricular septal rupture · LV mural thrombus
  - NEU-002 Upper motor neuron examination signs: Hyperreflexia · Spasticity · Pronator drift · Extensor plantar response
  - PLEXUS-GEN-019 Respiratory and related findings in cystic fibrosis: Recurrent pulmonary infections · Thick airway secretions · Nasal polyps · Digital clubbing
  - PSY-004 Core PTSD symptom domains: Intrusive re-experiencing · Trauma-cue avoidance · Negative mood and cognition · Hyperarousal
- **nd-028** cleared (Claude (AI board review), 2026-10-15): No tricuspid-endocarditis group; the manometry and Ottawa caveats are content notes, not board conflicts.
  - CARD-023 Classic tricuspid regurgitation associations: Lower sternal holosystolic murmur · Murmur louder on inspiration · Raised jugular venous pressure · Tricuspid infection in injection drug use
  - GI-008 Classic achalasia findings: Loss of inhibitory myenteric neurons · Impaired LES relaxation · Bird-beak narrowing · Dysphagia to solids and liquids
  - MSK-034 Bony tenderness sites in the Ottawa ankle-foot rules: Posterior edge or tip of lateral malleolus · Posterior edge or tip of medial malleolus · Base of the fifth metatarsal · Navicular
  - NEU-008 Functional regions of the frontal lobe: Primary motor cortex · Supplementary motor area · Frontal eye fields · Broca area
- **nd-031** cleared (Claude (AI board review), 2026-10-15): No MPA/EGPA group or NER/MMR group is present; DNA ligase is shared with other pathways only off-board.
  - MSK-022 Granulomatosis with polyangiitis clues: Saddle nose deformity · Chronic sinusitis · Cavitating pulmonary nodules · Pauci-immune glomerulonephritis
  - PLEXUS-GEN-009 Base excision repair participants: DNA glycosylase · AP endonuclease · DNA polymerase beta · DNA ligase
  - PLX-BCH-008 Fat-soluble vitamins: Retinol · Cholecalciferol · Tocopherol · Phylloquinone
  - PLX-HEM-062 Waldenstrom-macroglobulinemia clues: Monoclonal IgM · Hyperviscosity · Peripheral neuropathy · Cold agglutinins
- **nd-033** cleared (Claude (AI board review), 2026-10-15): No warm-AIHA group and no extra homocysteine-raising tile is on the board.
  - DERM-008 High-risk oncogenic HPV types: HPV 16 · HPV 18 · HPV 31 · HPV 33
  - ENDO-031 Recessive enzyme defects affecting sex-steroid synthesis or activation: 21-hydroxylase deficiency · 17-alpha-hydroxylase deficiency · 11-beta-hydroxylase deficiency · 5-alpha-reductase deficiency
  - PLX-BCH-013 Causes of elevated homocysteine: Folate deficiency · Vitamin B12 deficiency · Cystathionine beta-synthase deficiency · MTHFR deficiency
  - PLX-HEM-004 Cold-antibody hemolysis associations: Mycoplasma pneumoniae infection · Epstein-Barr virus infection · Waldenstrom macroglobulinemia · Chronic lymphocytic leukemia
- **nd-035** cleared (Claude (AI board review), 2026-10-15): Weak positive birefringence and blue-parallel are redundant within the CPP group, which makes it easier but creates no cross-fit; tryptophan/threonine are absent, and Factor IX has no vitamin K group to compete with.
  - CARD-003 Dihydropyridine calcium channel blockers: Nifedipine · Nicardipine · Felodipine · Amlodipine
  - MSK-006 CPP crystal arthritis diagnostic clues: Rhomboid crystals · Weak positive birefringence · Chondrocalcinosis · Blue when aligned parallel to the compensator
  - PLX-BCH-068 Amino acids whose catabolism feeds pyruvate: Alanine · Glycine · Serine · Cysteine
  - PLX-HEM-003 Intrinsic-pathway components in the classic cascade: Prekallikrein · High-molecular-weight kininogen · Factor IX · Factor VIII
- **nd-037** cleared (Claude (AI board review), 2026-10-15): No extra NADPH users, trypsinogen or pepsinogen are on the board; the antineoplastic note is internal to the fibrosis group.
  - MICRO-054 Penicillinase-resistant antistaphylococcal penicillins: Nafcillin · Oxacillin · Dicloxacillin · Methicillin
  - PLX-BCH-012 Enzymes that use NADPH: Glutathione reductase · HMG-CoA reductase · Fatty acid synthase · NADPH oxidase
  - PLX-BCH-047 Pancreatic zymogens activated by trypsin: Chymotrypsinogen · Proelastase · Procarboxypeptidase A · Procarboxypeptidase B
  - PULM-001 Drugs associated with pulmonary fibrosis: Bleomycin · Amiodarone · Nitrofurantoin · Busulfan
- **nd-041** cleared (Claude (AI board review), 2026-10-15): Alfuzosin/silodosin, a BPH category, quinidine/anti-TNF and hypercalcemia/erythrocytosis groups are absent; methyldopa is an alpha-2 agonist, not an alpha-1 blocker.
  - MSK-011 Medications classically linked to drug-induced lupus: Hydralazine · Minocycline · Isoniazid · Methyldopa
  - NEPH-024 Renal cell carcinoma paraneoplastic mediators: PTH-related peptide · Erythropoietin · ACTH · Renin
  - PHARM-011 Alpha-1 adrenergic antagonists: Prazosin · Terazosin · Doxazosin · Tamsulosin
  - PLX-BCH-035 Amino acids whose catabolism yields propionyl-CoA: Methionine · Valine · Isoleucine · Threonine
- **nd-043** cleared (Claude (AI board review), 2026-10-15): No Mn-SOD tile and no other glomerular-lesion or neurologic group compete.
  - GI-052 Extraintestinal manifestations of Whipple disease: Migratory arthralgias · Culture-negative endocarditis · Lymphadenopathy · Neurologic dysfunction
  - NEPH-010 Secondary membranous nephropathy associations: Hepatitis B infection · Systemic lupus erythematosus · Solid malignancy · Penicillamine exposure
  - PLX-BCH-011 Enzymes requiring copper: Cytochrome c oxidase · Tyrosinase · Lysyl oxidase · Superoxide dismutase 1
  - PLX-BCH-072 Enzymes with vitamin B6 cofactor requirements: Alanine aminotransferase · Aspartate aminotransferase · ALA synthase · Glycogen phosphorylase
- **nd-045** cleared (Claude (AI board review), 2026-10-15): Adductor magnus, midgut/hindgut organs and cysteine are all absent; cystine (cystinuria) is not a polar uncharged side chain, and lysine/arginine/ornithine are basic.
  - GI-001 Foregut-derived digestive organs: Esophagus · Stomach · Liver · Pancreas
  - MSK-028 Hip extensor muscles: Gluteus maximus · Long head of biceps femoris · Semimembranosus · Semitendinosus
  - PLX-BCH-003 Amino acids lost in cystinuria: Cystine · Ornithine · Lysine · Arginine
  - PLX-BCH-066 Polar uncharged amino acid side chains: Serine · Threonine · Asparagine · Glutamine
- **nd-046** cleared (Claude (AI board review), 2026-10-15): No hypocalcemia category or tinea versicolor is on the board; renal failure/rhabdo/TLS cause hyperkalemia but are causes, not ACE-inhibitor effects.
  - CARD-009 Important adverse effects of ACE inhibitors: Dry cough · Angioedema · Hyperkalemia · Fetal toxicity
  - DERM-011 Dermatophyte infections named by site: Tinea corporis · Tinea capitis · Tinea pedis · Tinea manuum
  - NEPH-030 Phosphate-elevating conditions: Renal failure · Hypoparathyroidism · Tumor lysis syndrome · Rhabdomyolysis
  - PLX-HEM-040 DIC laboratory pattern: Thrombocytopenia · Prolonged PT and aPTT · Low fibrinogen · Increased D-dimer
- **nd-049** cleared (Claude (AI board review), 2026-10-15): No RA or other malabsorption group; otosclerosis vs subchondral sclerosis is only wordplay.
  - GI-048 Somatostatinoma syndrome manifestations: Diabetes mellitus · Cholelithiasis · Steatorrhea · Weight loss
  - MSK-005 Classic radiographic changes of osteoarthritis: Nonuniform (asymmetric) joint-space loss · Subchondral sclerosis · Marginal osteophytes · Subchondral cysts
  - NEU-024 Causes of conductive hearing loss: Cerumen impaction · Otitis media · Otosclerosis · Tympanic membrane perforation
  - PLX-BCH-004 Four metabolic fates of pyruvate: Acetyl-CoA · Oxaloacetate · Lactate · Alanine
- **nd-054** cleared (Claude (AI board review), 2026-10-15): No anthracycline beyond doxorubicin, no second RTA category and no other nephrotoxic group is present; aspirin and thiazides don't cause a normal-anion-gap acidosis.
  - MICRO-058 Aminoglycoside antibiotics: Gentamicin · Tobramycin · Amikacin · Streptomycin
  - MSK-004 Medications that can promote hyperuricemia: Thiazide diuretics · Pyrazinamide · Low-dose aspirin · Niacin
  - NEPH-028 Normal-anion-gap metabolic acidosis associations: Diarrhea · Acetazolamide · Distal renal tubular acidosis · Pancreatic fistula
  - PLEXUS-GEN-002 Anticancer drugs targeting topoisomerases: Irinotecan · Topotecan · Etoposide · Doxorubicin
- **nd-056** cleared (Claude (AI board review), 2026-10-15): Protein S deficiency is not on the board; paired blot format is self-contained; stroke mechanisms are generic processes, not named inherited thrombophilias.
  - NEU-034 Mechanisms of ischemic stroke: In-situ thrombosis · Arterial embolism · Small-vessel (lacunar) occlusion · Systemic hypoperfusion
  - PLEXUS-GEN-014 Blot techniques and their targets: Southern blot - DNA · Northern blot - RNA · Western blot - protein · Southwestern blot - DNA-binding proteins
  - PLX-BCH-014 Inherited defects that impair urea-cycle ammonia disposal: OTC deficiency · CPS I deficiency · Arginase deficiency · NAGS deficiency
  - PLX-HEM-037 Inherited venous-thrombophilia mechanisms: Antithrombin deficiency · Factor V Leiden · Prothrombin G20210A mutation · Protein C deficiency
- **nd-059** cleared (Claude (AI board review), 2026-10-15): DKA tiles are used together in a DKA group; no PMR tile is present; no progestin-only tile is present; migraine with aura and transient monocular vision loss are resolved by context.
  - ENDO-040 Classic clues to diabetic ketoacidosis: Kussmaul respirations · Fruity breath · Ketonemia · Anion gap metabolic acidosis
  - MSK-021 Giant cell arteritis cranial clues: New temporal headache · Jaw claudication · Transient monocular vision loss · Scalp tenderness
  - NEU-056 Potentially treatable contributors to cognitive impairment: Major depressive disorder · Hypothyroidism · Neurosyphilis · Vitamin B12 deficiency
  - REPRO-023 Category 4 contraindications to combined (estrogen-containing) hormonal contraception: Migraine with aura · Acute deep venous thrombosis · Prior stroke · Coronary artery disease
- **nd-066** cleared (Claude (AI board review), 2026-10-15): No systemic-inflammatory, epididymo-orchitis, or clostridial-toxin category is present on this board, so none of the three flagged conflicts apply.
  - GI-059 Extraintestinal manifestations of inflammatory bowel disease: Sacroiliitis · Uveitis · Erythema nodosum · Pyoderma gangrenosum
  - MICRO-005 Spore-forming obligate anaerobic bacilli: Clostridium tetani · Clostridium botulinum · Clostridium perfringens · Clostridioides difficile
  - PLX-BCH-031 Classic Marfan syndrome associations: Arachnodactyly · Upward lens subluxation · Aortic dissection · Pectus deformity
  - REPRO-025 Bacterial pathogens of infectious epididymitis: Chlamydia trachomatis · Neisseria gonorrhoeae · Escherichia coli · Pseudomonas aeruginosa
- **nd-073** cleared (Claude (AI board review), 2026-10-15): No threonine, ototoxicity, or class IA group is on the board; the Shiga pair only makes its own group easier.
  - CARD-006 Antiarrhythmics that can prolong QT: Quinidine · Procainamide · Disopyramide · Sotalol
  - MICRO-002 Bacterial toxins that inhibit host protein synthesis: Diphtheria toxin · Pseudomonas exotoxin A · Shiga toxin (Shigella dysenteriae) · Shiga-like toxin / Stx (EHEC)
  - NEPH-003 Loop diuretics: Furosemide · Torsemide · Bumetanide · Ethacrynic acid
  - PLX-BCH-067 Amino acids that are both glucogenic and ketogenic: Isoleucine · Phenylalanine · Tyrosine · Tryptophan
- **nd-074** cleared (Claude (AI board review), 2026-10-15): No TTP group or secondary iron-overload group is present.
  - CARD-052 Typical changes during dynamic exercise: Increased heart rate · Increased contractility · Increased venous return · Reduced systemic vascular resistance
  - GI-024 Iron studies in hereditary hemochromatosis: Increased serum iron · Increased ferritin · Increased transferrin saturation · Reduced TIBC
  - PLX-BCH-078 Characteristic OTC deficiency laboratory clues: Hyperammonemia · Elevated orotic acid · Low citrulline · Low BUN
  - PLX-HEM-035 Shiga-toxin-associated HUS clues: Preceding bloody diarrhea · Microangiopathic hemolytic anemia · Thrombocytopenia · Acute kidney injury
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
- Rejected CARD-032, IMM-028, PLX-BCH-049, PLX-HEM-032 (Claude (AI board review), 2026-10-15): "Wiskott-Aldrich syndrome" (X-linked inborn errors of immunity) also fits "Mucocutaneous bleeding from primary-hemostasis defects": WAS causes thrombocytopenia with small platelets, which produces petechiae and mucocutaneous bleeding. "Eczema" (Classic phenylketonuria presentation clues) is part of the classic Wiskott-Aldrich triad, which strengthens the pull toward the X-linked group.
- Rejected CARD-028, IMM-014, MICRO-026, MICRO-036 (Claude (AI board review), 2026-10-15): "Anaphylaxis after cyst rupture" (Hydatid disease diagnostic and complication clues) also fits "IgE-associated immune events": it is IgE-mediated type I hypersensitivity to released antigen, and 'Helminth defense' could plausibly be swapped into the hydatid group.
- Rejected ENDO-012, GI-047, NEU-057, PLX-HEM-048 (Claude (AI board review), 2026-10-15): "Weight loss" (VIPoma (Verner-Morrison) findings) also fits "Characteristic associations of Graves disease": weight loss is a hallmark of Graves hyperthyroidism, and it is not part of the classic WDHA triad.
- Rejected IMM-027, MICRO-031, PLX-BCH-026, PLX-HEM-058 (Claude (AI board review), 2026-10-15): "Thrombocytopenia" (Wiskott-Aldrich syndrome clues) is a defensible member of Characteristic Gaucher disease findings: thrombocytopenia from hypersplenism and marrow infiltration is a classic presenting Gaucher finding (bruising/bleeding).
- Rejected ENDO-019, MICRO-032, PLX-BCH-054, PLX-HEM-064 (Claude (AI board review), 2026-10-15): "Massive splenomegaly" (Myelofibrosis clues) fits Visceral leishmaniasis diagnostic associations: kala-azar is a classic cause of massive splenomegaly, making it near-interchangeable with "Hepatosplenomegaly". "Hepatosplenomegaly" (Visceral leishmaniasis diagnostic associations) fits Myelofibrosis clues: extramedullary hematopoiesis enlarges both liver and spleen.
- Rejected CARD-048, GI-042, MICRO-027, PLX-HEM-010 (Claude (AI board review), 2026-10-15): "Foul-smelling fatty diarrhea" (Giardiasis clinical and microscopy clues) fits Diagnostic pattern of chronic pancreatic exocrine insufficiency: steatorrhea is the defining clinical feature of exocrine pancreatic insufficiency.
- Rejected GI-014, NEU-056, PLX-BCH-014, PLX-HEM-028 (Claude (AI board review), 2026-10-15): "Vitamin B12 deficiency" (Potentially treatable contributors to cognitive impairment) fits Consequences of parietal-cell autoimmunity: pernicious anemia directly causes B12 deficiency, near-interchangeable with "Vitamin B12 malabsorption". "Megaloblastic anemia", "Hypersegmented neutrophils" and "Increased homocysteine" (Folate-deficiency laboratory pattern) are also consequences of parietal-cell autoimmunity via B12 deficiency.
- Rejected CARD-027, GI-054, PLX-BCH-031, PLX-HEM-017 (Claude (AI board review), 2026-10-15): "Meckel diverticulum" (Potential lead points for intussusception) also fits Sources of chronic iron-loss anemia: ectopic gastric mucosa causes painless GI bleeding and is a classic cause of iron-deficiency anemia in children. "Intestinal polyp" (Potential lead points for intussusception) also fits Sources of chronic iron-loss anemia: bleeding GI polyps are a standard cause of occult blood loss and iron deficiency, nearly interchangeable with "Bleeding gastrointestinal malignancy".
- Rejected GI-064, MICRO-010, PHARM-014, REPRO-025 (Claude (AI board review), 2026-10-15): "Escherichia coli" (Bacterial pathogens of infectious epididymitis) also fits Bacterial infections linked to unpasteurized dairy: E. coli O157:H7 (EHEC) is a classic raw-milk pathogen, as the MICRO-010 flag itself notes.
- Rejected GI-009, MICRO-014, MSK-017, NEU-017 (Claude (AI board review), 2026-10-15): "Scleroderma" (Conditions predisposing to gastroesophageal reflux) also fits Characteristic limited systemic sclerosis features: it names the disease itself, so the player sees five systemic-sclerosis tiles, and the esophageal dysmotility it implies is the CREST feature the MSK-017 flag warns against placing on the board.
- Rejected MICRO-020, MSK-021, PLX-HEM-037, REPRO-023 (Claude (AI board review), 2026-10-15): "Factor V Leiden" (Inherited venous-thrombophilia mechanisms) also fits Category 4 contraindications to combined (estrogen-containing) hormonal contraception: known thrombogenic mutations are US MEC Category 4 and a classic USMLE estrogen contraindication; the same applies to "Prothrombin G20210A mutation", "Antithrombin deficiency" and "Protein C deficiency".
- Rejected GI-059, MSK-002, NEU-050, PLX-BCH-042 (Claude (AI board review), 2026-10-15): "IBD-associated (enteropathic) spondyloarthritis" (Seronegative spondyloarthritides) is itself an extraintestinal manifestation of IBD and fits "Extraintestinal manifestations of inflammatory bowel disease" as well as its own group; "Sacroiliitis" is the axial lesion of that same entity, so the two are near-interchangeable.
- Rejected ENDO-040, NEU-034, PLEXUS-GEN-014, PLX-BCH-039 (Claude (AI board review), 2026-10-15): "Ketonemia" (Classic clues to diabetic ketoacidosis) fits "Metabolic consequences of ethanol-driven NADH excess" because alcoholic ketoacidosis produces ketonemia. "Anion gap metabolic acidosis" (Classic clues to diabetic ketoacidosis) fits "Metabolic consequences of ethanol-driven NADH excess" because ethanol-driven lactic acidosis and ketoacidosis are both anion-gap acidoses.
- Rejected GI-014, GI-047, MICRO-026, PLX-HEM-017 (Claude (AI board review), 2026-10-15): "Achlorhydria" (VIPoma (Verner-Morrison) findings) fits "Consequences of parietal-cell autoimmunity" equally well: autoimmune destruction of parietal cells abolishes acid secretion, a classic consequence of autoimmune atrophic gastritis.
- Rejected GI-054, IMM-027, MICRO-020, PLX-HEM-032 (Claude (AI board review), 2026-10-15): "Thrombocytopenia" (Wiskott-Aldrich syndrome clues) is itself a primary-hemostasis defect causing mucocutaneous bleeding, so it fits "Mucocutaneous bleeding from primary-hemostasis defects" (especially beside "Immune thrombocytopenia" and BSS, which is often thrombocytopenic).

## Systems expansion from released Dailies

- 49 expansion boards are scheduled. Each is released on the same date as the Daily that supplied its last connection, never earlier.
  - Cardiology: 7 (first on 2026-11-11)
  - Neurology: 7 (first on 2026-11-03)
  - GI: 6 (first on 2026-10-28)
  - Endocrine: 4 (first on 2026-11-05)
  - Heme/Onc: 7 (first on 2026-10-26)
  - Microbiology: 9 (first on 2026-10-26)
  - Immunology: 3 (first on 2026-10-30)
  - Dermatology: 2 (first on 2026-11-10)
  - Biochemistry/Genetics: 4 (first on 2026-10-26)
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

