# Player explanations: review list

Fuller connection explanations and per-tile notes. Only eligible entries are served (by `activate.mjs`); drafts and stale entries never reach players. To review: `node scripts/library/explanations.mjs export review.csv`, send the sheet through the usual review, fill **Verification Status** (and Reviewer / Notes), then `import` it and re-run `activate.mjs`.

Counts: draft 56 · eligible 7

Served (7): GI-033, GI-043, MSK-001, NEU-052, PLX-BCH-008, PSY-006, PULM-001

## Waiting for review or a fix

### CARD-024: Settings in which an S3 may be heard
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: The source lists a physiologic S3 in pregnancy and pathologic S3 associations in volume-loaded or systolically failing ventricles.

**Detail (draft):** An S3 is a low-pitched early diastolic sound produced as blood rapidly fills the ventricle. It can be physiologic in pregnancy and in children and young adults, but in older patients it usually signals a dilated, volume-overloaded or systolically failing ventricle, as in systolic heart failure or significant chronic mitral or aortic regurgitation. Not every S3 means heart failure.

- **Pregnancy:** Pregnancy increases blood volume and cardiac output, so rapid early ventricular filling can produce an S3 in a healthy woman. Here the S3 is physiologic rather than a sign of disease.
- **Systolic heart failure:** In systolic heart failure (reduced ejection fraction) the ventricle is dilated and has elevated filling pressures. An S3 in this setting is a pathologic sign of volume overload and ventricular dysfunction.
- **Mitral regurgitation:** Mitral regurgitation is backflow of blood from the left ventricle into the left atrium during systole. When significant and chronic, the extra volume returning to the ventricle in early diastole can generate an S3.
- **Aortic regurgitation:** In aortic regurgitation, blood leaks back from the aorta into the left ventricle during diastole. Significant chronic regurgitation volume-loads and dilates the ventricle, which can produce an S3.

### CARD-029: Atrial fibrillation clues
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: Uncoordinated atrial activity explains absent organized atrial signals, irregular ventricular timing and the source-described pulmonary vein trigger sites.

**Detail (draft):** In atrial fibrillation, disorganized atrial electrical activity replaces coordinated atrial contraction. This explains the loss of organized atrial signals (P waves on ECG and a waves in the jugular venous pulse) and the irregular ventricular response, while ectopic foci near the pulmonary vein ostia are recognized triggers. The ECG clues assume conducted AF rather than a paced rhythm or complete heart block.

- **Irregularly spaced R waves:** R waves mark ventricular depolarization on the ECG. In atrial fibrillation, chaotic atrial impulses reach the ventricles at random, giving the classic irregularly irregular R-R intervals when AV conduction is intact.
- **Absent discrete P waves:** P waves represent coordinated atrial depolarization. In atrial fibrillation, discrete P waves are absent and the baseline may show fine or coarse fibrillatory waves instead.
- **Absent jugular a waves:** The a wave of the jugular venous pulse is produced by right atrial contraction. Because the atria fibrillate rather than contract effectively, the a wave disappears in atrial fibrillation.
- **Pulmonary vein ostial triggers:** Muscle sleeves where the pulmonary veins enter the left atrium can generate rapid ectopic impulses that trigger atrial fibrillation. This is why pulmonary vein isolation is the central strategy in catheter ablation for AF.

### CARD-037: Complications of myocardial infarction
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: Ventricular arrhythmia and the three mechanical ruptures (papillary muscle, interventricular septum, LV free wall) are recognized post-MI complications that occur on distinct timelines: arrhythmias may be early, whereas mechanical ruptures typically present about 3-5 days after a transmural infarct. The grouping does not imply a shared day of onset.

**Detail (draft):** All four are recognized complications of myocardial infarction, but they occur on different timelines. Ventricular arrhythmias are a major cause of death early after MI, whereas the three mechanical ruptures typically present about 3 to 5 days after a transmural infarct, when necrotic tissue is weakest. A sudden new murmur, hypotension or shock in the days after an MI should raise concern for rupture.

- **Ventricular arrhythmia:** Ventricular tachycardia and ventricular fibrillation can arise from ischemic, electrically unstable myocardium. They are an important cause of sudden death, especially in the early hours after an infarct.
- **Papillary muscle rupture:** Rupture of a papillary muscle, most often the posteromedial one, detaches mitral valve support. The result is acute severe mitral regurgitation with pulmonary edema and a new murmur.
- **Interventricular septal rupture:** A rupture in the interventricular septum creates an acquired ventricular septal defect with left-to-right shunting. It typically presents with a new holosystolic murmur and heart failure or shock.
- **LV free wall rupture:** Rupture of the left ventricular free wall lets blood escape into the pericardial sac. This causes hemopericardium and cardiac tamponade, which is frequently fatal.

### CARD-042: Chronic venous insufficiency findings
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: Failed venous valves and elevated venous hydrostatic pressure connect these source-listed findings.

**Detail (draft):** In chronic venous insufficiency, failed venous valves allow reflux, and the resulting sustained venous hypertension in the legs underlies each of these findings. High pressure dilates superficial veins, pushes fluid and red cells into the tissues, and produces edema and skin changes concentrated around the medial ankle. Duplex ultrasound confirms reflux, while the other findings are recognized on examination.

- **Varicose superficial veins:** Varicose superficial veins are dilated, tortuous veins just under the skin, typically of the legs. They develop when incompetent valves let blood pool and distend the vein wall under high pressure.
- **Brown medial ankle skin:** Brown medial ankle skin is hemosiderin hyperpigmentation: red cells leak from congested capillaries and their iron-containing breakdown product stains the skin. The medial ankle is also a classic site for venous ulcers.
- **Venous reflux on ultrasound:** Venous reflux on ultrasound means duplex imaging shows blood flowing backward through incompetent valves. It is a diagnostic test rather than a bedside sign, and it identifies which veins are affected.
- **Leg swelling improved by elevation:** Leg swelling improved by elevation reflects edema driven by gravity-dependent venous pressure, typically worse after standing and at day's end. Raising the leg lowers that pressure, which is why elevation and compression are core treatments.

### CARD-052: Typical changes during dynamic exercise
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: The source describes sympathetic cardiac stimulation and enhanced venous return alongside vasodilation in active skeletal muscle.

**Detail (draft):** During dynamic (aerobic) exercise such as running or cycling, sympathetic activation raises heart rate and contractility, while the skeletal muscle pump and venoconstriction increase venous return. At the same time, metabolic vasodilation in working muscle lowers systemic vascular resistance, so cardiac output rises substantially. This pattern applies to dynamic exercise and does not generalize to sustained isometric exercise.

- **Increased heart rate:** Heart rate is the number of beats per minute. In dynamic exercise it rises through reduced vagal tone and increased sympathetic stimulation of the SA node, a major contributor to the rise in cardiac output.
- **Increased contractility:** Contractility is the intrinsic strength of myocardial contraction independent of preload and afterload. Sympathetic beta-1 stimulation increases it during dynamic exercise, raising stroke volume.
- **Increased venous return:** Venous return is the flow of blood back to the right heart. Rhythmic contraction of exercising muscles squeezes veins (the muscle pump), and sympathetic venoconstriction helps, so more blood returns to fill the heart.
- **Reduced systemic vascular resistance:** Systemic vascular resistance is the total resistance of the systemic arterioles to flow. In dynamic exercise, local metabolites dilate arterioles in active skeletal muscle, which lowers overall resistance despite sympathetic constriction elsewhere.

### DERM-007: Clinical forms of VZV infection
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: VZV causes primary varicella and can later reactivate as zoster, including ophthalmic and otic forms.

**Detail (draft):** Varicella zoster virus (VZV) causes primary varicella (chickenpox), then establishes latency in sensory ganglia. It can later reactivate as herpes zoster (shingles), which includes dermatomal forms with specific complications such as herpes zoster ophthalmicus and herpes zoster oticus. Recognizing these forms matters because ophthalmic and otic involvement can threaten vision, hearing and facial nerve function.

- **Varicella:** Varicella (chickenpox) is the primary VZV infection, with fever and an itchy rash of vesicles in crops at different stages. Afterward the virus stays latent in sensory ganglia.
- **Herpes zoster:** Herpes zoster (shingles) is reactivation of latent VZV, causing a painful vesicular rash in a dermatomal distribution, usually unilateral. Postherpetic neuralgia is a common complication, especially in older adults.
- **Herpes zoster ophthalmicus:** Herpes zoster ophthalmicus is zoster in the ophthalmic division (V1) of the trigeminal nerve. It can involve the eye (for example keratitis or uveitis); vesicles on the nasal tip (Hutchinson sign) suggest higher risk of ocular involvement.
- **Herpes zoster oticus:** Herpes zoster oticus (Ramsay Hunt syndrome) is VZV reactivation in the geniculate ganglion. It classically causes ear pain, vesicles in the ear canal or auricle, and ipsilateral facial nerve palsy.

### DERM-008: High-risk oncogenic HPV types
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: The source lists these HPV types among those associated with cervical cancer risk. The set is not an exhaustive list of high-risk HPV types.

**Detail (draft):** HPV 16, 18, 31 and 33 are high-risk (oncogenic) human papillomavirus types associated with cervical cancer and other anogenital and oropharyngeal cancers. Their E6 and E7 proteins inactivate the tumor suppressors p53 and Rb, respectively. All four are covered by the nonavalent vaccine, but they are not the full list of high-risk types and are not the usual cause of ordinary cutaneous warts.

- **HPV 16:** HPV 16 is the highest-risk HPV type and the one most often found in cervical cancer. It is also strongly linked to HPV-associated oropharyngeal squamous cell carcinoma.
- **HPV 18:** HPV 18 is the second most important oncogenic type in cervical cancer. It is particularly associated with cervical adenocarcinoma, and is targeted by all HPV vaccines along with HPV 16.
- **HPV 31:** HPV 31 is a high-risk type carrying a lower cancer risk than HPV 16 or 18. It is one of the additional oncogenic types covered by the nonavalent HPV vaccine.
- **HPV 33:** HPV 33 is another high-risk type of intermediate oncogenic potential relative to HPV 16 and 18. Like HPV 31, it is included in the nonavalent vaccine to broaden protection against cervical cancer.

### DERM-014: Rhino-orbital mucormycosis clues
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: The source links destructive sinonasal disease with broad fungal hyphae, wide-angle branching, and amphotericin B treatment in mucormycosis.

