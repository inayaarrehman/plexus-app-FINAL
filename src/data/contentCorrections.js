// ---------------------------------------------------------------------
// Content corrections from the October 2026 content review.
// ---------------------------------------------------------------------
// Applied on top of the bundled content so the original entries stay intact
// and every change is reviewable in one place. Category ids never change.
//   BANK_CORRECTIONS     bank category id -> changed fields
//   SYSTEM_CORRECTIONS   "<system puzzle id>#<category index>" -> changed fields
//   DAILY_CORRECTIONS    "<authored daily id>#<category index>" -> changed fields
//   NEAR_MISSES          id or key -> 4 curated plausible non-members, each with
//                        a reason. Used as distractors in the 3-Minute mode.
// Entries still needing review are listed in CONTENT_REVIEW.md.

export const BANK_CORRECTIONS = {
  "bank-easy-02": {
    "title": "QT-prolonging drugs",
    "explanation": "Each is a well-recognized cause of QT prolongation, raising the risk of torsades de pointes."
  },
  "bank-easy-03": {
    "remember": "Noncaseating granulomas usually point away from infection. Think sarcoid, Crohn, beryllium, or a foreign body."
  },
  "bank-easy-04": {
    "tiles": [
      "Tuberculosis",
      "Histoplasmosis",
      "Coccidioidomycosis",
      "Nontuberculous mycobacterial infection"
    ],
    "tileExplanations": [
      "Mycobacterium tuberculosis is the prototype cause of caseating granulomas.",
      "A dimorphic fungus endemic to the Ohio and Mississippi River valleys that classically causes caseating granulomas resembling TB.",
      "A dimorphic fungus endemic to the southwestern US whose spherules sit within necrotizing granulomas.",
      "Mycobacterium avium complex and related species cause necrotizing granulomas in immunocompetent lungs, mimicking TB."
    ]
  },
  "bank-easy-06": {
    "explanation": "Each is a classic cause of digital clubbing. The leading theory is that megakaryocytes and platelet clumps bypass the lung capillaries (or reach the fingertips from diseased lung) and release growth factors like PDGF and VEGF, so hypoxia alone is not the trigger.",
    "tileExplanations": [
      "A paraneoplastic cause of clubbing and hypertrophic osteoarthropathy, especially non-small cell lung cancer.",
      "Chronic suppurative lung disease makes clubbing common in children and young adults with CF.",
      "Chronic suppurative infection in permanently dilated airways is a classic cause of clubbing.",
      "Right-to-left shunting is the classic pediatric cause of clubbing, often with cyanosis."
    ],
    "remember": "Clubbing points to suppurative lung disease, lung cancer, fibrosis, or cyanotic heart disease. Uncomplicated COPD does not cause clubbing, so new clubbing in a smoker means look for cancer."
  },
  "bank-easy-14": {
    "tileExplanations": [
      "Reduced renal perfusion activates the renin-angiotensin system, raising blood pressure.",
      "Catecholamine excess from an adrenal medullary tumor raises blood pressure, often episodically.",
      "Excess cortisol activates mineralocorticoid receptors and boosts vascular sensitivity to catecholamines, raising blood pressure.",
      "Excess aldosterone drives sodium and water retention, raising blood pressure."
    ]
  },
  "bank-medium-02": {
    "tileExplanations": [
      "Contracts vascular smooth muscle via Gq/IP3/calcium.",
      "Contracts smooth muscle and increases vascular permeability via Gq.",
      "Contracts vascular smooth muscle (vasopressin) via Gq.",
      "Mediates CNS and enteric nervous system signaling via Gq."
    ]
  },
  "bank-medium-03": {
    "tileExplanations": [
      "Inhibits further norepinephrine release via Gi (presynaptic autoreceptor).",
      "Slows heart rate via Gi in the SA/AV node.",
      "Mediates inhibitory dopamine signaling via Gi and is the main antipsychotic drug target.",
      "Broadly inhibits hormone release throughout the gut and endocrine system via Gi."
    ]
  },
  "bank-medium-04": {
    "explanation": "All four pass through the cavernous sinus region, though not identically: CN III, IV, and V1 (along with V2) run in the lateral wall, while CN VI runs freely through the sinus itself alongside the internal carotid artery. This is why CN VI is often the first nerve affected in cavernous sinus pathology.",
    "tileExplanations": [
      "Runs in the lateral wall of the cavernous sinus, the most superior of the wall nerves.",
      "Runs in the lateral wall of the cavernous sinus, just inferior to CN III.",
      "The ophthalmic division of the trigeminal nerve runs in the lateral wall below CN IV.",
      "Runs through the body of the sinus itself, making it the most vulnerable to compression."
    ],
    "remember": "CN VI runs through the cavernous sinus proper; III, IV, V1, and V2 run in its lateral wall. That is why CN VI palsy is often the earliest sign."
  },
  "bank-medium-12": {
    "explanation": "Each consumes complement and lowers serum C3 and/or C4, mostly through immune-complex activation; MPGN can also do it through alternative pathway dysregulation.",
    "tileExplanations": [
      "Immune complexes activate and consume complement, lowering C3/C4.",
      "Immune complex deposition after streptococcal infection consumes complement.",
      "Immune complex deposition or alternative pathway dysregulation (C3 nephritic factor) consumes complement.",
      "Circulating immune complexes (cryoglobulins) consume complement."
    ]
  },
  "bank-medium-13": {
    "remember": "A classic eosinophilia mnemonic is NAACP: neoplasm, asthma/allergy, Addison disease, collagen vascular disease, and parasites. Add drug reactions (DRESS) and EGPA."
  },
  "bank-medium-16": {
    "explanation": "Each lowers systemic vascular resistance, lowers blood oxygen content, or raises metabolic demand, forcing cardiac output up until the heart eventually cannot keep pace.",
    "remember": "High-output heart failure: the heart fails from pumping too much for too long, not from weak contractility."
  },
  "bank-hard-02": {
    "tileExplanations": [
      "Virchow triad: stasis, endothelial injury, hypercoagulability (thrombosis risk factors).",
      "Charcot triad: fever, jaundice, RUQ pain (ascending cholangitis).",
      "Beck triad: hypotension, JVD, muffled heart sounds (cardiac tamponade).",
      "Whipple triad: hypoglycemic symptoms, low measured glucose, and relief with glucose, which confirms true hypoglycemia before a workup like insulinoma."
    ]
  },
  "bank-hard-05": {
    "remember": "Four \"lines,\" four different exams: chest X-ray, skin folds, nails, and skin patterning that follows embryonic cell migration rather than dermatomes."
  },
  "bank-hard-07": {
    "tileExplanations": [
      "Raynaud phenomenon: episodic digital vasospasm triggered by cold or stress.",
      "Koebner phenomenon: new skin lesions at sites of trauma, seen in psoriasis and lichen planus.",
      "Arthus phenomenon: a local type III hypersensitivity reaction to a repeated antigen injection.",
      "Somogyi phenomenon: rebound morning hyperglycemia after nocturnal hypoglycemia, a board classic even though CGM data suggest it is rare."
    ]
  },
  "bank-hard-08": {
    "tileExplanations": [
      "Portal vein: carries nutrient-rich blood from the gut to the liver.",
      "Portal hypertension: elevated pressure in the portal venous system, classically from cirrhosis.",
      "Portal triad: the bile duct, hepatic artery, and portal vein running together at the corners of each hepatic lobule.",
      "Portal circulation: a venous system draining into a second capillary bed instead of directly to the heart."
    ]
  },
  "bank-hard-09": {
    "tiles": [
      "Nutmeg liver",
      "Rice-water stool",
      "Café-au-lait spots",
      "Chocolate cyst"
    ],
    "tileExplanations": [
      "Nutmeg liver: a mottled cut surface from chronic passive congestion, resembling a cut nutmeg seed.",
      "Rice-water stool: profuse, pale, watery diarrhea flecked with mucus, classic for cholera.",
      "Café-au-lait spots: flat, light-brown macules, classically six or more in neurofibromatosis type 1.",
      "Chocolate cyst: a blood-filled ovarian cyst from endometriosis, named for its dark, thick contents."
    ],
    "title": "Named after a food that is not a fruit",
    "explanation": "Each descriptor borrows a non-fruit food or drink (a spice, a grain, coffee, chocolate) to paint a specific finding. Fruit-named descriptors belong in a separate group.",
    "remember": "Food and drink descriptors are a shortcut to an image. Picture the food, then picture the disease, and check whether it is a fruit."
  },
  "bank-hard-10": {
    "title": "Named after a fruit",
    "explanation": "Each descriptor borrows a fruit's color or texture to paint one specific finding.",
    "remember": "Fruit-named descriptors do the same job as other food descriptors. Picture the fruit, then picture the disease."
  },
  "bank-hard-11": {
    "tileExplanations": [
      "Stellate (hepatic) cells: star-shaped liver cells that store vitamin A and drive fibrosis when activated.",
      "Starry-sky appearance: pale macrophages scattered among dark lymphoma cells, classic for Burkitt lymphoma.",
      "Stellate scar: a central star-shaped scar seen in focal nodular hyperplasia (and fibrolamellar HCC) of the liver and radial scars of the breast.",
      "Stellate ganglion: a sympathetic ganglion in the neck, a target for nerve blocks in CRPS and some arrhythmias."
    ]
  },
  "bank-expert-04": {
    "difficulty": "medium",
    "status": "needs_review",
    "reviewNote": "Decide whether to keep both place-name categories; if both stay, make sure they never appear in the same puzzle or swap tiles so they do not overlap."
  },
  "bank-expert-05": {
    "tiles": [
      "Insulin resistance",
      "Pseudohypoparathyroidism",
      "Androgen insensitivity syndrome",
      "Nephrogenic diabetes insipidus"
    ],
    "tileExplanations": [
      "Cells resist insulin, so the pancreas compensates by secreting more, causing hyperinsulinemia.",
      "End-organ (renal) resistance to PTH keeps PTH high despite low calcium.",
      "Defective androgen receptors blunt feedback, so LH and testosterone run high despite a female phenotype.",
      "The kidney does not respond to ADH, so ADH levels rise as the body tries and fails to concentrate urine."
    ],
    "title": "Hormone runs high because the target tissue is resistant",
    "explanation": "In each, a hormone level is high not from a primary oversecreting gland but because its target tissue fails to respond, so feedback keeps pushing secretion up."
  },
  "bank-neuro-01": {
    "explanation": "Each is a well-established cause of peripheral nerve damage, via chronic hyperglycemia, B12 deficiency, alcohol toxicity with poor nutrition, or microtubule disruption.",
    "tileExplanations": [
      "Chronic hyperglycemia damages small vessels and nerves, the most common cause of peripheral neuropathy overall.",
      "Deficiency causes a symmetric, mostly sensory neuropathy, often alongside subacute combined degeneration of the spinal cord.",
      "Direct axonal toxicity, often worsened by concurrent thiamine deficiency.",
      "A vinca alkaloid that disrupts microtubules needed for axonal transport, causing a dose-limiting neuropathy."
    ]
  },
  "bank-neuro-02": {
    "title": "Nerve lesions that localize on eye exam",
    "explanation": "Each damages a nerve pathway to the eye (three cranial nerves and the oculosympathetic chain), producing a distinctive, localizing finding you can name before imaging.",
    "tileExplanations": [
      "A \"down and out\" eye with ptosis and a dilated, poorly reactive pupil.",
      "Vertical and torsional diplopia, classically worse looking down and in (e.g. descending stairs).",
      "An eye that cannot abduct, resting medially deviated from unopposed medial rectus tone.",
      "Ptosis, miosis, and anhidrosis from interrupted sympathetic supply, the one member that is not a cranial nerve palsy."
    ],
    "remember": "Each nerve pathway to the eye (CN III, IV, VI, or the sympathetics) has one classic localizing sign. Learn the sign, name the lesion."
  },
  "bank-neuro-04": {
    "explanation": "Most people default to \"brain lesions cause contralateral deficits.\" That holds for the corticospinal and spinothalamic tracts once they have crossed, but each of these produces a same-side deficit because the relevant pathway has not crossed yet at that level, never crosses, or crosses twice.",
    "tileExplanations": [
      "Cerebellar output effectively crosses twice, so a hemisphere lesion causes ipsilateral ataxia.",
      "Dorsal column fibers ascend uncrossed and only decussate in the medulla, so a cord lesion causes ipsilateral proprioceptive loss below it.",
      "The descending hypothalamospinal sympathetic fibers run uncrossed, so a lateral medullary stroke causes an ipsilateral Horner syndrome.",
      "A lower motor neuron lesion lies past the corticospinal decussation, so weakness is on the same side (the trochlear nucleus is the classic exception)."
    ]
  },
  "bank-expert-07": {
    "status": "needs_review",
    "reviewNote": "Consider narrowing the title (e.g. \"Compensation that shows up as a second blood gas or sodium abnormality\") or making sure no other primary disturbance appears in the same puzzle. Medical content of the four tiles is accurate."
  },
  "bank-migrated-sys-mixed-0001-L2": {
    "remember": "T8 = vena cava, T10 = esophagus (+vagus), T12 = aorta (+thoracic duct, azygos vein)."
  },
  "bank-migrated-sys-mixed-0001-L3": {
    "title": "Fetal circulatory structure → adult remnant",
    "explanation": "Fetal circulation uses the umbilical vein plus shunts that bypass the liver and lungs; after birth each closes and persists as a fibrous cord or scar."
  },
  "bank-migrated-sys-mixed-0001-L4": {
    "explanation": "Each tips the coagulation balance toward clotting: a factor that resists inactivation (factor V Leiden), loss of a natural anticoagulant (protein C deficiency), excess procoagulant (prothrombin G20210A), or an acquired autoantibody (antiphospholipid syndrome)."
  },
  "bank-migrated-sys-micro-0001-L2": {
    "explanation": "Dimorphic fungi live as mold in the cool environment and convert to a tissue form at body temperature (yeast, or spherules for Coccidioides), and each has its own geographic hotspot.",
    "remember": "Dimorphic = mold in the cold, yeast in the heat (Coccidioides makes spherules instead), and each one has a home region."
  },
  "bank-migrated-sys-mixed-0002-L2": {
    "explanation": "Inflamed meninges hurt when stretched or jostled, so maneuvers that stretch or move the spinal cord and its coverings reproduce pain or reflex guarding.",
    "remember": "Meningismus signs all work by stretching or jostling irritated meninges one way or another."
  },
  "bank-migrated-sys-biochem-0001-L2": {
    "explanation": "Disease needs two mutated copies, and a carrier with one working copy is usually healthy. Many are enzyme or channel defects, though sickle cell is a structural hemoglobin mutation rather than an enzyme deficiency.",
    "remember": "AR: both copies must be broken, carriers are usually unaffected, and enzyme deficiencies are the classic (not universal) example."
  },
  "bank-migrated-sys-biochem-0001-L4": {
    "tileExplanations": [
      "CGG repeat expansion in FMR1 on the X chromosome.",
      "CTG repeat expansion in DMPK; autosomal dominant with anticipation.",
      "GAA repeat expansion in frataxin; autosomal recessive and, unlike the others, does not typically show anticipation.",
      "CAG repeat expansion in the androgen receptor; X-linked spinobulbar muscular atrophy."
    ]
  },
  "bank-migrated-sys-hemeonc-0001-L2": {
    "explanation": "Each translocation either creates a fusion oncogene (BCR-ABL, PML-RARA) or moves an oncogene next to the immunoglobulin heavy chain locus so it is overexpressed (MYC, BCL2), driving a specific blood cancer.",
    "tileExplanations": [
      "BCR-ABL fusion tyrosine kinase, defines chronic myeloid leukemia.",
      "PML-RARA fusion, defines acute promyelocytic leukemia.",
      "MYC placed next to the IGH locus and overexpressed, classic for Burkitt lymphoma.",
      "BCL2 placed next to the IGH locus and overexpressed, classic for follicular lymphoma."
    ],
    "title": "Translocations that define blood cancers"
  },
  "bank-migrated-sys-hemeonc-0001-L3": {
    "explanation": "Tumor markers are proteins a cancer sheds into the blood. They are more useful for monitoring treatment response and recurrence than for screening."
  },
  "bank-migrated-sys-pharm-0001-L3": {
    "title": "Antidotes",
    "explanation": "Each antidote directly counters its toxin's mechanism, either by replenishing what is depleted or by blocking or reversing what is overactive."
  },
  "bank-migrated-sys-pharm-0001-L4": {
    "tiles": [
      "Ethanol",
      "Phenytoin",
      "Aspirin (high dose)",
      "Theophylline (toxic levels)"
    ],
    "tileExplanations": [
      "Eliminated at a constant rate regardless of concentration.",
      "Follows zero-order kinetics at therapeutic-to-toxic doses.",
      "Switches to zero-order kinetics in overdose.",
      "Hepatic metabolism saturates at toxic levels, so it accumulates quickly."
    ],
    "explanation": "Once the enzyme system handling these drugs is saturated, a constant AMOUNT (not percentage) is cleared per unit time.",
    "remember": "PEA: Phenytoin, Ethanol, Aspirin (in overdose) are the textbook zero-order drugs, and theophylline joins them at toxic levels."
  },
  "bank-migrated-sys-mixed-0003-L1": {
    "explanation": "Each lets deoxygenated blood reach the systemic circulation, through right-to-left shunting, mixing, or parallel circuits, causing cyanosis.",
    "remember": "Cyanotic heart defects share one theme: deoxygenated blood reaches the body."
  },
  "bank-migrated-sys-mixed-0003-L2": {
    "tileExplanations": [
      "Derived from the first pharyngeal arch (Meckel's cartilage).",
      "Derived from the second pharyngeal arch (Reichert's cartilage).",
      "Derived from the third pharyngeal arch.",
      "Derived from the fourth pharyngeal arch; the sixth arch forms the cricoid and arytenoid cartilages."
    ],
    "remember": "Pharyngeal arch number maps to a specific bone/cartilage: 1st jaw, 2nd ear (stapes), 3rd hyoid, 4th thyroid cartilage, 6th cricoid/arytenoids."
  },
  "bank-migrated-sys-mixed-0003-L3": {
    "explanation": "TORCH infections cross the placenta (or, for HSV, are mostly acquired at delivery) and tend to damage the developing brain and eyes, with hearing loss most prominent in CMV and rubella.",
    "tileExplanations": [
      "Congenital infection causing hydrocephalus, diffuse intracranial calcifications, and chorioretinitis.",
      "Congenital infection causing cataracts, sensorineural deafness, and PDA.",
      "Most common congenital infection; periventricular calcifications and sensorineural hearing loss.",
      "Usually acquired during delivery; causes skin vesicles, eye disease, and encephalitis."
    ],
    "remember": "TORCH infections overlap (brain, eyes, hearing), so the distinguishing clue matters: calcification pattern, cataracts, or vesicles."
  },
  "bank-migrated-sys-mixed-0003-L4": {
    "tiles": [
      "Spina bifida occulta",
      "Anencephaly",
      "Encephalocele",
      "Meningomyelocele"
    ],
    "tileExplanations": [
      "Failure of vertebral arch fusion without herniation of neural tissue, the mildest form.",
      "Failure of the rostral (anterior) neuropore to close, leaving no forebrain or calvarium.",
      "Herniation of brain and meninges through a skull defect, usually occipital.",
      "Herniation of meninges and spinal cord through a vertebral defect."
    ],
    "explanation": "All arise from incomplete closure of the neural tube in the fourth week. Low maternal folate is the classic preventable risk factor, especially for open defects.",
    "remember": "Folic acid before conception cuts the risk of open neural tube defects."
  },
  "bank-migrated-sys-cardio-0002-L2": {
    "tiles": [
      "Cardiac tamponade",
      "Tension pneumothorax",
      "Massive pulmonary embolism",
      "Constrictive pericarditis"
    ],
    "tileExplanations": [
      "Pericardial fluid compresses the heart, restricting filling.",
      "Rising intrathoracic pressure compresses the vena cava and heart, restricting venous return.",
      "A large clot obstructs right ventricular outflow into the pulmonary circulation.",
      "A rigid, scarred pericardium restricts diastolic filling."
    ],
    "explanation": "Something physically blocks blood from filling the heart or leaving it, while the myocardium and blood volume are initially fine."
  },
  "bank-migrated-sys-pulm-0001-L3": {
    "title": "Causes of a low DLCO"
  },
  "bank-migrated-sys-pulm-0001-L4": {
    "title": "Causes of an increased DLCO",
    "explanation": "Each adds hemoglobin or pulmonary capillary blood available to bind carbon monoxide, raising the measured DLCO.",
    "remember": "DLCO rises with extra blood or hemoglobin to bind CO: hemorrhage, polycythemia, left-to-right shunt, and exercise."
  },
  "bank-migrated-sys-pulm-0002-L1": {
    "tileExplanations": [
      "Elevated hydrostatic pressure pushes fluid into the pleural space.",
      "Ascitic fluid tracks through small diaphragmatic defects into the pleural space (hepatic hydrothorax), helped by low oncotic pressure.",
      "Urinary protein loss lowers oncotic pressure, favoring fluid leakage.",
      "Low oncotic pressure lets fluid leak into the pleural space."
    ]
  },
  "bank-migrated-sys-pulm-0002-L2": {
    "tileExplanations": [
      "Adjacent lung infection inflames the pleura, leaking protein-rich fluid.",
      "Tumor invasion of the pleura increases capillary permeability.",
      "Pleural inflammation from infarction usually produces an exudate, though some are transudates.",
      "Pleural infection provokes an intensely exudative, lymphocyte-rich effusion."
    ]
  },
  "bank-migrated-sys-pulm-0002-L4": {
    "tiles": [
      "Idiopathic pulmonary fibrosis (UIP)",
      "Aspiration pneumonia",
      "Asbestosis",
      "Alpha-1 antitrypsin deficiency emphysema"
    ],
    "tileExplanations": [
      "Classically starts at the lung bases and subpleural regions.",
      "Gravity carries aspirated material into the lower or posterior segments.",
      "Inhaled asbestos fibers cause fibrosis predominantly at the lung bases.",
      "Panacinar emphysema that predominates in the lower lobes, unlike centriacinar smoking emphysema."
    ],
    "explanation": "Each preferentially affects the lower lobes, from gravity-dependent aspiration to the basal fibrosis of IPF and asbestosis and the panacinar emphysema of alpha-1 antitrypsin deficiency.",
    "remember": "Lower-lobe disease: IPF, asbestosis, aspiration, and alpha-1 antitrypsin emphysema. Smoking emphysema and silicosis go up top."
  },
  "bank-migrated-sys-pulm-0003-L1": {
    "explanation": "Each impairs gas exchange within the lung itself (V/Q mismatch, diffusion limitation, or shunt), so alveolar oxygen fails to reach arterial blood.",
    "remember": "A high A-a gradient means the problem is IN the lung: V/Q mismatch, diffusion limitation, or shunt.",
    "tileExplanations": [
      "Ventilated but under-perfused lung creates V/Q mismatch.",
      "Fluid-filled alveoli are perfused but poorly ventilated, mismatching V/Q.",
      "Flooded alveoli act as shunt and low V/Q units.",
      "Deoxygenated blood bypasses ventilated alveoli entirely."
    ]
  },
  "bank-migrated-sys-pulm-0003-L4": {
    "title": "Points along the V/Q ratio spectrum"
  },
  "bank-migrated-sys-renal-0001-L2": {
    "explanation": "Each either loses bicarbonate (GI or renal) or fails to excrete acid, and chloride rises in its place, keeping the anion gap normal.",
    "remember": "Non-anion gap acidosis = bicarbonate lost or acid not excreted, with chloride filling the gap."
  },
  "bank-migrated-sys-renal-0001-L3": {
    "explanation": "Each either removes acid (vomiting), adds alkali (milk-alkali syndrome), or drives renal hydrogen and potassium loss that generates new bicarbonate.",
    "remember": "Metabolic alkalosis: lose acid (vomiting), add alkali (milk-alkali), or push the kidney to make bicarbonate (diuretics, aldosterone excess)."
  },
  "bank-migrated-sys-renal-0002-L4": {
    "tileExplanations": [
      "Antibodies bind uniformly along the glomerular basement membrane in anti-GBM (Goodpasture) disease.",
      "Subepithelial immune deposits create this appearance in membranous nephropathy.",
      "IgA deposits in the mesangium define IgA nephropathy (Berger disease), also seen in IgA vasculitis.",
      "GBM splitting from mesangial interposition and subendothelial deposits in membranoproliferative GN."
    ],
    "remember": "Glomerular pathology is pattern recognition: linear (anti-GBM), spike and dome (membranous), mesangial IgA (IgA nephropathy or IgA vasculitis), tram-track (MPGN)."
  },
  "bank-migrated-sys-renal-0003-L1": {
    "tileExplanations": [
      "Reduced excretory capacity lets potassium accumulate.",
      "Reduced aldosterone activity impairs renal potassium excretion.",
      "Damaged muscle cells release intracellular potassium into the blood.",
      "H+ moves into cells in exchange for K+, a shift most marked in non-anion gap (mineral) acidoses."
    ]
  },
  "bank-migrated-sys-renal-0003-L3": {
    "title": "Diuretic classes by nephron site"
  },
  "bank-migrated-sys-neuro-0002-L3": {
    "title": "The four most common dementias",
    "explanation": "These are the four most common dementias, and each has a distinguishing early feature that helps separate it before advanced disease blurs the picture."
  },
  "bank-migrated-sys-neuro-0002-L4": {
    "title": "Misfolded protein aggregates in neurodegeneration"
  },
  "bank-migrated-sys-pharm-0002-L1": {
    "title": "Indications for beta-blockers"
  },
  "bank-migrated-sys-pharm-0002-L2": {
    "title": "Alpha blockade: uses and effects",
    "tileExplanations": [
      "Relaxes prostatic and bladder neck smooth muscle, easing urinary flow.",
      "This nonselective alpha blocker rapidly vasodilates, as in pheochromocytoma crisis.",
      "Loss of vasoconstrictive tone on standing drops blood pressure.",
      "Vasodilation triggers baroreceptor-mediated compensatory tachycardia."
    ]
  },
  "bank-migrated-sys-pharm-0002-L4": {
    "title": "Drug effects explained by receptor type and location"
  },
  "bank-ext-003": {
    "remember": "Target cells, HALT: HbC disease, Asplenia, Liver disease, Thalassemia."
  },
  "bank-ext-004": {
    "explanation": "Most of these follow from NKCC2 blockade in the thick ascending limb; ototoxicity instead comes from inhibiting the related NKCC1 cotransporter in the inner ear."
  },
  "bank-ext-005": {
    "remember": "Unconjugated = overproduction (hemolysis) or underconjugation (Gilbert, Crigler-Najjar, newborns)."
  },
  "bank-ext-007": {
    "explanation": "Mast cell and basophil degranulation (classically IgE-mediated, type I) releases histamine and other mediators, producing these systemic findings.",
    "remember": "Classic anaphylaxis is type I hypersensitivity. Treat immediately with IM epinephrine."
  },
  "bank-ext-009": {
    "title": "Diseases prevented by the MMRV vaccine",
    "explanation": "Each is a classic childhood viral illness covered by the live attenuated MMRV vaccine; measles, rubella and varicella cause rashes, while mumps causes parotitis rather than an exanthem.",
    "remember": "MMRV = measles, mumps, rubella, varicella: all live attenuated, so avoid in pregnancy and severe immunosuppression."
  },
  "bank-ext-032": {
    "explanation": "Each causes \"atypical\" pneumonia with patchy or interstitial infiltrates and no response to beta-lactams; most are mild \"walking\" pneumonias, but Legionella can be severe."
  },
  "bank-ext-037": {
    "tileExplanations": [
      "The classic association. Screen high-risk ADPKD patients.",
      "Especially the vascular type, where defective type III collagen weakens arterial walls.",
      "A reported but debated association; larger studies have not consistently confirmed it.",
      "Associated with berry aneurysms (and a bicuspid aortic valve)."
    ]
  },
  "bank-ext-051": {
    "explanation": "Each infiltrates or stiffens the myocardium, impairing diastolic filling while systolic function is usually preserved."
  },
  "bank-ext-064": {
    "title": "Mitochondrial disorders",
    "explanation": "Each is a disorder of mitochondrial energy production. MELAS, LHON and MERRF come from mtDNA mutations with maternal inheritance and heteroplasmy, while Leigh syndrome is caused by nuclear gene variants in most cases and by mtDNA in about 20%.",
    "tileExplanations": [
      "Mitochondrial encephalomyopathy, lactic acidosis, stroke-like episodes.",
      "Subacute bilateral central vision loss in young men.",
      "Myoclonic epilepsy with ragged-red fibers.",
      "A subacute necrotizing encephalomyelopathy of infancy, usually from nuclear gene variants."
    ],
    "remember": "Mitochondrial disorders: MELAS, LHON, MERRF (mtDNA, maternal, heteroplasmy) and Leigh (mostly nuclear genes)."
  },
  "bank-ext-065": {
    "title": "Features of normal pressure hydrocephalus"
  },
  "bank-ext-067": {
    "explanation": "Each leaves the epidermis fragile (acantholysis, superficial toxin cleavage, or full-thickness necrosis), so lateral pressure shears the skin. Subepidermal blistering diseases like bullous pemphigoid stay Nikolsky-negative."
  },
  "bank-ext-068": {
    "explanation": "Each has an antiphagocytic polysaccharide capsule, so asplenic patients are at high risk. Pneumococcus, Hib and meningococcus have conjugate vaccines; Klebsiella has none."
  },
  "bank-ext-083": {
    "difficulty": "medium"
  },
  "bank-ext-084": {
    "tileExplanations": [
      "c-ANCA/anti-PR3; upper airway, lung and kidney involvement.",
      "p-ANCA/anti-MPO; kidney and lung without granulomas.",
      "Asthma, eosinophilia and granulomas; p-ANCA is positive in only a minority.",
      "Renal-limited ANCA vasculitis: glomerular crescents with few or no immune deposits."
    ],
    "remember": "ANCA vasculitis (pauci-immune): GPA (c-ANCA), MPA and EGPA (p-ANCA), plus renal-limited crescentic GN."
  },
  "bank-ext-087": {
    "remember": "Paraneoplastic: SIADH, ectopic ACTH, and Lambert-Eaton (small cell lung); PTHrP hypercalcemia (squamous cell)."
  },
  "bank-ext-092": {
    "title": "Hallmark features of PCOS",
    "tileExplanations": [
      "Clinical (hirsutism, acne) or biochemical excess androgens.",
      "Infrequent or absent ovulation causing irregular cycles.",
      "Polycystic ovarian morphology: 20 or more follicles per ovary (or increased ovarian volume) on modern ultrasound.",
      "Not a diagnostic criterion, but a common metabolic driver linking PCOS to type 2 diabetes."
    ],
    "remember": "PCOS = 2 of 3 (hyperandrogenism, oligo-ovulation, polycystic ovaries); insulin resistance is common but not a criterion."
  },
  "bank-ext-099": {
    "tileExplanations": [
      "Long-acting; used for alcohol withdrawal and status epilepticus.",
      "Intermediate-acting; safer in liver disease because it is glucuronidated rather than oxidized.",
      "Intermediate-acting with rapid onset; high abuse potential, used in panic disorder.",
      "Very short-acting; used for procedural sedation."
    ]
  },
  "bank-ext-102": {
    "explanation": "Each supports abstinence or reduced drinking by a different mechanism: blunting reward (naltrexone), restoring glutamate/GABA balance (acamprosate), creating aversion (disulfiram), or dampening glutamate while boosting GABA (topiramate)."
  },
  "bank-ext-103": {
    "explanation": "All are rheumatoid-factor-negative inflammatory arthritides with enthesitis and possible sacroiliitis. HLA-B27 is linked to all, most strongly to ankylosing spondylitis, while psoriatic and enteropathic arthritis often hit peripheral joints too."
  },
  "bank-ext-106": {
    "explanation": "All are inherited progressive muscle-wasting disorders. Duchenne and Becker are dystrophin defects, myotonic dystrophy is a CTG repeat in DMPK, and limb-girdle types involve other muscle proteins."
  },
  "bank-ext-111": {
    "remember": "Blistering: pemphigus vulgaris (desmoglein 3, intraepidermal, Nikolsky+, oral), pemphigus foliaceus (desmoglein 1, superficial, no mucosa), bullous pemphigoid (hemidesmosome, subepidermal, tense), dermatitis herpetiformis (IgA, celiac)."
  },
  "bank-ext-112": {
    "title": "Skin cancers",
    "explanation": "All are skin malignancies linked to UV exposure, ranging from the most common and indolent (BCC) to the most aggressive (melanoma, Merkel cell). Merkel cell carcinoma is also driven by a polyomavirus.",
    "tileExplanations": [
      "Most common; pearly papule with rolled borders and telangiectasias; rarely metastasizes.",
      "Ulcerated or scaly lesion that can arise from actinic keratosis; can metastasize.",
      "Pigmented lesion (ABCDE); prognosis by Breslow depth; high metastatic potential.",
      "Rare, aggressive neuroendocrine tumor linked to UV damage and Merkel cell polyomavirus."
    ]
  },
  "bank-ext-113": {
    "tiles": [
      "Stevens-Johnson syndrome",
      "Toxic epidermal necrolysis",
      "DRESS syndrome",
      "Acute generalized exanthematous pustulosis (AGEP)"
    ],
    "tileExplanations": [
      "Epidermal detachment of <10% of body surface area with mucosal involvement, usually drug-triggered.",
      "The severe end of the SJS spectrum, with detachment of >30% of BSA.",
      "Drug Reaction with Eosinophilia and Systemic Symptoms: rash, fever, eosinophilia and organ (often liver) involvement 2 to 6 weeks after the drug.",
      "Many small sterile non-follicular pustules on red skin with fever and neutrophilia, appearing within days of the drug."
    ],
    "explanation": "These are the severe cutaneous adverse drug reactions (SCARs), each with a distinct picture. SJS and TEN cause epidermal detachment and mucositis, DRESS causes a rash with eosinophilia and internal organ involvement, and AGEP causes sterile pustules with fever and neutrophilia.",
    "remember": "SCARs: SJS (<10% BSA) and TEN (>30% BSA) detach skin, DRESS gives eosinophilia and organ involvement, AGEP gives sterile pustules. Erythema multiforme is separate and mostly HSV-triggered."
  }
}

