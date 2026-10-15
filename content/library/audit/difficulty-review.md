# Difficulty labels: review

How labels are set: `content/library/difficulty-rubric.md`. Decide a queued connection by adding it to `content/library/audit/difficulty-overrides.json` and running `node scripts/library/activate.mjs`. All ratings are AI estimates, not player data.

## Counts (served connections)

| | Easy | Medium | Hard | Expert |
|---|---|---|---|---|
| Old rule (recognition only) | 208 | 326 | 105 | 1 |
| Score alone | 223 | 290 | 104 | 23 |
| Second rating | 206 | 375 | 58 | 1 |
| **Served now** | **208** | **380** | **50** | **2** |

Status: 396 confirmed (score and second rating agree), 223 settled by a third rating, 0 waiting for you, 21 decided by you.

Daily boards, labels shown easiest to hardest (E Easy, M Medium, H Hard, X Expert):

- EMMH: 56
- EMMX: 13
- EMHH: 4
- MMHH: 4
- MHHX: 2
- EEMH: 1
- EMHX: 1
- EMMM: 1
- MMHX: 1

82 of 83 Daily boards show at least one Hard or Expert group; 17 show an Expert group.

## Needs your decision (0)

Shipped meanwhile with the majority rating, or the middle one when all three differ (an Easy that needs more than recall ships as Medium). Ratings that span two tiers or more are listed first.

## Every label that changed (157)