**Detail (draft):** Rhino-orbital mucormycosis is an aggressive, angioinvasive fungal infection seen especially in diabetic ketoacidosis and immunosuppression. It classically causes necrotic sinonasal or palatal tissue, and tissue shows broad, ribbon-like, pauciseptate hyphae with wide-angle branching. Amphotericin B is the standard initial antifungal, but it does not replace urgent surgical debridement and correction of the underlying condition.

- **Necrotic nasal or palatal eschar:** An eschar is a dark, dead crust of tissue. Mucorales fungi invade blood vessels and cause infarction, so a black necrotic eschar on the nasal mucosa or palate is a classic warning sign.
- **Broad pauciseptate hyphae:** Mucorales hyphae are broad and ribbon-like with few or no septa (pauciseptate). This contrasts with Aspergillus, whose hyphae are narrow and regularly septate, and the broad ribbon-like shape is the more reliable clue.
- **Wide-angle branching:** Mucormycosis hyphae are classically taught to branch at wide angles, approaching 90 degrees, unlike the acute-angle branching of Aspergillus. In tissue this angle can be hard to judge, so it supports rather than secures the diagnosis.
- **Amphotericin B:** Amphotericin B is a polyene antifungal that binds ergosterol in fungal membranes and forms pores; nephrotoxicity is its classic toxicity. It is the standard initial drug for mucormycosis, given alongside urgent surgical debridement.

### ENDO-009: Interventions used to treat acromegaly
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: Removing the adenoma, suppressing GH with a somatostatin analogue or dopamine agonist, and blocking the GH receptor are treatment approaches listed for acromegaly.

**Detail (draft):** Acromegaly is caused by excess growth hormone, usually from a pituitary adenoma, after the growth plates have closed. Treatment aims to remove the tumor or control GH and IGF-1: transsphenoidal resection is first-line, while somatostatin analogues, dopamine agonists and GH receptor antagonists are medical options when surgery is not curative or not possible.

- **Pituitary adenoma resection:** Pituitary adenoma resection, usually via a transsphenoidal approach, removes the GH-secreting tumor. It is the first-line treatment for acromegaly and can be curative.
- **Octreotide:** Octreotide is a somatostatin analogue that inhibits GH secretion from the pituitary adenoma. It is a mainstay of medical therapy, and gallstones are a well-known adverse effect.
- **Pegvisomant:** Pegvisomant is a GH receptor antagonist that blocks GH action and lowers IGF-1 without reducing GH secretion. Treatment response is therefore monitored with IGF-1 rather than GH levels.
- **Cabergoline:** Cabergoline is a dopamine (D2) agonist that can modestly suppress GH secretion. It is less potent than somatostatin analogues and is used as an adjunctive option, especially in milder disease.

### ENDO-012: Characteristic associations of Graves disease
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: Receptor-stimulating antibodies increase thyroid activity; orbital and pretibial tissue changes and diffuse gland uptake are characteristic Graves associations.

**Detail (draft):** Graves disease is an autoimmune disorder in which antibodies stimulate the TSH receptor, driving excess thyroid hormone production and a diffusely enlarged, overactive gland. Receptor-related autoimmunity also affects orbital and pretibial connective tissue, causing eye and skin changes that are specific to Graves among causes of hyperthyroidism, although not every patient develops them. Diffusely increased radioiodine uptake helps distinguish Graves from nodular disease and thyroiditis.

- **TSH-receptor stimulating antibodies:** TSH-receptor stimulating antibodies (thyroid-stimulating immunoglobulins) bind and activate the TSH receptor, mimicking TSH. They cause the hyperthyroidism of Graves disease and are a classic example of type II hypersensitivity with stimulatory antibodies.
- **Exophthalmos:** Exophthalmos is forward protrusion of the eyes, here caused by inflammation and glycosaminoglycan deposition in orbital tissue and extraocular muscles. It is a feature of Graves orbitopathy, which not all patients have.
- **Pretibial myxedema:** Pretibial myxedema is a non-pitting, thickened, sometimes orange-peel textured skin change over the shins from glycosaminoglycan deposition. It is a characteristic but relatively uncommon Graves dermopathy.
- **Diffuse increased radioiodine uptake:** Diffuse increased radioiodine uptake means the whole gland takes up more iodine than normal on a thyroid scan, reflecting uniform antibody-driven stimulation. This contrasts with patchy uptake in toxic multinodular goiter and low uptake in thyroiditis.

### ENDO-020: Classic clinical consequences of hypercalcemia
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: The source associates elevated calcium with stone disease, slowed intestinal transit, skeletal pain and psychiatric or cognitive symptoms.

**Detail (draft):** Kidney stones, constipation, bone pain and neuropsychiatric symptoms are classic consequences of elevated serum calcium, summarized by the mnemonic "stones, bones, groans and psychiatric overtones." How prominent they are depends on the severity and chronicity of the hypercalcemia. Primary hyperparathyroidism and malignancy are the most common underlying causes.

- **Calcium kidney stones:** Hypercalcemia increases the amount of calcium filtered and excreted in the urine (hypercalciuria). This favors formation of calcium-containing kidney stones, such as calcium oxalate or calcium phosphate stones.
- **Constipation:** Constipation is infrequent or difficult passage of stool. High calcium reduces neuromuscular excitability and slows gut smooth-muscle activity, giving the "groans" of abdominal discomfort.
- **Bone pain:** Bone pain in hypercalcemia often reflects increased bone resorption, as in hyperparathyroidism (where severe cases cause osteitis fibrosa cystica) or bone involvement by malignancy. These are the "bones" of the mnemonic.
- **Neuropsychiatric disturbances:** Neuropsychiatric disturbances range from fatigue, depression and poor concentration to confusion, and in severe hypercalcemia stupor or coma. They are the "psychiatric overtones" of the mnemonic.

### ENDO-021: Calcium-raising and phosphate-lowering actions of PTH
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: PTH conserves renal calcium, promotes phosphaturia, stimulates calcitriol formation and indirectly increases osteoclast-mediated resorption through osteoblast-lineage cells.

**Detail (draft):** Parathyroid hormone (PTH) raises serum calcium and lowers serum phosphate through four core actions: increased distal tubular calcium reabsorption, phosphaturia, stimulation of renal 1-alpha-hydroxylase to form calcitriol, and bone resorption. The bone effect is indirect, as PTH acts on osteoblast-lineage cells to increase RANKL, which activates osteoclasts. Sustained PTH signaling favors resorption, which explains bone loss in hyperparathyroidism.

- **Increased renal calcium reabsorption:** PTH increases calcium reabsorption mainly in the distal convoluted tubule. This reduces urinary calcium loss and helps raise serum calcium.
- **Increased urinary phosphate excretion:** PTH inhibits sodium-phosphate cotransport in the proximal tubule, causing phosphaturia. This lowers serum phosphate, preventing calcium phosphate precipitation as calcium rises.
- **Increased renal 1-alpha-hydroxylase activity:** Renal 1-alpha-hydroxylase converts 25-hydroxyvitamin D to active 1,25-dihydroxyvitamin D (calcitriol). PTH stimulates this enzyme, and calcitriol then increases intestinal calcium absorption.
- **Increased osteoclast-mediated bone resorption:** Osteoclasts are bone-resorbing cells, but they are not the direct target of PTH. PTH acts on osteoblast-lineage cells to increase RANKL, which drives osteoclast activity when PTH is sustained.

### GI-003: Tongue muscles innervated by CN XII
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: The hypoglossal nerve (CN XII) innervates all intrinsic tongue muscles and all extrinsic tongue muscles except palatoglossus, which receives vagal (pharyngeal plexus) motor supply.

**Detail (draft):** The hypoglossal nerve (CN XII) supplies motor fibers to all intrinsic tongue muscles and to every extrinsic tongue muscle except palatoglossus, which is supplied by the vagus nerve via the pharyngeal plexus. A unilateral CN XII lesion classically causes the protruded tongue to deviate toward the side of the lesion, a frequently tested localizing sign.

- **Genioglossus:** Genioglossus is the fan-shaped extrinsic muscle that protrudes the tongue. Weakness of one genioglossus from a CN XII lesion explains why the tongue deviates toward the weak side on protrusion.
- **Hyoglossus:** Hyoglossus is an extrinsic muscle running from the hyoid bone to the side of the tongue that depresses and retracts it. Like the other extrinsic muscles except palatoglossus, it is innervated by CN XII.
- **Styloglossus:** Styloglossus arises from the styloid process and pulls the tongue upward and backward, for example during swallowing. It receives its motor supply from the hypoglossal nerve.
- **Intrinsic tongue muscles:** The intrinsic tongue muscles (longitudinal, transverse and vertical fibers) lie entirely within the tongue and change its shape rather than its position. All of them are supplied by CN XII.

### GI-004: Systemic diseases associated with recurrent aphthous oral ulcers
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: Each of these systemic conditions is associated with recurrent aphthous ulceration. Oral ulcers can occur in each but are not sufficient alone to diagnose any of them.

**Detail (draft):** Behcet disease, celiac disease, inflammatory bowel disease and systemic lupus erythematosus are all associated with recurrent aphthous oral ulcers. Recognizing the link can prompt a search for an underlying systemic disease in a patient with recurrent mouth ulcers. The association is not universal, and oral ulcers alone are not enough to diagnose any of these conditions.

- **Behcet disease:** Behcet disease is a systemic vasculitis affecting vessels of varying sizes. Recurrent oral aphthous ulcers are a central feature, classically with genital ulcers and uveitis.
- **Celiac disease:** Celiac disease is an immune reaction to gluten that damages the small intestinal mucosa. Recurrent aphthous ulcers are a recognized extraintestinal manifestation.
- **Inflammatory bowel disease:** Inflammatory bowel disease includes Crohn disease and ulcerative colitis. Oral aphthous ulcers are a recognized extraintestinal manifestation, seen more often with Crohn disease.
- **Systemic lupus erythematosus:** Systemic lupus erythematosus is a multisystem autoimmune disease. Oral ulcers, often painless and on the palate, are one of its classic mucocutaneous features.

### GI-009: Conditions predisposing to gastroesophageal reflux
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: These promote GERD through distinct mechanisms: increased intra-abdominal pressure (obesity, pregnancy), disruption of the gastroesophageal junction barrier (sliding hiatal hernia), and low LES tone/dysmotility (scleroderma).