export const SYSTEM_CORRECTIONS = {
  "sys-mixed-0001#1": {
    "remember": "T8 = vena cava, T10 = esophagus (+vagus), T12 = aorta (+thoracic duct, azygos vein)."
  },
  "sys-mixed-0001#2": {
    "title": "Fetal circulatory structure → adult remnant",
    "explanation": "Fetal circulation uses the umbilical vein plus shunts that bypass the liver and lungs; after birth each closes and persists as a fibrous cord or scar."
  },
  "sys-mixed-0001#3": {
    "explanation": "Each tips the coagulation balance toward clotting: a factor that resists inactivation (factor V Leiden), loss of a natural anticoagulant (protein C deficiency), excess procoagulant (prothrombin G20210A), or an acquired autoantibody (antiphospholipid syndrome)."
  },
  "sys-micro-0001#1": {
    "explanation": "Dimorphic fungi live as mold in the cool environment and convert to a tissue form at body temperature (yeast, or spherules for Coccidioides), and each has its own geographic hotspot.",
    "remember": "Dimorphic = mold in the cold, yeast in the heat (Coccidioides makes spherules instead), and each one has a home region."
  },
  "sys-mixed-0002#1": {
    "explanation": "Inflamed meninges hurt when stretched or jostled, so maneuvers that stretch or move the spinal cord and its coverings reproduce pain or reflex guarding.",
    "remember": "Meningismus signs all work by stretching or jostling irritated meninges one way or another."
  },
  "sys-biochem-0001#1": {
    "explanation": "Disease needs two mutated copies, and a carrier with one working copy is usually healthy. Many are enzyme or channel defects, though sickle cell is a structural hemoglobin mutation rather than an enzyme deficiency.",
    "remember": "AR: both copies must be broken, carriers are usually unaffected, and enzyme deficiencies are the classic (not universal) example."
  },
  "sys-biochem-0001#3": {
    "tileExplanations": [
      "CGG repeat expansion in FMR1 on the X chromosome.",
      "CTG repeat expansion in DMPK; autosomal dominant with anticipation.",
      "GAA repeat expansion in frataxin; autosomal recessive and, unlike the others, does not typically show anticipation.",
      "CAG repeat expansion in the androgen receptor; X-linked spinobulbar muscular atrophy."
    ]
  },
  "sys-hemeonc-0001#1": {
    "explanation": "Each translocation either creates a fusion oncogene (BCR-ABL, PML-RARA) or moves an oncogene next to the immunoglobulin heavy chain locus so it is overexpressed (MYC, BCL2), driving a specific blood cancer.",
    "tileExplanations": [
      "BCR-ABL fusion tyrosine kinase, defines chronic myeloid leukemia.",
      "PML-RARA fusion, defines acute promyelocytic leukemia.",
      "MYC placed next to the IGH locus and overexpressed, classic for Burkitt lymphoma.",
      "BCL2 placed next to the IGH locus and overexpressed, classic for follicular lymphoma."
    ],
    "title": "Translocations that define blood cancers"
  },
  "sys-hemeonc-0001#2": {
    "explanation": "Tumor markers are proteins a cancer sheds into the blood. They are more useful for monitoring treatment response and recurrence than for screening."
  },
  "sys-pharm-0001#2": {
    "title": "Antidotes",
    "explanation": "Each antidote directly counters its toxin's mechanism, either by replenishing what is depleted or by blocking or reversing what is overactive."
  },
  "sys-pharm-0001#3": {
    "tiles": [
      "Ethanol",
      "Phenytoin",
      "Aspirin (high dose)",
      "Theophylline (toxic levels)"
    ],
    "tileExplanations": [
      "Eliminated at a constant rate regardless of concentration.",
      "Follows zero-order kinetics at therapeutic-to-toxic doses.",
      "Switches to zero-order kinetics in overdose.",
      "Hepatic metabolism saturates at toxic levels, so it accumulates quickly."
    ],
    "explanation": "Once the enzyme system handling these drugs is saturated, a constant AMOUNT (not percentage) is cleared per unit time.",
    "remember": "PEA: Phenytoin, Ethanol, Aspirin (in overdose) are the textbook zero-order drugs, and theophylline joins them at toxic levels."
  },
  "sys-mixed-0003#0": {
    "explanation": "Each lets deoxygenated blood reach the systemic circulation, through right-to-left shunting, mixing, or parallel circuits, causing cyanosis.",
    "remember": "Cyanotic heart defects share one theme: deoxygenated blood reaches the body."
  },
  "sys-mixed-0003#1": {
    "tileExplanations": [
      "Derived from the first pharyngeal arch (Meckel's cartilage).",
      "Derived from the second pharyngeal arch (Reichert's cartilage).",
      "Derived from the third pharyngeal arch.",
      "Derived from the fourth pharyngeal arch; the sixth arch forms the cricoid and arytenoid cartilages."
    ],
    "remember": "Pharyngeal arch number maps to a specific bone/cartilage: 1st jaw, 2nd ear (stapes), 3rd hyoid, 4th thyroid cartilage, 6th cricoid/arytenoids."
  },
  "sys-mixed-0003#2": {
    "explanation": "TORCH infections cross the placenta (or, for HSV, are mostly acquired at delivery) and tend to damage the developing brain and eyes, with hearing loss most prominent in CMV and rubella.",
    "tileExplanations": [
      "Congenital infection causing hydrocephalus, diffuse intracranial calcifications, and chorioretinitis.",
      "Congenital infection causing cataracts, sensorineural deafness, and PDA.",
      "Most common congenital infection; periventricular calcifications and sensorineural hearing loss.",
      "Usually acquired during delivery; causes skin vesicles, eye disease, and encephalitis."
    ],
    "remember": "TORCH infections overlap (brain, eyes, hearing), so the distinguishing clue matters: calcification pattern, cataracts, or vesicles."
  },
  "sys-mixed-0003#3": {
    "tiles": [
      "Spina bifida occulta",
      "Anencephaly",
      "Encephalocele",
      "Meningomyelocele"
    ],
    "tileExplanations": [
      "Failure of vertebral arch fusion without herniation of neural tissue, the mildest form.",
      "Failure of the rostral (anterior) neuropore to close, leaving no forebrain or calvarium.",
      "Herniation of brain and meninges through a skull defect, usually occipital.",
      "Herniation of meninges and spinal cord through a vertebral defect."
    ],
    "explanation": "All arise from incomplete closure of the neural tube in the fourth week. Low maternal folate is the classic preventable risk factor, especially for open defects.",
    "remember": "Folic acid before conception cuts the risk of open neural tube defects."
  },
  "sys-cardio-0002#1": {
    "tiles": [
      "Cardiac tamponade",
      "Tension pneumothorax",
      "Massive pulmonary embolism",
      "Constrictive pericarditis"
    ],
    "tileExplanations": [
      "Pericardial fluid compresses the heart, restricting filling.",
      "Rising intrathoracic pressure compresses the vena cava and heart, restricting venous return.",
      "A large clot obstructs right ventricular outflow into the pulmonary circulation.",
      "A rigid, scarred pericardium restricts diastolic filling."
    ],
    "explanation": "Something physically blocks blood from filling the heart or leaving it, while the myocardium and blood volume are initially fine."
  },
  "sys-pulm-0001#2": {
    "title": "Causes of a low DLCO"
  },
  "sys-pulm-0001#3": {
    "title": "Causes of an increased DLCO",
    "explanation": "Each adds hemoglobin or pulmonary capillary blood available to bind carbon monoxide, raising the measured DLCO.",
    "remember": "DLCO rises with extra blood or hemoglobin to bind CO: hemorrhage, polycythemia, left-to-right shunt, and exercise."
  },
  "sys-pulm-0002#0": {
    "tileExplanations": [
      "Elevated hydrostatic pressure pushes fluid into the pleural space.",
      "Ascitic fluid tracks through small diaphragmatic defects into the pleural space (hepatic hydrothorax), helped by low oncotic pressure.",
      "Urinary protein loss lowers oncotic pressure, favoring fluid leakage.",
      "Low oncotic pressure lets fluid leak into the pleural space."
    ]
  },
  "sys-pulm-0002#1": {
    "tileExplanations": [
      "Adjacent lung infection inflames the pleura, leaking protein-rich fluid.",
      "Tumor invasion of the pleura increases capillary permeability.",
      "Pleural inflammation from infarction usually produces an exudate, though some are transudates.",
      "Pleural infection provokes an intensely exudative, lymphocyte-rich effusion."
    ]
  },
  "sys-pulm-0002#3": {
    "tiles": [
      "Idiopathic pulmonary fibrosis (UIP)",
      "Aspiration pneumonia",
      "Asbestosis",
      "Alpha-1 antitrypsin deficiency emphysema"
    ],
    "tileExplanations": [
      "Classically starts at the lung bases and subpleural regions.",
      "Gravity carries aspirated material into the lower or posterior segments.",
      "Inhaled asbestos fibers cause fibrosis predominantly at the lung bases.",
      "Panacinar emphysema that predominates in the lower lobes, unlike centriacinar smoking emphysema."
    ],
    "explanation": "Each preferentially affects the lower lobes, from gravity-dependent aspiration to the basal fibrosis of IPF and asbestosis and the panacinar emphysema of alpha-1 antitrypsin deficiency.",
    "remember": "Lower-lobe disease: IPF, asbestosis, aspiration, and alpha-1 antitrypsin emphysema. Smoking emphysema and silicosis go up top."
  },
  "sys-pulm-0003#0": {
    "explanation": "Each impairs gas exchange within the lung itself (V/Q mismatch, diffusion limitation, or shunt), so alveolar oxygen fails to reach arterial blood.",
    "remember": "A high A-a gradient means the problem is IN the lung: V/Q mismatch, diffusion limitation, or shunt.",
    "tileExplanations": [
      "Ventilated but under-perfused lung creates V/Q mismatch.",
      "Fluid-filled alveoli are perfused but poorly ventilated, mismatching V/Q.",
      "Flooded alveoli act as shunt and low V/Q units.",
      "Deoxygenated blood bypasses ventilated alveoli entirely."
    ]
  },
  "sys-pulm-0003#3": {
    "title": "Points along the V/Q ratio spectrum"
  },
  "sys-renal-0001#1": {
    "explanation": "Each either loses bicarbonate (GI or renal) or fails to excrete acid, and chloride rises in its place, keeping the anion gap normal.",
    "remember": "Non-anion gap acidosis = bicarbonate lost or acid not excreted, with chloride filling the gap."
  },
  "sys-renal-0001#2": {
    "explanation": "Each either removes acid (vomiting), adds alkali (milk-alkali syndrome), or drives renal hydrogen and potassium loss that generates new bicarbonate.",
    "remember": "Metabolic alkalosis: lose acid (vomiting), add alkali (milk-alkali), or push the kidney to make bicarbonate (diuretics, aldosterone excess)."
  },
  "sys-renal-0002#3": {
    "tileExplanations": [
      "Antibodies bind uniformly along the glomerular basement membrane in anti-GBM (Goodpasture) disease.",
      "Subepithelial immune deposits create this appearance in membranous nephropathy.",
      "IgA deposits in the mesangium define IgA nephropathy (Berger disease), also seen in IgA vasculitis.",
      "GBM splitting from mesangial interposition and subendothelial deposits in membranoproliferative GN."
    ],
    "remember": "Glomerular pathology is pattern recognition: linear (anti-GBM), spike and dome (membranous), mesangial IgA (IgA nephropathy or IgA vasculitis), tram-track (MPGN)."
  },
  "sys-renal-0003#0": {
    "tileExplanations": [
      "Reduced excretory capacity lets potassium accumulate.",
      "Reduced aldosterone activity impairs renal potassium excretion.",
      "Damaged muscle cells release intracellular potassium into the blood.",
      "H+ moves into cells in exchange for K+, a shift most marked in non-anion gap (mineral) acidoses."
    ]
  },
  "sys-renal-0003#2": {
    "title": "Diuretic classes by nephron site"
  },
  "sys-neuro-0002#2": {
    "title": "The four most common dementias",
    "explanation": "These are the four most common dementias, and each has a distinguishing early feature that helps separate it before advanced disease blurs the picture."
  },
  "sys-neuro-0002#3": {
    "title": "Misfolded protein aggregates in neurodegeneration"
  },
  "sys-pharm-0002#0": {
    "title": "Indications for beta-blockers"
  },
  "sys-pharm-0002#1": {
    "title": "Alpha blockade: uses and effects",
    "tileExplanations": [
      "Relaxes prostatic and bladder neck smooth muscle, easing urinary flow.",
      "This nonselective alpha blocker rapidly vasodilates, as in pheochromocytoma crisis.",
      "Loss of vasoconstrictive tone on standing drops blood pressure.",
      "Vasodilation triggers baroreceptor-mediated compensatory tachycardia."
    ]
  },
  "sys-pharm-0002#3": {
    "title": "Drug effects explained by receptor type and location"
  }
}

export const DAILY_CORRECTIONS = {
  "daily-0001#3": {
    "tileExplanations": [
      "Non-caseating granulomas, classically pulmonary/hilar.",
      "Caseating granulomas containing acid-fast bacilli.",
      "Non-caseating granulomas anywhere along the GI tract.",
      "Necrotizing granulomas of the respiratory tract, with a pauci-immune glomerulonephritis in the kidney."
    ]
  },
  "daily-0002#2": {
    "explanation": "'Portal' describes the liver's unique blood supply, a vein that carries blood from one capillary bed in the gut to a second one in the liver, plus everything that happens when that system backs up.",
    "tileExplanations": [
      "Elevated pressure in the portal venous system, usually from cirrhosis.",
      "Carries nutrient-rich blood from the gut to the liver.",
      "Branches of the portal vein, hepatic artery, and bile duct running together at the corners of each hepatic lobule.",
      "Mucosal congestion from portal hypertension, causing a 'snakeskin' stomach lining."
    ]
  },
  "daily-0003#1": {
    "title": "Imaging signs named for what they look like",
    "tileExplanations": [
      "Dilated ovarian follicles arranged around the ovary's edge in PCOS.",
      "Alternating stenosis and dilation of the renal artery in fibromuscular dysplasia.",
      "Subpleural cystic airspaces seen in usual interstitial pneumonia/pulmonary fibrosis.",
      "Hazy increased lung density that doesn't hide vessels, seen in Pneumocystis, COVID-19, edema, and early ILD."
    ]
  },
  "daily-0003#3": {
    "tiles": [
      "Lambert-Eaton myasthenic syndrome",
      "SIADH",
      "Ectopic Cushing syndrome",
      "Humoral hypercalcemia of malignancy"
    ]
  }
}