| Id | Connection | Old | New | Score | 2nd | 3rd | How |
|---|---|---|---|---|---|---|---|
| CARD-005 | Non-antiarrhythmic drugs that can prolong QT | hard | **medium** | hard (3) | medium | medium | majority |
| CARD-008 | Recognized amiodarone toxicities | medium | **easy** | medium (2) | easy | easy | majority |
| CARD-010 | Metabolic adverse effects of thiazides | medium | **easy** | easy (1.5) | easy |  | confirmed |
| CARD-018 | Classic clues to aortic coarctation | medium | **easy** | medium (2) | easy | easy | majority |
| CARD-022 | Classic mitral regurgitation associations | hard | **medium** | hard (3.5) | medium | medium | majority |
| CARD-024 | Settings in which an S3 may be heard | hard | **medium** | hard (3.5) | medium | medium | majority |
| CARD-025 | Conditions associated with an S4 | hard | **medium** | hard (3.5) | medium | medium | majority |
| CARD-033 | Constrictive pericarditis clues | hard | **medium** | hard (3.5) | medium | medium | majority |
| CARD-035 | Causes of tamponade from acute hemopericardium | hard | **medium** | hard (3.75) | medium | medium | majority |
| CARD-037 | Complications of myocardial infarction | medium | **easy** | medium (2) | easy | easy | majority |
| CARD-038 | ECG leads viewing the lateral wall | medium | **easy** | easy (1.5) | easy |  | confirmed |
| CARD-039 | Precordial leads spanning the anterior-septal territory | easy | **medium** | easy (0.5) | medium | medium | majority |
| CARD-040 | Drug exposures associated with coronary vasospasm | hard | **medium** | hard (3.75) | medium | medium | majority |
| CARD-043 | Peripheral arterial disease clues | medium | **easy** | medium (2) | easy | easy | majority |
| CARD-044 | Endocrine causes of secondary hypertension | medium | **easy** | medium (2) | easy | easy | majority |
| CARD-045 | Causes of hypovolemic shock | medium | **easy** | medium (2) | easy | easy | majority |
| CARD-053 | Aortic diseases that can lead to aortic regurgitation | hard | **medium** | hard (3.75) | medium | medium | majority |
| DERM-001 | Major epidermal cell populations | medium | **easy** | medium (2) | easy | easy | majority |
| DERM-004 | Staphylococcal scalded skin syndrome clues | hard | **medium** | hard (3.5) | medium | medium | majority |
| DERM-005 | Necrotizing fasciitis warning signs | hard | **medium** | hard (3.5) | medium | medium | majority |
| DERM-008 | High-risk oncogenic HPV types | easy | **medium** | easy (0.5) | medium | medium | majority |
| DERM-009 | HPV-associated wart subtypes | easy | **medium** | easy (1) | medium | medium | majority |
| DERM-018 | Infectious associations of erythema nodosum | hard | **medium** | hard (3.5) | medium | medium | majority |
| DERM-022 | Acne vulgaris pathogenesis | easy | **medium** | easy (1) | medium | medium | majority |
| DERM-024 | Rosacea flushing triggers | hard | **medium** | hard (3) | medium | medium | majority |
| DERM-030 | Risk settings for cutaneous squamous cell carcinoma | hard | **medium** | hard (3) | medium | medium | majority |
| DERM-035 | Bacillary angiomatosis clues | medium | **hard** | hard (2.75) | hard | medium | majority |
| ENDO-029 | Hereditary syndromes associated with pheochromocytoma | medium | **easy** | easy (1.5) | medium | easy | majority |
| ENDO-031 | Recessive enzyme defects affecting sex-steroid synthesis or activation | easy | **medium** | easy (0.5) | hard | hard | override |
| ENDO-037 | Organ-specific autoimmune diseases that cluster together (autoimmune polyendocrine syndrome type 2 spectrum) | medium | **hard** | medium (2) | hard | hard | majority |
| ENDO-039 | Precipitants shared by DKA and HHS | hard | **medium** | hard (3) | medium | medium | majority |
| ENDO-042 | Glucose-lowering agents associated with weight loss | hard | **medium** | hard (3.5) | medium | medium | majority |
| GI-003 | Tongue muscles innervated by CN XII | easy | **medium** | easy (0.5) | medium | medium | majority |
| GI-004 | Systemic diseases associated with recurrent oral ulcers | hard | **medium** | hard (3.5) | medium | medium | majority |
| GI-009 | Conditions predisposing to gastroesophageal reflux | hard | **medium** | hard (3.75) | medium | medium | majority |
| GI-016 | Features of Zollinger-Ellison syndrome | medium | **easy** | medium (2) | easy | easy | majority |
| GI-018 | Nutrients at risk with prolonged PPI use | hard | **medium** | hard (3.75) | medium | medium | majority |
| GI-019 | Classic adverse effects of cimetidine | hard | **medium** | hard (3) | medium | medium | majority |
| GI-026 | Measures used to remove/reduce excess iron | medium | **easy** | easy (1.5) | easy |  | confirmed |
| GI-027 | Markers of impaired synthetic/metabolic function in advanced cirrhosis | hard | **medium** | hard (3.75) | medium | medium | majority |
| GI-030 | Causes of portal hypertension by site of obstruction | hard | **medium** | expert (3.75) | hard | medium | override |
| GI-032 | Neonatal causes of indirect (unconjugated) hyperbilirubinemia | easy | **medium** | easy (0.5) | medium | medium | majority |
| GI-036 | Imaging and examination clues to acute cholecystitis | easy | **medium** | easy (1) | medium | medium | majority |
| GI-040 | Drugs associated with acute pancreatitis | hard | **medium** | hard (3) | medium | medium | majority |
| GI-052 | Extraintestinal manifestations of Whipple disease | hard | **medium** | hard (3) | medium | medium | majority |
| GI-054 | Potential lead points for intussusception | hard | **medium** | hard (3) | medium | medium | majority |
| GI-061 | Hirschsprung disease clues | medium | **easy** | medium (2) | easy | easy | majority |
| IMM-004 | Growth factors in inflammatory tissue repair | easy | **medium** | easy (0.5) | medium | medium | majority |
| IMM-010 | Features of T-dependent B-cell activation | hard | **medium** | hard (3.75) | medium | medium | majority |
| IMM-011 | Associations of IgG | medium | **easy** | medium (2) | easy | easy | majority |
| IMM-018 | Live attenuated viral vaccines | medium | **easy** | medium (2) | easy | easy | majority |
| IMM-019 | Protein-antigen vaccines | hard | **medium** | hard (3.5) | medium | medium | majority |
| IMM-024 | Selective IgA deficiency associations | easy | **medium** | easy (1) | medium | medium | majority |
| IMM-028 | X-linked inborn errors of immunity | hard | **medium** | hard (3.5) | medium | medium | majority |
| IMM-029 | Cytotoxic type II hypersensitivity examples | medium | **easy** | easy (1.5) | easy |  | confirmed |
| IMM-038 | Drugs inhibiting IL-2 production or signaling | hard | **medium** | hard (3.75) | medium | medium | majority |
| IMM-039 | Systemic glucocorticoid adverse effects | medium | **easy** | medium (2) | easy | easy | majority |
| MICRO-001 | Bacterial toxins that raise host-cell cAMP | hard | **medium** | hard (3.75) | medium | medium | majority |
| MICRO-002 | Bacterial toxins that inhibit host protein synthesis | hard | **medium** | hard (3.25) | medium | medium | majority |
| MICRO-003 | Classic toxins associated with lysogenic conversion | hard | **medium** | hard (3.5) | medium | medium | majority |
| MICRO-008 | Fastidious causes of blood-culture-negative endocarditis | hard | **medium** | hard (3) | medium | medium | majority |
| MICRO-009 | Classic bacterial causes of atypical pneumonia | medium | **easy** | medium (2) | easy | easy | majority |
| MICRO-010 | Bacterial infections linked to unpasteurized dairy | hard | **medium** | hard (3) | medium | medium | majority |
| MICRO-022 | Allergic bronchopulmonary aspergillosis findings | hard | **medium** | hard (3.5) | medium | medium | majority |
| MICRO-025 | Pneumocystis pneumonia associations | medium | **easy** | medium (2) | easy | easy | majority |
| MICRO-033 | Nematodes with a pulmonary migration phase | hard | **medium** | hard (3.5) | medium | medium | majority |
| MICRO-039 | Aedes-transmitted viruses | easy | **medium** | easy (0.5) | medium | medium | majority |
| MICRO-040 | Segmented RNA virus groups | easy | **medium** | easy (0.75) | medium | medium | majority |
| MICRO-056 | Third-generation cephalosporins | hard | **medium** | hard (3) | medium | medium | majority |
| MICRO-057 | Antibiotic groups acting on the 50S ribosome | medium | **easy** | medium (2) | easy | easy | majority |
| MICRO-069 | HCV NS5A inhibitors | easy | **medium** | easy (0.5) | medium | medium | majority |
| MICRO-070 | HCV NS3/4A protease inhibitors | easy | **medium** | easy (0.5) | medium | medium | majority |
| MSK-007 | Clinical consequences of osteopetrosis | hard | **medium** | hard (3.75) | medium | medium | majority |
| MSK-009 | Classic Paget bone disease associations | medium | **easy** | medium (2) | easy | easy | majority |
| MSK-012 | Neonatal lupus manifestations | hard | **medium** | hard (3.5) | medium | medium | majority |
| MSK-013 | Sjogren syndrome clues | easy | **medium** | easy (1) | medium | medium | majority |
| MSK-018 | Sarcoidosis diagnostic associations | easy | **medium** | easy (1) | medium | medium | majority |
| MSK-020 | Classic Ewing sarcoma clues | easy | **medium** | easy (1.25) | medium | medium | majority |
| MSK-022 | Granulomatosis with polyangiitis clues | medium | **easy** | medium (2) | easy | easy | majority |
| MSK-023 | IgA vasculitis organ manifestations | medium | **easy** | medium (2) | easy | easy | majority |
| MSK-033 | Causes of acute limb compartment syndrome | hard | **medium** | hard (3.75) | medium | medium | majority |
| MSK-034 | Bony tenderness sites in the Ottawa ankle-foot rules | medium | **hard** | medium (2) | hard | hard | majority |
| MSK-035 | High-risk stress fracture sites | hard | **expert** | expert (4.5) | hard | expert | majority |
| NEPH-002 | Metanephric mesenchyme derivatives | easy | **medium** | easy (0.5) | medium | medium | majority |
| NEPH-010 | Secondary membranous nephropathy associations | hard | **medium** | hard (3.5) | medium | medium | majority |
| NEPH-011 | Membranous nephropathy diagnostic clues | medium | **hard** | hard (3) | hard |  | confirmed |
| NEPH-013 | Alport syndrome clues | easy | **medium** | easy (1.25) | medium | medium | majority |
| NEPH-018 | Renal papillary necrosis associations | medium | **easy** | medium (2) | easy | easy | majority |
| NEPH-030 | Phosphate-elevating conditions | hard | **medium** | hard (3.75) | medium | medium | majority |
| NEU-003 | Lower motor neuron lesion findings | easy | **medium** | medium (1.5) | easy | easy | majority |
| NEU-004 | Extrapyramidal descending motor tracts | medium | **hard** | medium (2) | hard | hard | majority |
| NEU-006 | Medial brainstem structures | hard | **medium** | hard (3) | medium | medium | majority |
| NEU-007 | Four lateral brainstem localization structures | easy | **medium** | easy (0.5) | medium | medium | majority |
| NEU-009 | Brown-Sequard (hemicord) localization findings | easy | **medium** | easy (0.5) | hard | medium | override |
| NEU-011 | Clinical clues supporting multiple sclerosis | easy | **medium** | easy (1) | medium | medium | majority |
| NEU-012 | Multiple sclerosis investigation clues | easy | **medium** | easy (1.25) | medium | medium | majority |
| NEU-018 | Complete (pupil-involving) CN III palsy findings | easy | **medium** | easy (1) | medium | medium | majority |
| NEU-020 | Branch-dependent effects of proximal facial nerve injury | medium | **hard** | hard (2.75) | hard | medium | majority |
| NEU-024 | Causes of conductive hearing loss | medium | **easy** | medium (2) | easy | easy | majority |
| NEU-028 | Medulloblastoma pathology and behavior | hard | **medium** | hard (3.75) | medium | medium | majority |
| NEU-029 | Pilocytic astrocytoma associations | easy | **medium** | easy (1.25) | medium | medium | majority |
| NEU-050 | Alzheimer disease neuropathology clues | easy | **medium** | easy (1.25) | medium | medium | majority |
| NEU-055 | Creutzfeldt-Jakob disease clues | medium | **easy** | medium (2) | easy | easy | majority |
| NEU-057 | Typical migraine features | medium | **easy** | medium (2) | easy | easy | majority |
| PHARM-001 | Hepatic phase II conjugation reactions | medium | **easy** | easy (1.5) | medium | easy | majority |
| PLEXUS-GEN-011 | Fanconi anemia associations | hard | **medium** | hard (3.5) | medium | medium | majority |
| PLEXUS-GEN-017 | Angelman syndrome associations | easy | **medium** | easy (1) | medium | medium | majority |
| PLEXUS-GEN-020 | Vaso-occlusive complications of sickle cell disease | easy | **medium** | easy (1) | medium | medium | majority |
| PLEXUS-GEN-029 | Edwards syndrome physical findings | easy | **medium** | easy (1) | medium | medium | majority |
| PLEXUS-GEN-030 | Down syndrome congenital associations | medium | **easy** | medium (2) | easy | easy | majority |
| PLX-BCH-001 | Thiamine-dependent enzymes | medium | **easy** | easy (1.5) | easy |  | confirmed |
| PLX-BCH-005 | Gluconeogenesis bypass enzymes | medium | **easy** | medium (2) | easy | easy | majority |
| PLX-BCH-007 | Fibrillar collagen types | easy | **medium** | easy (0.5) | hard | hard | override |
| PLX-BCH-011 | Enzymes requiring copper | hard | **medium** | hard (3) | medium | medium | majority |
| PLX-BCH-015 | Glycogen storage diseases with hepatic involvement | medium | **hard** | medium (2) | hard | hard | majority |
| PLX-BCH-016 | Neurotransmitters formed through B6-dependent decarboxylation | medium | **hard** | hard (2.75) | hard | hard | majority |
| PLX-BCH-022 | Findings associated with primary ciliary dyskinesia | hard | **medium** | hard (3.5) | easy | easy | override |
| PLX-BCH-024 | Characteristic clues for Tay-Sachs disease | easy | **medium** | easy (1.25) | medium | medium | majority |
| PLX-BCH-025 | Classic Fabry disease associations | medium | **easy** | medium (2) | easy | easy | majority |
| PLX-BCH-030 | Characteristic Menkes disease clues | hard | **medium** | hard (3.5) | medium | medium | majority |
| PLX-BCH-031 | Classic Marfan syndrome associations | easy | **medium** | medium (1.5) | easy | easy | majority |
| PLX-BCH-036 | Processes using SAM methyl donation | hard | **medium** | hard (3.25) | medium | medium | majority |
| PLX-BCH-037 | Classic homocystinuria clinical associations | easy | **medium** | medium (1.5) | medium |  | confirmed |
| PLX-BCH-039 | Metabolic consequences of ethanol-driven NADH excess | hard | **medium** | hard (3.75) | medium | medium | majority |
| PLX-BCH-040 | Glycogen storage diseases with muscle involvement | medium | **hard** | medium (2) | hard | hard | majority |
| PLX-BCH-044 | Extrahepatic tissues that can oxidize ketone bodies | hard | **medium** | hard (3.75) | medium | medium | majority |
| PLX-BCH-046 | Familial hypercholesterolemia clues | medium | **easy** | medium (2) | easy | easy | majority |
| PLX-BCH-049 | Classic phenylketonuria presentation clues | medium | **easy** | medium (2) | easy | easy | majority |
| PLX-BCH-055 | Precipitants of acute intermittent porphyria attacks | hard | **medium** | hard (3.5) | medium | medium | majority |
| PLX-BCH-058 | Chronic vitamin A toxicity findings | hard | **medium** | hard (3) | medium | medium | majority |
| PLX-BCH-062 | Vitamin B6 deficiency manifestations | hard | **medium** | hard (3.5) | medium | medium | majority |
| PLX-BCH-065 | Classic zinc deficiency findings | hard | **medium** | hard (3) | medium | medium | majority |
| PLX-BCH-066 | Polar uncharged amino acid side chains | hard | **medium** | hard (3) | medium |  | override |
| PLX-BCH-067 | Amino acids that are both glucogenic and ketogenic | hard | **medium** | hard (3.5) | medium | medium | majority |
| PLX-BCH-072 | Enzymes with vitamin B6 cofactor requirements | hard | **medium** | hard (3) | medium | medium | majority |
| PLX-BCH-074 | Proteins supporting long-chain fatty acid mitochondrial entry | easy | **medium** | easy (0.5) | medium | medium | majority |
| PLX-HEM-006 | Oxidative triggers in G6PD deficiency | medium | **easy** | medium (2) | easy | easy | majority |
| PLX-HEM-013 | Sickle-cell disease smear findings | easy | **medium** | easy (1) | medium | medium | majority |
| PLX-HEM-019 | Lead-toxicity clinical clues | medium | **easy** | medium (2) | easy | easy | majority |
| PLX-HEM-037 | Inherited venous-thrombophilia mechanisms | medium | **easy** | medium (2) | easy | easy | majority |
| PLX-HEM-040 | DIC laboratory pattern | medium | **easy** | medium (2) | easy | easy | majority |
| PLX-HEM-044 | Purine-analogue agents | hard | **medium** | hard (3.5) | medium | medium | majority |
| PLX-HEM-048 | DNA-crosslinking cytotoxic agents | hard | **medium** | hard (3) | medium | medium | majority |
| PLX-HEM-050 | Tumor-associated signaling kinases | hard | **medium** | hard (3) | medium | medium | majority |
| PLX-HEM-056 | Hairy-cell-leukemia clues | easy | **medium** | easy (1.5) | medium | medium | majority |
| PLX-HEM-057 | CLL-associated findings | easy | **medium** | easy (1.25) | medium | medium | majority |
| PSY-010 | Classic opioid withdrawal findings | medium | **easy** | medium (2) | easy | easy | majority |
| PSY-018 | High-potency first-generation antipsychotics | hard | **medium** | hard (3.5) | medium | medium | majority |
| PSY-019 | Antipsychotic-associated extrapyramidal movement disorders | medium | **easy** | medium (2) | easy | easy | majority |
| PULM-001 | Drugs associated with pulmonary fibrosis | medium | **easy** | medium (2) | easy | easy | majority |
| PULM-007 | Conditions that lower lung compliance | hard | **medium** | hard (3.75) | medium | medium | majority |
| PULM-010 | Hypoxemia mechanisms responsive to supplemental oxygen | medium | **hard** | hard (2.75) | hard | hard | majority |
| REPRO-004 | Structural abnormalities associated with Turner syndrome | easy | **medium** | easy (1) | medium | medium | majority |
| REPRO-011 | The four etiologic groups of postpartum hemorrhage (4 Ts) | easy | **medium** | easy (0.5) | medium | medium | majority |
| REPRO-015 | States of prolonged unopposed estrogen exposure | hard | **medium** | hard (3.75) | medium | medium | majority |
| REPRO-021 | GnRH receptor agonists | easy | **medium** | easy (0.5) | medium | medium | majority |
| REPRO-025 | Bacterial pathogens of infectious epididymitis | hard | **medium** | hard (3) | medium | medium | majority |