**Detail (draft):** Obesity, pregnancy, sliding hiatal hernia and scleroderma all predispose to gastroesophageal reflux disease, but through different mechanisms rather than one shared effect on the lower esophageal sphincter (LES). Obesity and pregnancy raise intra-abdominal pressure, a sliding hiatal hernia disrupts the gastroesophageal junction barrier, and scleroderma lowers LES tone and impairs esophageal motility.

- **Obesity:** Obesity, especially central adiposity, increases intra-abdominal pressure. This pushes gastric contents against the gastroesophageal junction and favors reflux.
- **Pregnancy:** Pregnancy raises intra-abdominal pressure as the uterus enlarges. Heartburn is a very common complaint, particularly later in pregnancy.
- **Sliding hiatal hernia:** A sliding hiatal hernia is displacement of the gastroesophageal junction and upper stomach through the diaphragmatic hiatus into the chest. Loss of the normal diaphragmatic support weakens the antireflux barrier.
- **Scleroderma:** Scleroderma (systemic sclerosis) causes smooth muscle atrophy and fibrosis of the lower esophagus. The result is low LES tone and weak peristalsis, so refluxed acid is poorly cleared.

### GI-014: Consequences of parietal-cell autoimmunity
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: Autoimmune destruction of parietal cells causes loss of intrinsic factor (and B12 malabsorption) and oxyntic (body/fundic) atrophic gastritis, which carries increased risk of gastric adenocarcinoma and type 1 gastric carcinoid.

**Detail (draft):** In autoimmune gastritis, the immune system destroys parietal cells of the gastric body and fundus. Loss of these cells removes intrinsic factor, leading to vitamin B12 malabsorption (pernicious anemia), and produces atrophic gastritis of the acid-secreting mucosa. This chronic atrophy increases, but does not guarantee, the risk of gastric adenocarcinoma and type 1 gastric carcinoid tumors.

- **Intrinsic factor deficiency:** Intrinsic factor is a glycoprotein secreted by parietal cells that binds vitamin B12 and allows its uptake. Autoantibodies and parietal cell destruction cause its deficiency in pernicious anemia.
- **Vitamin B12 malabsorption:** Vitamin B12 is absorbed in the terminal ileum only when bound to intrinsic factor. Without intrinsic factor, B12 malabsorption leads to megaloblastic anemia and can cause neurologic damage such as subacute combined degeneration.
- **Atrophic gastritis:** Atrophic gastritis is chronic inflammation with loss of gastric glands. In the autoimmune form it targets the body and fundus while sparing the antrum, causing reduced acid production and high gastrin levels.
- **Increased gastric malignancy risk:** Chronic atrophic gastritis carries an increased risk of gastric adenocarcinoma, and high gastrin drives enterochromaffin-like cell growth that can lead to type 1 carcinoid tumors. This risk is raised but most patients do not develop cancer.

### GI-023: Therapies that reduce copper burden in Wilson disease
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: Chelators (penicillamine, trientine) promote urinary copper excretion; zinc salts induce enterocyte metallothionein to block copper uptake; dietary restriction reduces intake. All lower body copper burden.

**Detail (draft):** Wilson disease results from ATP7B mutations that impair biliary copper excretion, so copper accumulates in the liver, brain, and cornea. Each of these therapies lowers body copper burden, but by different mechanisms: chelators increase urinary excretion, zinc blocks intestinal absorption, and diet limits intake. They have different roles and are not interchangeable, nor are they all used together, and treatment is lifelong.

- **Penicillamine:** Penicillamine is a copper chelator that binds copper and increases its excretion in urine. It is effective but has frequent adverse effects, including hypersensitivity reactions, proteinuria, and bone marrow suppression.
- **Trientine:** Trientine is another copper chelator that promotes urinary copper excretion. It is commonly used as an alternative to penicillamine, particularly when penicillamine is not tolerated.
- **Zinc salts:** Zinc salts induce metallothionein in intestinal cells; this protein binds dietary copper, which is then lost in stool as the cells are shed. Zinc reduces copper absorption rather than removing stored copper and is often used for maintenance.
- **Low-copper diet:** A Low-copper diet means limiting copper-rich foods such as shellfish, organ meats, nuts, chocolate, and mushrooms. It is an adjunct that reduces intake and is not sufficient as the sole treatment.

### GI-047: VIPoma (Verner-Morrison) findings
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: VIP-driven intestinal secretion causes profuse secretory watery diarrhea with hypokalemia and achlorhydria (WDHA / Verner-Morrison syndrome); weight loss accompanies the catabolic state.

**Detail (draft):** VIPoma is a pancreatic neuroendocrine tumor that secretes vasoactive intestinal peptide (VIP), which drives intestinal fluid and electrolyte secretion. The specific triad is watery diarrhea, hypokalemia and achlorhydria (WDHA, or Verner-Morrison syndrome), while weight loss is a nonspecific accompaniment. Large-volume diarrhea that persists despite fasting points to a secretory cause such as VIPoma.

- **Profuse watery diarrhea:** VIP stimulates intestinal secretion of water and electrolytes, producing large-volume secretory diarrhea. Unlike osmotic diarrhea, it continues even when the patient is fasting.
- **Hypokalemia:** Hypokalemia is a low serum potassium level. In VIPoma, large amounts of potassium are lost in the stool, which can cause muscle weakness and cardiac arrhythmias.
- **Achlorhydria:** Achlorhydria is absent or very low gastric acid secretion. VIP inhibits acid production by the stomach, completing the WDHA triad (some patients have reduced rather than absent acid).
- **Weight loss:** Weight loss commonly accompanies VIPoma due to fluid losses and the catabolic state of the disease. It is a nonspecific finding and does not help distinguish VIPoma from other causes of chronic diarrhea.

### IMM-001: Secondary lymphoid tissues
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: These are sites where mature lymphocytes encounter antigen and mount adaptive responses, rather than the primary sites of lymphocyte development.

**Detail (draft):** The spleen, lymph nodes, Peyer's patches and tonsils are secondary (peripheral) lymphoid tissues. Lymphocytes develop in the primary lymphoid organs, the bone marrow and thymus, and then circulate to secondary tissues, where mature lymphocytes meet antigen and mount adaptive immune responses. Each secondary tissue samples antigen from a different compartment, such as blood, lymph or mucosal surfaces.

- **Spleen:** The spleen filters blood: its white pulp contains lymphocytes that respond to bloodborne antigens, and its red pulp removes old red cells. Loss of the spleen raises the risk of infection by encapsulated bacteria.
- **Lymph nodes:** Lymph nodes filter lymph draining from tissues. B cells cluster in follicles in the cortex and T cells in the paracortex, where they encounter antigen carried in by dendritic cells.
- **Peyer's patches:** Peyer's patches are lymphoid aggregates in the wall of the small intestine, most prominent in the ileum. M cells deliver gut antigens to underlying lymphocytes, promoting IgA responses.
- **Tonsils:** Tonsils are collections of mucosa-associated lymphoid tissue in the pharynx, forming part of Waldeyer ring. They sample inhaled and ingested antigens entering through the mouth and nose.

### IMM-014: IgE-associated immune events
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: IgE binds high-affinity receptors on mast cells; allergen crosslinking can trigger immediate hypersensitivity, while IgE also participates in defense against helminths.

**Detail (draft):** IgE binds with high affinity to Fc epsilon receptor I on mast cells and basophils, sensitizing these cells. When a multivalent allergen later crosslinks the bound IgE, the cells degranulate within minutes, producing type I (immediate) hypersensitivity such as allergic rhinitis, asthma, or anaphylaxis. The same IgE-based system also contributes to host defense against helminths, together with eosinophils.

- **Mast-cell Fc receptor binding:** Mast-cell Fc receptor binding refers to the Fc portion of IgE attaching to the high-affinity receptor Fc epsilon RI on mast cells and basophils. This arms the cells in advance, so IgE sits on them even without antigen present.
- **Allergen-induced crosslinking:** Allergen-induced crosslinking occurs when an allergen bridges two or more receptor-bound IgE molecules. This triggers signaling that releases preformed mediators such as histamine and starts synthesis of leukotrienes and prostaglandins.
- **Type I hypersensitivity:** Type I hypersensitivity is the immediate, IgE-mediated allergic reaction that requires prior sensitization and begins within minutes of re-exposure. A late-phase reaction can follow hours later as recruited inflammatory cells arrive.
- **Helminth defense:** Helminth defense is a physiologic role of IgE: Th2 responses, driven by IL-4, promote class switching to IgE in parasitic worm infection. IgE coating the parasite helps eosinophils target it, which is why worm infections often raise IgE and eosinophil counts.

### IMM-016: C1-inhibitor deficiency angioedema clues
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: Hereditary C1-inhibitor deficiency causes excess bradykinin, reduced C4 and recurrent non-pitting edema that can involve the intestinal wall.

**Detail (draft):** Hereditary angioedema due to C1-inhibitor deficiency is an autosomal dominant disorder (SERPING1 gene) in which unchecked kallikrein activity generates excess bradykinin. Uncontrolled C1 activity consumes C4 (a useful screening clue), and attacks cause recurrent non-pitting swelling without hives, including bowel-wall edema and potentially fatal laryngeal edema. This differs from hereditary angioedema with normal C1 inhibitor, in which C4 is normal.

- **Autosomal dominant inheritance:** Autosomal dominant inheritance means one abnormal copy of the gene is enough to cause disease. Hereditary C1-inhibitor deficiency follows this pattern, so a family history of unexplained swelling is a clue.
- **Increased bradykinin:** Bradykinin is a peptide that dilates vessels and increases vascular permeability. Without C1 inhibitor to restrain kallikrein, bradykinin accumulates and drives the swelling, which is why antihistamines are ineffective.
- **Low C4:** C4 is a complement protein cleaved by activated C1. Without C1 inhibitor, C4 is continuously consumed, so a low C4 level is a classic screening finding.
- **Recurrent bowel-wall edema:** Edema of the intestinal wall causes episodes of severe, crampy abdominal pain, sometimes with vomiting. These attacks can mimic a surgical abdomen and are a classic presentation of this disorder.

### IMM-026: STAT3 hyper-IgE syndrome clues
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: STAT3-related hyper-IgE syndrome combines a characteristic immune defect with eczema, high IgE and recurrent abscesses that may show little overt inflammation.