export const NEAR_MISSES = {
  "bank-easy-01": [
    {
      "text": "Hypovolemic shock",
      "why": "Low circulating volume flattens the neck veins, so JVP is low, not high"
    },
    {
      "text": "Early septic shock",
      "why": "Distributive vasodilation pools blood peripherally, so JVP is usually low"
    },
    {
      "text": "Adrenal crisis",
      "why": "Volume depletion and vasodilation lower venous pressure rather than raise it"
    },
    {
      "text": "Hepatojugular reflux",
      "why": "A bedside maneuver that unmasks raised venous pressure; it is a test, not a cause"
    }
  ],
  "bank-easy-02": [
    {
      "text": "Lidocaine",
      "why": "A class IB antiarrhythmic that shortens or does not change the QT interval"
    },
    {
      "text": "Digoxin",
      "why": "Causes scooped ST segments and tends to shorten the QT interval"
    },
    {
      "text": "Penicillins",
      "why": "Beta-lactam antibiotics are not associated with QT prolongation, unlike macrolides and fluoroquinolones"
    },
    {
      "text": "Aminoglycosides",
      "why": "Known for nephrotoxicity and ototoxicity, not QT prolongation"
    }
  ],
  "bank-easy-03": [
    {
      "text": "Tuberculosis",
      "why": "The prototype of caseating (necrotizing) granulomas"
    },
    {
      "text": "Histoplasmosis",
      "why": "An endemic fungus that classically forms caseating granulomas resembling TB"
    },
    {
      "text": "Ulcerative colitis",
      "why": "Mucosal inflammation with crypt abscesses but no granulomas, unlike Crohn disease"
    },
    {
      "text": "Asbestosis",
      "why": "An occupational lung disease causing interstitial fibrosis, not granulomas like berylliosis"
    }
  ],
  "bank-easy-04": [
    {
      "text": "Sarcoidosis",
      "why": "The classic cause of noncaseating granulomas, not an infection"
    },
    {
      "text": "Berylliosis",
      "why": "An occupational hypersensitivity that forms noncaseating granulomas"
    },
    {
      "text": "Crohn disease",
      "why": "Forms noncaseating granulomas in the bowel wall, not infectious necrotizing ones"
    },
    {
      "text": "Pneumocystis pneumonia",
      "why": "Causes a foamy alveolar exudate and interstitial pneumonia, not granulomas"
    }
  ],
  "bank-easy-05": [
    {
      "text": "Rheumatoid arthritis",
      "why": "Seropositive symmetric small-joint arthritis linked to HLA-DR4, not HLA-B27"
    },
    {
      "text": "Behçet disease",
      "why": "A vasculitis with oral and genital ulcers linked to HLA-B51"
    },
    {
      "text": "Gout",
      "why": "Crystal arthritis from monosodium urate, unrelated to HLA-B27"
    },
    {
      "text": "Diffuse idiopathic skeletal hyperostosis",
      "why": "Noninflammatory spinal ligament ossification that mimics AS on X-ray but spares the SI joints and lacks a B27 link"
    }
  ],
  "bank-easy-06": [
    {
      "text": "COPD",
      "why": "Chronic hypoxia without suppuration does not cause clubbing; new clubbing in COPD suggests cancer"
    },
    {
      "text": "Asthma",
      "why": "Obstructive airway disease that does not cause clubbing"
    },
    {
      "text": "Iron deficiency anemia",
      "why": "Causes koilonychia (spoon nails), a different nail finding"
    },
    {
      "text": "Psoriasis",
      "why": "Causes nail pitting and onycholysis, not clubbing"
    }
  ],
  "bank-easy-07": [
    {
      "text": "Loop diuretics",
      "why": "Increase urinary calcium excretion and lower serum calcium, the opposite of thiazides"
    },
    {
      "text": "Hypoparathyroidism",
      "why": "Low PTH causes hypocalcemia"
    },
    {
      "text": "Acute pancreatitis",
      "why": "Saponification of fat in the retroperitoneum causes hypocalcemia"
    },
    {
      "text": "Vitamin D deficiency",
      "why": "Reduces intestinal calcium absorption, causing low or low-normal calcium"
    }
  ],
  "bank-easy-08": [
    {
      "text": "Spironolactone",
      "why": "A potassium-sparing aldosterone antagonist that causes hyperkalemia"
    },
    {
      "text": "ACE inhibitors",
      "why": "Lower aldosterone and can raise serum potassium"
    },
    {
      "text": "Rhabdomyolysis",
      "why": "Muscle breakdown releases intracellular potassium, causing hyperkalemia"
    },
    {
      "text": "Primary adrenal insufficiency",
      "why": "Aldosterone deficiency causes hyperkalemia"
    }
  ],
  "bank-easy-09": [
    {
      "text": "Poststreptococcal glomerulonephritis",
      "why": "A classic nephritic syndrome with hematuria and red cell casts"
    },
    {
      "text": "Anti-GBM disease",
      "why": "Causes crescentic, nephritic-pattern disease with linear IgG deposits"
    },
    {
      "text": "Acute interstitial nephritis",
      "why": "A tubulointerstitial process with WBC casts, not a glomerular nephrotic disease"
    },
    {
      "text": "Acute tubular necrosis",
      "why": "Tubular injury with muddy brown casts, not heavy proteinuria"
    }
  ],
  "bank-easy-10": [
    {
      "text": "Minimal change disease",
      "why": "Classic nephrotic syndrome with bland sediment"
    },
    {
      "text": "Membranous nephropathy",
      "why": "A nephrotic disease from subepithelial deposits, without red cell casts"
    },
    {
      "text": "Renal amyloidosis",
      "why": "Deposits cause nephrotic-range proteinuria, not an active nephritic sediment"
    },
    {
      "text": "Acute tubular necrosis",
      "why": "Tubular injury with muddy brown granular casts, not glomerular inflammation"
    }
  ],
  "bank-easy-11": [
    {
      "text": "Emphysema",
      "why": "Destroys alveolar walls and causes obstruction with a high TLC"
    },
    {
      "text": "Chronic bronchitis",
      "why": "An obstructive disease with a low FEV1/FVC ratio"
    },
    {
      "text": "Asthma",
      "why": "Reversible obstruction with a low FEV1/FVC ratio"
    },
    {
      "text": "Pulmonary embolism",
      "why": "Impairs perfusion and gas exchange but leaves spirometry and lung volumes normal"
    }
  ],
  "bank-easy-12": [
    {
      "text": "Idiopathic pulmonary fibrosis",
      "why": "A restrictive disease with low TLC and a normal or high FEV1/FVC"
    },
    {
      "text": "Asbestosis",
      "why": "Lower-lobe fibrosis causing a restrictive pattern"
    },
    {
      "text": "Kyphoscoliosis",
      "why": "A chest wall deformity causing extrapulmonary restriction"
    },
    {
      "text": "Pulmonary arterial hypertension",
      "why": "A pulmonary vascular disease with essentially normal airflow"
    }
  ],
  "bank-migrated-sys-pulm-0001-L1": [
    {
      "text": "Idiopathic pulmonary fibrosis",
      "why": "A restrictive disease with low TLC and a normal or high FEV1/FVC"
    },
    {
      "text": "Asbestosis",
      "why": "Lower-lobe fibrosis causing a restrictive pattern"
    },
    {
      "text": "Kyphoscoliosis",
      "why": "A chest wall deformity causing extrapulmonary restriction"
    },
    {
      "text": "Pulmonary arterial hypertension",
      "why": "A pulmonary vascular disease with essentially normal airflow"
    }
  ],
  "sys-pulm-0001#0": [
    {
      "text": "Idiopathic pulmonary fibrosis",
      "why": "A restrictive disease with low TLC and a normal or high FEV1/FVC"
    },
    {
      "text": "Asbestosis",
      "why": "Lower-lobe fibrosis causing a restrictive pattern"
    },
    {
      "text": "Kyphoscoliosis",
      "why": "A chest wall deformity causing extrapulmonary restriction"
    },
    {
      "text": "Pulmonary arterial hypertension",
      "why": "A pulmonary vascular disease with essentially normal airflow"
    }
  ],
  "bank-easy-13": [
    {
      "text": "Hypocalcemia",
      "why": "A consequence of severe pancreatitis from fat saponification, not a cause"
    },
    {
      "text": "Isolated hypercholesterolemia",
      "why": "Only very high triglycerides cause pancreatitis, not high cholesterol"
    },
    {
      "text": "Acute cholecystitis",
      "why": "A parallel gallstone complication from cystic duct obstruction, not a cause of pancreatitis"
    },
    {
      "text": "Elevated serum lipase",
      "why": "A diagnostic marker of pancreatitis, not a trigger"
    }
  ],
  "bank-easy-14": [
    {
      "text": "Essential hypertension",
      "why": "Primary hypertension with no single identifiable cause, the opposite of secondary"
    },
    {
      "text": "Primary adrenal insufficiency",
      "why": "Cortisol and aldosterone deficiency cause hypotension"
    },
    {
      "text": "Bartter syndrome",
      "why": "High renin and aldosterone but normal or low blood pressure from salt wasting"
    },
    {
      "text": "White coat hypertension",
      "why": "Office-only elevation from anxiety, not a true identifiable cause"
    }
  ],
  "bank-easy-15": [
    {
      "text": "Ventricular septal defect",
      "why": "A left-to-right shunt that is acyanotic unless it progresses to Eisenmenger syndrome"
    },
    {
      "text": "Atrial septal defect",
      "why": "An acyanotic left-to-right shunt with fixed split S2"
    },
    {
      "text": "Patent ductus arteriosus",
      "why": "An acyanotic left-to-right shunt with a continuous machine-like murmur"
    },
    {
      "text": "Coarctation of the aorta",
      "why": "An obstructive lesion causing upper-extremity hypertension, not cyanosis"
    }
  ],
  "bank-medium-01": [
    {
      "text": "α1 receptor",
      "why": "Couples to Gq, raising IP3 and calcium"
    },
    {
      "text": "α2 receptor",
      "why": "Couples to Gi, lowering cAMP"
    },
    {
      "text": "M3 receptor",
      "why": "Couples to Gq, raising IP3 and calcium"
    },
    {
      "text": "D2 receptor",
      "why": "Couples to Gi, the opposite of the Gs-coupled D1 receptor"
    }
  ],
  "bank-medium-02": [
    {
      "text": "V2 receptor",
      "why": "Couples to Gs in the collecting duct to insert aquaporins"
    },
    {
      "text": "H2 receptor",
      "why": "Couples to Gs to increase gastric acid secretion"
    },
    {
      "text": "M2 receptor",
      "why": "Couples to Gi to slow the heart"
    },
    {
      "text": "β2 receptor",
      "why": "Couples to Gs to relax bronchial smooth muscle"
    }
  ],
  "bank-medium-03": [
    {
      "text": "D1 receptor",
      "why": "Couples to Gs, raising cAMP"
    },
    {
      "text": "M3 receptor",
      "why": "Couples to Gq, raising IP3 and calcium"
    },
    {
      "text": "H2 receptor",
      "why": "Couples to Gs, raising cAMP"
    },
    {
      "text": "V2 receptor",
      "why": "Couples to Gs, raising cAMP"
    }
  ],
  "bank-medium-04": [
    {
      "text": "CN II",
      "why": "The optic nerve passes through the optic canal above the sinus, not through it"
    },
    {
      "text": "CN V3",
      "why": "The mandibular division exits via foramen ovale and never enters the cavernous sinus"
    },
    {
      "text": "CN VII",
      "why": "The facial nerve runs through the internal acoustic meatus and facial canal"
    },
    {
      "text": "CN IX",
      "why": "The glossopharyngeal nerve exits through the jugular foramen"
    }
  ],
  "bank-medium-05": [
    {
      "text": "Ophthalmic artery",
      "why": "The first major branch of the internal carotid, supplying the orbit"
    },
    {
      "text": "Inferior thyroid artery",
      "why": "Arises from the thyrocervical trunk of the subclavian, not the external carotid"
    },
    {
      "text": "Vertebral artery",
      "why": "A branch of the subclavian artery that supplies the posterior brain"
    },
    {
      "text": "Anterior cerebral artery",
      "why": "A terminal branch of the internal carotid supplying the medial frontal lobe"
    }
  ],
  "bank-medium-06": [
    {
      "text": "Adrenal cortex",
      "why": "Derived from mesoderm, unlike the neural crest-derived medulla"
    },
    {
      "text": "Oligodendrocytes",
      "why": "CNS myelinating cells derived from neuroectoderm (neural tube), not neural crest"
    },
    {
      "text": "Microglia",
      "why": "CNS macrophages derived from mesoderm (yolk sac), not neural crest"
    },
    {
      "text": "Thyroid follicular cells",
      "why": "Derived from endoderm of the pharyngeal floor"
    }
  ],
  "bank-medium-07": [
    {
      "text": "Spleen",
      "why": "Develops in the dorsal mesentery of the foregut but is derived from mesoderm"
    },
    {
      "text": "Anterior pituitary",
      "why": "Derived from surface ectoderm (Rathke pouch)"
    },
    {
      "text": "Kidney",
      "why": "Derived from intermediate mesoderm"
    },
    {
      "text": "Adrenal cortex",
      "why": "Derived from mesoderm"
    }
  ],
  "bank-medium-08": [
    {
      "text": "Mitral stenosis",
      "why": "An opening snap followed by a diastolic rumble"
    },
    {
      "text": "Aortic regurgitation",
      "why": "An early diastolic decrescendo murmur"
    },
    {
      "text": "Patent ductus arteriosus",
      "why": "A continuous machine-like murmur through systole and diastole"
    },
    {
      "text": "Tricuspid stenosis",
      "why": "A diastolic rumble at the left lower sternal border"
    }
  ],
  "bank-medium-09": [
    {
      "text": "Aortic stenosis",
      "why": "A crescendo-decrescendo systolic ejection murmur"
    },
    {
      "text": "Mitral regurgitation",
      "why": "A holosystolic murmur radiating to the axilla"
    },
    {
      "text": "Ventricular septal defect",
      "why": "A harsh holosystolic murmur at the left lower sternal border"
    },
    {
      "text": "Pulmonic stenosis",
      "why": "A systolic ejection murmur at the left upper sternal border"
    }
  ],
  "bank-medium-10": [
    {
      "text": "Aortic stenosis",
      "why": "Reduced stroke volume narrows the pulse pressure"
    },
    {
      "text": "Cardiac tamponade",
      "why": "Restricted filling lowers stroke volume and narrows the pulse pressure"
    },
    {
      "text": "Hypovolemic shock",
      "why": "Low stroke volume with vasoconstriction narrows the pulse pressure"
    },
    {
      "text": "Severe systolic heart failure",
      "why": "Low stroke volume narrows the pulse pressure"
    }
  ],
  "bank-medium-11": [
    {
      "text": "Severe LV systolic dysfunction",
      "why": "Classically causes pulsus alternans, not pulsus paradoxus"
    },
    {
      "text": "Aortic stenosis",
      "why": "Causes pulsus parvus et tardus (weak and delayed pulse)"
    },
    {
      "text": "Aortic regurgitation",
      "why": "Causes a bounding or bisferiens pulse and can even mask pulsus paradoxus in tamponade"
    },
    {
      "text": "Hypertrophic cardiomyopathy",
      "why": "Causes a bifid (spike-and-dome) pulse from dynamic outflow obstruction"
    }
  ],
  "bank-medium-12": [
    {
      "text": "IgA nephropathy",
      "why": "Mesangial IgA deposits with normal serum complement"
    },
    {
      "text": "Anti-GBM disease",
      "why": "Antibody against type IV collagen with normal complement"
    },
    {
      "text": "Granulomatosis with polyangiitis",
      "why": "A pauci-immune ANCA vasculitis with normal complement"
    },
    {
      "text": "Minimal change disease",
      "why": "Podocyte injury without immune complexes or low complement"
    }
  ],
  "bank-medium-13": [
    {
      "text": "Corticosteroid therapy",
      "why": "Glucocorticoids cause eosinopenia, not eosinophilia"
    },
    {
      "text": "Bacterial sepsis",
      "why": "Causes neutrophilia with a left shift, and eosinophils typically fall"
    },
    {
      "text": "Infectious mononucleosis",
      "why": "Causes lymphocytosis with atypical lymphocytes"
    },
    {
      "text": "Granulomatosis with polyangiitis",
      "why": "An ANCA vasculitis that, unlike EGPA, lacks asthma and eosinophilia"
    }
  ],
  "bank-medium-14": [
    {
      "text": "Diarrhea",
      "why": "Bicarbonate loss in stool causes a non-anion-gap metabolic acidosis"
    },
    {
      "text": "Acetazolamide",
      "why": "Carbonic anhydrase inhibition causes bicarbonate wasting and metabolic acidosis"
    },
    {
      "text": "Spironolactone",
      "why": "Blocks aldosterone and tends to cause hyperkalemic acidosis"
    },
    {
      "text": "Diabetic ketoacidosis",
      "why": "Ketoacids cause an anion-gap metabolic acidosis"
    }
  ],
  "bank-medium-15": [
    {
      "text": "Amphotericin B",
      "why": "Causes type 1 (distal) RTA with hypokalemia"
    },
    {
      "text": "Fanconi syndrome",
      "why": "Causes type 2 (proximal) RTA with bicarbonate wasting"
    },
    {
      "text": "Sjögren syndrome",
      "why": "A classic cause of type 1 (distal) RTA"
    },
    {
      "text": "Primary hyperaldosteronism",
      "why": "Excess aldosterone causes hypokalemic metabolic alkalosis, the opposite picture"
    }
  ],
  "bank-medium-16": [
    {
      "text": "Hypothyroidism",
      "why": "Lowers metabolic demand and cardiac output"
    },
    {
      "text": "Aortic stenosis",
      "why": "Causes pressure-overload failure with a low or fixed cardiac output"
    },
    {
      "text": "Dilated cardiomyopathy",
      "why": "A classic low-output, reduced-ejection-fraction heart failure"
    },
    {
      "text": "Constrictive pericarditis",
      "why": "Restricts filling and lowers cardiac output"
    }
  ],
  "bank-hard-09": [
    {
      "text": "Strawberry cervix",
      "why": "Punctate cervical hemorrhages in trichomoniasis, but named after a fruit"
    },
    {
      "text": "Apple-core lesion",
      "why": "A circumferential colon cancer on barium enema, but named after a fruit"
    },
    {
      "text": "Cherry angioma",
      "why": "A benign red vascular papule, but named after a fruit"
    },
    {
      "text": "Grape-like vesicles",
      "why": "The cluster-of-grapes look of a complete hydatidiform mole, but named after a fruit"
    }
  ],
  "bank-hard-10": [
    {
      "text": "Bread-and-butter pericarditis",
      "why": "Fibrinous pericarditis named after bread and butter, not a fruit"
    },
    {
      "text": "Anchovy paste aspirate",
      "why": "The brown aspirate of an amebic liver abscess, named after a fish paste"
    },
    {
      "text": "Cottage cheese discharge",
      "why": "Thick white discharge of vaginal candidiasis, named after a cheese"
    },
    {
      "text": "Salmon-colored rash",
      "why": "The evanescent rash of adult-onset Still disease, named after a fish"
    }
  ],
  "bank-expert-03": [
    {
      "text": "Primary hypothyroidism",
      "why": "A failing gland loses feedback, so TSH rises instead of being suppressed"
    },
    {
      "text": "Primary adrenal insufficiency",
      "why": "Low cortisol removes feedback, so ACTH rises"
    },
    {
      "text": "Klinefelter syndrome",
      "why": "Testicular failure removes feedback, so LH and FSH rise"
    },
    {
      "text": "Pseudohypoparathyroidism",
      "why": "PTH is high from end-organ resistance, not suppressed by excess hormone"
    }
  ],
  "bank-expert-05": [
    {
      "text": "Type 1 diabetes mellitus",
      "why": "Autoimmune beta cell loss makes insulin low, not high"
    },
    {
      "text": "Central diabetes insipidus",
      "why": "The pituitary fails to release ADH, so ADH is low"
    },
    {
      "text": "Primary hyperparathyroidism",
      "why": "An adenoma oversecretes PTH autonomously; target tissues respond normally"
    },
    {
      "text": "SIADH",
      "why": "ADH is inappropriately secreted, with intact kidney responsiveness"
    }
  ],
  "bank-expert-06": [
    {
      "text": "Diabetes mellitus",
      "why": "Tracked by HbA1c, which rises as control worsens"
    },
    {
      "text": "Multiple myeloma",
      "why": "Tracked by the M-protein, which rises as disease burden grows"
    },
    {
      "text": "Acromegaly",
      "why": "Tracked by IGF-1, which rises with disease activity"
    },
    {
      "text": "Hypertension",
      "why": "Tracked by blood pressure, which rises as disease worsens"
    }
  ],
  "bank-neuro-01": [
    {
      "text": "Myasthenia gravis",
      "why": "An autoimmune neuromuscular junction disorder with fatigable weakness, not nerve damage"
    },
    {
      "text": "Amyotrophic lateral sclerosis",
      "why": "Degeneration of upper and lower motor neurons without sensory neuropathy"
    },
    {
      "text": "Multiple sclerosis",
      "why": "CNS demyelination, not peripheral nerve disease"
    },
    {
      "text": "Polymyositis",
      "why": "An inflammatory myopathy causing proximal weakness with normal sensation"
    }
  ],
  "bank-neuro-02": [
    {
      "text": "Myasthenia gravis",
      "why": "Fatigable ptosis and diplopia from a neuromuscular junction disorder, not a nerve lesion"
    },
    {
      "text": "Thyroid eye disease",
      "why": "Restricted eye movement from enlarged extraocular muscles, not a nerve lesion"
    },
    {
      "text": "Orbital floor fracture",
      "why": "Limits upgaze by mechanically trapping the inferior rectus, not by nerve injury"
    },
    {
      "text": "Aponeurotic ptosis",
      "why": "Age-related stretching of the levator aponeurosis, with normal nerve supply"
    }
  ],
  "bank-neuro-03": [
    {
      "text": "Guillain-Barré syndrome",
      "why": "An acute peripheral demyelinating polyneuropathy, not a spinal cord lesion"
    },
    {
      "text": "Cauda equina syndrome",
      "why": "Compression of lumbosacral nerve roots below the cord, giving lower motor neuron signs"
    },
    {
      "text": "Lateral medullary syndrome",
      "why": "A brainstem stroke, not a spinal cord lesion"
    },
    {
      "text": "Weber syndrome",
      "why": "A midbrain stroke causing CN III palsy with contralateral hemiparesis"
    }
  ],
  "bank-neuro-04": [
    {
      "text": "Internal capsule lacunar stroke",
      "why": "Damages corticospinal fibers above the decussation, causing contralateral weakness"
    },
    {
      "text": "Spinothalamic tract lesion in the cord",
      "why": "These fibers cross within a level or two of entry, so pain and temperature loss is contralateral"
    },
    {
      "text": "Precentral gyrus lesion",
      "why": "Motor cortex damage causes contralateral weakness"
    },
    {
      "text": "Wallenberg loss of body pain and temperature",
      "why": "The spinothalamic tract has already crossed, so body sensory loss is contralateral"
    }
  ],
  "bank-expert-07": [
    {
      "text": "Kussmaul respirations",
      "why": "The compensatory breathing itself, not the primary problem that triggers it"
    },
    {
      "text": "Secondary polycythemia",
      "why": "The result of compensation for chronic hypoxemia, not a primary disturbance"
    },
    {
      "text": "Dilutional hyponatremia",
      "why": "The secondary lab abnormality produced by ADH release, not the primary problem"
    },
    {
      "text": "Reticulocytosis",
      "why": "The marrow response to blood loss or hemolysis, a compensation rather than the primary disturbance"
    }
  ],
  "bank-migrated-sys-mixed-0001-L1": [
    {
      "text": "Legionnaires' disease",
      "why": "Named after an American Legion convention, not a place."
    },
    {
      "text": "Kawasaki disease",
      "why": "Named after Tomisaku Kawasaki, a person, not the Japanese city."
    },
    {
      "text": "Chagas disease",
      "why": "Named after Carlos Chagas, a person."
    },
    {
      "text": "Hodgkin lymphoma",
      "why": "Named after Thomas Hodgkin, a person."
    }
  ],
  "sys-mixed-0001#0": [
    {
      "text": "Legionnaires' disease",
      "why": "Named after an American Legion convention, not a place."
    },
    {
      "text": "Kawasaki disease",
      "why": "Named after Tomisaku Kawasaki, a person, not the Japanese city."
    },
    {
      "text": "Chagas disease",
      "why": "Named after Carlos Chagas, a person."
    },
    {
      "text": "Hodgkin lymphoma",
      "why": "Named after Thomas Hodgkin, a person."
    }
  ],
  "bank-migrated-sys-mixed-0001-L2": [
    {
      "text": "Superior vena cava",
      "why": "Drains into the right atrium from above and never reaches the diaphragm"
    },
    {
      "text": "Left recurrent laryngeal nerve",
      "why": "Hooks under the aortic arch and ascends to the larynx, staying above the diaphragm"
    },
    {
      "text": "Pulmonary trunk",
      "why": "Leaves the right ventricle for the lungs entirely within the thorax"
    },
    {
      "text": "Brachiocephalic trunk",
      "why": "An aortic arch branch heading up into the neck and arm"
    }
  ],
  "sys-mixed-0001#1": [
    {
      "text": "Superior vena cava",
      "why": "Drains into the right atrium from above and never reaches the diaphragm"
    },
    {
      "text": "Left recurrent laryngeal nerve",
      "why": "Hooks under the aortic arch and ascends to the larynx, staying above the diaphragm"
    },
    {
      "text": "Pulmonary trunk",
      "why": "Leaves the right ventricle for the lungs entirely within the thorax"
    },
    {
      "text": "Brachiocephalic trunk",
      "why": "An aortic arch branch heading up into the neck and arm"
    }
  ],
  "bank-migrated-sys-mixed-0001-L3": [
    {
      "text": "Allantois",
      "why": "Becomes the urachus (median umbilical ligament), but it is not a circulatory structure"
    },
    {
      "text": "Notochord",
      "why": "Becomes the nucleus pulposus, an embryologic remnant outside the circulation"
    },
    {
      "text": "Vitelline duct",
      "why": "Can persist as a Meckel diverticulum, a gut remnant rather than a circulatory one"
    },
    {
      "text": "Ligamentum arteriosum",
      "why": "This is the adult remnant itself, not the fetal structure"
    }
  ],
  "sys-mixed-0001#2": [
    {
      "text": "Allantois",
      "why": "Becomes the urachus (median umbilical ligament), but it is not a circulatory structure"
    },
    {
      "text": "Notochord",
      "why": "Becomes the nucleus pulposus, an embryologic remnant outside the circulation"
    },
    {
      "text": "Vitelline duct",
      "why": "Can persist as a Meckel diverticulum, a gut remnant rather than a circulatory one"
    },
    {
      "text": "Ligamentum arteriosum",
      "why": "This is the adult remnant itself, not the fetal structure"
    }
  ],
  "bank-migrated-sys-mixed-0001-L4": [
    {
      "text": "Hemophilia A",
      "why": "Factor VIII deficiency causing bleeding, not clotting."
    },
    {
      "text": "Von Willebrand disease",
      "why": "The most common inherited bleeding disorder."
    },
    {
      "text": "Vitamin K deficiency",
      "why": "Lowers factors II, VII, IX, and X, causing bleeding."
    },
    {
      "text": "Bernard-Soulier syndrome",
      "why": "GpIb deficiency causing a platelet adhesion bleeding disorder."
    }
  ],
  "sys-mixed-0001#3": [
    {
      "text": "Hemophilia A",
      "why": "Factor VIII deficiency causing bleeding, not clotting."
    },
    {
      "text": "Von Willebrand disease",
      "why": "The most common inherited bleeding disorder."
    },
    {
      "text": "Vitamin K deficiency",
      "why": "Lowers factors II, VII, IX, and X, causing bleeding."
    },
    {
      "text": "Bernard-Soulier syndrome",
      "why": "GpIb deficiency causing a platelet adhesion bleeding disorder."
    }
  ],
  "bank-migrated-sys-micro-0001-L1": [
    {
      "text": "Actinomyces israelii",
      "why": "Looks like Nocardia (branching filaments) but is not acid-fast"
    },
    {
      "text": "Giardia lamblia",
      "why": "A stool protozoan diagnosed by antigen testing or trophozoites, not acid-fast staining"
    },
    {
      "text": "Mycoplasma pneumoniae",
      "why": "Lacks a cell wall, so it does not Gram stain, but it is not acid-fast"
    },
    {
      "text": "Entamoeba histolytica",
      "why": "An intestinal protozoan identified by trophozoites with ingested RBCs, not acid-fast"
    }
  ],
  "sys-micro-0001#0": [
    {
      "text": "Actinomyces israelii",
      "why": "Looks like Nocardia (branching filaments) but is not acid-fast"
    },
    {
      "text": "Giardia lamblia",
      "why": "A stool protozoan diagnosed by antigen testing or trophozoites, not acid-fast staining"
    },
    {
      "text": "Mycoplasma pneumoniae",
      "why": "Lacks a cell wall, so it does not Gram stain, but it is not acid-fast"
    },
    {
      "text": "Entamoeba histolytica",
      "why": "An intestinal protozoan identified by trophozoites with ingested RBCs, not acid-fast"
    }
  ],
  "bank-migrated-sys-micro-0001-L2": [
    {
      "text": "Cryptococcus neoformans",
      "why": "An encapsulated yeast at all temperatures, not dimorphic"
    },
    {
      "text": "Aspergillus fumigatus",
      "why": "A monomorphic mold with acute-angle branching septate hyphae"
    },
    {
      "text": "Mucor",
      "why": "A monomorphic mold with broad, nonseptate, right-angle hyphae"
    },
    {
      "text": "Pneumocystis jirovecii",
      "why": "An atypical fungus seen as cysts on silver stain, not dimorphic"
    }
  ],
  "sys-micro-0001#1": [
    {
      "text": "Cryptococcus neoformans",
      "why": "An encapsulated yeast at all temperatures, not dimorphic"
    },
    {
      "text": "Aspergillus fumigatus",
      "why": "A monomorphic mold with acute-angle branching septate hyphae"
    },
    {
      "text": "Mucor",
      "why": "A monomorphic mold with broad, nonseptate, right-angle hyphae"
    },
    {
      "text": "Pneumocystis jirovecii",
      "why": "An atypical fungus seen as cysts on silver stain, not dimorphic"
    }
  ],
  "bank-migrated-sys-micro-0001-L3": [
    {
      "text": "Campylobacter jejuni",
      "why": "A curved, comma or S-shaped gram-negative rod, not a spirochete"
    },
    {
      "text": "Helicobacter pylori",
      "why": "A spiral-shaped gram-negative rod with flagella, not a spirochete"
    },
    {
      "text": "Vibrio cholerae",
      "why": "A comma-shaped gram-negative rod, not a spirochete"
    },
    {
      "text": "Bartonella henselae",
      "why": "A small gram-negative rod causing cat scratch disease, not a spirochete"
    }
  ],
  "sys-micro-0001#2": [
    {
      "text": "Campylobacter jejuni",
      "why": "A curved, comma or S-shaped gram-negative rod, not a spirochete"
    },
    {
      "text": "Helicobacter pylori",
      "why": "A spiral-shaped gram-negative rod with flagella, not a spirochete"
    },
    {
      "text": "Vibrio cholerae",
      "why": "A comma-shaped gram-negative rod, not a spirochete"
    },
    {
      "text": "Bartonella henselae",
      "why": "A small gram-negative rod causing cat scratch disease, not a spirochete"
    }
  ],
  "bank-migrated-sys-micro-0001-L4": [
    {
      "text": "Listeria monocytogenes",
      "why": "A facultative intracellular organism that grows on standard media"
    },
    {
      "text": "Legionella pneumophila",
      "why": "Facultative intracellular and grows on buffered charcoal yeast extract agar"
    },
    {
      "text": "Salmonella Typhi",
      "why": "A facultative intracellular organism that grows readily in culture"
    },
    {
      "text": "Mycoplasma pneumoniae",
      "why": "Lacks a cell wall but is extracellular and can be cultured on special media"
    }
  ],
  "sys-micro-0001#3": [
    {
      "text": "Listeria monocytogenes",
      "why": "A facultative intracellular organism that grows on standard media"
    },
    {
      "text": "Legionella pneumophila",
      "why": "Facultative intracellular and grows on buffered charcoal yeast extract agar"
    },
    {
      "text": "Salmonella Typhi",
      "why": "A facultative intracellular organism that grows readily in culture"
    },
    {
      "text": "Mycoplasma pneumoniae",
      "why": "Lacks a cell wall but is extracellular and can be cultured on special media"
    }
  ],
  "bank-migrated-sys-mixed-0002-L1": [
    {
      "text": "Murphy's sign",
      "why": "Inspiratory arrest on RUQ palpation in cholecystitis."
    },
    {
      "text": "Cullen's sign",
      "why": "Periumbilical bruising in hemorrhagic pancreatitis."
    },
    {
      "text": "Grey Turner's sign",
      "why": "Flank bruising in retroperitoneal hemorrhage."
    },
    {
      "text": "Kehr's sign",
      "why": "Left shoulder pain from splenic rupture irritating the diaphragm."
    }
  ],
  "sys-mixed-0002#0": [
    {
      "text": "Murphy's sign",
      "why": "Inspiratory arrest on RUQ palpation in cholecystitis."
    },
    {
      "text": "Cullen's sign",
      "why": "Periumbilical bruising in hemorrhagic pancreatitis."
    },
    {
      "text": "Grey Turner's sign",
      "why": "Flank bruising in retroperitoneal hemorrhage."
    },
    {
      "text": "Kehr's sign",
      "why": "Left shoulder pain from splenic rupture irritating the diaphragm."
    }
  ],
  "bank-migrated-sys-mixed-0002-L2": [
    {
      "text": "Lhermitte's sign",
      "why": "Electric shock with neck flexion from cervical cord lesions like MS."
    },
    {
      "text": "Babinski sign",
      "why": "An upper motor neuron sign."
    },
    {
      "text": "Romberg sign",
      "why": "Tests proprioception, not meningeal irritation."
    },
    {
      "text": "Hoffmann's sign",
      "why": "An upper motor neuron sign in the hand."
    }
  ],
  "sys-mixed-0002#1": [
    {
      "text": "Lhermitte's sign",
      "why": "Electric shock with neck flexion from cervical cord lesions like MS."
    },
    {
      "text": "Babinski sign",
      "why": "An upper motor neuron sign."
    },
    {
      "text": "Romberg sign",
      "why": "Tests proprioception, not meningeal irritation."
    },
    {
      "text": "Hoffmann's sign",
      "why": "An upper motor neuron sign in the hand."
    }
  ],
  "bank-migrated-sys-mixed-0002-L3": [
    {
      "text": "Shortened QT interval",
      "why": "Seen in hypercalcemia."
    },
    {
      "text": "Peaked T waves",
      "why": "Seen in hyperkalemia."
    },
    {
      "text": "U waves",
      "why": "Seen in hypokalemia."
    },
    {
      "text": "Hyporeflexia",
      "why": "Seen in hypermagnesemia or hypercalcemia, not hypocalcemia."
    }
  ],
  "sys-mixed-0002#2": [
    {
      "text": "Shortened QT interval",
      "why": "Seen in hypercalcemia."
    },
    {
      "text": "Peaked T waves",
      "why": "Seen in hyperkalemia."
    },
    {
      "text": "U waves",
      "why": "Seen in hypokalemia."
    },
    {
      "text": "Hyporeflexia",
      "why": "Seen in hypermagnesemia or hypercalcemia, not hypocalcemia."
    }
  ],
  "bank-migrated-sys-mixed-0002-L4": [
    {
      "text": "Kussmaul's sign",
      "why": "Classic for constrictive pericarditis and usually absent in tamponade."
    },
    {
      "text": "Pericardial knock",
      "why": "An early diastolic sound in constrictive pericarditis."
    },
    {
      "text": "Pulsus alternans",
      "why": "Alternating pulse strength in severe LV failure."
    },
    {
      "text": "Square root sign",
      "why": "The dip-and-plateau pressure tracing of constrictive or restrictive disease."
    }
  ],
  "sys-mixed-0002#3": [
    {
      "text": "Kussmaul's sign",
      "why": "Classic for constrictive pericarditis and usually absent in tamponade."
    },
    {
      "text": "Pericardial knock",
      "why": "An early diastolic sound in constrictive pericarditis."
    },
    {
      "text": "Pulsus alternans",
      "why": "Alternating pulse strength in severe LV failure."
    },
    {
      "text": "Square root sign",
      "why": "The dip-and-plateau pressure tracing of constrictive or restrictive disease."
    }
  ],
  "bank-migrated-sys-biochem-0001-L1": [
    {
      "text": "Cystic fibrosis",
      "why": "Autosomal recessive CFTR mutation"
    },
    {
      "text": "Duchenne muscular dystrophy",
      "why": "X-linked recessive dystrophin mutation"
    },
    {
      "text": "Sickle cell disease",
      "why": "Autosomal recessive beta-globin point mutation"
    },
    {
      "text": "Wilson disease",
      "why": "Autosomal recessive ATP7B mutation causing copper buildup"
    }
  ],
  "sys-biochem-0001#0": [
    {
      "text": "Cystic fibrosis",
      "why": "Autosomal recessive CFTR mutation"
    },
    {
      "text": "Duchenne muscular dystrophy",
      "why": "X-linked recessive dystrophin mutation"
    },
    {
      "text": "Sickle cell disease",
      "why": "Autosomal recessive beta-globin point mutation"
    },
    {
      "text": "Wilson disease",
      "why": "Autosomal recessive ATP7B mutation causing copper buildup"
    }
  ],
  "bank-migrated-sys-biochem-0001-L2": [
    {
      "text": "Huntington disease",
      "why": "Autosomal dominant; one mutated copy causes disease."
    },
    {
      "text": "Marfan syndrome",
      "why": "Autosomal dominant fibrillin-1 mutation."
    },
    {
      "text": "Duchenne muscular dystrophy",
      "why": "X-linked recessive, not autosomal."
    },
    {
      "text": "Neurofibromatosis type 1",
      "why": "Autosomal dominant NF1 mutation."
    }
  ],
  "sys-biochem-0001#1": [
    {
      "text": "Huntington disease",
      "why": "Autosomal dominant; one mutated copy causes disease."
    },
    {
      "text": "Marfan syndrome",
      "why": "Autosomal dominant fibrillin-1 mutation."
    },
    {
      "text": "Duchenne muscular dystrophy",
      "why": "X-linked recessive, not autosomal."
    },
    {
      "text": "Neurofibromatosis type 1",
      "why": "Autosomal dominant NF1 mutation."
    }
  ],
  "bank-migrated-sys-biochem-0001-L3": [
    {
      "text": "Von Willebrand disease",
      "why": "Usually autosomal dominant, affects both sexes."
    },
    {
      "text": "X-linked hypophosphatemic rickets",
      "why": "X-linked dominant, not recessive."
    },
    {
      "text": "Sickle cell disease",
      "why": "Autosomal recessive beta-globin mutation."
    },
    {
      "text": "Huntington disease",
      "why": "Autosomal dominant CAG repeat disorder."
    }
  ],
  "sys-biochem-0001#2": [
    {
      "text": "Von Willebrand disease",
      "why": "Usually autosomal dominant, affects both sexes."
    },
    {
      "text": "X-linked hypophosphatemic rickets",
      "why": "X-linked dominant, not recessive."
    },
    {
      "text": "Sickle cell disease",
      "why": "Autosomal recessive beta-globin mutation."
    },
    {
      "text": "Huntington disease",
      "why": "Autosomal dominant CAG repeat disorder."
    }
  ],
  "bank-migrated-sys-biochem-0001-L4": [
    {
      "text": "Duchenne muscular dystrophy",
      "why": "Caused by dystrophin deletions, not repeat expansion."
    },
    {
      "text": "Cystic fibrosis",
      "why": "Most often a three-base deletion (F508del), not an expanding repeat."
    },
    {
      "text": "Spinal muscular atrophy",
      "why": "Caused by SMN1 deletion, not a repeat expansion."
    },
    {
      "text": "Marfan syndrome",
      "why": "Caused by FBN1 point mutations."
    }
  ],
  "sys-biochem-0001#3": [
    {
      "text": "Duchenne muscular dystrophy",
      "why": "Caused by dystrophin deletions, not repeat expansion."
    },
    {
      "text": "Cystic fibrosis",
      "why": "Most often a three-base deletion (F508del), not an expanding repeat."
    },
    {
      "text": "Spinal muscular atrophy",
      "why": "Caused by SMN1 deletion, not a repeat expansion."
    },
    {
      "text": "Marfan syndrome",
      "why": "Caused by FBN1 point mutations."
    }
  ],
  "bank-migrated-sys-hemeonc-0001-L1": [
    {
      "text": "Hodgkin lymphoma",
      "why": "A lymphoma defined by Reed-Sternberg cells, not a leukemia."
    },
    {
      "text": "Multiple myeloma",
      "why": "A plasma cell neoplasm, not a leukemia."
    },
    {
      "text": "Polycythemia vera",
      "why": "A myeloproliferative neoplasm driven by JAK2, not a leukemia."
    },
    {
      "text": "Follicular lymphoma",
      "why": "A nodal B-cell lymphoma with t(14;18)."
    }
  ],
  "sys-hemeonc-0001#0": [
    {
      "text": "Hodgkin lymphoma",
      "why": "A lymphoma defined by Reed-Sternberg cells, not a leukemia."
    },
    {
      "text": "Multiple myeloma",
      "why": "A plasma cell neoplasm, not a leukemia."
    },
    {
      "text": "Polycythemia vera",
      "why": "A myeloproliferative neoplasm driven by JAK2, not a leukemia."
    },
    {
      "text": "Follicular lymphoma",
      "why": "A nodal B-cell lymphoma with t(14;18)."
    }
  ],
  "bank-migrated-sys-hemeonc-0001-L2": [
    {
      "text": "JAK2 V617F mutation",
      "why": "A point mutation in polycythemia vera, not a translocation."
    },
    {
      "text": "BRAF V600E in hairy cell leukemia",
      "why": "A point mutation, not a translocation."
    },
    {
      "text": "FLT3 internal tandem duplication in AML",
      "why": "A duplication within one gene, not a translocation."
    },
    {
      "text": "Deletion 13q in CLL",
      "why": "A chromosomal deletion, not a translocation."
    }
  ],
  "sys-hemeonc-0001#1": [
    {
      "text": "JAK2 V617F mutation",
      "why": "A point mutation in polycythemia vera, not a translocation."
    },
    {
      "text": "BRAF V600E in hairy cell leukemia",
      "why": "A point mutation, not a translocation."
    },
    {
      "text": "FLT3 internal tandem duplication in AML",
      "why": "A duplication within one gene, not a translocation."
    },
    {
      "text": "Deletion 13q in CLL",
      "why": "A chromosomal deletion, not a translocation."
    }
  ],
  "bank-migrated-sys-hemeonc-0001-L3": [
    {
      "text": "Troponin",
      "why": "Marker of myocardial injury, not cancer."
    },
    {
      "text": "Lipase",
      "why": "Marker of pancreatitis, not pancreatic cancer."
    },
    {
      "text": "Procalcitonin",
      "why": "Marker of bacterial infection."
    },
    {
      "text": "BNP",
      "why": "Marker of ventricular stretch in heart failure."
    }
  ],
  "sys-hemeonc-0001#2": [
    {
      "text": "Troponin",
      "why": "Marker of myocardial injury, not cancer."
    },
    {
      "text": "Lipase",
      "why": "Marker of pancreatitis, not pancreatic cancer."
    },
    {
      "text": "Procalcitonin",
      "why": "Marker of bacterial infection."
    },
    {
      "text": "BNP",
      "why": "Marker of ventricular stretch in heart failure."
    }
  ],
  "bank-migrated-sys-hemeonc-0001-L4": [
    {
      "text": "Reed-Sternberg cells",
      "why": "Point to Hodgkin lymphoma, not a leukemia."
    },
    {
      "text": "Rouleaux formation",
      "why": "Classic for multiple myeloma."
    },
    {
      "text": "Schistocytes",
      "why": "Point to microangiopathic hemolysis such as TTP or DIC."
    },
    {
      "text": "Teardrop cells",
      "why": "Classic for myelofibrosis."
    }
  ],
  "sys-hemeonc-0001#3": [
    {
      "text": "Reed-Sternberg cells",
      "why": "Point to Hodgkin lymphoma, not a leukemia."
    },
    {
      "text": "Rouleaux formation",
      "why": "Classic for multiple myeloma."
    },
    {
      "text": "Schistocytes",
      "why": "Point to microangiopathic hemolysis such as TTP or DIC."
    },
    {
      "text": "Teardrop cells",
      "why": "Classic for myelofibrosis."
    }
  ],
  "bank-migrated-sys-pharm-0001-L1": [
    {
      "text": "Miosis",
      "why": "Cholinergic or opioid sign; anticholinergics dilate pupils."
    },
    {
      "text": "Diaphoresis",
      "why": "Cholinergic or sympathomimetic; anticholinergic skin is dry."
    },
    {
      "text": "Bradycardia",
      "why": "Cholinergic sign; anticholinergics cause tachycardia."
    },
    {
      "text": "Hyperactive bowel sounds",
      "why": "Cholinergic; anticholinergics cause ileus."
    }
  ],
  "sys-pharm-0001#0": [
    {
      "text": "Miosis",
      "why": "Cholinergic or opioid sign; anticholinergics dilate pupils."
    },
    {
      "text": "Diaphoresis",
      "why": "Cholinergic or sympathomimetic; anticholinergic skin is dry."
    },
    {
      "text": "Bradycardia",
      "why": "Cholinergic sign; anticholinergics cause tachycardia."
    },
    {
      "text": "Hyperactive bowel sounds",
      "why": "Cholinergic; anticholinergics cause ileus."
    }
  ],
  "bank-migrated-sys-pharm-0001-L2": [
    {
      "text": "Haloperidol",
      "why": "Dopamine blocker linked to neuroleptic malignant syndrome instead."
    },
    {
      "text": "Succinylcholine",
      "why": "Triggers malignant hyperthermia, not serotonin syndrome."
    },
    {
      "text": "Benztropine",
      "why": "Anticholinergic with no serotonergic effect."
    },
    {
      "text": "Cyproheptadine",
      "why": "A serotonin antagonist used to treat serotonin syndrome."
    }
  ],
  "sys-pharm-0001#1": [
    {
      "text": "Haloperidol",
      "why": "Dopamine blocker linked to neuroleptic malignant syndrome instead."
    },
    {
      "text": "Succinylcholine",
      "why": "Triggers malignant hyperthermia, not serotonin syndrome."
    },
    {
      "text": "Benztropine",
      "why": "Anticholinergic with no serotonergic effect."
    },
    {
      "text": "Cyproheptadine",
      "why": "A serotonin antagonist used to treat serotonin syndrome."
    }
  ],
  "bank-migrated-sys-pharm-0001-L3": [
    {
      "text": "Scopolamine",
      "why": "An anticholinergic that causes the toxidrome physostigmine reverses."
    },
    {
      "text": "Disulfiram",
      "why": "Inhibits aldehyde dehydrogenase, causing toxicity rather than treating it."
    },
    {
      "text": "Methadone",
      "why": "A long-acting opioid agonist whose overdose naloxone reverses."
    },
    {
      "text": "Isoniazid",
      "why": "Causes seizures in overdose that are treated with pyridoxine."
    }
  ],
  "sys-pharm-0001#2": [
    {
      "text": "Scopolamine",
      "why": "An anticholinergic that causes the toxidrome physostigmine reverses."
    },
    {
      "text": "Disulfiram",
      "why": "Inhibits aldehyde dehydrogenase, causing toxicity rather than treating it."
    },
    {
      "text": "Methadone",
      "why": "A long-acting opioid agonist whose overdose naloxone reverses."
    },
    {
      "text": "Isoniazid",
      "why": "Causes seizures in overdose that are treated with pyridoxine."
    }
  ],
  "bank-migrated-sys-pharm-0001-L4": [
    {
      "text": "Warfarin",
      "why": "Follows first-order elimination."
    },
    {
      "text": "Lithium",
      "why": "Renally cleared with first-order kinetics."
    },
    {
      "text": "Gentamicin",
      "why": "First-order renal elimination at usual doses."
    },
    {
      "text": "Digoxin",
      "why": "Follows first-order kinetics."
    }
  ],
  "sys-pharm-0001#3": [
    {
      "text": "Warfarin",
      "why": "Follows first-order elimination."
    },
    {
      "text": "Lithium",
      "why": "Renally cleared with first-order kinetics."
    },
    {
      "text": "Gentamicin",
      "why": "First-order renal elimination at usual doses."
    },
    {
      "text": "Digoxin",
      "why": "Follows first-order kinetics."
    }
  ],
  "bank-migrated-sys-mixed-0003-L1": [
    {
      "text": "Ventricular septal defect",
      "why": "Left-to-right shunt, acyanotic unless Eisenmenger develops."
    },
    {
      "text": "Atrial septal defect",
      "why": "Left-to-right shunt, acyanotic."
    },
    {
      "text": "Patent ductus arteriosus",
      "why": "Left-to-right shunt, acyanotic at presentation."
    },
    {
      "text": "Coarctation of the aorta",
      "why": "An obstructive lesion, acyanotic."
    }
  ],
  "sys-mixed-0003#0": [
    {
      "text": "Ventricular septal defect",
      "why": "Left-to-right shunt, acyanotic unless Eisenmenger develops."
    },
    {
      "text": "Atrial septal defect",
      "why": "Left-to-right shunt, acyanotic."
    },
    {
      "text": "Patent ductus arteriosus",
      "why": "Left-to-right shunt, acyanotic at presentation."
    },
    {
      "text": "Coarctation of the aorta",
      "why": "An obstructive lesion, acyanotic."
    }
  ],
  "bank-migrated-sys-mixed-0003-L2": [
    {
      "text": "Parathyroid glands",
      "why": "Derived from the 3rd and 4th pharyngeal pouches, not arches."
    },
    {
      "text": "Thymus",
      "why": "Derived from the 3rd pharyngeal pouch."
    },
    {
      "text": "External auditory meatus",
      "why": "Derived from the 1st pharyngeal cleft."
    },
    {
      "text": "Palatine tonsil",
      "why": "Derived from the 2nd pharyngeal pouch."
    }
  ],
  "sys-mixed-0003#1": [
    {
      "text": "Parathyroid glands",
      "why": "Derived from the 3rd and 4th pharyngeal pouches, not arches."
    },
    {
      "text": "Thymus",
      "why": "Derived from the 3rd pharyngeal pouch."
    },
    {
      "text": "External auditory meatus",
      "why": "Derived from the 1st pharyngeal cleft."
    },
    {
      "text": "Palatine tonsil",
      "why": "Derived from the 2nd pharyngeal pouch."
    }
  ],
  "bank-migrated-sys-mixed-0003-L3": [
    {
      "text": "Group B streptococcus",
      "why": "Causes neonatal sepsis and meningitis, not a TORCH congenital syndrome."
    },
    {
      "text": "Neisseria gonorrhoeae ophthalmia neonatorum",
      "why": "Acquired at delivery and limited to the eye; not a TORCH infection."
    },
    {
      "text": "Chlamydia trachomatis neonatal conjunctivitis",
      "why": "Perinatal eye and lung infection, not part of TORCH."
    },
    {
      "text": "E. coli neonatal meningitis",
      "why": "A bacterial perinatal infection, not a TORCH organism."
    }
  ],
  "sys-mixed-0003#2": [
    {
      "text": "Group B streptococcus",
      "why": "Causes neonatal sepsis and meningitis, not a TORCH congenital syndrome."
    },
    {
      "text": "Neisseria gonorrhoeae ophthalmia neonatorum",
      "why": "Acquired at delivery and limited to the eye; not a TORCH infection."
    },
    {
      "text": "Chlamydia trachomatis neonatal conjunctivitis",
      "why": "Perinatal eye and lung infection, not part of TORCH."
    },
    {
      "text": "E. coli neonatal meningitis",
      "why": "A bacterial perinatal infection, not a TORCH organism."
    }
  ],
  "bank-migrated-sys-mixed-0003-L4": [
    {
      "text": "Chiari I malformation",
      "why": "Cerebellar tonsil herniation without a neural tube closure defect."
    },
    {
      "text": "Dandy-Walker malformation",
      "why": "Cerebellar vermis hypoplasia with a cystic 4th ventricle, not a closure defect."
    },
    {
      "text": "Holoprosencephaly",
      "why": "Failure of the forebrain to divide into hemispheres (SHH pathway), not failed tube closure."
    },
    {
      "text": "Syringomyelia",
      "why": "A fluid-filled cavity within the cord, often with Chiari I, not a closure defect."
    }
  ],
  "sys-mixed-0003#3": [
    {
      "text": "Chiari I malformation",
      "why": "Cerebellar tonsil herniation without a neural tube closure defect."
    },
    {
      "text": "Dandy-Walker malformation",
      "why": "Cerebellar vermis hypoplasia with a cystic 4th ventricle, not a closure defect."
    },
    {
      "text": "Holoprosencephaly",
      "why": "Failure of the forebrain to divide into hemispheres (SHH pathway), not failed tube closure."
    },
    {
      "text": "Syringomyelia",
      "why": "A fluid-filled cavity within the cord, often with Chiari I, not a closure defect."
    }
  ],
  "bank-migrated-sys-cardio-0001-L1": [
    {
      "text": "Aortic regurgitation",
      "why": "Early diastolic decrescendo murmur."
    },
    {
      "text": "Mitral stenosis",
      "why": "Diastolic rumble after an opening snap."
    },
    {
      "text": "Patent ductus arteriosus",
      "why": "Continuous machine-like murmur."
    },
    {
      "text": "Pulmonic regurgitation",
      "why": "Diastolic murmur at the left upper sternal border."
    }
  ],
  "sys-cardio-0001#0": [
    {
      "text": "Aortic regurgitation",
      "why": "Early diastolic decrescendo murmur."
    },
    {
      "text": "Mitral stenosis",
      "why": "Diastolic rumble after an opening snap."
    },
    {
      "text": "Patent ductus arteriosus",
      "why": "Continuous machine-like murmur."
    },
    {
      "text": "Pulmonic regurgitation",
      "why": "Diastolic murmur at the left upper sternal border."
    }
  ],
  "bank-migrated-sys-cardio-0001-L2": [
    {
      "text": "Mitral regurgitation",
      "why": "Holosystolic murmur."
    },
    {
      "text": "Aortic stenosis",
      "why": "Crescendo-decrescendo systolic murmur."
    },
    {
      "text": "Hypertrophic cardiomyopathy",
      "why": "Systolic murmur from outflow obstruction."
    },
    {
      "text": "Mitral valve prolapse",
      "why": "Midsystolic click with late systolic murmur."
    }
  ],
  "sys-cardio-0001#1": [
    {
      "text": "Mitral regurgitation",
      "why": "Holosystolic murmur."
    },
    {
      "text": "Aortic stenosis",
      "why": "Crescendo-decrescendo systolic murmur."
    },
    {
      "text": "Hypertrophic cardiomyopathy",
      "why": "Systolic murmur from outflow obstruction."
    },
    {
      "text": "Mitral valve prolapse",
      "why": "Midsystolic click with late systolic murmur."
    }
  ],
  "bank-migrated-sys-cardio-0001-L3": [
    {
      "text": "Mitral regurgitation",
      "why": "Left-sided; louder with expiration, not inspiration."
    },
    {
      "text": "Aortic stenosis",
      "why": "Left-sided; does not augment with inspiration."
    },
    {
      "text": "Hypertrophic cardiomyopathy",
      "why": "Gets louder with Valsalva and standing, not inspiration."
    },
    {
      "text": "Mitral valve prolapse",
      "why": "Click moves earlier with standing or Valsalva; left-sided."
    }
  ],
  "sys-cardio-0001#2": [
    {
      "text": "Mitral regurgitation",
      "why": "Left-sided; louder with expiration, not inspiration."
    },
    {
      "text": "Aortic stenosis",
      "why": "Left-sided; does not augment with inspiration."
    },
    {
      "text": "Hypertrophic cardiomyopathy",
      "why": "Gets louder with Valsalva and standing, not inspiration."
    },
    {
      "text": "Mitral valve prolapse",
      "why": "Click moves earlier with standing or Valsalva; left-sided."
    }
  ],
  "bank-migrated-sys-cardio-0001-L4": [
    {
      "text": "Prolonged QT interval",
      "why": "An interval measurement with many causes, not a named waveform."
    },
    {
      "text": "Left axis deviation",
      "why": "A vector finding with many causes, not a named wave."
    },
    {
      "text": "Low-voltage QRS complexes",
      "why": "A nonspecific amplitude finding seen in effusion, obesity, or COPD."
    },
    {
      "text": "Prolonged PR interval",
      "why": "Defines first-degree AV block; an interval, not a named wave."
    }
  ],
  "sys-cardio-0001#3": [
    {
      "text": "Prolonged QT interval",
      "why": "An interval measurement with many causes, not a named waveform."
    },
    {
      "text": "Left axis deviation",
      "why": "A vector finding with many causes, not a named wave."
    },
    {
      "text": "Low-voltage QRS complexes",
      "why": "A nonspecific amplitude finding seen in effusion, obesity, or COPD."
    },
    {
      "text": "Prolonged PR interval",
      "why": "Defines first-degree AV block; an interval, not a named wave."
    }
  ],
  "bank-migrated-sys-cardio-0002-L1": [
    {
      "text": "Cardiac tamponade",
      "why": "Obstructive shock; the pump is compressed, not failing."
    },
    {
      "text": "Tension pneumothorax",
      "why": "Obstructive shock from impaired venous return."
    },
    {
      "text": "Septic shock",
      "why": "Distributive shock from vasodilation."
    },
    {
      "text": "Hemorrhage",
      "why": "Hypovolemic shock from lost volume."
    }
  ],
  "sys-cardio-0002#0": [
    {
      "text": "Cardiac tamponade",
      "why": "Obstructive shock; the pump is compressed, not failing."
    },
    {
      "text": "Tension pneumothorax",
      "why": "Obstructive shock from impaired venous return."
    },
    {
      "text": "Septic shock",
      "why": "Distributive shock from vasodilation."
    },
    {
      "text": "Hemorrhage",
      "why": "Hypovolemic shock from lost volume."
    }
  ],
  "bank-migrated-sys-cardio-0002-L2": [
    {
      "text": "Massive myocardial infarction",
      "why": "Cardiogenic shock; the pump itself fails."
    },
    {
      "text": "Septic shock",
      "why": "Distributive shock from vasodilation."
    },
    {
      "text": "Anaphylaxis",
      "why": "Distributive shock from mast cell mediators."
    },
    {
      "text": "Hemorrhage",
      "why": "Hypovolemic shock from volume loss."
    }
  ],
  "sys-cardio-0002#1": [
    {
      "text": "Massive myocardial infarction",
      "why": "Cardiogenic shock; the pump itself fails."
    },
    {
      "text": "Septic shock",
      "why": "Distributive shock from vasodilation."
    },
    {
      "text": "Anaphylaxis",
      "why": "Distributive shock from mast cell mediators."
    },
    {
      "text": "Hemorrhage",
      "why": "Hypovolemic shock from volume loss."
    }
  ],
  "bank-migrated-sys-cardio-0002-L3": [
    {
      "text": "Pulmonary arterial hypertension",
      "why": "Pre-capillary disease with a normal wedge pressure."
    },
    {
      "text": "ARDS",
      "why": "Noncardiogenic edema with a typically normal wedge."
    },
    {
      "text": "Massive pulmonary embolism",
      "why": "Raises RV and PA pressures, not left atrial pressure."
    },
    {
      "text": "Tricuspid regurgitation",
      "why": "Raises right atrial pressure, not the wedge."
    }
  ],
  "sys-cardio-0002#2": [
    {
      "text": "Pulmonary arterial hypertension",
      "why": "Pre-capillary disease with a normal wedge pressure."
    },
    {
      "text": "ARDS",
      "why": "Noncardiogenic edema with a typically normal wedge."
    },
    {
      "text": "Massive pulmonary embolism",
      "why": "Raises RV and PA pressures, not left atrial pressure."
    },
    {
      "text": "Tricuspid regurgitation",
      "why": "Raises right atrial pressure, not the wedge."
    }
  ],
  "bank-migrated-sys-cardio-0002-L4": [
    {
      "text": "Aortic stenosis",
      "why": "Classically narrows pulse pressure."
    },
    {
      "text": "Cardiac tamponade",
      "why": "Low stroke volume narrows pulse pressure."
    },
    {
      "text": "Hypovolemic shock",
      "why": "Low stroke volume narrows pulse pressure."
    },
    {
      "text": "Mitral stenosis",
      "why": "Reduced LV filling lowers stroke volume, not widening pulse pressure."
    }
  ],
  "sys-cardio-0002#3": [
    {
      "text": "Aortic stenosis",
      "why": "Classically narrows pulse pressure."
    },
    {
      "text": "Cardiac tamponade",
      "why": "Low stroke volume narrows pulse pressure."
    },
    {
      "text": "Hypovolemic shock",
      "why": "Low stroke volume narrows pulse pressure."
    },
    {
      "text": "Mitral stenosis",
      "why": "Reduced LV filling lowers stroke volume, not widening pulse pressure."
    }
  ],
  "bank-migrated-sys-cardio-0003-L1": [
    {
      "text": "Hyperthyroidism",
      "why": "Causes tachycardia."
    },
    {
      "text": "Atropine",
      "why": "Blocks vagal tone, raising heart rate."
    },
    {
      "text": "Cocaine use",
      "why": "Sympathomimetic, causes tachycardia."
    },
    {
      "text": "Hypovolemia",
      "why": "Triggers reflex tachycardia."
    }
  ],
  "sys-cardio-0003#0": [
    {
      "text": "Hyperthyroidism",
      "why": "Causes tachycardia."
    },
    {
      "text": "Atropine",
      "why": "Blocks vagal tone, raising heart rate."
    },
    {
      "text": "Cocaine use",
      "why": "Sympathomimetic, causes tachycardia."
    },
    {
      "text": "Hypovolemia",
      "why": "Triggers reflex tachycardia."
    }
  ],
  "bank-migrated-sys-cardio-0003-L2": [
    {
      "text": "Ventricular tachycardia",
      "why": "Originates in the ventricles, giving a wide QRS."
    },
    {
      "text": "Torsades de pointes",
      "why": "Polymorphic ventricular tachycardia with wide complexes."
    },
    {
      "text": "Antidromic AVRT in WPW",
      "why": "Conducts down the accessory pathway, giving a wide QRS."
    },
    {
      "text": "Accelerated idioventricular rhythm",
      "why": "Ventricular origin with wide complexes and a rate under 100."
    }
  ],
  "sys-cardio-0003#1": [
    {
      "text": "Ventricular tachycardia",
      "why": "Originates in the ventricles, giving a wide QRS."
    },
    {
      "text": "Torsades de pointes",
      "why": "Polymorphic ventricular tachycardia with wide complexes."
    },
    {
      "text": "Antidromic AVRT in WPW",
      "why": "Conducts down the accessory pathway, giving a wide QRS."
    },
    {
      "text": "Accelerated idioventricular rhythm",
      "why": "Ventricular origin with wide complexes and a rate under 100."
    }
  ],
  "bank-migrated-sys-cardio-0003-L3": [
    {
      "text": "Right bundle branch block",
      "why": "Intraventricular conduction delay, not AV block."
    },
    {
      "text": "Left bundle branch block",
      "why": "Intraventricular conduction delay, not AV block."
    },
    {
      "text": "Sick sinus syndrome",
      "why": "Sinus node dysfunction, not AV conduction failure."
    },
    {
      "text": "Wolff-Parkinson-White syndrome",
      "why": "Accelerated AV conduction via an accessory pathway."
    }
  ],
  "sys-cardio-0003#2": [
    {
      "text": "Right bundle branch block",
      "why": "Intraventricular conduction delay, not AV block."
    },
    {
      "text": "Left bundle branch block",
      "why": "Intraventricular conduction delay, not AV block."
    },
    {
      "text": "Sick sinus syndrome",
      "why": "Sinus node dysfunction, not AV conduction failure."
    },
    {
      "text": "Wolff-Parkinson-White syndrome",
      "why": "Accelerated AV conduction via an accessory pathway."
    }
  ],
  "bank-migrated-sys-cardio-0003-L4": [
    {
      "text": "Hypercalcemia",
      "why": "Shortens the QT interval."
    },
    {
      "text": "Hypermagnesemia",
      "why": "Not a torsades risk; magnesium is the treatment."
    },
    {
      "text": "Lidocaine",
      "why": "Class IB agent that shortens repolarization."
    },
    {
      "text": "Sinus tachycardia",
      "why": "Faster rates shorten QT; pauses and bradycardia are the risk."
    }
  ],
  "sys-cardio-0003#3": [
    {
      "text": "Hypercalcemia",
      "why": "Shortens the QT interval."
    },
    {
      "text": "Hypermagnesemia",
      "why": "Not a torsades risk; magnesium is the treatment."
    },
    {
      "text": "Lidocaine",
      "why": "Class IB agent that shortens repolarization."
    },
    {
      "text": "Sinus tachycardia",
      "why": "Faster rates shorten QT; pauses and bradycardia are the risk."
    }
  ],
  "bank-migrated-sys-pulm-0001-L2": [
    {
      "text": "Emphysema",
      "why": "Obstructive; TLC is increased, not reduced."
    },
    {
      "text": "Asthma",
      "why": "Obstructive with reversible airflow limitation."
    },
    {
      "text": "Chronic bronchitis",
      "why": "Obstructive with a low FEV1/FVC."
    },
    {
      "text": "Bronchiectasis",
      "why": "Obstructive airway disease."
    }
  ],
  "sys-pulm-0001#1": [
    {
      "text": "Emphysema",
      "why": "Obstructive; TLC is increased, not reduced."
    },
    {
      "text": "Asthma",
      "why": "Obstructive with reversible airflow limitation."
    },
    {
      "text": "Chronic bronchitis",
      "why": "Obstructive with a low FEV1/FVC."
    },
    {
      "text": "Bronchiectasis",
      "why": "Obstructive airway disease."
    }
  ],
  "bank-migrated-sys-pulm-0001-L3": [
    {
      "text": "Asthma",
      "why": "DLCO is normal or even high because the alveolar membrane is intact."
    },
    {
      "text": "Chronic bronchitis",
      "why": "An airway disease that usually leaves DLCO normal."
    },
    {
      "text": "Polycythemia",
      "why": "Extra hemoglobin raises DLCO."
    },
    {
      "text": "Diffuse alveolar hemorrhage",
      "why": "Free alveolar blood binds extra CO and raises DLCO."
    }
  ],
  "sys-pulm-0001#2": [
    {
      "text": "Asthma",
      "why": "DLCO is normal or even high because the alveolar membrane is intact."
    },
    {
      "text": "Chronic bronchitis",
      "why": "An airway disease that usually leaves DLCO normal."
    },
    {
      "text": "Polycythemia",
      "why": "Extra hemoglobin raises DLCO."
    },
    {
      "text": "Diffuse alveolar hemorrhage",
      "why": "Free alveolar blood binds extra CO and raises DLCO."
    }
  ],
  "bank-migrated-sys-pulm-0001-L4": [
    {
      "text": "Emphysema",
      "why": "Destroyed alveolar surface lowers DLCO."
    },
    {
      "text": "Anemia",
      "why": "Less hemoglobin lowers DLCO."
    },
    {
      "text": "Pulmonary fibrosis",
      "why": "Thickened membrane lowers DLCO."
    },
    {
      "text": "Chronic pulmonary embolism",
      "why": "Lost capillary bed lowers DLCO."
    }
  ],
  "sys-pulm-0001#3": [
    {
      "text": "Emphysema",
      "why": "Destroyed alveolar surface lowers DLCO."
    },
    {
      "text": "Anemia",
      "why": "Less hemoglobin lowers DLCO."
    },
    {
      "text": "Pulmonary fibrosis",
      "why": "Thickened membrane lowers DLCO."
    },
    {
      "text": "Chronic pulmonary embolism",
      "why": "Lost capillary bed lowers DLCO."
    }
  ],
  "bank-migrated-sys-pulm-0002-L1": [
    {
      "text": "Empyema",
      "why": "Infected pleural fluid is a classic exudate."
    },
    {
      "text": "Acute pancreatitis",
      "why": "Inflammatory, often left-sided exudative effusion."
    },
    {
      "text": "Rheumatoid arthritis",
      "why": "Causes an exudate with very low glucose."
    },
    {
      "text": "Mesothelioma",
      "why": "Pleural malignancy produces an exudate."
    }
  ],
  "sys-pulm-0002#0": [
    {
      "text": "Empyema",
      "why": "Infected pleural fluid is a classic exudate."
    },
    {
      "text": "Acute pancreatitis",
      "why": "Inflammatory, often left-sided exudative effusion."
    },
    {
      "text": "Rheumatoid arthritis",
      "why": "Causes an exudate with very low glucose."
    },
    {
      "text": "Mesothelioma",
      "why": "Pleural malignancy produces an exudate."
    }
  ],
  "bank-migrated-sys-pulm-0002-L2": [
    {
      "text": "Congestive heart failure",
      "why": "Most common transudate."
    },
    {
      "text": "Cirrhosis",
      "why": "Hepatic hydrothorax is a transudate."
    },
    {
      "text": "Nephrotic syndrome",
      "why": "Low oncotic pressure gives a transudate."
    },
    {
      "text": "Peritoneal dialysis",
      "why": "Dialysate leak causes a transudate."
    }
  ],
  "sys-pulm-0002#1": [
    {
      "text": "Congestive heart failure",
      "why": "Most common transudate."
    },
    {
      "text": "Cirrhosis",
      "why": "Hepatic hydrothorax is a transudate."
    },
    {
      "text": "Nephrotic syndrome",
      "why": "Low oncotic pressure gives a transudate."
    },
    {
      "text": "Peritoneal dialysis",
      "why": "Dialysate leak causes a transudate."
    }
  ],
  "bank-migrated-sys-pulm-0002-L3": [
    {
      "text": "Asbestosis",
      "why": "Lower-lobe predominant fibrosis."
    },
    {
      "text": "Idiopathic pulmonary fibrosis",
      "why": "Basal and subpleural predominant."
    },
    {
      "text": "Alpha-1 antitrypsin deficiency emphysema",
      "why": "Panacinar and lower-lobe predominant."
    },
    {
      "text": "Aspiration pneumonia",
      "why": "Favors dependent lower or posterior segments."
    }
  ],
  "sys-pulm-0002#2": [
    {
      "text": "Asbestosis",
      "why": "Lower-lobe predominant fibrosis."
    },
    {
      "text": "Idiopathic pulmonary fibrosis",
      "why": "Basal and subpleural predominant."
    },
    {
      "text": "Alpha-1 antitrypsin deficiency emphysema",
      "why": "Panacinar and lower-lobe predominant."
    },
    {
      "text": "Aspiration pneumonia",
      "why": "Favors dependent lower or posterior segments."
    }
  ],
  "bank-migrated-sys-pulm-0002-L4": [
    {
      "text": "Silicosis",
      "why": "Upper-lobe predominant."
    },
    {
      "text": "Reactivation tuberculosis",
      "why": "Upper-lobe apical disease."
    },
    {
      "text": "Centriacinar emphysema from smoking",
      "why": "Upper-lobe predominant."
    },
    {
      "text": "Pulmonary Langerhans cell histiocytosis",
      "why": "Upper and mid zones, sparing the bases."
    }
  ],
  "sys-pulm-0002#3": [
    {
      "text": "Silicosis",
      "why": "Upper-lobe predominant."
    },
    {
      "text": "Reactivation tuberculosis",
      "why": "Upper-lobe apical disease."
    },
    {
      "text": "Centriacinar emphysema from smoking",
      "why": "Upper-lobe predominant."
    },
    {
      "text": "Pulmonary Langerhans cell histiocytosis",
      "why": "Upper and mid zones, sparing the bases."
    }
  ],
  "bank-migrated-sys-pulm-0003-L1": [
    {
      "text": "Opioid overdose",
      "why": "Pure hypoventilation keeps the A-a gradient normal."
    },
    {
      "text": "High altitude",
      "why": "Low inspired oxygen with a normal A-a gradient."
    },
    {
      "text": "Myasthenic crisis",
      "why": "Respiratory muscle weakness causes hypoventilation with a normal A-a gradient."
    },
    {
      "text": "Obesity hypoventilation syndrome",
      "why": "The classic picture is hypoventilation with a normal A-a gradient."
    }
  ],
  "sys-pulm-0003#0": [
    {
      "text": "Opioid overdose",
      "why": "Pure hypoventilation keeps the A-a gradient normal."
    },
    {
      "text": "High altitude",
      "why": "Low inspired oxygen with a normal A-a gradient."
    },
    {
      "text": "Myasthenic crisis",
      "why": "Respiratory muscle weakness causes hypoventilation with a normal A-a gradient."
    },
    {
      "text": "Obesity hypoventilation syndrome",
      "why": "The classic picture is hypoventilation with a normal A-a gradient."
    }
  ],
  "bank-migrated-sys-pulm-0003-L2": [
    {
      "text": "Pneumonia",
      "why": "Raises the A-a gradient via V/Q mismatch."
    },
    {
      "text": "Pulmonary embolism",
      "why": "Raises the A-a gradient."
    },
    {
      "text": "ARDS",
      "why": "Shunt physiology with a high A-a gradient."
    },
    {
      "text": "Idiopathic pulmonary fibrosis",
      "why": "Raises the A-a gradient."
    }
  ],
  "sys-pulm-0003#1": [
    {
      "text": "Pneumonia",
      "why": "Raises the A-a gradient via V/Q mismatch."
    },
    {
      "text": "Pulmonary embolism",
      "why": "Raises the A-a gradient."
    },
    {
      "text": "ARDS",
      "why": "Shunt physiology with a high A-a gradient."
    },
    {
      "text": "Idiopathic pulmonary fibrosis",
      "why": "Raises the A-a gradient."
    }
  ],
  "bank-migrated-sys-pulm-0003-L3": [
    {
      "text": "Carbon monoxide poisoning",
      "why": "Shifts the curve left."
    },
    {
      "text": "Fetal hemoglobin",
      "why": "Higher oxygen affinity, left shift."
    },
    {
      "text": "Alkalosis",
      "why": "Shifts the curve left."
    },
    {
      "text": "Hypothermia",
      "why": "Shifts the curve left."
    }
  ],
  "sys-pulm-0003#2": [
    {
      "text": "Carbon monoxide poisoning",
      "why": "Shifts the curve left."
    },
    {
      "text": "Fetal hemoglobin",
      "why": "Higher oxygen affinity, left shift."
    },
    {
      "text": "Alkalosis",
      "why": "Shifts the curve left."
    },
    {
      "text": "Hypothermia",
      "why": "Shifts the curve left."
    }
  ],
  "bank-migrated-sys-pulm-0003-L4": [
    {
      "text": "Diffusion limitation",
      "why": "A thickened membrane slows gas transfer regardless of V/Q ratio."
    },
    {
      "text": "Low inspired oxygen at altitude",
      "why": "Lowers alveolar PO2 without describing a V/Q ratio."
    },
    {
      "text": "Carbon monoxide poisoning",
      "why": "Reduces O2 carrying capacity, not a V/Q ratio."
    },
    {
      "text": "Anemia",
      "why": "Lowers O2 content with a normal V/Q distribution."
    }
  ],
  "sys-pulm-0003#3": [
    {
      "text": "Diffusion limitation",
      "why": "A thickened membrane slows gas transfer regardless of V/Q ratio."
    },
    {
      "text": "Low inspired oxygen at altitude",
      "why": "Lowers alveolar PO2 without describing a V/Q ratio."
    },
    {
      "text": "Carbon monoxide poisoning",
      "why": "Reduces O2 carrying capacity, not a V/Q ratio."
    },
    {
      "text": "Anemia",
      "why": "Lowers O2 content with a normal V/Q distribution."
    }
  ],
  "bank-migrated-sys-renal-0001-L1": [
    {
      "text": "Diarrhea",
      "why": "Bicarbonate loss with a normal anion gap."
    },
    {
      "text": "Renal tubular acidosis",
      "why": "Normal anion gap acidosis."
    },
    {
      "text": "Acetazolamide",
      "why": "Normal anion gap acidosis from bicarbonate wasting."
    },
    {
      "text": "Large-volume normal saline",
      "why": "Dilutional hyperchloremic, normal-gap acidosis."
    }
  ],
  "sys-renal-0001#0": [
    {
      "text": "Diarrhea",
      "why": "Bicarbonate loss with a normal anion gap."
    },
    {
      "text": "Renal tubular acidosis",
      "why": "Normal anion gap acidosis."
    },
    {
      "text": "Acetazolamide",
      "why": "Normal anion gap acidosis from bicarbonate wasting."
    },
    {
      "text": "Large-volume normal saline",
      "why": "Dilutional hyperchloremic, normal-gap acidosis."
    }
  ],
  "bank-migrated-sys-renal-0001-L2": [
    {
      "text": "Methanol",
      "why": "Formic acid widens the anion gap."
    },
    {
      "text": "Diabetic ketoacidosis",
      "why": "Ketoacids widen the anion gap."
    },
    {
      "text": "Lactic acidosis",
      "why": "Lactate is an unmeasured anion that widens the gap."
    },
    {
      "text": "Ethylene glycol",
      "why": "Glycolic and oxalic acids widen the anion gap."
    }
  ],
  "sys-renal-0001#1": [
    {
      "text": "Methanol",
      "why": "Formic acid widens the anion gap."
    },
    {
      "text": "Diabetic ketoacidosis",
      "why": "Ketoacids widen the anion gap."
    },
    {
      "text": "Lactic acidosis",
      "why": "Lactate is an unmeasured anion that widens the gap."
    },
    {
      "text": "Ethylene glycol",
      "why": "Glycolic and oxalic acids widen the anion gap."
    }
  ],
  "bank-migrated-sys-renal-0001-L3": [
    {
      "text": "Diarrhea",
      "why": "Bicarbonate loss causes metabolic acidosis."
    },
    {
      "text": "Acetazolamide",
      "why": "Renal bicarbonate wasting causes metabolic acidosis."
    },
    {
      "text": "Spironolactone",
      "why": "Blocks aldosterone, tending toward acidosis and hyperkalemia."
    },
    {
      "text": "Diabetic ketoacidosis",
      "why": "Ketoacids cause an anion gap metabolic acidosis."
    }
  ],
  "sys-renal-0001#2": [
    {
      "text": "Diarrhea",
      "why": "Bicarbonate loss causes metabolic acidosis."
    },
    {
      "text": "Acetazolamide",
      "why": "Renal bicarbonate wasting causes metabolic acidosis."
    },
    {
      "text": "Spironolactone",
      "why": "Blocks aldosterone, tending toward acidosis and hyperkalemia."
    },
    {
      "text": "Diabetic ketoacidosis",
      "why": "Ketoacids cause an anion gap metabolic acidosis."
    }
  ],
  "bank-migrated-sys-renal-0001-L4": [
    {
      "text": "Anxiety hyperventilation",
      "why": "Blows off CO2, causing respiratory alkalosis."
    },
    {
      "text": "High altitude",
      "why": "Hypoxic drive causes respiratory alkalosis."
    },
    {
      "text": "Pregnancy",
      "why": "Progesterone drives respiratory alkalosis."
    },
    {
      "text": "Early salicylate toxicity",
      "why": "Stimulates respiratory center, causing respiratory alkalosis."
    }
  ],
  "sys-renal-0001#3": [
    {
      "text": "Anxiety hyperventilation",
      "why": "Blows off CO2, causing respiratory alkalosis."
    },
    {
      "text": "High altitude",
      "why": "Hypoxic drive causes respiratory alkalosis."
    },
    {
      "text": "Pregnancy",
      "why": "Progesterone drives respiratory alkalosis."
    },
    {
      "text": "Early salicylate toxicity",
      "why": "Stimulates respiratory center, causing respiratory alkalosis."
    }
  ],
  "bank-migrated-sys-renal-0002-L1": [
    {
      "text": "RBC casts",
      "why": "Point to nephritic syndrome."
    },
    {
      "text": "Hypertension with oliguria",
      "why": "Classic nephritic features."
    },
    {
      "text": "Hematuria",
      "why": "Nephritic, not a core nephrotic finding."
    },
    {
      "text": "Low serum C3",
      "why": "Seen in some nephritic diseases, not a defining nephrotic finding."
    }
  ],
  "sys-renal-0002#0": [
    {
      "text": "RBC casts",
      "why": "Point to nephritic syndrome."
    },
    {
      "text": "Hypertension with oliguria",
      "why": "Classic nephritic features."
    },
    {
      "text": "Hematuria",
      "why": "Nephritic, not a core nephrotic finding."
    },
    {
      "text": "Low serum C3",
      "why": "Seen in some nephritic diseases, not a defining nephrotic finding."
    }
  ],
  "bank-migrated-sys-renal-0002-L2": [
    {
      "text": "Proteinuria over 3.5 g/day",
      "why": "Defines nephrotic syndrome."
    },
    {
      "text": "Fatty casts and oval fat bodies",
      "why": "Nephrotic urine finding."
    },
    {
      "text": "Hyperlipidemia",
      "why": "Nephrotic feature."
    },
    {
      "text": "Hypercoagulability",
      "why": "Nephrotic feature from antithrombin loss."
    }
  ],
  "sys-renal-0002#1": [
    {
      "text": "Proteinuria over 3.5 g/day",
      "why": "Defines nephrotic syndrome."
    },
    {
      "text": "Fatty casts and oval fat bodies",
      "why": "Nephrotic urine finding."
    },
    {
      "text": "Hyperlipidemia",
      "why": "Nephrotic feature."
    },
    {
      "text": "Hypercoagulability",
      "why": "Nephrotic feature from antithrombin loss."
    }
  ],
  "bank-migrated-sys-renal-0002-L3": [
    {
      "text": "Minimal change disease",
      "why": "Nephrotic with normal light microscopy, no crescents."
    },
    {
      "text": "Membranous nephropathy",
      "why": "Nephrotic with spike and dome, not crescentic."
    },
    {
      "text": "Focal segmental glomerulosclerosis",
      "why": "Nephrotic with segmental sclerosis."
    },
    {
      "text": "Diabetic nephropathy",
      "why": "Kimmelstiel-Wilson nodules, not crescents."
    }
  ],
  "sys-renal-0002#2": [
    {
      "text": "Minimal change disease",
      "why": "Nephrotic with normal light microscopy, no crescents."
    },
    {
      "text": "Membranous nephropathy",
      "why": "Nephrotic with spike and dome, not crescentic."
    },
    {
      "text": "Focal segmental glomerulosclerosis",
      "why": "Nephrotic with segmental sclerosis."
    },
    {
      "text": "Diabetic nephropathy",
      "why": "Kimmelstiel-Wilson nodules, not crescents."
    }
  ],
  "bank-migrated-sys-renal-0002-L4": [
    {
      "text": "Anti-PLA2R antibodies",
      "why": "A serologic test for membranous nephropathy, not a biopsy pattern."
    },
    {
      "text": "c-ANCA (PR3) positivity",
      "why": "A serologic marker for GPA."
    },
    {
      "text": "Low serum C3",
      "why": "A serum complement level, not microscopy."
    },
    {
      "text": "Anti-GBM antibody titer",
      "why": "A blood test, not a biopsy pattern."
    }
  ],
  "sys-renal-0002#3": [
    {
      "text": "Anti-PLA2R antibodies",
      "why": "A serologic test for membranous nephropathy, not a biopsy pattern."
    },
    {
      "text": "c-ANCA (PR3) positivity",
      "why": "A serologic marker for GPA."
    },
    {
      "text": "Low serum C3",
      "why": "A serum complement level, not microscopy."
    },
    {
      "text": "Anti-GBM antibody titer",
      "why": "A blood test, not a biopsy pattern."
    }
  ],
  "bank-migrated-sys-renal-0003-L1": [
    {
      "text": "Albuterol",
      "why": "Beta-2 agonism shifts potassium into cells."
    },
    {
      "text": "Metabolic alkalosis",
      "why": "Shifts potassium into cells, lowering serum K+."
    },
    {
      "text": "Cushing syndrome",
      "why": "Mineralocorticoid effect of cortisol causes potassium wasting."
    },
    {
      "text": "Refeeding syndrome",
      "why": "Insulin surge drives potassium into cells."
    }
  ],
  "sys-renal-0003#0": [
    {
      "text": "Albuterol",
      "why": "Beta-2 agonism shifts potassium into cells."
    },
    {
      "text": "Metabolic alkalosis",
      "why": "Shifts potassium into cells, lowering serum K+."
    },
    {
      "text": "Cushing syndrome",
      "why": "Mineralocorticoid effect of cortisol causes potassium wasting."
    },
    {
      "text": "Refeeding syndrome",
      "why": "Insulin surge drives potassium into cells."
    }
  ],
  "bank-migrated-sys-renal-0003-L2": [
    {
      "text": "ACE inhibitors",
      "why": "Raise potassium by lowering aldosterone."
    },
    {
      "text": "Spironolactone",
      "why": "Potassium-sparing, causes hyperkalemia."
    },
    {
      "text": "Rhabdomyolysis",
      "why": "Releases intracellular potassium."
    },
    {
      "text": "Succinylcholine",
      "why": "Causes potassium efflux from muscle."
    }
  ],
  "sys-renal-0003#1": [
    {
      "text": "ACE inhibitors",
      "why": "Raise potassium by lowering aldosterone."
    },
    {
      "text": "Spironolactone",
      "why": "Potassium-sparing, causes hyperkalemia."
    },
    {
      "text": "Rhabdomyolysis",
      "why": "Releases intracellular potassium."
    },
    {
      "text": "Succinylcholine",
      "why": "Causes potassium efflux from muscle."
    }
  ],
  "bank-migrated-sys-renal-0003-L3": [
    {
      "text": "Desmopressin",
      "why": "A V2 agonist that concentrates urine, the opposite of a diuretic."
    },
    {
      "text": "Fludrocortisone",
      "why": "A mineralocorticoid that promotes sodium retention."
    },
    {
      "text": "ACE inhibitors",
      "why": "Act on the renin-angiotensin system, not as a nephron-segment diuretic."
    },
    {
      "text": "NSAIDs",
      "why": "Block renal prostaglandins and cause sodium retention."
    }
  ],
  "sys-renal-0003#2": [
    {
      "text": "Desmopressin",
      "why": "A V2 agonist that concentrates urine, the opposite of a diuretic."
    },
    {
      "text": "Fludrocortisone",
      "why": "A mineralocorticoid that promotes sodium retention."
    },
    {
      "text": "ACE inhibitors",
      "why": "Act on the renin-angiotensin system, not as a nephron-segment diuretic."
    },
    {
      "text": "NSAIDs",
      "why": "Block renal prostaglandins and cause sodium retention."
    }
  ],
  "bank-migrated-sys-renal-0003-L4": [
    {
      "text": "Primary polydipsia",
      "why": "Dilute urine with low serum osmolality, neither DI nor SIADH."
    },
    {
      "text": "Cerebral salt wasting",
      "why": "Hypovolemic hyponatremia treated with saline, not water restriction."
    },
    {
      "text": "Hyperglycemic osmotic diuresis",
      "why": "Glucose drives water loss, not an ADH problem."
    },
    {
      "text": "Pseudohyponatremia from hyperlipidemia",
      "why": "A lab artifact with normal serum osmolality."
    }
  ],
  "sys-renal-0003#3": [
    {
      "text": "Primary polydipsia",
      "why": "Dilute urine with low serum osmolality, neither DI nor SIADH."
    },
    {
      "text": "Cerebral salt wasting",
      "why": "Hypovolemic hyponatremia treated with saline, not water restriction."
    },
    {
      "text": "Hyperglycemic osmotic diuresis",
      "why": "Glucose drives water loss, not an ADH problem."
    },
    {
      "text": "Pseudohyponatremia from hyperlipidemia",
      "why": "A lab artifact with normal serum osmolality."
    }
  ],
  "bank-migrated-sys-neuro-0001-L1": [
    {
      "text": "Contralateral leg weakness",
      "why": "ACA territory."
    },
    {
      "text": "Urinary incontinence",
      "why": "ACA territory (medial frontal lobe)."
    },
    {
      "text": "Vertigo with ipsilateral ataxia",
      "why": "Posterior circulation."
    },
    {
      "text": "Homonymous hemianopia with macular sparing",
      "why": "PCA territory."
    }
  ],
  "sys-neuro-0001#0": [
    {
      "text": "Contralateral leg weakness",
      "why": "ACA territory."
    },
    {
      "text": "Urinary incontinence",
      "why": "ACA territory (medial frontal lobe)."
    },
    {
      "text": "Vertigo with ipsilateral ataxia",
      "why": "Posterior circulation."
    },
    {
      "text": "Homonymous hemianopia with macular sparing",
      "why": "PCA territory."
    }
  ],
  "bank-migrated-sys-neuro-0001-L2": [
    {
      "text": "Aphasia",
      "why": "Dominant MCA territory."
    },
    {
      "text": "Contralateral hemineglect",
      "why": "Non-dominant MCA territory."
    },
    {
      "text": "Contralateral face and arm weakness",
      "why": "MCA territory."
    },
    {
      "text": "Homonymous hemianopia with macular sparing",
      "why": "PCA territory."
    }
  ],
  "sys-neuro-0001#1": [
    {
      "text": "Aphasia",
      "why": "Dominant MCA territory."
    },
    {
      "text": "Contralateral hemineglect",
      "why": "Non-dominant MCA territory."
    },
    {
      "text": "Contralateral face and arm weakness",
      "why": "MCA territory."
    },
    {
      "text": "Homonymous hemianopia with macular sparing",
      "why": "PCA territory."
    }
  ],
  "bank-migrated-sys-neuro-0001-L3": [
    {
      "text": "Aphasia",
      "why": "Cortical sign that excludes a lacune."
    },
    {
      "text": "Hemineglect",
      "why": "Cortical sign."
    },
    {
      "text": "Homonymous hemianopia",
      "why": "Usually cortical or radiation involvement, not a classic lacunar syndrome."
    },
    {
      "text": "Lateral medullary (Wallenberg) syndrome",
      "why": "Large vessel (PICA or vertebral) territory."
    }
  ],
  "sys-neuro-0001#2": [
    {
      "text": "Aphasia",
      "why": "Cortical sign that excludes a lacune."
    },
    {
      "text": "Hemineglect",
      "why": "Cortical sign."
    },
    {
      "text": "Homonymous hemianopia",
      "why": "Usually cortical or radiation involvement, not a classic lacunar syndrome."
    },
    {
      "text": "Lateral medullary (Wallenberg) syndrome",
      "why": "Large vessel (PICA or vertebral) territory."
    }
  ],
  "bank-migrated-sys-neuro-0001-L4": [
    {
      "text": "Brown-Séquard syndrome",
      "why": "A hemisection of the spinal cord, not the brainstem."
    },
    {
      "text": "Gerstmann syndrome",
      "why": "Dominant parietal cortex lesion."
    },
    {
      "text": "Anton syndrome",
      "why": "Bilateral occipital cortical blindness with denial."
    },
    {
      "text": "Central cord syndrome",
      "why": "Cervical cord injury with arm-predominant weakness."
    }
  ],
  "sys-neuro-0001#3": [
    {
      "text": "Brown-Séquard syndrome",
      "why": "A hemisection of the spinal cord, not the brainstem."
    },
    {
      "text": "Gerstmann syndrome",
      "why": "Dominant parietal cortex lesion."
    },
    {
      "text": "Anton syndrome",
      "why": "Bilateral occipital cortical blindness with denial."
    },
    {
      "text": "Central cord syndrome",
      "why": "Cervical cord injury with arm-predominant weakness."
    }
  ],
  "bank-migrated-sys-neuro-0002-L1": [
    {
      "text": "Intention tremor",
      "why": "Cerebellar, not parkinsonian."
    },
    {
      "text": "Clasp-knife spasticity",
      "why": "Upper motor neuron sign."
    },
    {
      "text": "Chorea",
      "why": "Hyperkinetic, Huntington-type movement."
    },
    {
      "text": "Babinski sign",
      "why": "Upper motor neuron sign."
    }
  ],
  "sys-neuro-0002#0": [
    {
      "text": "Intention tremor",
      "why": "Cerebellar, not parkinsonian."
    },
    {
      "text": "Clasp-knife spasticity",
      "why": "Upper motor neuron sign."
    },
    {
      "text": "Chorea",
      "why": "Hyperkinetic, Huntington-type movement."
    },
    {
      "text": "Babinski sign",
      "why": "Upper motor neuron sign."
    }
  ],
  "bank-migrated-sys-neuro-0002-L2": [
    {
      "text": "Essential tremor",
      "why": "Action tremor, not chorea."
    },
    {
      "text": "Myasthenia gravis",
      "why": "Neuromuscular junction weakness."
    },
    {
      "text": "Restless legs syndrome",
      "why": "Urge to move, not involuntary chorea."
    },
    {
      "text": "Cerebellar ataxia",
      "why": "Incoordination, not dance-like movements."
    }
  ],
  "sys-neuro-0002#1": [
    {
      "text": "Essential tremor",
      "why": "Action tremor, not chorea."
    },
    {
      "text": "Myasthenia gravis",
      "why": "Neuromuscular junction weakness."
    },
    {
      "text": "Restless legs syndrome",
      "why": "Urge to move, not involuntary chorea."
    },
    {
      "text": "Cerebellar ataxia",
      "why": "Incoordination, not dance-like movements."
    }
  ],
  "bank-migrated-sys-neuro-0002-L3": [
    {
      "text": "Normal pressure hydrocephalus",
      "why": "A reversible cause of dementia, far less common than these four."
    },
    {
      "text": "Creutzfeldt-Jakob disease",
      "why": "A rare prion disease with rapid decline and myoclonus."
    },
    {
      "text": "Delirium",
      "why": "Acute, fluctuating confusion, not a dementia."
    },
    {
      "text": "Depression (pseudodementia)",
      "why": "Mood-related cognitive slowing that improves with treatment."
    }
  ],
  "sys-neuro-0002#2": [
    {
      "text": "Normal pressure hydrocephalus",
      "why": "A reversible cause of dementia, far less common than these four."
    },
    {
      "text": "Creutzfeldt-Jakob disease",
      "why": "A rare prion disease with rapid decline and myoclonus."
    },
    {
      "text": "Delirium",
      "why": "Acute, fluctuating confusion, not a dementia."
    },
    {
      "text": "Depression (pseudodementia)",
      "why": "Mood-related cognitive slowing that improves with treatment."
    }
  ],
  "bank-migrated-sys-neuro-0002-L4": [
    {
      "text": "Myelin basic protein",
      "why": "An autoimmune target in multiple sclerosis, not an aggregating protein."
    },
    {
      "text": "Acetylcholine receptor",
      "why": "The antibody target in myasthenia gravis."
    },
    {
      "text": "Dystrophin",
      "why": "Absent in Duchenne muscular dystrophy, not aggregated."
    },
    {
      "text": "SMN protein",
      "why": "Deficient in spinal muscular atrophy, not aggregated."
    }
  ],
  "sys-neuro-0002#3": [
    {
      "text": "Myelin basic protein",
      "why": "An autoimmune target in multiple sclerosis, not an aggregating protein."
    },
    {
      "text": "Acetylcholine receptor",
      "why": "The antibody target in myasthenia gravis."
    },
    {
      "text": "Dystrophin",
      "why": "Absent in Duchenne muscular dystrophy, not aggregated."
    },
    {
      "text": "SMN protein",
      "why": "Deficient in spinal muscular atrophy, not aggregated."
    }
  ],
  "bank-migrated-sys-pharm-0002-L1": [
    {
      "text": "Acute asthma exacerbation",
      "why": "Beta-blockade can worsen bronchospasm."
    },
    {
      "text": "Prinzmetal angina",
      "why": "Unopposed alpha tone can worsen coronary vasospasm."
    },
    {
      "text": "Acute decompensated heart failure",
      "why": "Starting a beta-blocker can worsen acute pump failure."
    },
    {
      "text": "Second-degree Mobitz II AV block",
      "why": "Beta-blockers can worsen high-grade AV block."
    }
  ],
  "sys-pharm-0002#0": [
    {
      "text": "Acute asthma exacerbation",
      "why": "Beta-blockade can worsen bronchospasm."
    },
    {
      "text": "Prinzmetal angina",
      "why": "Unopposed alpha tone can worsen coronary vasospasm."
    },
    {
      "text": "Acute decompensated heart failure",
      "why": "Starting a beta-blocker can worsen acute pump failure."
    },
    {
      "text": "Second-degree Mobitz II AV block",
      "why": "Beta-blockers can worsen high-grade AV block."
    }
  ],
  "bank-migrated-sys-pharm-0002-L2": [
    {
      "text": "Urinary retention",
      "why": "Alpha-1 blockade relieves outflow obstruction rather than causing retention."
    },
    {
      "text": "Mydriasis",
      "why": "Alpha-1 agonism dilates the pupil; blockade does not."
    },
    {
      "text": "Bradycardia",
      "why": "Vasodilation causes reflex tachycardia instead."
    },
    {
      "text": "Bronchospasm",
      "why": "A beta-2 blockade effect."
    }
  ],
  "sys-pharm-0002#1": [
    {
      "text": "Urinary retention",
      "why": "Alpha-1 blockade relieves outflow obstruction rather than causing retention."
    },
    {
      "text": "Mydriasis",
      "why": "Alpha-1 agonism dilates the pupil; blockade does not."
    },
    {
      "text": "Bradycardia",
      "why": "Vasodilation causes reflex tachycardia instead."
    },
    {
      "text": "Bronchospasm",
      "why": "A beta-2 blockade effect."
    }
  ],
  "bank-migrated-sys-pharm-0002-L3": [
    {
      "text": "Miosis",
      "why": "Muscarinic agonist effect."
    },
    {
      "text": "Bronchoconstriction",
      "why": "Muscarinic agonist effect."
    },
    {
      "text": "Diarrhea",
      "why": "Muscarinic agonist effect."
    },
    {
      "text": "Bradycardia",
      "why": "Muscarinic agonist effect."
    }
  ],
  "sys-pharm-0002#2": [
    {
      "text": "Miosis",
      "why": "Muscarinic agonist effect."
    },
    {
      "text": "Bronchoconstriction",
      "why": "Muscarinic agonist effect."
    },
    {
      "text": "Diarrhea",
      "why": "Muscarinic agonist effect."
    },
    {
      "text": "Bradycardia",
      "why": "Muscarinic agonist effect."
    }
  ],
  "bank-migrated-sys-pharm-0002-L4": [
    {
      "text": "Acetaminophen hepatotoxicity",
      "why": "Caused by the toxic metabolite NAPQI, not a receptor."
    },
    {
      "text": "Aminoglycoside nephrotoxicity",
      "why": "Direct proximal tubule toxicity."
    },
    {
      "text": "Warfarin skin necrosis",
      "why": "Early protein C depletion, not a receptor effect."
    },
    {
      "text": "Penicillin anaphylaxis",
      "why": "IgE-mediated hypersensitivity."
    }
  ],
  "sys-pharm-0002#3": [
    {
      "text": "Acetaminophen hepatotoxicity",
      "why": "Caused by the toxic metabolite NAPQI, not a receptor."
    },
    {
      "text": "Aminoglycoside nephrotoxicity",
      "why": "Direct proximal tubule toxicity."
    },
    {
      "text": "Warfarin skin necrosis",
      "why": "Early protein C depletion, not a receptor effect."
    },
    {
      "text": "Penicillin anaphylaxis",
      "why": "IgE-mediated hypersensitivity."
    }
  ],
  "bank-ext-001": [
    {
      "text": "Vitamin B12",
      "why": "Water-soluble, though stored in the liver for years."
    },
    {
      "text": "Vitamin C",
      "why": "Water-soluble antioxidant."
    },
    {
      "text": "Folate",
      "why": "Water-soluble B vitamin."
    },
    {
      "text": "Thiamine",
      "why": "Water-soluble vitamin B1."
    }
  ],
  "bank-ext-002": [
    {
      "text": "Recombinant zoster vaccine (Shingrix)",
      "why": "Recombinant subunit, not live."
    },
    {
      "text": "Injectable influenza vaccine",
      "why": "Inactivated."
    },
    {
      "text": "HPV vaccine",
      "why": "Recombinant virus-like particles."
    },
    {
      "text": "Inactivated polio vaccine",
      "why": "Killed virus; oral polio is the live one."
    }
  ],
  "bank-ext-003": [
    {
      "text": "Hereditary spherocytosis",
      "why": "Spherocytes, which have too little membrane."
    },
    {
      "text": "G6PD deficiency",
      "why": "Bite cells and Heinz bodies."
    },
    {
      "text": "Myelofibrosis",
      "why": "Teardrop cells."
    },
    {
      "text": "Lead poisoning",
      "why": "Basophilic stippling."
    }
  ],
  "bank-ext-004": [
    {
      "text": "Hyperkalemia",
      "why": "Loops waste potassium; hyperkalemia points to potassium-sparing diuretics like spironolactone."
    },
    {
      "text": "Hypercalcemia",
      "why": "Thiazides raise serum calcium; loops increase urinary calcium loss."
    },
    {
      "text": "Normal anion gap metabolic acidosis",
      "why": "Classic for acetazolamide, not loops, which cause alkalosis."
    },
    {
      "text": "Gynecomastia",
      "why": "An antiandrogen effect of spironolactone, not loop diuretics."
    }
  ],
  "bank-ext-005": [
    {
      "text": "Dubin-Johnson syndrome",
      "why": "Defective canalicular excretion causes conjugated hyperbilirubinemia with a black liver."
    },
    {
      "text": "Rotor syndrome",
      "why": "A benign conjugated hyperbilirubinemia, not unconjugated."
    },
    {
      "text": "Biliary atresia",
      "why": "Obstructed bile flow in infants raises conjugated bilirubin."
    },
    {
      "text": "Choledocholithiasis",
      "why": "Bile duct obstruction causes conjugated (direct) hyperbilirubinemia."
    }
  ],
  "bank-ext-006": [
    {
      "text": "Vancomycin",
      "why": "Known for an infusion-related flushing reaction, not photosensitivity."
    },
    {
      "text": "Ampicillin",
      "why": "Causes a maculopapular rash when given in EBV infection, not a sun-triggered rash."
    },
    {
      "text": "Bleomycin",
      "why": "Causes flagellate hyperpigmentation and pulmonary fibrosis, not classic photosensitivity."
    },
    {
      "text": "Warfarin",
      "why": "Causes skin necrosis early in therapy, not photosensitivity."
    }
  ],
  "bank-ext-007": [
    {
      "text": "Hypertension",
      "why": "Anaphylaxis causes vasodilation and hypotension"
    },
    {
      "text": "Peripheral eosinophilia",
      "why": "Points to parasites, DRESS or allergic disease over time, not acute anaphylaxis"
    },
    {
      "text": "Petechial rash",
      "why": "Suggests platelet or vascular disorders, not mast cell degranulation"
    },
    {
      "text": "High fever",
      "why": "Not a feature of anaphylaxis; suggests infection or other drug reactions"
    }
  ],
  "bank-ext-008": [
    {
      "text": "Swan neck deformity",
      "why": "A rheumatoid arthritis finding from inflammatory tendon and ligament damage."
    },
    {
      "text": "Marginal erosions",
      "why": "Inflammatory pannus erosions typical of RA, not OA."
    },
    {
      "text": "Juxta-articular osteopenia",
      "why": "An early RA radiographic finding; OA shows subchondral sclerosis instead."
    },
    {
      "text": "Morning stiffness lasting over an hour",
      "why": "Suggests inflammatory arthritis; OA stiffness is brief and worse with use."
    }
  ],
  "bank-ext-009": [
    {
      "text": "Roseola",
      "why": "HHV-6 high fever then rash; no vaccine exists."
    },
    {
      "text": "Erythema infectiosum",
      "why": "Parvovirus B19 \"slapped cheek\" rash; no vaccine exists."
    },
    {
      "text": "Hand-foot-and-mouth disease",
      "why": "Coxsackievirus A infection without a routine vaccine."
    },
    {
      "text": "Scarlet fever",
      "why": "A group A strep toxin-mediated rash, treated with penicillin and not vaccine-preventable."
    }
  ],
  "bank-ext-020": [
    {
      "text": "Amlodipine",
      "why": "A dihydropyridine CCB that acts on vascular smooth muscle with little AV nodal effect."
    },
    {
      "text": "Atropine",
      "why": "A muscarinic antagonist that speeds AV nodal conduction."
    },
    {
      "text": "Hydralazine",
      "why": "An arteriolar vasodilator that causes reflex tachycardia, not nodal slowing."
    },
    {
      "text": "Isoproterenol",
      "why": "A beta agonist that increases heart rate and AV conduction."
    }
  ],
  "bank-ext-021": [
    {
      "text": "Cataplexy",
      "why": "Emotion-triggered loss of muscle tone is specific to narcolepsy type 1."
    },
    {
      "text": "Cheyne-Stokes respiration",
      "why": "A central sleep apnea pattern seen with heart failure, not upper airway collapse."
    },
    {
      "text": "Anemia",
      "why": "OSA tends to cause secondary polycythemia from chronic hypoxia, not anemia."
    },
    {
      "text": "Restless legs syndrome",
      "why": "An urge to move the legs linked to iron deficiency, not airway obstruction."
    }
  ],
  "bank-ext-022": [
    {
      "text": "Craniopharyngioma",
      "why": "Damages the hypothalamus or pituitary stalk, causing central DI."
    },
    {
      "text": "Carbamazepine",
      "why": "Associated with SIADH, the opposite of a blunted ADH response."
    },
    {
      "text": "Psychogenic polydipsia",
      "why": "Excess water intake with intact ADH response; urine concentrates with water restriction."
    },
    {
      "text": "Desmopressin",
      "why": "An ADH analog that treats central DI rather than causing nephrogenic DI."
    }
  ],
  "bank-ext-023": [
    {
      "text": "Left-sided valvular disease",
      "why": "The lungs inactivate serotonin, so left heart valves are usually spared."
    },
    {
      "text": "Hypoglycemia",
      "why": "A feature of insulinoma, not carcinoid syndrome."
    },
    {
      "text": "Necrolytic migratory erythema",
      "why": "The classic rash of glucagonoma."
    },
    {
      "text": "Achlorhydria",
      "why": "Part of the VIPoma picture (watery diarrhea, hypokalemia, achlorhydria)."
    }
  ],
  "bank-ext-024": [
    {
      "text": "Gynecomastia",
      "why": "Results from reduced estrogen clearance in liver failure, not raised portal pressure."
    },
    {
      "text": "Spider angiomata",
      "why": "Caused by hyperestrogenism of cirrhosis rather than portal hypertension."
    },
    {
      "text": "Palmar erythema",
      "why": "Another estrogen-related sign of liver dysfunction."
    },
    {
      "text": "Coagulopathy",
      "why": "Reflects reduced hepatic synthesis of clotting factors, not portal pressure."
    }
  ],
  "bank-ext-025": [
    {
      "text": "Hypoglycemia",
      "why": "Cortisol excess causes hyperglycemia; hypoglycemia fits adrenal insufficiency."
    },
    {
      "text": "Hyperkalemia",
      "why": "Cushing tends toward hypokalemia from mineralocorticoid effects."
    },
    {
      "text": "Exophthalmos",
      "why": "A sign of Graves disease, not cortisol excess."
    },
    {
      "text": "Unintentional weight loss",
      "why": "Cushing causes weight gain with central fat redistribution."
    }
  ],
  "bank-ext-026": [
    {
      "text": "Hypokalemia",
      "why": "Aldosterone deficiency causes hyperkalemia; hypokalemia suggests aldosterone excess."
    },
    {
      "text": "Hypertension",
      "why": "Addison disease causes hypotension; hypertension fits Conn or Cushing."
    },
    {
      "text": "Hyperglycemia",
      "why": "Cortisol deficiency causes hypoglycemia."
    },
    {
      "text": "Metabolic alkalosis",
      "why": "Aldosterone loss causes a non-anion gap metabolic acidosis instead."
    }
  ],
  "bank-ext-027": [
    {
      "text": "Hereditary spherocytosis",
      "why": "A normocytic hemolytic anemia with high MCHC, not a hemoglobin synthesis defect."
    },
    {
      "text": "Vitamin B12 deficiency",
      "why": "Impaired DNA synthesis causes macrocytic, megaloblastic anemia."
    },
    {
      "text": "Aplastic anemia",
      "why": "Marrow failure gives a normocytic anemia with pancytopenia."
    },
    {
      "text": "Acute blood loss",
      "why": "Causes a normocytic anemia early on."
    }
  ],
  "bank-ext-028": [
    {
      "text": "Iron deficiency",
      "why": "The classic microcytic anemia."
    },
    {
      "text": "Lead poisoning",
      "why": "Inhibits heme synthesis, causing microcytic anemia with basophilic stippling."
    },
    {
      "text": "Beta-thalassemia minor",
      "why": "Reduced globin synthesis gives microcytosis."
    },
    {
      "text": "Anemia of chronic kidney disease",
      "why": "Low erythropoietin causes a normocytic anemia."
    }
  ],
  "bank-ext-029": [
    {
      "text": "Lead-pipe rigidity",
      "why": "The hallmark of neuroleptic malignant syndrome, not serotonin syndrome."
    },
    {
      "text": "Bradykinesia",
      "why": "A parkinsonian sign from dopamine blockade, not serotonin excess."
    },
    {
      "text": "Dry skin",
      "why": "Points to anticholinergic toxicity; serotonin syndrome causes diaphoresis."
    },
    {
      "text": "Hyporeflexia",
      "why": "Serotonin syndrome causes hyperreflexia."
    }
  ],
  "bank-ext-030": [
    {
      "text": "Inducible clonus",
      "why": "The hallmark of serotonin syndrome, not NMS."
    },
    {
      "text": "Hyperreflexia",
      "why": "Typical of serotonin syndrome; NMS reflexes are normal or reduced."
    },
    {
      "text": "Hyperactive bowel sounds",
      "why": "Serotonin excess drives GI hypermotility; NMS does not."
    },
    {
      "text": "Hypothermia",
      "why": "NMS causes high fever, not low body temperature."
    }
  ],
  "bank-ext-031": [
    {
      "text": "Treponema pallidum",
      "why": "Tertiary syphilis causes aortitis and aortic regurgitation, not valve vegetations."
    },
    {
      "text": "Clostridioides difficile",
      "why": "Causes antibiotic-associated colitis, not endocarditis."
    },
    {
      "text": "Helicobacter pylori",
      "why": "Causes gastritis and peptic ulcers, not endocarditis."
    },
    {
      "text": "Mycoplasma pneumoniae",
      "why": "Causes atypical pneumonia; lacking a cell wall, it is not a valve pathogen."
    }
  ],
  "bank-ext-032": [
    {
      "text": "Streptococcus pneumoniae",
      "why": "The classic typical lobar pneumonia that responds to beta-lactams."
    },
    {
      "text": "Klebsiella pneumoniae",
      "why": "Typical lobar pneumonia with \"currant jelly\" sputum in alcoholics."
    },
    {
      "text": "Staphylococcus aureus",
      "why": "Causes typical, often cavitary pneumonia, classically after influenza."
    },
    {
      "text": "Haemophilus influenzae",
      "why": "A typical pneumonia pathogen, common in COPD exacerbations."
    }
  ],
  "bank-ext-033": [
    {
      "text": "Tetracycline",
      "why": "Causes tooth discoloration in children, not gum overgrowth."
    },
    {
      "text": "Lisinopril",
      "why": "ACE inhibitors cause angioedema and cough, not gingival hyperplasia."
    },
    {
      "text": "Hydralazine",
      "why": "Known for drug-induced lupus, not gingival hyperplasia."
    },
    {
      "text": "Methotrexate",
      "why": "Causes oral mucositis and ulcers rather than gum overgrowth."
    }
  ],
  "bank-ext-034": [
    {
      "text": "Fasciculations",
      "why": "Spontaneous motor unit firing indicates lower motor neuron disease."
    },
    {
      "text": "Hyporeflexia",
      "why": "Reduced reflexes point to an LMN lesion."
    },
    {
      "text": "Cogwheel rigidity",
      "why": "A basal ganglia (parkinsonian) sign, not a pyramidal tract sign."
    },
    {
      "text": "Intention tremor",
      "why": "A cerebellar sign, not an upper motor neuron sign."
    }
  ],
  "bank-ext-035": [
    {
      "text": "Babinski sign",
      "why": "An extensor plantar response indicates an upper motor neuron lesion."
    },
    {
      "text": "Clonus",
      "why": "Sustained rhythmic contractions reflect UMN disinhibition."
    },
    {
      "text": "Lead-pipe rigidity",
      "why": "An extrapyramidal sign, not denervation."
    },
    {
      "text": "Dysdiadochokinesia",
      "why": "Impaired rapid alternating movements indicate cerebellar disease."
    }
  ],
  "bank-ext-036": [
    {
      "text": "Lyme disease",
      "why": "Causes erythema migrans, an expanding target-like rash, not erythema nodosum."
    },
    {
      "text": "Celiac disease",
      "why": "Linked to dermatitis herpetiformis, not erythema nodosum."
    },
    {
      "text": "Diabetes mellitus",
      "why": "Associated with necrobiosis lipoidica on the shins, a different lesion."
    },
    {
      "text": "Dermatomyositis",
      "why": "Causes a heliotrope rash and Gottron papules, not panniculitis."
    }
  ],
  "bank-ext-037": [
    {
      "text": "Cystic fibrosis",
      "why": "A CFTR chloride channel defect affecting lungs and pancreas, not cerebral arteries."
    },
    {
      "text": "Down syndrome",
      "why": "Linked to endocardial cushion defects, not intracranial aneurysms."
    },
    {
      "text": "Sturge-Weber syndrome",
      "why": "Causes leptomeningeal angiomas and port-wine stains rather than saccular aneurysms."
    },
    {
      "text": "Klinefelter syndrome",
      "why": "A 47,XXY hypogonadism syndrome with no berry aneurysm association."
    }
  ],
  "bank-ext-050": [
    {
      "text": "Left ventricular hypertrophy",
      "why": "TOF thickens the right ventricle, not the left."
    },
    {
      "text": "Transposition of the great arteries",
      "why": "A separate cyanotic lesion with an \"egg on a string\" heart."
    },
    {
      "text": "Aortic stenosis",
      "why": "Left outflow obstruction is not part of the tetralogy."
    },
    {
      "text": "Coarctation of the aorta",
      "why": "Associated with Turner syndrome and bicuspid valve, not TOF."
    }
  ],
  "bank-ext-051": [
    {
      "text": "Chronic alcohol use",
      "why": "Causes dilated cardiomyopathy"
    },
    {
      "text": "Doxorubicin",
      "why": "Causes dilated cardiomyopathy"
    },
    {
      "text": "Chagas disease",
      "why": "Causes dilated cardiomyopathy and apical aneurysm"
    },
    {
      "text": "Hypertrophic cardiomyopathy",
      "why": "Sarcomere gene disorder with asymmetric septal hypertrophy, a separate category"
    }
  ],
  "bank-ext-052": [
    {
      "text": "Opioid overdose",
      "why": "Hypoventilation retains CO2, causing respiratory acidosis."
    },
    {
      "text": "Vomiting",
      "why": "Loss of gastric acid causes metabolic, not respiratory, alkalosis."
    },
    {
      "text": "Diabetic ketoacidosis",
      "why": "Hyperventilation here is compensation for a primary metabolic acidosis."
    },
    {
      "text": "Guillain-Barré syndrome",
      "why": "Respiratory muscle weakness causes hypoventilation and respiratory acidosis."
    }
  ],
  "bank-ext-053": [
    {
      "text": "Tracheal deviation toward the affected side",
      "why": "Seen with lobar collapse or pneumonectomy, not tension pneumothorax."
    },
    {
      "text": "Dullness to percussion",
      "why": "Suggests pleural effusion or consolidation; air is hyperresonant."
    },
    {
      "text": "Bronchial breath sounds",
      "why": "Indicate consolidation, whereas a pneumothorax silences breath sounds."
    },
    {
      "text": "Muffled heart sounds",
      "why": "Part of Beck triad for cardiac tamponade."
    }
  ],
  "bank-ext-054": [
    {
      "text": "Aminoglycosides",
      "why": "Cause acute tubular necrosis, not allergic interstitial nephritis."
    },
    {
      "text": "IV contrast",
      "why": "Causes contrast nephropathy via tubular injury and vasoconstriction."
    },
    {
      "text": "Cyclosporine",
      "why": "Nephrotoxic through afferent arteriolar vasoconstriction."
    },
    {
      "text": "Lisinopril",
      "why": "Causes hemodynamic AKI by dilating the efferent arteriole, not hypersensitivity."
    }
  ],
  "bank-ext-055": [
    {
      "text": "Obesity-related fatty liver disease",
      "why": "Produces macrovesicular, large-droplet steatosis."
    },
    {
      "text": "Acetaminophen overdose",
      "why": "Causes centrilobular (zone 3) necrosis, not microvesicular fat."
    },
    {
      "text": "Halothane hepatitis",
      "why": "An immune-mediated massive hepatic necrosis."
    },
    {
      "text": "Chronic hepatitis B",
      "why": "Shows ground-glass hepatocytes, not microvesicular steatosis."
    }
  ],
  "bank-ext-056": [
    {
      "text": "Medullary thyroid carcinoma",
      "why": "Part of MEN2A and MEN2B (RET), not MEN1."
    },
    {
      "text": "Pheochromocytoma",
      "why": "Seen in MEN2A and MEN2B, not MEN1."
    },
    {
      "text": "Mucosal neuromas",
      "why": "A defining feature of MEN2B."
    },
    {
      "text": "Marfanoid habitus",
      "why": "Seen in MEN2B, not MEN1."
    }
  ],
  "bank-ext-057": [
    {
      "text": "Sarcoidosis",
      "why": "Granulomas make 1,25-vitamin D, causing hypercalcemia."
    },
    {
      "text": "Thiazide diuretics",
      "why": "Increase distal calcium reabsorption and can raise serum calcium."
    },
    {
      "text": "Primary hyperparathyroidism",
      "why": "Excess PTH causes hypercalcemia."
    },
    {
      "text": "Milk-alkali syndrome",
      "why": "Excess calcium and alkali intake causes hypercalcemia."
    }
  ],
  "bank-ext-058": [
    {
      "text": "Hereditary spherocytosis",
      "why": "A membrane defect causing extravascular hemolysis with spherocytes, not schistocytes."
    },
    {
      "text": "G6PD deficiency",
      "why": "Oxidative hemolysis with Heinz bodies and bite cells."
    },
    {
      "text": "Warm autoimmune hemolytic anemia",
      "why": "IgG-mediated extravascular hemolysis with spherocytes and a positive Coombs test."
    },
    {
      "text": "Immune thrombocytopenia",
      "why": "Isolated low platelets without hemolysis or schistocytes."
    }
  ],
  "bank-ext-059": [
    {
      "text": "Cancer cachexia",
      "why": "A chronic wasting syndrome, not a time-critical emergency."
    },
    {
      "text": "Chemotherapy-induced alopecia",
      "why": "A distressing but harmless, reversible side effect."
    },
    {
      "text": "Acanthosis nigricans",
      "why": "A paraneoplastic skin marker (gastric cancer), not an emergency."
    },
    {
      "text": "Cancer-related fatigue",
      "why": "Common and chronic, but not an acute emergency."
    }
  ],
  "bank-ext-060": [
    {
      "text": "Osteophytes",
      "why": "Bony spurs typical of osteoarthritis, absent in RA."
    },
    {
      "text": "Subchondral sclerosis",
      "why": "A degenerative OA finding rather than an inflammatory one."
    },
    {
      "text": "Pencil-in-cup deformity",
      "why": "The classic radiographic finding of psoriatic arthritis."
    },
    {
      "text": "Chondrocalcinosis",
      "why": "Cartilage calcification seen in calcium pyrophosphate deposition disease."
    }
  ],
  "bank-ext-061": [
    {
      "text": "Goodpasture syndrome",
      "why": "Anti-GBM antibodies bind fixed antigen: type II hypersensitivity."
    },
    {
      "text": "Rheumatic fever",
      "why": "Antibody cross-reactivity (molecular mimicry), a type II reaction."
    },
    {
      "text": "Myasthenia gravis",
      "why": "Antibodies against the acetylcholine receptor: type II."
    },
    {
      "text": "Allergic contact dermatitis",
      "why": "T cell-mediated delayed-type (type IV) hypersensitivity."
    }
  ],
  "bank-ext-062": [
    {
      "text": "Doxorubicin",
      "why": "Its signature toxicity is dilated cardiomyopathy."
    },
    {
      "text": "Cisplatin",
      "why": "Causes nephrotoxicity and ototoxicity, not lung fibrosis."
    },
    {
      "text": "Vincristine",
      "why": "Causes peripheral neuropathy."
    },
    {
      "text": "ACE inhibitors",
      "why": "Cause a dry cough from bradykinin, not fibrosis."
    }
  ],
  "bank-ext-063": [
    {
      "text": "Neural tube defects",
      "why": "The classic teratogenic effect of valproate and carbamazepine."
    },
    {
      "text": "Agranulocytosis",
      "why": "The feared toxicity of clozapine and carbamazepine."
    },
    {
      "text": "SIADH",
      "why": "Caused by carbamazepine; lithium causes the opposite, nephrogenic DI."
    },
    {
      "text": "Stevens-Johnson syndrome",
      "why": "Associated with lamotrigine, especially with rapid titration."
    }
  ],
  "bank-ext-064": [
    {
      "text": "Tay-Sachs disease",
      "why": "Lysosomal storage disorder (hexosaminidase A), not mitochondrial"
    },
    {
      "text": "Huntington disease",
      "why": "Autosomal dominant CAG repeat disorder"
    },
    {
      "text": "Duchenne muscular dystrophy",
      "why": "X-linked dystrophin defect"
    },
    {
      "text": "Pompe disease",
      "why": "Lysosomal glycogen storage myopathy, not mitochondrial"
    }
  ],
  "bank-ext-065": [
    {
      "text": "Papilledema",
      "why": "A sign of raised intracranial pressure; NPH has normal opening pressure."
    },
    {
      "text": "Resting tremor",
      "why": "Points to Parkinson disease rather than NPH."
    },
    {
      "text": "Elevated CSF opening pressure",
      "why": "NPH is defined by a normal opening pressure."
    },
    {
      "text": "Hydrocephalus ex vacuo",
      "why": "Ventricles enlarge passively from brain atrophy, not impaired CSF resorption."
    }
  ],
  "bank-ext-066": [
    {
      "text": "Caseating granulomas",
      "why": "Point to tuberculosis or fungal infection; sarcoid granulomas are noncaseating."
    },
    {
      "text": "Hypocalcemia",
      "why": "Sarcoid raises calcium through granuloma vitamin D activation."
    },
    {
      "text": "Ferruginous bodies",
      "why": "Asbestos fibers coated with iron, seen in asbestosis."
    },
    {
      "text": "Erythema migrans",
      "why": "The expanding rash of Lyme disease."
    }
  ],
  "bank-ext-067": [
    {
      "text": "Bullous pemphigoid",
      "why": "Subepidermal hemidesmosome antibodies make tense, Nikolsky-negative bullae."
    },
    {
      "text": "Dermatitis herpetiformis",
      "why": "Itchy grouped vesicles from IgA at dermal papillae; Nikolsky-negative."
    },
    {
      "text": "Porphyria cutanea tarda",
      "why": "Photosensitive blisters on the hands from UROD deficiency; Nikolsky-negative."
    },
    {
      "text": "Pemphigoid gestationis",
      "why": "A subepidermal pregnancy blistering disease with tense, Nikolsky-negative bullae."
    }
  ],
  "bank-ext-068": [
    {
      "text": "Mycoplasma pneumoniae",
      "why": "Lacks a cell wall and capsule entirely."
    },
    {
      "text": "Listeria monocytogenes",
      "why": "A facultative intracellular rod with actin rockets, not a classic encapsulated organism."
    },
    {
      "text": "Chlamydia trachomatis",
      "why": "An obligate intracellular bacterium without a polysaccharide capsule."
    },
    {
      "text": "Rickettsia rickettsii",
      "why": "An obligate intracellular, tick-borne bacterium, not encapsulated."
    }
  ],
  "bank-ext-080": [
    {
      "text": "Left anterior fascicular block",
      "why": "Causes left axis deviation."
    },
    {
      "text": "Left ventricular hypertrophy",
      "why": "Shifts the axis leftward if at all."
    },
    {
      "text": "Inferior wall myocardial infarction",
      "why": "Loss of inferior forces causes left axis deviation."
    },
    {
      "text": "Left bundle branch block",
      "why": "Produces a normal or left axis, not right."
    }
  ],
  "bank-ext-081": [
    {
      "text": "Minimal change disease",
      "why": "A podocytopathy causing nephrotic syndrome in children."
    },
    {
      "text": "IgA nephropathy",
      "why": "Mesangial IgA deposits cause hematuria after infections, not papillary infarction."
    },
    {
      "text": "Autosomal dominant polycystic kidney disease",
      "why": "Causes bilateral cortical and medullary cysts."
    },
    {
      "text": "Poststreptococcal glomerulonephritis",
      "why": "An immune complex glomerular disease, not medullary ischemia."
    }
  ],
  "bank-ext-082": [
    {
      "text": "MEN1",
      "why": "Parathyroid, pituitary and pancreatic tumors, without pheochromocytoma."
    },
    {
      "text": "Neurofibromatosis type 2",
      "why": "Bilateral vestibular schwannomas and meningiomas, not pheochromocytoma."
    },
    {
      "text": "Sturge-Weber syndrome",
      "why": "Port-wine stain and leptomeningeal angiomas."
    },
    {
      "text": "Tuberous sclerosis",
      "why": "Hamartomas, angiomyolipomas and seizures, not a classic pheo syndrome."
    }
  ],
  "bank-ext-083": [
    {
      "text": "Vibrio cholerae",
      "why": "Cholera toxin causes profuse \"rice-water\", non-bloody diarrhea."
    },
    {
      "text": "Enterotoxigenic E. coli",
      "why": "Traveler diarrhea from heat-labile and heat-stable toxins; watery, not bloody."
    },
    {
      "text": "Giardia lamblia",
      "why": "Causes fatty, foul-smelling, non-bloody diarrhea."
    },
    {
      "text": "Rotavirus",
      "why": "The classic cause of watery diarrhea in young children."
    }
  ],
  "bank-ext-084": [
    {
      "text": "Polyarteritis nodosa",
      "why": "A medium-vessel, ANCA-negative vasculitis linked to hepatitis B."
    },
    {
      "text": "IgA vasculitis",
      "why": "A small-vessel vasculitis driven by IgA immune complexes, not pauci-immune."
    },
    {
      "text": "Goodpasture syndrome",
      "why": "Anti-GBM antibodies give linear immunofluorescence, not a pauci-immune pattern."
    },
    {
      "text": "Takayasu arteritis",
      "why": "A large-vessel granulomatous vasculitis of the aorta and branches."
    }
  ],
  "bank-ext-085": [
    {
      "text": "Warfarin",
      "why": "Monitored by its effect (INR), not by serum drug levels."
    },
    {
      "text": "Amoxicillin",
      "why": "A wide therapeutic index antibiotic that needs no level monitoring."
    },
    {
      "text": "Metoprolol",
      "why": "Titrated to heart rate and blood pressure, not serum levels."
    },
    {
      "text": "Atorvastatin",
      "why": "Monitored by lipid response, not drug levels."
    }
  ],
  "bank-ext-086": [
    {
      "text": "Von Gierke disease",
      "why": "A glycogen storage disease from cytosolic glucose-6-phosphatase deficiency, not lysosomal."
    },
    {
      "text": "McArdle disease",
      "why": "Muscle glycogen phosphorylase deficiency, a non-lysosomal glycogen storage disease."
    },
    {
      "text": "Phenylketonuria",
      "why": "An amino acid metabolism disorder from phenylalanine hydroxylase deficiency."
    },
    {
      "text": "Maple syrup urine disease",
      "why": "Branched-chain alpha-ketoacid dehydrogenase deficiency, a mitochondrial enzyme."
    }
  ],
  "bank-ext-087": [
    {
      "text": "Superior vena cava syndrome",
      "why": "Caused by direct tumor compression, not a remote hormonal or immune effect."
    },
    {
      "text": "Horner syndrome from a Pancoast tumor",
      "why": "Local invasion of the sympathetic chain, not paraneoplastic."
    },
    {
      "text": "Tumor lysis syndrome",
      "why": "A metabolic complication of rapid tumor cell death, usually after treatment."
    },
    {
      "text": "Malignant pleural effusion",
      "why": "Direct pleural involvement by tumor."
    }
  ],
  "bank-ext-088": [
    {
      "text": "ANA",
      "why": "Sensitive for SLE but positive in many autoimmune diseases and healthy people."
    },
    {
      "text": "Rheumatoid factor",
      "why": "Found in RA but also Sjögren, hepatitis C and healthy elderly."
    },
    {
      "text": "Anti-Ro/SSA",
      "why": "Seen in both Sjögren syndrome and SLE, so not specific to one disease."
    },
    {
      "text": "p-ANCA",
      "why": "Positive in MPA, EGPA, ulcerative colitis and PSC."
    }
  ],
  "bank-ext-089": [
    {
      "text": "Prolactin",
      "why": "Drives lactation; excess suppresses GnRH and the cycle."
    },
    {
      "text": "Oxytocin",
      "why": "Drives uterine contraction in labor and milk letdown."
    },
    {
      "text": "hCG",
      "why": "Made by the placenta to maintain the corpus luteum in pregnancy."
    },
    {
      "text": "TSH",
      "why": "Regulates the thyroid; dysfunction disrupts cycles only indirectly."
    }
  ],
  "bank-ext-090": [
    {
      "text": "Copper IUD",
      "why": "An intrauterine device that is spermicidal via copper ions, not a barrier."
    },
    {
      "text": "Vaginal ring",
      "why": "Releases estrogen and progestin, a hormonal method."
    },
    {
      "text": "Spermicide alone",
      "why": "A chemical method that kills sperm rather than blocking them."
    },
    {
      "text": "Withdrawal",
      "why": "A behavioral method with no physical barrier."
    }
  ],
  "bank-ext-091": [
    {
      "text": "Asherman syndrome",
      "why": "Intrauterine adhesions after instrumentation cause secondary amenorrhea."
    },
    {
      "text": "Sheehan syndrome",
      "why": "Postpartum pituitary necrosis causes secondary amenorrhea."
    },
    {
      "text": "Lactational amenorrhea",
      "why": "Prolactin suppresses ovulation after delivery; a secondary amenorrhea."
    },
    {
      "text": "Menopause",
      "why": "Ovarian follicle depletion ends previously established menses."
    }
  ],
  "bank-ext-092": [
    {
      "text": "Decreased LH:FSH ratio",
      "why": "PCOS classically shows an elevated LH:FSH ratio."
    },
    {
      "text": "Elevated serum prolactin",
      "why": "Points to hyperprolactinemia, which must be excluded before diagnosing PCOS."
    },
    {
      "text": "Elevated FSH",
      "why": "Suggests primary ovarian insufficiency, not PCOS."
    },
    {
      "text": "Low estrogen state",
      "why": "PCOS has normal to high unopposed estrogen, raising endometrial cancer risk."
    }
  ],
  "bank-ext-093": [
    {
      "text": "Trisomy 21",
      "why": "Associated with low MSAFP on the quad screen."
    },
    {
      "text": "Trisomy 18",
      "why": "Lowers MSAFP along with hCG and estriol."
    },
    {
      "text": "Overestimated gestational age",
      "why": "A pregnancy earlier than dated gives a falsely low AFP."
    },
    {
      "text": "Skin-covered (closed) neural tube defect",
      "why": "Intact skin prevents AFP leakage, so MSAFP stays normal."
    }
  ],
  "bank-ext-094": [
    {
      "text": "Granulosa cell tumor",
      "why": "A sex cord-stromal tumor that secretes estrogen and inhibin."
    },
    {
      "text": "Sertoli-Leydig cell tumor",
      "why": "A sex cord-stromal tumor causing virilization."
    },
    {
      "text": "Serous cystadenocarcinoma",
      "why": "The most common malignant surface epithelial ovarian tumor."
    },
    {
      "text": "Krukenberg tumor",
      "why": "Metastatic signet ring cell carcinoma, usually from the stomach."
    }
  ],
  "bank-ext-095": [
    {
      "text": "Ectopic pregnancy",
      "why": "Causes first-trimester bleeding and pain."
    },
    {
      "text": "Uterine atony",
      "why": "The most common cause of postpartum, not antepartum, hemorrhage."
    },
    {
      "text": "Threatened abortion",
      "why": "Bleeding before 20 weeks with a closed os."
    },
    {
      "text": "Retained products of conception",
      "why": "A cause of postpartum or post-abortion bleeding."
    }
  ],
  "bank-ext-096": [
    {
      "text": "Severe hypoglycemia",
      "why": "More typical of acute fatty liver of pregnancy than HELLP."
    },
    {
      "text": "Pruritus with elevated bile acids",
      "why": "Defines intrahepatic cholestasis of pregnancy."
    },
    {
      "text": "Positive direct Coombs test",
      "why": "HELLP hemolysis is microangiopathic and Coombs-negative."
    },
    {
      "text": "Severely low ADAMTS13 activity",
      "why": "Diagnostic of TTP, a HELLP mimic."
    }
  ],
  "bank-ext-097": [
    {
      "text": "Venlafaxine",
      "why": "An SNRI that blocks both serotonin and norepinephrine reuptake."
    },
    {
      "text": "Bupropion",
      "why": "A norepinephrine-dopamine reuptake inhibitor without serotonergic action."
    },
    {
      "text": "Mirtazapine",
      "why": "An alpha-2 antagonist, not a reuptake inhibitor."
    },
    {
      "text": "Trazodone",
      "why": "A serotonin antagonist and reuptake inhibitor (SARI) used mainly for sleep."
    }
  ],
  "bank-ext-098": [
    {
      "text": "Flat affect",
      "why": "A negative symptom: reduced emotional expression."
    },
    {
      "text": "Alogia",
      "why": "A negative symptom: poverty of speech."
    },
    {
      "text": "Avolition",
      "why": "A negative symptom: lack of motivation."
    },
    {
      "text": "Anhedonia",
      "why": "A negative symptom: inability to feel pleasure."
    }
  ],
  "bank-ext-099": [
    {
      "text": "Zolpidem",
      "why": "A non-benzodiazepine that binds the BZ1 site of GABA-A."
    },
    {
      "text": "Buspirone",
      "why": "A 5-HT1A partial agonist with no GABA activity."
    },
    {
      "text": "Phenobarbital",
      "why": "A barbiturate that increases the duration, not frequency, of Cl- channel opening."
    },
    {
      "text": "Flumazenil",
      "why": "A benzodiazepine receptor antagonist used as an antidote."
    }
  ],
  "bank-ext-100": [
    {
      "text": "Hyperprolactinemia",
      "why": "D2 blockade in the tuberoinfundibular pathway, an endocrine rather than motor effect."
    },
    {
      "text": "QT prolongation",
      "why": "A cardiac adverse effect, especially with ziprasidone and haloperidol IV."
    },
    {
      "text": "Agranulocytosis",
      "why": "A hematologic toxicity of clozapine."
    },
    {
      "text": "Weight gain",
      "why": "A metabolic side effect, prominent with olanzapine and clozapine."
    }
  ],
  "bank-ext-101": [
    {
      "text": "Sertraline",
      "why": "An SSRI with no routine serum level or blood count monitoring."
    },
    {
      "text": "Bupropion",
      "why": "No routine blood monitoring; avoid in seizure and eating disorders."
    },
    {
      "text": "Buspirone",
      "why": "A well-tolerated anxiolytic needing no lab monitoring."
    },
    {
      "text": "Trazodone",
      "why": "Used for sleep and depression without routine blood tests."
    }
  ],
  "bank-ext-102": [
    {
      "text": "Methadone",
      "why": "A full opioid agonist used for opioid use disorder."
    },
    {
      "text": "Buprenorphine",
      "why": "A partial opioid agonist for opioid use disorder."
    },
    {
      "text": "Chlordiazepoxide",
      "why": "Treats acute alcohol withdrawal but is not maintenance therapy for AUD."
    },
    {
      "text": "Bupropion",
      "why": "Used for smoking cessation and depression, not AUD."
    }
  ],
  "bank-ext-103": [
    {
      "text": "Rheumatoid arthritis",
      "why": "RF/anti-CCP-positive symmetric small-joint arthritis, not a spondyloarthropathy"
    },
    {
      "text": "Gout",
      "why": "Crystal (monosodium urate) arthritis, not an HLA-B27 inflammatory spondyloarthropathy"
    },
    {
      "text": "Diffuse idiopathic skeletal hyperostosis (DISH)",
      "why": "Non-inflammatory ligament ossification of the spine with preserved SI joints"
    },
    {
      "text": "Pseudogout (CPPD disease)",
      "why": "Calcium pyrophosphate crystal arthritis, not a spondyloarthropathy"
    }
  ],
  "bank-ext-104": [
    {
      "text": "Teres major",
      "why": "Attaches near the cuff but adducts and internally rotates; not a rotator cuff muscle"
    },
    {
      "text": "Deltoid",
      "why": "Main arm abductor beyond 15 degrees but not part of the cuff"
    },
    {
      "text": "Latissimus dorsi",
      "why": "Adducts, extends and internally rotates the arm; not a cuff muscle"
    },
    {
      "text": "Long head of biceps brachii",
      "why": "Its tendon runs through the shoulder joint but it is not a rotator cuff muscle"
    }
  ],
  "bank-ext-105": [
    {
      "text": "Marginal erosions",
      "why": "Classic for rheumatoid arthritis, not osteoarthritis"
    },
    {
      "text": "Juxta-articular osteopenia",
      "why": "Inflammatory arthritis finding (RA), whereas OA bone is sclerotic"
    },
    {
      "text": "Pencil-in-cup deformity",
      "why": "Erosive change of psoriatic arthritis"
    },
    {
      "text": "Punched-out erosions with overhanging edges",
      "why": "Classic radiographic sign of chronic gout"
    }
  ],
  "bank-ext-106": [
    {
      "text": "Spinal muscular atrophy",
      "why": "Anterior horn cell (SMN1) disease, a neuronopathy rather than a muscular dystrophy"
    },
    {
      "text": "Myasthenia gravis",
      "why": "Autoimmune neuromuscular junction disorder, not inherited muscle degeneration"
    },
    {
      "text": "Polymyositis",
      "why": "Acquired inflammatory myopathy, not an inherited dystrophy"
    },
    {
      "text": "Lambert-Eaton myasthenic syndrome",
      "why": "Presynaptic calcium channel autoimmunity, often paraneoplastic"
    }
  ],
  "bank-ext-107": [
    {
      "text": "Bone metastasis from prostate cancer",
      "why": "Secondary (metastatic) tumor, not a primary bone tumor"
    },
    {
      "text": "Paget disease of bone",
      "why": "Disordered bone remodeling, not a neoplasm (though it raises osteosarcoma risk)"
    },
    {
      "text": "Osteomyelitis",
      "why": "Bone infection that can mimic a tumor on imaging"
    },
    {
      "text": "Brown tumor of hyperparathyroidism",
      "why": "Reactive osteoclastic lesion from high PTH, not a true neoplasm"
    }
  ],
  "bank-ext-109": [
    {
      "text": "Actinic keratosis",
      "why": "Premalignant lesion that can progress to squamous cell carcinoma"
    },
    {
      "text": "Basal cell carcinoma",
      "why": "Malignant, although it rarely metastasizes"
    },
    {
      "text": "Lentigo maligna",
      "why": "Melanoma in situ on sun-damaged skin, not benign"
    },
    {
      "text": "Dysplastic nevus",
      "why": "Atypical mole that marks increased melanoma risk"
    }
  ],
  "bank-ext-110": [
    {
      "text": "Wickham striae",
      "why": "Lacy white lines on lichen planus papules"
    },
    {
      "text": "Herald patch",
      "why": "First lesion of pityriasis rosea"
    },
    {
      "text": "Honey-colored crusts",
      "why": "Classic for impetigo"
    },
    {
      "text": "Flexural lichenified plaques",
      "why": "Typical of chronic atopic dermatitis, which favors flexures not extensors"
    }
  ],
  "bank-ext-111": [
    {
      "text": "Staphylococcal scalded skin syndrome",
      "why": "Blistering from bacterial exfoliative toxin, not autoantibodies"
    },
    {
      "text": "Stevens-Johnson syndrome",
      "why": "Drug-triggered cytotoxic epidermal necrosis, not an autoantibody disease"
    },
    {
      "text": "Porphyria cutanea tarda",
      "why": "Photosensitive blistering from a heme synthesis defect (uroporphyrinogen decarboxylase)"
    },
    {
      "text": "Bullous impetigo",
      "why": "Localized staphylococcal toxin-mediated blisters, not autoimmune"
    }
  ],
  "bank-ext-112": [
    {
      "text": "Kaposi sarcoma",
      "why": "Vascular tumor driven by HHV-8, not UV exposure."
    },
    {
      "text": "Mycosis fungoides",
      "why": "Cutaneous T-cell lymphoma, not UV-driven."
    },
    {
      "text": "Dermatofibrosarcoma protuberans",
      "why": "A dermal sarcoma with a COL1A1-PDGFB fusion, not UV-linked."
    },
    {
      "text": "Actinic keratosis",
      "why": "UV-induced but premalignant, not a cancer."
    }
  ],
  "bank-ext-113": [
    {
      "text": "Erythema multiforme major",
      "why": "Targetoid lesions mostly triggered by HSV or Mycoplasma; distinct from SJS/TEN"
    },
    {
      "text": "Staphylococcal scalded skin syndrome",
      "why": "Superficial peeling from staphylococcal exfoliative toxin, not a drug reaction"
    },
    {
      "text": "Morbilliform drug eruption",
      "why": "The common benign drug exanthem without organ involvement, pustules or detachment"
    },
    {
      "text": "Drug-induced urticaria",
      "why": "Immediate IgE-type reaction with wheals, not a delayed SCAR"
    }
  ],
  "bank-ext-114": [
    {
      "text": "Physiologic neonatal jaundice",
      "why": "Transient immaturity of conjugation, not an inherited defect"
    },
    {
      "text": "Biliary atresia",
      "why": "Acquired obliteration of bile ducts causing conjugated jaundice in infants"
    },
    {
      "text": "Wilson disease",
      "why": "Inherited copper accumulation (ATP7B), not a primary bilirubin processing defect"
    },
    {
      "text": "Primary biliary cholangitis",
      "why": "Autoimmune destruction of small bile ducts, not hereditary"
    }
  ],
  "bank-ext-115": [
    {
      "text": "Ulcerative colitis",
      "why": "Raises colorectal cancer risk but is acquired inflammation, not an inherited syndrome"
    },
    {
      "text": "MEN2A",
      "why": "Inherited RET syndrome with thyroid, adrenal and parathyroid tumors, not colorectal cancer"
    },
    {
      "text": "Von Hippel-Lindau disease",
      "why": "Inherited tumor syndrome of kidney, CNS and adrenal, not colorectal polyps"
    },
    {
      "text": "Hereditary hemochromatosis",
      "why": "Inherited iron overload that raises hepatocellular, not colorectal, cancer risk"
    }
  ],
  "bank-ext-116": [
    {
      "text": "Nephrotic syndrome",
      "why": "Low-SAAG ascites from hypoalbuminemia, no portal hypertension"
    },
    {
      "text": "Peritoneal carcinomatosis",
      "why": "Low-SAAG exudative ascites from peritoneal tumor"
    },
    {
      "text": "Tuberculous peritonitis",
      "why": "Low-SAAG, high-protein ascites with lymphocytes"
    },
    {
      "text": "Pancreatic ascites",
      "why": "Low-SAAG ascites with very high fluid amylase"
    }
  ],
  "daily-0001#0": [
    {
      "text": "Hemorrhagic shock",
      "why": "Low volume gives flat neck veins."
    },
    {
      "text": "Septic shock",
      "why": "Vasodilation usually leaves the JVP low."
    },
    {
      "text": "Severe dehydration",
      "why": "Volume depletion flattens the JVP."
    },
    {
      "text": "Neurogenic shock",
      "why": "Loss of sympathetic tone pools blood peripherally with a low JVP."
    }
  ],
  "daily-0001#1": [
    {
      "text": "Cystic fibrosis",
      "why": "A single-gene CFTR disorder, not an HLA association."
    },
    {
      "text": "Duchenne muscular dystrophy",
      "why": "X-linked dystrophin mutation, not HLA-linked."
    },
    {
      "text": "Huntington disease",
      "why": "CAG repeat expansion, not an HLA association."
    },
    {
      "text": "Marfan syndrome",
      "why": "Fibrillin-1 mutation, not HLA-linked."
    }
  ],
  "daily-0001#2": [
    {
      "text": "Hypercalcemia",
      "why": "Shortens the QT interval."
    },
    {
      "text": "Digoxin",
      "why": "Shortens QT and scoops the ST segment."
    },
    {
      "text": "Lidocaine",
      "why": "A class IB drug that shortens repolarization."
    },
    {
      "text": "Metoprolol",
      "why": "Slows heart rate without blocking repolarizing potassium channels."
    }
  ],
  "daily-0001#3": [
    {
      "text": "Ulcerative colitis",
      "why": "Mucosal inflammation and crypt abscesses without granulomas."
    },
    {
      "text": "Microscopic polyangiitis",
      "why": "ANCA vasculitis that, unlike GPA, lacks granulomas."
    },
    {
      "text": "Goodpasture syndrome",
      "why": "Anti-GBM antibody disease without granulomas."
    },
    {
      "text": "Lobar pneumococcal pneumonia",
      "why": "Acute neutrophilic consolidation, not granulomatous."
    }
  ],
  "daily-0002#0": [
    {
      "text": "Strawberry tongue",
      "why": "Named for a fruit (Kawasaki disease, scarlet fever)."
    },
    {
      "text": "Apple-core lesion",
      "why": "Named for a fruit (colon cancer on barium enema)."
    },
    {
      "text": "Bamboo spine",
      "why": "Named for a plant (ankylosing spondylitis)."
    },
    {
      "text": "Cherry-red spot",
      "why": "Named for a fruit (Tay-Sachs, central retinal artery occlusion)."
    }
  ],
  "daily-0002#3": [
    {
      "text": "Hypothyroidism",
      "why": "Starts with 'hypo' and raises TSH."
    },
    {
      "text": "Hypoaldosteronism",
      "why": "Starts with 'hypo' and raises potassium."
    },
    {
      "text": "Hypoparathyroidism",
      "why": "Starts with 'hypo' and raises phosphate."
    },
    {
      "text": "Hypoventilation",
      "why": "Starts with 'hypo' and raises PaCO2."
    }
  ],
  "daily-0003#0": [
    {
      "text": "Reynolds pentad",
      "why": "Five findings, not a triad."
    },
    {
      "text": "Tetralogy of Fallot",
      "why": "Four defects, and named a tetralogy."
    },
    {
      "text": "Renal cell carcinoma triad",
      "why": "Hematuria, flank pain, and mass, but not eponymous."
    },
    {
      "text": "TTP pentad",
      "why": "Five findings and not named after a person."
    }
  ],
  "daily-0003#1": [
    {
      "text": "Butterfly rash",
      "why": "A skin exam finding, not an imaging sign."
    },
    {
      "text": "Nutmeg liver",
      "why": "A gross pathology appearance of congestive hepatopathy."
    },
    {
      "text": "Owl's eye inclusions",
      "why": "A histology finding in CMV."
    },
    {
      "text": "Strawberry tongue",
      "why": "A physical exam finding."
    }
  ],
  "daily-0003#2": [
    {
      "text": "Foam cells",
      "why": "Lipid-laden macrophages with a descriptive, not eponymous, name."
    },
    {
      "text": "Signet ring cells",
      "why": "Mucin-filled cells named for their shape, not a person."
    },
    {
      "text": "Koilocytes",
      "why": "HPV-infected cells with perinuclear halos, not eponymous."
    },
    {
      "text": "Clue cells",
      "why": "Bacteria-coated epithelial cells in bacterial vaginosis, not eponymous."
    }
  ],
  "daily-0003#3": [
    {
      "text": "Superior vena cava syndrome",
      "why": "Direct compression by tumor, not a remote effect."
    },
    {
      "text": "Pancoast syndrome",
      "why": "Local invasion of the brachial plexus and sympathetic chain."
    },
    {
      "text": "Hypercalcemia from bone metastases",
      "why": "Local osteolysis, not a secreted factor."
    },
    {
      "text": "Tumor lysis syndrome",
      "why": "A treatment-related metabolic complication."
    }
  ]
}

