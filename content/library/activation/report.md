# Plexus new library: activation report

Daily switches to the new library on **2026-10-10** (players' local date). Earlier dates keep the existing Daily.

## Content

| | Count |
|---|---|
| Active connections (eligible, unique, not held) | 647 |
| ...served on a published board | 644 |
| Held: medical / source review | 14 |
| Held: possible duplicate awaiting decision | 23 |
| Consolidated into a canonical relationship | 8 |
| Human verified | 0 |

Review labels of active connections: AI_REVIEWED_PASS 629, AI_REVIEWED_REVISED 18 (OpenEvidence AI review; none relabelled as human verified).

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

### Replacements made during review
- gi-starter-3: GI-035 (Clinical findings of obstructive cholestasis) replaced by GI-061 (Hirschsprung disease clues). Pruritus and jaundice (obstructive cholestasis) also fit primary biliary cholangitis on the same board. Replaced the cholestasis group with Hirschsprung disease clues, which share no plausible tiles with the liver groups.
- psychiatry-starter-3: PSY-022 (Serotonin syndrome-associated non-antidepressant drugs) replaced by PSY-018 (High-potency first-generation antipsychotics). Meperidine and tramadol (serotonin-syndrome group) are mu-opioid agonists and could be placed with the full mu-agonist group. Replaced with high-potency first-generation antipsychotics.
- pulmonary-starter-3: PULM-021 (Features of diffuse alveolar damage in ARDS) replaced by PULM-003 (Markers of neuroendocrine differentiation in small cell carcinoma). Two ARDS groups on one board; diffuse alveolar damage features could mix with ARDS triggers and hypoxemia mechanisms. Replaced the DAD group with neuroendocrine markers of small cell carcinoma.
- pulmonary-starter-4: PULM-019 (Bedside clues to pleural effusion) replaced by PULM-013 (Core obstructive lung diseases in the source). Pleural effusion clues compete with the asbestos group's pleural tiles, the exact overlap PULM-017's reviewer warned about. Replaced with core obstructive lung diseases.
- reproductive-starter-5: REPRO-010 (Conditions associated with polyhydramnios) replaced by REPRO-015 (States of prolonged unopposed estrogen exposure). Multiple gestation (beta-hCG group) is also associated with polyhydramnios, and the twin-twin transfusion tile sits in the polyhydramnios group. Replaced with states of prolonged unopposed estrogen exposure.

### Flags reviewed and cleared (not silently)
- **biochemistry-genetics-starter-5** (Claude (AI review at the owner's request), 2026-10-08): The caution asks to avoid a competing neurotransmitter-deficiency group. The other groups are alkaptonuria, ketone-oxidizing tissues and peroxisomal processes; none is a neurotransmitter-deficiency group and none of their tiles fits AADC deficiency.
  - flag: PLX-BCH-077 board instruction to check against the other groups: "Avoid a competing neurotransmitter-deficiency category on the same board."
- **msk-starter-5** (Claude (AI review at the owner's request), 2026-10-08): The caution concerns navicular and sesamoid tiles as distractors. Neither appears on the board, and no other group (dermatomyositis skin, osteopetrosis, sarcoidosis) names a fracture site.
  - flag: MSK-035 board instruction to check against the other groups: "Board overlap: navicular and sesamoids are additional high-risk sites - avoid as distractors."
- **renal-starter-5** (Claude (AI review at the owner's request), 2026-10-08): The caution concerns a Valsalva-maneuver group. None is on the board; acetazolamide uses, oxalate stone exposures and Alport clues do not share a plausible tile with stress-incontinence triggers.
  - flag: NEPH-027 board instruction to check against the other groups: "Board overlap: any Valsalva-maneuver category (ambiguity 1)."
- **pharmacology-starter-2** (Claude (AI review at the owner's request), 2026-10-08): Cautions concern a sympathomimetic-toxicity group, a fifth conjugation tile and carbachol. None is on the board. Muscarinic agonists are drugs while the antimuscarinic group lists findings, so the two do not compete for tiles; CYP inhibitors share no plausible tile with them.
  - flag: PHARM-009 board instruction to check against the other groups: "BOARD OVERLAP: mydriasis and tachycardia also occur in sympathomimetic toxicity."
  - flag: PHARM-001 board instruction to check against the other groups: "Glutathione and amino-acid conjugation are other valid members; a 5th-member board tile could blur this category."
  - flag: PHARM-006 board instruction to check against the other groups: "Carbachol is another valid member (board note)."
- **pharmacology-starter-3** (Claude (AI review at the owner's request), 2026-10-08): Cautions concern an antiseizure-drug group, other toxidromes, an adrenergic-receptor group and class III antiarrhythmics. None is on the board. The beta-blocker group lists drugs while the Gs group lists receptors, so tiles do not cross.
  - flag: PHARM-002 board instruction to check against the other groups: "BOARD OVERLAP: carbamazepine, phenobarbital, phenytoin also fit an antiseizure-drug category; rifampin does not."
  - flag: PHARM-008 board instruction to check against the other groups: "BOARD OVERLAP: each sign individually appears in other toxidromes."
  - flag: PHARM-005 board instruction to check against the other groups: "BOARD OVERLAP: beta-1/beta-2 also fit an adrenergic-receptor category."
  - flag: PHARM-013 board instruction to check against the other groups: "BOARD OVERLAP: sotalol also fits class III antiarrhythmics; its added K-channel activity does not negate its beta-blockade."
- **psychiatry-starter-3** (Claude (AI review at the owner's request), 2026-10-08): The caution concerns shared EPS risk with another antipsychotic or EPS group. None is on the board. The delirium group is explicitly non-drug measures (clocks, calendars, sleep, visitors), so haloperidol does not read as a member.
  - flag: PSY-018 board instruction to check against the other groups: "Shared high EPS risk is a board-overlap consideration."
- **psychiatry-starter-5** (Claude (AI review at the owner's request), 2026-10-08): No other psychosis, decoy defense, or serotonin-syndrome group is on the board. PSY-012's citalopram/escitalopram note is about two tiles inside its own group and cannot be resolved by board composition; it is listed as an open content question for the owner.
  - flag: PSY-006 board instruction to check against the other groups: "Board overlap: schizoaffective, brief psychotic, schizophreniform, and substance-induced psychosis share these; do not present as diagnostic of schizophrenia."
  - flag: PSY-012 board instruction to check against the other groups: "Board caution: escitalopram is the S-enantiomer of citalopram, so the pair are near-duplicates and could be contested as distinct tiles; keep them on separate boards if possible."
  - flag: PSY-001 board instruction to check against the other groups: "Board caution: anticipation, affiliation, self-assertion are also mature defenses and make strong decoys."
  - flag: PSY-023 board instruction to check against the other groups: "Board overlap: fever, altered mental status, and autonomic instability also occur in serotonin syndrome—lead-pipe rigidity (vs clonus/hyperreflexia) is the differentiating tile."
- **pulmonary-starter-3** (Claude (AI review at the owner's request), 2026-10-08): The caution concerns carcinoid or LCNEC groups. Neither is on the board; ARDS triggers, curve shifts and hypoxemia mechanisms share no plausible tile with neuroendocrine markers.
  - flag: PULM-003 board instruction to check against the other groups: "Board overlap: these markers also stain carcinoid and LCNEC."
- **pulmonary-starter-4** (Claude (AI review at the owner's request), 2026-10-08): Cautions concern an air-trapping group, a broader tissue-hypoxia group and a competing pleural group. None is on the board after replacing the pleural-effusion group. Mesothelioma belongs with asbestos exposure, not with small cell paraneoplastic syndromes.
  - flag: PULM-013 board instruction to check against the other groups: "Board overlap: ''air trapping disorders.'' Added refs: Stanojevic et al., ERS/ATS 2022;"
  - flag: PULM-011 board instruction to check against the other groups: "Board overlap: broader ''causes of tissue hypoxia.'' Added refs: Henretig et al., NEJM 2019;"
  - flag: PULM-017 board instruction to check against the other groups: "BOARD-LEVEL OVERLAP WARNING: three tiles (plaques, benign effusion, mesothelioma) are pleural and could be grouped as ''asbestos pleural disease'' on a 16-tile board; pair with care and avoid a competing pleural category."
- **reproductive-starter-5** (Claude (AI review at the owner's request), 2026-10-08): Cautions concern gestational trophoblastic disease, quad-screen and endometrial-cancer-risk groups. None is on the board. Turner structural findings and mesonephric derivatives do not share plausible tiles with the hCG or unopposed-estrogen groups.
  - flag: REPRO-007 board instruction to check against the other groups: "Board overlap: mole/choriocarcinoma also fit gestational trophoblastic disease, and trisomy 21 fits quad-screen findings; avoid these competing groups on the same board."
  - flag: REPRO-015 board instruction to check against the other groups: "Board caution: do not place a separate endometrial-cancer-risk group on the same board."

## Daily

- Launch-ready Daily boards: **84** (63 with no flags, 21 flagged and cleared on review).
- Runway: 2026-10-10 to 2027-01-01 with no relationship repeated.
- Boards waiting for review (not scheduled): 0. Rejected on review: 1. Connections left over (no compatible board yet): 3.
- Exhaustion policy: after 2027-01-01, the Daily replays the same reviewed boards in the same order, one per day, under new dates. Nothing is regenerated, so no unreviewed board appears. Importing more content before then extends the new schedule instead.

### Daily boards reviewed
- **nd-003** cleared (Claude (AI review at the owner's request), 2026-10-08): Cautions concern a zoster-complications group, adductor magnus, another RTA group and ALS. None is on the board; LMN signs do not fit the other groups.
  - DERM-007 Clinical forms of VZV infection: Varicella · Herpes zoster · Herpes zoster ophthalmicus · Herpes zoster oticus
  - MSK-028 Hip extensor muscles: Gluteus maximus · Long head of biceps femoris · Semimembranosus · Semitendinosus
  - NEPH-028 Normal-anion-gap metabolic acidosis associations: Diarrhea · Acetazolamide · Distal renal tubular acidosis · Proximal renal tubular acidosis
  - NEU-003 Lower motor neuron examination signs: Fasciculations · Muscle atrophy · Hyporeflexia · Hypotonia
- **nd-005** cleared (Claude (AI review at the owner's request), 2026-10-08): Cautions concern separate Crohn/UC tiles, antipsychotic pathways, NER/MMR enzymes and other ANCA vasculitides. None is on the board; SLE (aphthous ulcers) does not fit the GPA clues.
  - GI-004 Systemic diseases associated with recurrent aphthous oral ulcers: Behcet disease · Celiac disease · Inflammatory bowel disease · Systemic lupus erythematosus
  - NEU-049 Major dopaminergic pathways: Mesolimbic pathway · Mesocortical pathway · Nigrostriatal pathway · Tuberoinfundibular pathway
  - PLEXUS-GEN-009 Base excision repair participants: DNA glycosylase · AP endonuclease · DNA polymerase beta · DNA ligase
  - MSK-022 Granulomatosis with polyangiitis clues: PR3-ANCA (c-ANCA) · Chronic sinusitis · Cavitating pulmonary nodules · Pauci-immune glomerulonephritis
- **nd-008** cleared (Claude (AI review at the owner's request), 2026-10-08): Cautions concern glutamate, acute stress disorder, the small round blue cell differential and hypercalcemia/erythrocytosis groups. None is on the board.
  - PLX-BCH-069 Amino acids feeding alpha-ketoglutarate through glutamate: Arginine · Proline · Histidine · Glutamine
  - PSY-004 Core PTSD symptom domains: Intrusive re-experiencing · Trauma-cue avoidance · Negative mood and cognition · Hyperarousal
  - MSK-020 Classic Ewing sarcoma clues: Diaphyseal lesion · Onion-skin periosteal reaction · Small round blue cells · EWSR1-FLI1 fusion
  - NEPH-024 Renal cell carcinoma paraneoplastic mediators: PTH-related peptide · Erythropoietin · ACTH · Renin
- **nd-011** cleared (Claude (AI review at the owner's request), 2026-10-08): Cautions concern the TTTS donor twin, a nephrotoxic/ototoxic antibiotic group and a primary lymphoid group. None is on the board. The blot group pairs each technique with its target, which makes it easy rather than ambiguous.
  - REPRO-010 Conditions associated with polyhydramnios: Anencephaly · Intestinal atresia · Maternal diabetes · Twin-twin transfusion recipient
  - MICRO-058 Aminoglycoside antibiotics: Gentamicin · Tobramycin · Amikacin · Streptomycin
  - PLEXUS-GEN-014 Blot techniques and their targets: Southern blot - DNA · Northern blot - RNA · Western blot - protein · Southwestern blot - DNA-binding proteins
  - IMM-001 Secondary lymphoid tissues: Spleen · Lymph nodes · Peyer's patches · Tonsils
- **nd-013** cleared (Claude (AI review at the owner's request), 2026-10-08): Cautions concern other obturator-innervated muscles, a duplicate PDE-5 quartet, a hyperparathyroidism group and a hypocalcemia group. None is on the board; hypoparathyroidism raises phosphate and does not fit the hypercalcemia group.
  - MSK-026 Muscles supplied by the obturator nerve: Adductor longus · Adductor brevis · Gracilis · Adductor part of adductor magnus
  - PHARM-014 PDE-5 (phosphodiesterase-5) inhibitors: Sildenafil · Vardenafil · Tadalafil · Avanafil
  - ENDO-020 Classic clinical consequences of hypercalcemia: Calcium kidney stones · Constipation · Bone pain · Neuropsychiatric disturbances
  - NEPH-030 Phosphate-elevating conditions: Renal failure · Hypoparathyroidism · Tumor lysis syndrome · Rhabdomyolysis
- **nd-016** cleared (Claude (AI review at the owner's request), 2026-10-08): Cautions concern Down syndrome, cysteine, other glomerular lesions and a general overlap check. None of those is on the board and no tile fits two groups.
  - PLEXUS-GEN-011 Fanconi anemia associations: Bone marrow failure · Skeletal abnormalities · Cafe-au-lait macules · Acute myeloid leukemia risk
  - GI-006 Conditions associated with macroglossia: Acromegaly · Hypothyroidism · Amyloidosis · Beckwith-Wiedemann syndrome
  - PLX-BCH-066 Polar uncharged amino acid side chains: Serine · Threonine · Asparagine · Glutamine
  - NEPH-010 Secondary membranous nephropathy associations: Hepatitis B infection · Systemic lupus erythematosus · Solid malignancy · Penicillamine exposure
- **nd-020** cleared (Claude (AI review at the owner's request), 2026-10-08): Cautions concern other GI malabsorption syndromes, Patau syndrome, Chlamydia and Hunter syndrome. None is on the board, and no tile fits two of these groups.
  - GI-048 Somatostatinoma syndrome manifestations: Diabetes mellitus · Cholelithiasis · Steatorrhea · Weight loss
  - PLEXUS-GEN-029 Edwards syndrome physical findings: Prominent occiput · Clenched hands with overlapping fingers · Rocker-bottom feet · Low-set ears
  - MSK-003 Enteric triggers of reactive arthritis: Campylobacter · Salmonella · Shigella · Yersinia
  - PLX-BCH-079 Storage diseases with enzyme replacement described in the source: Fabry disease · Gaucher disease · Hurler syndrome · Pompe disease
- **nd-023** cleared (Claude (AI review at the owner's request), 2026-10-08): Cautions concern RA radiographs, a class IA group, other pyruvate-source amino acids and an ototoxicity group. None is on the board.
  - MSK-005 Classic radiographic changes of osteoarthritis: Nonuniform (asymmetric) joint-space loss · Subchondral sclerosis · Marginal osteophytes · Subchondral cysts
  - CARD-006 Antiarrhythmics that can prolong QT: Quinidine · Procainamide · Disopyramide · Sotalol
  - PLX-BCH-068 Amino acids whose catabolism feeds pyruvate: Alanine · Glycine · Serine · Cysteine
  - NEPH-003 Loop diuretics: Furosemide · Torsemide · Bumetanide · Ethacrynic acid
- **nd-025** cleared (Claude (AI review at the owner's request), 2026-10-08): Cautions concern other antineoplastic groups, Mn-SOD, a TTP group and progestin-only methods. None is on the board.
  - PULM-001 Drugs associated with pulmonary fibrosis: Bleomycin · Amiodarone · Methotrexate · Busulfan
  - PLX-BCH-011 Enzymes requiring copper: Cytochrome c oxidase · Tyrosinase · Lysyl oxidase · Cu/Zn superoxide dismutase (SOD1)
  - PLX-HEM-035 Shiga-toxin-associated HUS clues: Preceding bloody diarrhea · Microangiopathic hemolytic anemia · Thrombocytopenia · Acute kidney injury
  - REPRO-023 Category 4 contraindications to combined (estrogen-containing) hormonal contraception: Migraine with aura · Prior deep venous thrombosis · Prior stroke · Coronary artery disease
- **nd-027** cleared (Claude (AI review at the owner's request), 2026-10-08): Cautions concern a botulism group, tinea versicolor, extra homocysteine causes and Ottawa-rule caveats. None is on the board; the four groups share no plausible tile.
  - MSK-034 Bony tenderness sites in the Ottawa ankle-foot rules: Posterior edge or tip of lateral malleolus · Posterior edge or tip of medial malleolus · Base of the fifth metatarsal · Navicular
  - NEU-016 Ocular and bulbar myasthenia gravis symptoms: Ptosis · Diplopia · Dysphagia · Dysarthria
  - DERM-011 Dermatophyte infections named by site: Tinea corporis · Tinea capitis · Tinea pedis · Tinea manuum
  - PLX-BCH-013 Causes of elevated homocysteine: Folate deficiency · Vitamin B12 deficiency · Cystathionine beta-synthase deficiency · MTHFR deficiency
- **nd-032** cleared (Claude (AI review at the owner's request), 2026-10-08): Cautions concern a warm-AIHA group, broad undernutrition, a general CF check and a collapsing-glomerulopathy group. None is on the board. Infections appear in two groups (Mycoplasma and EBV vs HIV), but each fits only its own relationship.
  - PLX-HEM-004 Cold-antibody hemolysis associations: Mycoplasma pneumoniae infection · Epstein-Barr virus infection · Waldenstrom macroglobulinemia · Chronic lymphocytic leukemia
  - PSY-009 Clinical clues to anorexia-related undernutrition: Lanugo · Amenorrhea · Osteoporosis · Nutritional deficiencies
  - PLEXUS-GEN-019 Respiratory and related findings in cystic fibrosis: Recurrent pulmonary infections · Thick airway secretions · Nasal polyps · Digital clubbing
  - NEPH-009 Secondary FSGS associations: HIV infection · Heroin exposure · Interferon therapy · Sickle cell disease
- **nd-034** cleared (Claude (AI review at the owner's request), 2026-10-08): Cautions concern protein S, an epididymo-orchitis group, midgut/hindgut derivatives and other urate-raising drugs. None is on the board.
  - PLX-HEM-037 Inherited venous-thrombophilia mechanisms: Antithrombin deficiency · Factor V Leiden · Prothrombin G20210A mutation · Protein C deficiency
  - REPRO-025 Bacterial pathogens of infectious epididymitis: Chlamydia trachomatis · Neisseria gonorrhoeae · Escherichia coli · Pseudomonas aeruginosa
  - GI-001 Foregut-derived digestive organs: Esophagus · Stomach · Liver · Pancreas
  - MSK-004 Medications that can promote hyperuricemia: Thiazide diuretics · Loop diuretics · Low-dose aspirin · Niacin
- **nd-037** cleared (Claude (AI review at the owner's request), 2026-10-08): Cautions concern spasticity/hypertonia redundancy inside the UMN group, an ANA-positive grouping, the easy Shiga pair and anticipation claims. No competing group is on the board.
  - NEU-002 Upper motor neuron examination signs: Hyperreflexia · Spasticity · Hypertonia · Extensor plantar response
  - MSK-024 Autoimmune rheumatic diseases associated with Raynaud phenomenon: Systemic sclerosis · Systemic lupus erythematosus · Mixed connective tissue disease · Sjogren syndrome
  - MICRO-002 Bacterial toxins that inhibit host protein synthesis: Diphtheria toxin · Pseudomonas exotoxin A · Shiga toxin (Shigella dysenteriae) · Shiga-like toxin / Stx (EHEC)
  - PLEXUS-GEN-004 Trinucleotide repeat expansion disorders: Fragile X syndrome · Friedreich ataxia · Huntington disease · Myotonic dystrophy type 1
- **nd-046** cleared (Claude (AI review at the owner's request), 2026-10-08): Cautions concern a Kawasaki/TSS group, other systemic-inflammatory groups, tau/tangle redundancy and a glycoprotein-hormone group. None is on the board.
  - DERM-003 Classic scarlet fever findings: Sandpaper-textured rash · Pastia lines · Circumoral pallor · Strawberry tongue
  - GI-059 Extraintestinal manifestations of inflammatory bowel disease: Enteropathic (IBD-associated) arthritis · Uveitis · Erythema nodosum · Pyoderma gangrenosum
  - NEU-050 Alzheimer disease neuropathology clues: Extracellular amyloid-beta plaques · Intracellular neurofibrillary tangles · Hyperphosphorylated tau · Cerebral amyloid angiopathy
  - ENDO-002 Anterior pituitary hormones targeting other endocrine glands: TSH · ACTH · FSH · LH
- **nd-055** cleared (Claude (AI review at the owner's request), 2026-10-08): Cautions concern a clostridial toxin-disease group, anthracyclines, HLA-B27/enthesitis groups and RNA/protein methylation tiles. None is on the board.
  - MICRO-005 Spore-forming obligate anaerobic bacilli: Clostridium tetani · Clostridium botulinum · Clostridium perfringens · Clostridioides difficile
  - PLEXUS-GEN-002 Anticancer drugs targeting topoisomerases: Irinotecan · Topotecan · Etoposide · Teniposide
  - MSK-002 Seronegative spondyloarthritides: Ankylosing spondylitis · Psoriatic arthritis · Reactive arthritis · IBD-associated (enteropathic) spondyloarthritis
  - PLX-BCH-036 Processes using SAM methyl donation: Creatine synthesis · Epinephrine synthesis · Phosphatidylcholine synthesis · DNA methylation
- **nd-060** cleared (Claude (AI review at the owner's request), 2026-10-08): Cautions concern trypsinogen, bDMARDs/JAK inhibitors, a tricuspid-endocarditis group and manometry caveats. None is on the board; the groups share no plausible tile.
  - GI-008 Classic achalasia findings: Loss of inhibitory myenteric neurons · Impaired LES relaxation · Bird-beak narrowing · Dysphagia to solids and liquids
  - PLX-BCH-047 Pancreatic zymogens activated by trypsin: Chymotrypsinogen · Proelastase · Procarboxypeptidase A · Procarboxypeptidase B
  - MSK-010 Conventional synthetic DMARDs used in RA: Methotrexate · Hydroxychloroquine · Sulfasalazine · Leflunomide
  - CARD-023 Classic tricuspid regurgitation associations: Lower sternal holosystolic murmur · Murmur louder on inspiration · Raised jugular venous pressure · Tricuspid infection in injection drug use
- **nd-061** cleared (Claude (AI review at the owner's request), 2026-10-08): Cautions concern other glucogenic amino acids, a competing trigeminal autonomic cephalalgia group and a broad neurologic tile. None of those groups is on the board. Mydriasis (botulism) and miosis (cluster) point opposite ways; Neurologic dysfunction is a red herring for botulism, but the botulism group is complete without it.
  - PLX-BCH-033 Carbon sources for gluconeogenesis: Lactate · Alanine · Glycerol · Propionyl-CoA
  - MICRO-013 Classic descending botulism findings: Descending flaccid paralysis · Hyporeflexia · Mydriasis · Xerostomia
  - NEU-058 Cluster headache ipsilateral cranial autonomic signs: Lacrimation · Rhinorrhea · Nasal congestion · Miosis (partial Horner)
  - GI-052 Extraintestinal manifestations of Whipple disease: Migratory arthralgias · Culture-negative endocarditis · Lymphadenopathy · Neurologic dysfunction
- **nd-064** cleared (Claude (AI review at the owner's request), 2026-10-08): Cautions concern other drug-induced lupus culprits, non-diabetic ketoacidoses and other raw-dairy pathogens. None is on the board.
  - MSK-011 Medications classically linked to drug-induced lupus: Hydralazine · Procainamide · Isoniazid · Methyldopa
  - NEU-034 Mechanisms of ischemic stroke: In-situ thrombosis · Arterial embolism · Small-vessel (lacunar) occlusion · Systemic hypoperfusion
  - ENDO-040 Classic clues to diabetic ketoacidosis: Kussmaul respirations · Fruity breath · Ketonemia · Anion gap metabolic acidosis
  - MICRO-010 Bacterial infections linked to unpasteurized dairy: Listeria monocytogenes · Brucella species · Campylobacter jejuni · Yersinia enterocolitica
- **nd-073** cleared (Claude (AI review at the owner's request), 2026-10-08): Cautions concern secondary iron overload, threonine, polymyalgia rheumatica and other chromosomal-instability disorders. None is on the board.
  - GI-024 Iron studies in hereditary hemochromatosis: Increased serum iron · Increased ferritin · Increased transferrin saturation · Reduced TIBC
  - PLX-BCH-067 Amino acids that are both glucogenic and ketogenic: Isoleucine · Phenylalanine · Tyrosine · Tryptophan
  - MSK-021 Giant cell arteritis cranial clues: New temporal headache · Jaw claudication · Transient monocular vision loss · Temporal artery giant-cell inflammation
  - PLEXUS-GEN-012 Bloom syndrome associations: Short stature · Long narrow face · Photosensitive facial (butterfly) telangiectatic erythema · Markedly increased cancer risk
- **nd-076** cleared (Claude (AI review at the owner's request), 2026-10-08): Cautions concern alfuzosin/silodosin and a BPH-treatment group. Neither is on the board. Intellectual disability (homocystinuria) is a developmental finding rather than a treatable contributor to acquired cognitive impairment, so it does not compete with the neurosyphilis/B12/thyroid/depression group. Rebuilt board after the nd-053 rejection.
  - PHARM-011 Alpha-1 adrenergic antagonists: Prazosin · Terazosin · Doxazosin · Tamsulosin
  - NEU-056 Potentially treatable contributors to cognitive impairment: Major depressive disorder (pseudodementia) · Thyroid disease (hypothyroidism) · Neurosyphilis · Vitamin B12 deficiency
  - PLX-BCH-037 Classic homocystinuria clinical associations: Marfanoid habitus · Downward lens subluxation · Thromboembolism · Intellectual disability
  - GI-026 Measures used to remove/reduce excess iron: Therapeutic phlebotomy · Deferoxamine · Deferasirox · Deferiprone
- **nd-082** cleared (Claude (AI review at the owner's request), 2026-10-08): Cautions concern other NADPH users, esophageal dysmotility, an unspecified overlap and an antacid group. None is on the board.
  - PLX-BCH-012 Enzymes that use NADPH: Glutathione reductase · HMG-CoA reductase · Fatty acid synthase · NADPH oxidase
  - MSK-017 Characteristic limited systemic sclerosis features: Calcinosis cutis · Raynaud phenomenon · Sclerodactyly · Telangiectasias
  - NEU-024 Causes of conductive hearing loss: Cerumen impaction · Otitis media · Otosclerosis · Obstructing external canal mass (non-cerumen)
  - GI-064 Osmotic laxatives: Magnesium hydroxide · Magnesium citrate · Polyethylene glycol · Lactulose
- Rejected NEU-056, PLX-BCH-037, CARD-053, GI-026 (Claude (AI review at the owner's request), 2026-10-08): "Tertiary syphilis" (aortic regurgitation group) also fits "Potentially treatable contributors to cognitive impairment", which holds neurosyphilis; a player could reasonably place it there. Board rebuilt.

## Systems expansion from released Dailies

- 60 expansion boards are scheduled. Each is released on the same date as the Daily that supplied its last connection, never earlier.
  - Cardiology: 7 (first on 2026-10-21)
  - Neurology: 7 (first on 2026-10-21)
  - GI: 8 (first on 2026-10-21)
  - Endocrine: 4 (first on 2026-10-24)
  - Heme/Onc: 8 (first on 2026-10-28)
  - Microbiology: 9 (first on 2026-10-18)
  - Immunology: 3 (first on 2026-10-27)
  - Dermatology: 3 (first on 2026-10-31)
  - Biochemistry/Genetics: 11 (first on 2026-10-19)
- Connections still waiting in subject queues at the end of the runway: 96.
- These boards intentionally reuse released Daily connections. That is separate from timed-mode overlap, which is excluded below.

## Timed library (3 Minutes and Race)

- Timed entries before activation: 206 verified.
- Removed as confirmed equivalents of new-library connections: 11.
- Temporarily excluded (unresolved overlap with an active new-library connection): 39.
- Served: 157. Timed entries sharing one canonical relationship: 9 (never both in one session).

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