**Detail (draft):** STAT3 hyper-IgE syndrome (Job syndrome) is an autosomal dominant loss-of-function disorder that impairs Th17 cell development and neutrophil recruitment. It classically presents with eczema, markedly elevated IgE and recurrent staphylococcal abscesses that show little warmth or redness. It should be distinguished from DOCK8 deficiency, and cold abscesses are characteristic but not mandatory.

- **STAT3 mutation:** STAT3 is a signaling protein downstream of several cytokine receptors. Dominant loss-of-function mutations impair Th17 differentiation and IL-17 production, weakening neutrophil-mediated defense of the skin and lungs.
- **Cold abscesses:** Cold abscesses are collections of pus, often due to Staphylococcus aureus, that lack the usual warmth, redness and pain. They are characteristic of STAT3 hyper-IgE syndrome, though not present in every patient.
- **Eczema:** Eczema is an itchy, inflamed, scaly rash. In STAT3 hyper-IgE syndrome it often begins early in life and can become secondarily infected.
- **Elevated IgE:** Serum IgE is typically very high in this syndrome, often far above levels seen in ordinary atopy. The elevation is a defining laboratory clue but is not specific on its own.

### MICRO-025: Pneumocystis pneumonia associations
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: P. jirovecii pneumonia is a key opportunistic infection in advanced HIV, causing subacute exertional dyspnea and diffuse ground-glass opacities. TMP-SMX is the classic prophylactic agent in appropriate patients.

**Detail (draft):** Pneumocystis jirovecii pneumonia is a key opportunistic infection in advanced HIV, classically when the CD4 count falls below 200 cells/uL. It typically causes subacute, progressive exertional dyspnea with bilateral ground-glass opacities on imaging. TMP-SMX is the classic agent for prophylaxis in appropriate patients, although the CD4 threshold is a teaching rule rather than the full prophylaxis algorithm.

- **CD4 count below 200 cells/uL:** CD4 count below 200 cells/uL indicates advanced immunosuppression in HIV infection. It is the classic teaching threshold at which Pneumocystis pneumonia risk rises and prophylaxis is considered.
- **Progressive exertional dyspnea:** Progressive exertional dyspnea is shortness of breath with activity that worsens over days to weeks. In Pneumocystis pneumonia it often comes with dry cough, fever and exertional hypoxemia.
- **Bilateral ground-glass lung opacities:** Bilateral ground-glass lung opacities are hazy areas of increased lung density through which vessels remain visible. They are the classic imaging pattern of Pneumocystis pneumonia, though early chest radiographs can be normal.
- **TMP-SMX prophylaxis:** TMP-SMX (trimethoprim-sulfamethoxazole) is the preferred agent for both prophylaxis and treatment of Pneumocystis pneumonia. Prophylaxis also helps protect against toxoplasmosis.

### MICRO-027: Giardiasis clinical and microscopy clues
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: Giardia can follow contaminated-water ingestion, cause nonbloody malabsorptive diarrhea, and be more troublesome with IgA deficiency. Trophozoites have a characteristic paired-nuclear appearance.

**Detail (draft):** These are classic clues to giardiasis, infection of the small intestine by the flagellated protozoan Giardia lamblia (also called G. duodenalis or G. intestinalis). Cysts are acquired from contaminated water, trophozoites attach to the intestinal lining and cause nonbloody malabsorptive diarrhea, and IgA deficiency predisposes to infection. These features raise suspicion, but diagnosis is confirmed by stool testing such as antigen detection, microscopy or PCR.

- **Foul-smelling fatty diarrhea:** Steatorrhea is bulky, greasy, foul-smelling stool caused by fat malabsorption. Giardia interferes with small-bowel absorption, producing this nonbloody diarrhea often accompanied by bloating and flatulence.
- **Camping-water exposure:** Drinking untreated stream or lake water while camping or hiking is a classic exposure. Giardia cysts survive in cold water and resist standard chlorination, so contaminated water is a common route of infection.
- **IgA deficiency:** Selective IgA deficiency is the most common primary immunodeficiency and reduces secretory IgA at mucosal surfaces. Affected patients are prone to Giardia infection, which may be recurrent or persistent.
- **Two-nucleated trophozoites:** Trophozoites are the active, feeding form of the parasite. Giardia trophozoites are pear-shaped and flagellated with two nuclei, giving a characteristic face-like appearance on stool or duodenal microscopy.

### MICRO-038: Parasite infections with ivermectin treatment options
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: Ivermectin has treatment roles in these nematode and ectoparasite infections. Route, patient factors, contraindications, and alternative drugs differ across indications.

**Detail (draft):** Ivermectin acts on glutamate-gated chloride channels in invertebrate nerve and muscle, paralyzing susceptible worms and arthropods, and it has treatment roles in all four of these infections. Its role is not identical across them: route, first-line status, and alternatives differ by indication and patient. Before treating onchocerciasis, clinicians screen for Loa loa co-infection, because treating heavy Loa loa microfilaremia can cause severe reactions.

- **Onchocerciasis:** Onchocerciasis (river blindness) is caused by the filarial worm Onchocerca volvulus, spread by blackfly bites, and causes itchy dermatitis, skin nodules, and eye damage. Ivermectin kills the microfilariae, after screening for Loa loa co-infection.
- **Strongyloidiasis:** Strongyloidiasis is infection with Strongyloides stercoralis, whose larvae penetrate the skin and can persist for years through autoinfection. Ivermectin is the treatment of choice, which matters because corticosteroids or immunosuppression can trigger life-threatening hyperinfection.
- **Scabies:** Scabies is an intensely itchy skin infestation by the burrowing mite Sarcoptes scabiei, classically affecting finger webs and worse at night. Oral ivermectin is an option alongside topical agents such as permethrin, and is often used for crusted scabies or outbreaks.
- **Pediculosis capitis:** Pediculosis capitis is head lice infestation, causing scalp itching with nits attached to hair shafts. Topical ivermectin lotion is an approved treatment, while oral ivermectin is an off-label option, and the two are not interchangeable first-line choices.

### MICRO-041: Viruses with F-protein-mediated cell fusion
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: Their fusion (F) proteins mediate fusion of the viral envelope with host membranes and can drive syncytium formation between infected cells. RSV is now classified in Pneumoviridae rather than Paramyxoviridae.

**Detail (draft):** Measles, mumps, parainfluenza and respiratory syncytial virus all carry a fusion (F) protein that merges the viral envelope with the host cell membrane. The F protein can also fuse neighboring infected cells into multinucleated giant cells (syncytia). Measles, mumps and parainfluenza belong to Paramyxoviridae, whereas RSV is now classified in Pneumoviridae.

- **Measles virus:** Measles virus causes fever, cough, coryza, conjunctivitis, Koplik spots and a spreading maculopapular rash. F-protein-mediated fusion produces the multinucleated giant cells (Warthin-Finkeldey cells) seen in infected tissue.
- **Mumps virus:** Mumps virus classically causes parotitis and can cause orchitis and aseptic meningitis. Its F protein mediates envelope fusion with host cells.
- **Parainfluenza virus:** Parainfluenza virus is the classic cause of croup (laryngotracheobronchitis) in young children, with a barking cough. Like the others, it uses an F protein to fuse with host cell membranes.
- **Respiratory syncytial virus:** Respiratory syncytial virus (RSV) is a leading cause of bronchiolitis in infants and is named for the syncytia it forms in cell culture. Its F protein is the target of the preventive monoclonal antibody palivizumab.

### MICRO-058: Aminoglycoside antibiotics
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: These aminoglycosides act at the 30S ribosome and disrupt translation. Uptake requires oxygen-dependent transport; nephrotoxicity and ototoxicity are key class risks.

**Detail (draft):** Gentamicin, tobramycin, amikacin and streptomycin are aminoglycosides, bactericidal antibiotics that bind the 30S ribosomal subunit and disrupt protein synthesis, causing mRNA misreading. Their uptake into bacteria requires oxygen-dependent transport, so they are ineffective against anaerobes. Nephrotoxicity and ototoxicity are the key class adverse effects, so drug levels and renal function are monitored.

- **Gentamicin:** Gentamicin is a widely used aminoglycoside for serious gram-negative infections. It is also given with a beta-lactam for synergy in some gram-positive infections such as enterococcal endocarditis.
- **Tobramycin:** Tobramycin is an aminoglycoside with good activity against Pseudomonas aeruginosa. It is often given by inhalation to patients with cystic fibrosis.
- **Amikacin:** Amikacin is an aminoglycoside that resists many of the bacterial enzymes that inactivate other aminoglycosides. It is therefore useful for resistant gram-negative organisms and some mycobacterial infections.
- **Streptomycin:** Streptomycin was the first aminoglycoside discovered and is used as a second-line agent for tuberculosis. It is also a classic treatment for plague and tularemia.

### MSK-020: Classic Ewing sarcoma clues
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: Ewing sarcoma often arises in the diaphysis of long bones and shows a lamellated 'onion-skin' periosteal reaction, small round blue cell histology, and the t(11;22) EWSR1-FLI1 fusion in most cases.

**Detail (draft):** Ewing sarcoma is a malignant small round blue cell tumor of bone, seen mostly in children and adolescents. The classic picture combines a diaphyseal long-bone lesion, a lamellated onion-skin periosteal reaction, small round blue cell histology, and the t(11;22) EWSR1-FLI1 fusion found in most cases. None of these is specific alone: other sites and other fusion partners such as EWSR1-ERG occur, so the combination is what points to the diagnosis.

- **Diaphyseal lesion:** The diaphysis is the shaft of a long bone. Ewing sarcoma classically arises there, unlike osteosarcoma's typical metaphyseal location, although it also occurs in the pelvis and other flat bones.
- **Onion-skin periosteal reaction:** An Onion-skin periosteal reaction is layered new bone laid down by the periosteum in concentric sheets around a lesion, seen on plain radiographs. It indicates an aggressive process and can also occur with other lesions such as osteomyelitis.
- **Small round blue cells:** Small round blue cells are sheets of uniform cells with scant cytoplasm and dark nuclei on H&E staining. This pattern is shared by tumors such as neuroblastoma, lymphoma, and rhabdomyosarcoma, and membranous CD99 staining supports Ewing sarcoma.
- **EWSR1-FLI1 fusion:** EWSR1-FLI1 fusion results from the t(11;22) translocation joining EWSR1 on chromosome 22 with FLI1 on chromosome 11, creating an abnormal transcription factor. It is present in most cases, while others carry different partners such as ERG.