// Bank entries: correct fields, attach near misses.
export function applyBankCorrections(list) {
  return list.map((cat) => {
    const fix = BANK_CORRECTIONS[cat.id]
    const near = NEAR_MISSES[cat.id]
    if (!fix && !near) return cat
    return { ...cat, ...(fix || {}), ...(near && !cat.nearMisses ? { nearMisses: near } : {}) }
  })
}

// Authored puzzles (Systems, early Dailies): categories hold items.
export function applyPuzzleCorrections(puzzles, fixes) {
  return puzzles.map((p) => {
    let changed = false
    const categories = p.categories.map((cat, i) => {
      const key = `${p.id}#${i}`
      const fix = fixes[key]
      const near = NEAR_MISSES[key]
      if (!fix && !near) return cat
      changed = true
      const next = { ...cat }
      if (fix?.title) next.title = fix.title
      if (fix?.explanation) next.explanation = fix.explanation
      if (fix?.remember) next.remember = fix.remember
      if (fix?.tiles || fix?.tileExplanations) {
        const terms = fix.tiles || cat.items.map((it) => it.term)
        next.items = terms.map((term, k) => ({ ...(cat.items[k] || {}), term, why: fix.tileExplanations?.[k] ?? cat.items[k]?.why ?? '' }))
      }
      if (near && !cat.nearMisses) next.nearMisses = near
      return next
    })
    return changed ? { ...p, categories } : p
  })
}