### MSK-022: Granulomatosis with polyangiitis clues
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: The upper-airway, pulmonary, renal, and PR3-ANCA pattern is characteristic of GPA. PR3-ANCA is not universal and renal involvement or cavitation may be absent.

**Detail (draft):** Granulomatosis with polyangiitis (GPA) is a necrotizing granulomatous small-vessel vasculitis that classically involves the upper airway, lungs, and kidneys, usually with PR3-ANCA. Not every patient has every feature: a minority are ANCA-negative, and renal disease or cavitation may be absent. Upper airway disease together with cavitating lung nodules helps separate GPA from the other ANCA-associated vasculitides, microscopic polyangiitis and EGPA.

- **PR3-ANCA (c-ANCA):** PR3-ANCA (c-ANCA) is an autoantibody against proteinase 3, a neutrophil granule enzyme, that gives cytoplasmic staining on immunofluorescence. It is the characteristic serology of GPA, but a negative result does not exclude the disease.
- **Chronic sinusitis:** Chronic sinusitis is persistent inflammation of the paranasal sinuses. In GPA, granulomatous inflammation of the upper airway can also cause nasal crusting, ulcers, and septal destruction with saddle-nose deformity.
- **Cavitating pulmonary nodules:** Cavitating pulmonary nodules are lung nodules whose centers break down into air-filled cavities. In GPA they reflect necrotizing granulomatous inflammation and can cause cough or hemoptysis, though cavitation is not seen in every patient.
- **Pauci-immune glomerulonephritis:** Pauci-immune glomerulonephritis is glomerular inflammation with few or no immune deposits on immunofluorescence, often presenting as rapidly progressive crescentic disease. It occurs across the ANCA-associated vasculitides, so it supports but does not by itself establish GPA.

### MSK-026: Muscles supplied by the obturator nerve
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: The obturator nerve supplies these medial-thigh adductors. Adductor magnus is dually innervated; only its adductor part is obturator-supplied (the hamstring part is tibial-division sciatic), so that tile is qualified.

**Detail (draft):** The obturator nerve (L2 to L4) enters the thigh through the obturator foramen and supplies the medial compartment muscles that adduct the thigh. Adductor magnus is dually innervated: only its adductor part is obturator-supplied, while its hamstring part is supplied by the tibial division of the sciatic nerve. Obturator nerve injury classically weakens thigh adduction and reduces sensation over the medial thigh.

- **Adductor longus:** Adductor longus is the most anterior of the adductors and forms the medial border of the femoral triangle. It adducts the thigh and is supplied by the obturator nerve.
- **Adductor brevis:** Adductor brevis lies deep to adductor longus, and the anterior and posterior divisions of the obturator nerve pass on either side of it. It adducts the thigh and is obturator-innervated.
- **Gracilis:** Gracilis is a long, thin medial thigh muscle and the only medial compartment muscle that crosses the knee, inserting as part of the pes anserinus. It adducts the thigh and helps flex the knee, with motor supply from the obturator nerve.
- **Adductor part of adductor magnus:** Adductor magnus is a large muscle with two parts: an adductor part and a hamstring part. Only the adductor part is supplied by the obturator nerve; the hamstring part receives the tibial division of the sciatic nerve.

### MSK-028: Hip extensor muscles
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: Gluteus maximus and the three hamstrings shown extend the hip. The short head of biceps femoris does not cross the hip and is correctly excluded; the long-head qualifier prevents that objection.

**Detail (draft):** Gluteus maximus and the three hamstrings that cross the hip (long head of biceps femoris, semimembranosus and semitendinosus) all extend the hip. The short head of biceps femoris arises from the femur, does not cross the hip, and only flexes the knee. Hip extension matters clinically for rising from a chair, climbing stairs and running.

- **Gluteus maximus:** Gluteus maximus is the large superficial buttock muscle, supplied by the inferior gluteal nerve. It is the most powerful hip extensor, especially when rising from sitting or climbing stairs.
- **Long head of biceps femoris:** The long head of biceps femoris arises from the ischial tuberosity and is supplied by the tibial part of the sciatic nerve. Because it crosses both joints, it extends the hip and flexes the knee.
- **Semimembranosus:** Semimembranosus is a medial hamstring arising from the ischial tuberosity and supplied by the tibial part of the sciatic nerve. It extends the hip and flexes the knee.
- **Semitendinosus:** Semitendinosus is a medial hamstring with a long tendon that inserts on the medial tibia as part of the pes anserinus. Like the other hamstrings that cross the hip, it extends the hip and flexes the knee.

### NEPH-024: Renal cell carcinoma paraneoplastic mediators
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: RCC can be associated with production of mediators causing hypercalcemia (PTHrP), erythrocytosis (EPO), hypercortisolism (ACTH), or hypertension (renin).

**Detail (draft):** Renal cell carcinoma is classically associated with paraneoplastic syndromes caused by ectopic or excess hormone production. PTHrP can cause hypercalcemia and erythropoietin can cause erythrocytosis, and these are the more common associations. ACTH production causing Cushing syndrome and renin production causing hypertension are rare but recognized.

- **PTH-related peptide:** PTH-related peptide (PTHrP) mimics parathyroid hormone at its receptor, increasing bone resorption and renal calcium reabsorption. Its secretion causes humoral hypercalcemia of malignancy with suppressed PTH, one of the more common RCC paraneoplastic effects.
- **Erythropoietin:** Erythropoietin is the hormone, normally made by kidney interstitial cells in response to hypoxia, that stimulates red cell production. Secretion by RCC can cause secondary erythrocytosis with a raised hematocrit despite normal oxygenation.
- **ACTH:** ACTH (adrenocorticotropic hormone) normally comes from the pituitary and drives adrenal cortisol release. Ectopic production by RCC is rare and can cause Cushing syndrome; ectopic ACTH is more classically linked to small cell lung cancer.
- **Renin:** Renin is the enzyme released by juxtaglomerular cells that initiates the renin-angiotensin-aldosterone system. Renin production by RCC is a rare association that can cause hypertension.

### NEPH-028: Normal-anion-gap metabolic acidosis associations
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: GI bicarbonate loss and renal bicarbonate loss or impaired acid excretion can produce hyperchloremic metabolic acidosis without an increased anion gap.

**Detail (draft):** Diarrhea, acetazolamide, distal renal tubular acidosis and proximal renal tubular acidosis can each produce a normal-anion-gap (hyperchloremic) metabolic acidosis. Bicarbonate is lost from the gut or kidney, or renal acid excretion is impaired, and chloride rises to replace it, so the anion gap stays normal. This separates them from causes of high-anion-gap acidosis such as ketoacidosis or lactic acidosis.

- **Diarrhea:** Diarrhea causes loss of bicarbonate-rich intestinal fluid. It is one of the most common causes of normal-anion-gap metabolic acidosis.
- **Acetazolamide:** Acetazolamide is a carbonic anhydrase inhibitor that reduces bicarbonate reabsorption in the proximal tubule. Its effect resembles proximal renal tubular acidosis, producing a hyperchloremic acidosis.
- **Distal renal tubular acidosis:** Distal renal tubular acidosis (type 1) is impaired hydrogen ion secretion by the distal nephron. Urine pH stays inappropriately high (above about 5.5), and hypokalemia and calcium phosphate kidney stones are classic associations.
- **Proximal renal tubular acidosis:** Proximal renal tubular acidosis (type 2) is impaired bicarbonate reabsorption in the proximal tubule. It can occur alone or as part of Fanconi syndrome, and urine can still be acidified once serum bicarbonate falls low enough.

### NEPH-030: Phosphate-elevating conditions
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: Reduced renal phosphate clearance, reduced PTH-mediated phosphaturia, or large intracellular phosphate release can increase serum phosphate.

**Detail (draft):** Serum phosphate rises when the kidneys cannot excrete it, when low PTH reduces urinary phosphate loss, or when large amounts of intracellular phosphate are released into the blood. Renal failure, hypoparathyroidism, tumor lysis syndrome and rhabdomyolysis illustrate these mechanisms, although the actual level depends on renal function, timing and treatment.

- **Renal failure:** Renal failure is loss of the kidneys' ability to filter and excrete solutes. Reduced phosphate excretion causes hyperphosphatemia, which in chronic kidney disease contributes to secondary hyperparathyroidism and bone disease.
- **Hypoparathyroidism:** Hypoparathyroidism is deficient parathyroid hormone (PTH) secretion, for example after neck surgery. Because PTH normally promotes renal phosphate excretion, its absence allows serum phosphate to rise.
- **Tumor lysis syndrome:** Tumor lysis syndrome occurs when many tumor cells break down, often after starting chemotherapy for rapidly growing cancers. Released intracellular contents cause hyperphosphatemia along with hyperkalemia and hyperuricemia, and can injure the kidneys.
- **Rhabdomyolysis:** Rhabdomyolysis is breakdown of skeletal muscle, for example from crush injury, extreme exertion or certain drugs. Damaged muscle releases phosphate, potassium, creatine kinase and myoglobin, and the resulting kidney injury can further impair phosphate excretion.

### NEU-003: Lower motor neuron examination signs
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: Loss of lower motor neuron input can produce muscle wasting, fasciculations, reduced or absent reflexes, and low tone.

**Detail (draft):** Fasciculations, muscle atrophy, hyporeflexia and hypotonia are classic signs of lower motor neuron dysfunction, localizing to the anterior horn cell, nerve root or peripheral nerve. They contrast with upper motor neuron signs such as spasticity, hyperreflexia and an extensor plantar response. Not every peripheral neuromuscular disorder produces all four.

- **Fasciculations:** Fasciculations are brief, spontaneous, visible twitches of a group of muscle fibers supplied by one motor unit. They suggest an irritable or degenerating lower motor neuron, classically in anterior horn cell disease.
- **Muscle atrophy:** Muscle atrophy is wasting of muscle bulk. Marked atrophy follows loss of lower motor neuron innervation (denervation), unlike the milder disuse atrophy of upper motor neuron lesions.
- **Hyporeflexia:** Hyporeflexia means reduced or absent deep tendon reflexes. Damage to the lower motor neuron interrupts the efferent limb of the stretch reflex arc.
- **Hypotonia:** Hypotonia is reduced resistance to passive movement, giving a floppy or flaccid limb. It reflects loss of the lower motor neuron drive that normally maintains resting muscle tone.

### NEU-012: Multiple sclerosis investigation clues
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: MRI can reveal periventricular demyelinating lesions (including the perivenular 'Dawson fingers' pattern), while CSF may show intrathecal oligoclonal bands and mild lymphocytic inflammation.

**Detail (draft):** All four are supportive investigation findings in multiple sclerosis, a demyelinating disease of the central nervous system. MRI often shows periventricular white matter lesions, sometimes in the Dawson fingers pattern, while CSF may show intrathecal oligoclonal bands and a mild lymphocytic pleocytosis. A markedly raised CSF cell count argues against MS and should prompt a search for another diagnosis.

- **Periventricular white matter lesions:** These are areas of demyelination in the white matter bordering the lateral ventricles, seen as bright spots on T2/FLAIR MRI. Periventricular location is one of the classic MRI sites for MS plaques.
- **Dawson fingers:** Dawson fingers are oval periventricular lesions oriented perpendicular to the lateral ventricles, following small medullary veins. They are a specific pattern of periventricular lesion that is highly suggestive of MS.
- **CSF oligoclonal bands:** Oligoclonal bands are discrete IgG bands on CSF electrophoresis that are absent from matched serum, indicating antibody production within the CNS. They are a classic, though not universal, CSF finding in MS.
- **CSF mild lymphocytic pleocytosis:** Pleocytosis means an increased number of white cells in the CSF. In MS it is typically mild and lymphocytic; a high cell count points toward infection or another inflammatory disorder instead.

### NEU-026: Peripheral causes of vertigo
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: These disorders affect the peripheral vestibular apparatus or CN VIII and can produce vertigo with differing timing and hearing features.

**Detail (draft):** Each of these disorders involves the peripheral vestibular apparatus or CN VIII and can produce vertigo, but they differ in timing and in whether hearing is affected. Distinguishing peripheral from central causes of vertigo is a key clinical and exam skill, and the pattern of episode duration and hearing loss helps separate these peripheral causes from one another.

- **BPPV:** Benign paroxysmal positional vertigo (BPPV) is caused by displaced otoconia, most often in the posterior semicircular canal. It produces brief vertigo triggered by head position changes, without hearing loss, and is diagnosed with the Dix-Hallpike maneuver.
- **Vestibular neuritis:** Vestibular neuritis is inflammation of the vestibular nerve, often after a viral illness. It causes sudden, continuous vertigo lasting days with nausea and imbalance, classically with hearing preserved.
- **Meniere disease:** Meniere disease is thought to result from excess endolymph (endolymphatic hydrops) in the inner ear. It causes recurrent vertigo episodes lasting minutes to hours with fluctuating sensorineural hearing loss, tinnitus and aural fullness.
- **Vestibular schwannoma:** A vestibular schwannoma is a benign Schwann cell tumor of CN VIII at the cerebellopontine angle. It more often causes slowly progressive unilateral hearing loss, tinnitus and imbalance than acute spinning vertigo, though vertigo can occur.

### NEU-039: Subdural hematoma associations
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: Bridging-vein injury produces a crescentic subdural collection that can cross suture lines; cerebral atrophy (elderly, alcohol use) increases susceptibility.

**Detail (draft):** A subdural hematoma forms when bridging veins tear and venous blood collects between the dura and arachnoid, appearing on CT as a crescent-shaped collection that can cross suture lines but not the midline. Because the bleeding is venous, it may accumulate slowly, and chronic cases can present with gradual confusion or headache. Cerebral atrophy (older age, chronic alcohol use) raises risk, as do infancy (shaking injury) and anticoagulation.

- **Torn bridging veins:** Bridging veins drain blood from the brain surface across the subdural space into the dural venous sinuses. Shearing forces, even from minor trauma, can tear them and produce a subdural hematoma.
- **Blood between dura and arachnoid:** The subdural space is a potential space between the dura mater and the arachnoid mater. Blood here defines a subdural hematoma, as opposed to blood above the dura (epidural) or beneath the arachnoid (subarachnoid).
- **Crescent-shaped (concave) CT collection:** A crescent-shaped (concave) collection follows the curve of the brain surface on CT. Subdural blood can cross suture lines but is stopped at the midline by the falx; acute blood looks bright and chronic blood darker.
- **Older age with cerebral atrophy:** Cerebral atrophy, common with older age, enlarges the gap between brain and skull and stretches bridging veins, making them easier to tear. It is a risk factor rather than a requirement, since infants and anticoagulated patients are also at risk.

### NEU-047: Parinaud (dorsal midbrain) syndrome clues
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: A pineal-region or dorsal midbrain lesion disrupts pretectal eye-movement circuitry (posterior commissure, riMLF) and can obstruct the cerebral aqueduct, causing hydrocephalus.

**Detail (draft):** Parinaud syndrome results from a lesion of the dorsal midbrain, classically a pineal-region tumor, that disrupts pretectal eye-movement circuits including the posterior commissure and riMLF. Its eye signs include upgaze palsy, light-near dissociation and convergence-retraction nystagmus, with eyelid retraction (Collier sign) as a related finding. The same mass can compress the cerebral aqueduct and cause hydrocephalus, and hydrocephalus itself can also produce the syndrome.

- **Vertical (up) gaze palsy:** Vertical gaze palsy is an inability to move the eyes vertically, most characteristically upward. Damage to the vertical gaze centers of the dorsal midbrain makes upgaze palsy the hallmark sign of Parinaud syndrome.
- **Light-near dissociation:** Light-near dissociation means the pupils react poorly to light but constrict normally during near focusing (accommodation). It reflects damage to the pretectal light reflex pathway in the dorsal midbrain.
- **Convergence-retraction nystagmus:** Convergence-retraction nystagmus consists of jerky convergent eye movements with backward pulling of the globes, typically on attempted upgaze. It is a characteristic sign of dorsal midbrain dysfunction.
- **Aqueductal obstruction / hydrocephalus:** The cerebral aqueduct connects the third and fourth ventricles and runs just beneath the dorsal midbrain. A pineal or midbrain mass can block it and cause obstructive hydrocephalus, which is a consequence of the lesion rather than an eye sign.

### NEU-049: Major dopaminergic pathways
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: These four classic dopamine circuits underlie reward/positive psychotic symptoms, cortical/negative symptoms, movement, and prolactin inhibition respectively.

**Detail (draft):** The mesolimbic, mesocortical, nigrostriatal and tuberoinfundibular pathways are the four classic dopaminergic circuits of the brain. They are associated with reward and positive psychotic symptoms, negative symptoms, movement, and prolactin inhibition, respectively. The board-relevant payoff is predicting antipsychotic effects: D2 blockade in the nigrostriatal pathway causes extrapyramidal symptoms, and in the tuberoinfundibular pathway causes hyperprolactinemia.

- **Mesolimbic pathway:** The mesolimbic pathway runs from the ventral tegmental area to limbic structures such as the nucleus accumbens. It mediates reward, and overactivity is linked to positive symptoms such as hallucinations and delusions.
- **Mesocortical pathway:** The mesocortical pathway projects from the ventral tegmental area to the prefrontal cortex. Reduced activity here is associated with negative symptoms such as flat affect and avolition.
- **Nigrostriatal pathway:** The nigrostriatal pathway runs from the substantia nigra pars compacta to the striatum and helps control movement. It degenerates in Parkinson disease, and blocking it with antipsychotics causes extrapyramidal symptoms.
- **Tuberoinfundibular pathway:** The tuberoinfundibular pathway carries dopamine from the hypothalamus to the pituitary, where dopamine inhibits prolactin release. D2 blockade here causes hyperprolactinemia, with galactorrhea, amenorrhea or gynecomastia.

### PHARM-014: PDE-5 (phosphodiesterase-5) inhibitors
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: Each inhibits PDE-5, reducing cGMP breakdown and promoting smooth-muscle relaxation; clinical indications are not identical across the four.

**Detail (draft):** Sildenafil, vardenafil, tadalafil and avanafil all inhibit phosphodiesterase-5, the enzyme that breaks down cGMP. Higher cGMP levels promote smooth-muscle relaxation and vasodilation, which underlies their use in erectile dysfunction, although their approved indications are not identical. Because nitrates also raise cGMP, combining them with any PDE-5 inhibitor can cause severe hypotension, a classic contraindication.

- **Sildenafil:** Sildenafil is a PDE-5 inhibitor used for erectile dysfunction and pulmonary arterial hypertension. Some cross-inhibition of PDE-6 in the retina explains its classic side effect of blue-tinted vision.
- **Vardenafil:** Vardenafil is a PDE-5 inhibitor used for erectile dysfunction. Like the rest of this class, it raises cGMP in smooth muscle and must not be combined with nitrates.
- **Tadalafil:** Tadalafil is the longest-acting drug of this class. Besides erectile dysfunction, it is also used for benign prostatic hyperplasia and pulmonary arterial hypertension, all through PDE-5 inhibition.
- **Avanafil:** Avanafil is a newer, more PDE-5-selective inhibitor used for erectile dysfunction. It shares the same cGMP-preserving mechanism and the same nitrate contraindication.

### PLEXUS-GEN-009: Base excision repair participants
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: In base excision repair a DNA glycosylase removes the damaged base, AP endonuclease incises the resulting abasic site, DNA polymerase beta fills the gap, and DNA ligase seals the nick (short-patch BER).

**Detail (draft):** These four enzymes carry out short-patch base excision repair (BER) in sequence: a damaged base is removed, the abasic site is cut, the one-nucleotide gap is filled, and the nick is sealed. BER corrects small lesions that do not distort the helix, such as uracil from cytosine deamination and oxidized or alkylated bases, which sets it apart from repair of bulky lesions like thymine dimers.

- **DNA glycosylase:** A DNA glycosylase recognizes a specific damaged or inappropriate base (for example uracil in DNA) and cleaves its bond to the sugar. This first step leaves an apurinic/apyrimidinic (AP), or abasic, site.
- **AP endonuclease:** AP endonuclease recognizes the abasic site left by the glycosylase and cuts the sugar-phosphate backbone there. The resulting nick gives the polymerase a place to start repair.
- **DNA polymerase beta:** DNA polymerase beta is a repair polymerase that inserts the single missing nucleotide in short-patch BER. It also removes the leftover deoxyribose-phosphate remnant before the strand is sealed.
- **DNA ligase:** DNA ligase forms the final phosphodiester bond that seals the nick, restoring an intact strand. Ligases also act in DNA replication and in other repair pathways, so this step is not unique to BER.

### PLEXUS-GEN-014: Blot techniques and their targets
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: Each blot detects a specific macromolecule: Southern (DNA), Northern (RNA), Western (protein), Southwestern (DNA-binding proteins). Southwestern is distinct from Southern.

**Detail (draft):** Blotting techniques separate molecules by gel electrophoresis, transfer them to a membrane and detect a specific target with a probe. Each blot is defined by what it detects: Southern blots detect DNA, Northern blots RNA, Western blots protein, and Southwestern blots proteins that bind DNA. The mnemonic SNoW DRoP pairs Southern, Northern and Western with DNA, RNA and protein.

- **Southern blot - DNA:** A Southern blot uses a labeled DNA probe to detect a specific DNA sequence. It can identify gene deletions, rearrangements or restriction fragment length differences.
- **Northern blot - RNA:** A Northern blot detects RNA using a labeled nucleic acid probe. It is used to study gene expression by showing whether, and how much, a particular mRNA is present.
- **Western blot - protein:** A Western blot separates proteins and identifies a specific one with a labeled antibody. It was historically used to confirm HIV infection and remains a standard research tool.
- **Southwestern blot - DNA-binding proteins:** A Southwestern blot uses labeled DNA probes to find proteins that bind DNA, such as transcription factors. Despite the similar name, it detects proteins, not DNA as in a Southern blot.

### PLX-BCH-007: Fibrillar collagen types
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: These four are the fibril-forming collagens providing mechanical strength, in contrast to network-forming type IV and anchoring type VII.

**Detail (draft):** Types I, II, III and V are fibril-forming collagens: their triple helices assemble into cross-linked fibrils that give tissues tensile strength. This sets them apart from network-forming type IV collagen of basement membranes and anchoring type VII collagen. Mutations in fibrillar collagens underlie classic exam diseases such as osteogenesis imperfecta and Ehlers-Danlos syndromes.

- **Type I collagen:** Type I collagen is the most abundant collagen, found in bone, skin, tendon and late wound repair. Defects in type I collagen synthesis cause osteogenesis imperfecta.
- **Type II collagen:** Type II collagen is the main collagen of cartilage, and is also present in the vitreous body and nucleus pulposus. It forms fibrils that resist compression in these tissues.
- **Type III collagen:** Type III collagen forms reticular fibers in skin, blood vessels, uterus and granulation tissue. Defects cause vascular Ehlers-Danlos syndrome, with risk of arterial and organ rupture.
- **Type V collagen:** Type V collagen is a minor fibrillar collagen that co-assembles with type I and helps regulate fibril formation. Mutations are a classic cause of classical Ehlers-Danlos syndrome.

### PLX-BCH-015: Glycogen storage diseases with hepatic involvement
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: GSD types I, III, IV, and VI are the hepatic-involvement group. Their defects involve glucose release, debranching, branching, and hepatic glycogen phosphorylase, respectively.

**Detail (draft):** Von Gierke (type I), Cori (type III), Andersen (type IV) and Hers (type VI) disease are glycogen storage diseases that affect the liver, typically with hepatomegaly. Their defects involve glucose release from the liver, glycogen debranching, glycogen branching and hepatic glycogen phosphorylase, respectively. Severity differs: fasting hypoglycemia is prominent in some, milder in others, and Cori and Andersen disease can also involve muscle.

- **Von Gierke disease:** Von Gierke disease (GSD type I) is usually due to glucose-6-phosphatase deficiency, blocking the final step of hepatic glucose release. It causes severe fasting hypoglycemia, hepatomegaly, lactic acidosis, hyperuricemia and hypertriglyceridemia.
- **Cori disease:** Cori disease (GSD type III) is a deficiency of debranching enzyme, so glycogen with short outer branches accumulates. It causes hepatomegaly and hypoglycemia that is generally milder than in von Gierke disease, and muscle may also be affected.
- **Andersen disease:** Andersen disease (GSD type IV) is a deficiency of branching enzyme, producing abnormal glycogen with few branches. In its classic form it causes hepatosplenomegaly and progressive cirrhosis in infancy; neuromuscular forms also exist.
- **Hers disease:** Hers disease (GSD type VI) is a deficiency of hepatic glycogen phosphorylase, the enzyme that breaks glycogen down in the liver. It usually causes hepatomegaly with a relatively mild clinical course.

### PLX-BCH-031: Classic Marfan syndrome associations
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: Defective fibrillin (FBN1) produces the skeletal, ocular, and aortic manifestations of Marfan syndrome.

**Detail (draft):** Marfan syndrome is an autosomal dominant connective tissue disorder caused by mutations in FBN1, which encodes fibrillin-1. Defective fibrillin weakens elastic tissue, producing classic skeletal, ocular and cardiovascular features. Lens subluxation is typically upward, unlike the downward displacement in homocystinuria, and aortic dissection is a serious possible complication rather than a requirement for diagnosis.

- **Arachnodactyly:** Arachnodactyly means abnormally long, slender fingers and toes. It is part of the tall, long-limbed skeletal habitus typical of Marfan syndrome.
- **Upward lens subluxation:** Lens subluxation (ectopia lentis) is partial displacement of the lens from its normal position. In Marfan syndrome it is classically upward and outward, because the fibrillin-rich zonular fibers that hold the lens are weak.
- **Aortic dissection:** Aortic dissection is a tear in the aortic intima allowing blood to split the vessel wall. In Marfan syndrome it usually follows progressive aortic root dilation and is the major life-threatening complication.
- **Pectus deformity:** Pectus deformity refers to a sunken (pectus excavatum) or protruding (pectus carinatum) chest wall. Both result from overgrowth of the ribs and are common skeletal features of Marfan syndrome.

### PLX-BCH-051: Diagnostic clues for maple syrup urine disease
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: Deficient branched-chain ketoacid dehydrogenase causes accumulation of BCAAs and their ketoacids, with characteristic urine odor and neurologic dysfunction.

**Detail (draft):** Maple syrup urine disease (MSUD) is an autosomal recessive defect in branched-chain alpha-ketoacid dehydrogenase, the enzyme complex that breaks down the ketoacids of leucine, isoleucine, and valine. Both the amino acids and their ketoacids accumulate, producing a sweet urine odor and neurotoxicity that often presents in the newborn period with poor feeding, vomiting, and lethargy. The specific neurologic signs vary between patients and phenotypes.

- **Sweet-smelling urine:** Sweet-smelling urine, often compared to maple syrup or burnt sugar, is the classic clue that gives the disease its name. The odor comes from accumulated branched-chain metabolites and may also be noticed in earwax.
- **Elevated branched-chain amino acids:** Elevated branched-chain amino acids (leucine, isoleucine, valine) are found on plasma amino acid analysis, and alloisoleucine is a characteristic diagnostic marker. Leucine is considered the most neurotoxic of the three.
- **Elevated branched-chain ketoacids:** Elevated branched-chain ketoacids are the alpha-ketoacids formed when the branched-chain amino acids are transaminated. They build up because the dehydrogenase step that should oxidize them is deficient, and they can be detected in urine.
- **Infantile dystonia:** Infantile dystonia refers to sustained involuntary muscle contractions producing abnormal postures in an infant. It is one possible neurologic manifestation of MSUD alongside lethargy, abnormal tone, and seizures, but it is not present in every case.

### PLX-BCH-069: Amino acids feeding alpha-ketoglutarate through glutamate
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: These amino acids are catabolized through glutamate and then into alpha-ketoglutarate.

**Detail (draft):** Arginine, proline, histidine, and glutamine are catabolized by different routes that converge on glutamate, which is then converted to alpha-ketoglutarate by deamination or transamination. Because alpha-ketoglutarate is a TCA cycle intermediate, these amino acids are glucogenic. Glutamate is the shared intermediate, and the number of steps needed to reach it differs among the four.

- **Arginine:** Arginine is a basic amino acid and the precursor of nitric oxide. In the urea cycle, arginase splits it into urea and ornithine, and ornithine can be converted via glutamate semialdehyde to glutamate.
- **Proline:** Proline is a cyclic amino acid abundant in collagen. Its catabolism opens the ring to form glutamate semialdehyde, which is then oxidized to glutamate.
- **Histidine:** Histidine has an imidazole side chain and is the precursor of histamine. Its breakdown passes through formiminoglutamate (FIGLU), which transfers a formimino group to tetrahydrofolate to yield glutamate, so FIGLU accumulates in folate deficiency.
- **Glutamine:** Glutamine is the most abundant free amino acid in blood and a major carrier of nitrogen. Glutaminase removes its amide nitrogen as ammonia to form glutamate, a reaction important for renal ammonia production in acidosis.

### PLX-BCH-074: Proteins supporting long-chain fatty acid mitochondrial entry
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: Fatty acid activation, transfer onto carnitine, acylcarnitine transport, and regeneration of matrix acyl-CoA together enable mitochondrial long-chain fatty acid use.

**Detail (draft):** Long-chain fatty acids cannot cross the inner mitochondrial membrane directly. They are first activated to fatty acyl-CoA, transferred onto carnitine by CPT I, carried across the inner membrane by a translocase, and converted back to acyl-CoA in the matrix by CPT II for beta-oxidation. Short- and medium-chain fatty acids use different entry mechanisms that do not require this system.

- **Fatty acyl-CoA synthetase:** Fatty acyl-CoA synthetase activates a fatty acid by attaching coenzyme A, using ATP. It acts upstream of the carnitine shuttle, producing the fatty acyl-CoA that CPT I then uses.
- **CPT I:** CPT I (carnitine palmitoyltransferase I) sits on the outer mitochondrial membrane and transfers the fatty acyl group from CoA to carnitine. It is the rate-limiting step of fatty acid oxidation and is inhibited by malonyl-CoA, preventing simultaneous synthesis and breakdown.
- **Carnitine-acylcarnitine translocase:** Carnitine-acylcarnitine translocase is a transporter in the inner mitochondrial membrane. It moves acylcarnitine into the matrix in exchange for free carnitine moving out.
- **CPT II:** CPT II, on the matrix side of the inner membrane, transfers the acyl group back to CoA and frees carnitine for reuse. CPT II deficiency classically causes muscle pain and myoglobinuria with prolonged exercise or fasting.

### PLX-HEM-013: Sickle-cell disease smear findings
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: Sickling changes red-cell morphology, chronic hemolysis stimulates reticulocytes, and functional asplenia allows nuclear remnants to persist.

**Detail (draft):** These findings reflect the main processes in sickle cell disease: polymerized hemoglobin S distorts red cells, chronic hemolysis drives the marrow to release reticulocytes, and repeated splenic infarction leads to functional asplenia. Some findings depend on disease stage, since Howell-Jolly bodies require loss of splenic function and the reticulocyte count falls during an aplastic crisis.

- **Sickled erythrocytes:** Sickled erythrocytes are crescent-shaped red cells formed when deoxygenated hemoglobin S polymerizes. They are the defining smear finding and cause both hemolysis and vaso-occlusion.
- **Target cells:** Target cells are red cells with a central dark spot surrounded by a pale ring, resembling a bullseye. They are common in sickle cell disease but are not specific, also appearing in thalassemia and liver disease.
- **Howell-Jolly bodies:** Howell-Jolly bodies are small nuclear remnants inside red cells that a working spleen normally removes. They appear once repeated infarction has caused functional asplenia (autosplenectomy).
- **Reticulocytosis:** Reticulocytes are young red cells newly released from the marrow. Chronic hemolysis keeps the count elevated, but it drops sharply during a parvovirus B19 aplastic crisis.

### PLX-HEM-016: Clinical clues to iron deficiency
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: These clinical findings or syndromic associations are recognized in iron deficiency, although none must be present.

**Detail (draft):** Koilonychia, pica, atrophic glossitis and Plummer-Vinson syndrome are recognized clinical clues to iron deficiency, although none must be present and many patients have only fatigue or pallor. Some are not specific: glossitis also occurs in vitamin B12 and folate deficiency. Plummer-Vinson syndrome is a syndrome that includes iron deficiency rather than a single sign of it.

- **Koilonychia:** Koilonychia means thin, concave, spoon-shaped nails that can hold a drop of water. It is a classic, though uncommon, sign of chronic iron deficiency.
- **Pica:** Pica is a craving to eat non-food substances such as ice (pagophagia), clay or starch. Ice craving in particular is a classic, though not universal, clue to iron deficiency.
- **Atrophic glossitis:** Atrophic glossitis is a smooth, red, often sore tongue caused by loss of the papillae. It can be seen in iron deficiency but is shared with vitamin B12 and folate deficiency, so it is not specific.
- **Plummer-Vinson syndrome:** Plummer-Vinson syndrome is the combination of iron deficiency anemia, upper esophageal webs and dysphagia. It contains iron deficiency as one of its components and is associated with an increased risk of esophageal squamous cell carcinoma.

### PLX-HEM-017: Sources of chronic iron-loss anemia
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: Each can cause sustained blood loss and eventual depletion of iron stores.

**Detail (draft):** Each of these conditions can cause sustained blood loss, and every milliliter of lost blood carries iron with it, so stores are gradually depleted and a microcytic, hypochromic anemia develops. Ulcers and tumors cause iron deficiency only when they bleed. Finding iron deficiency anemia should prompt a search for its source, particularly occult gastrointestinal bleeding in men and postmenopausal women.

- **Menorrhagia:** Menorrhagia is abnormally heavy or prolonged menstrual bleeding. It is a common cause of iron deficiency anemia in premenopausal women because monthly losses can exceed dietary iron intake.
- **Peptic ulcer bleeding:** Peptic ulcers are erosions in the stomach or duodenum, often due to H. pylori or NSAIDs. When they bleed, slowly or intermittently, the chronic blood loss can deplete iron stores.
- **Hookworm infection:** Hookworms (Necator americanus and Ancylostoma duodenale) enter through the skin, often of bare feet, and attach to the small intestinal wall to feed on blood. Hookworm infection is a leading global cause of iron deficiency anemia.
- **Bleeding gastrointestinal malignancy:** Gastrointestinal cancers, such as right-sided colon cancer, can bleed slowly and silently. Unexplained iron deficiency anemia in an older adult is a classic reason to evaluate for a bleeding GI malignancy.

### PLX-HEM-028: Folate-deficiency laboratory pattern
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: Folate deficiency impairs DNA synthesis and homocysteine metabolism without directly disrupting the B12-dependent methylmalonyl-CoA pathway.

**Detail (draft):** Folate is needed for thymidine synthesis and, as methyl-tetrahydrofolate, for remethylating homocysteine to methionine. Its deficiency therefore causes megaloblastic anemia with hypersegmented neutrophils and raises homocysteine, while methylmalonic acid stays normal because methylmalonyl-CoA mutase depends on vitamin B12, not folate. Elevated homocysteine with normal methylmalonic acid is the key laboratory pattern that separates folate deficiency from B12 deficiency.

- **Increased homocysteine:** Homocysteine is an amino acid intermediate that methionine synthase converts back to methionine using a methyl group from folate and vitamin B12 as cofactor. It rises in both folate and B12 deficiency, so on its own it does not tell them apart.
- **Normal methylmalonic acid:** Methylmalonic acid (MMA) accumulates when the B12-dependent enzyme methylmalonyl-CoA mutase fails. Because this reaction does not require folate, a Normal methylmalonic acid alongside high homocysteine points toward folate deficiency.
- **Megaloblastic anemia:** Megaloblastic anemia is a macrocytic anemia caused by impaired DNA synthesis, in which nuclear maturation lags behind cytoplasmic maturation and marrow precursors are abnormally large. It is shared by folate and B12 deficiency.
- **Hypersegmented neutrophils:** Hypersegmented neutrophils have an unusually high number of nuclear lobes, often five or more. They are a classic peripheral smear sign of a megaloblastic process and appear in both folate and B12 deficiency.

### PSY-004: Core PTSD symptom domains
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: DSM-5 PTSD comprises four symptom clusters after qualifying trauma: intrusion/re-experiencing, avoidance, negative alterations in cognition and mood, and altered arousal/reactivity.

**Detail (draft):** DSM-5 defines posttraumatic stress disorder by four symptom clusters following exposure to actual or threatened death, serious injury, or sexual violence: intrusion, avoidance, negative alterations in cognition and mood, and alterations in arousal and reactivity. Symptoms must last more than one month and cause distress or impairment. Similar symptoms lasting under one month suggest acute stress disorder, and ICD-11 uses a three-cluster model instead.

- **Intrusive re-experiencing:** Intrusive re-experiencing includes unwanted distressing memories, nightmares, and flashbacks in which the person feels the trauma is recurring. Intense psychological or physical reactions to reminders also belong to this cluster.
- **Trauma-cue avoidance:** Trauma-cue avoidance is the effortful avoidance of memories, thoughts, or feelings about the trauma, or of external reminders such as people, places, and activities. It forms its own DSM-5 cluster.
- **Negative mood and cognition:** Negative mood and cognition covers persistent negative beliefs about oneself or the world, distorted self-blame, ongoing fear, guilt or shame, detachment, loss of interest, and inability to feel positive emotions. Inability to recall key parts of the trauma also fits here.
- **Hyperarousal:** Hyperarousal refers to a persistently heightened state of alertness: hypervigilance, exaggerated startle, irritability or angry outbursts, reckless behavior, and trouble with sleep or concentration. It corresponds to the arousal and reactivity cluster.

### PULM-021: Features of diffuse alveolar damage in ARDS
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: Alveolar-capillary injury permits protein leakage and hyaline membrane formation, while surfactant dysfunction contributes to stiff, collapse-prone lungs.

**Detail (draft):** These are features of diffuse alveolar damage, the classic pathology of acute respiratory distress syndrome (ARDS). Injury to the alveolar-capillary barrier lets protein-rich fluid flood the alveoli, forming hyaline membranes, while surfactant dysfunction promotes alveolar collapse and stiff, poorly compliant lungs. Hyaline membranes are a histologic finding rather than a bedside criterion, and diffuse alveolar damage is not found in every patient who meets clinical ARDS criteria.

- **Protein-rich alveolar fluid:** In ARDS, damage to capillary endothelium and alveolar epithelium makes the barrier leaky, so protein-rich exudate fills the alveoli. This noncardiogenic pulmonary edema impairs gas exchange and causes hypoxemia.
- **Hyaline membranes:** Hyaline membranes are pink, glassy layers of fibrin and necrotic cell debris lining the alveolar walls on histology. They are the hallmark microscopic finding of diffuse alveolar damage, seen on biopsy or autopsy.
- **Reduced surfactant activity:** Surfactant, made by type II pneumocytes, lowers alveolar surface tension and prevents collapse. In ARDS, injury to type II cells and inactivation by leaked plasma proteins reduce surfactant function, favoring atelectasis.
- **Reduced lung compliance:** Compliance describes how easily the lungs expand for a given pressure. Fluid-filled, collapsed alveoli make the lungs stiff in ARDS, so higher pressures are needed to ventilate them.

### REPRO-010: Conditions associated with polyhydramnios
State: **draft** · status `DRAFT_AI_GENERATED`

Current explanation: Impaired fetal swallowing (anencephaly, intestinal/duodenal atresia) or increased fetal urine output (maternal diabetes via fetal osmotic diuresis; TTTS recipient hypervolemia) raises amniotic fluid volume.

**Detail (draft):** Polyhydramnios is an excess of amniotic fluid. Fluid volume depends on a balance between fetal urine production and fetal swallowing, so it rises when swallowing or gut passage is impaired (anencephaly, intestinal atresia) or when fetal urine output increases (maternal diabetes, the recipient twin in twin-twin transfusion syndrome). Polyhydramnios on ultrasound should prompt a search for these causes.

- **Anencephaly:** Anencephaly is a neural tube defect in which most of the brain and skull fail to form. Affected fetuses swallow poorly, so amniotic fluid accumulates.
- **Intestinal atresia:** Intestinal atresia is a congenital blockage of the bowel lumen, with duodenal atresia (and esophageal atresia) as classic examples. Swallowed amniotic fluid cannot pass and be absorbed, leading to polyhydramnios.
- **Maternal diabetes:** Poorly controlled maternal diabetes causes fetal hyperglycemia. The fetus then develops an osmotic diuresis, producing more urine and therefore more amniotic fluid.
- **Twin-twin transfusion recipient:** In twin-twin transfusion syndrome, shared placental vessels shunt blood from a donor twin to a recipient twin. The hypervolemic recipient produces excess urine and polyhydramnios, while the donor has oligohydramnios.

