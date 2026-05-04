// Drug-Drug Interaction Database
export interface DDI {
  drugA: string
  drugB: string
  severity: 'critical' | 'warning' | 'normal'
  mechanism: string
  clinical_effect: string
  management: string
  confounding?: string[]
}

export const DDI_DATABASE: DDI[] = [
  {
    drugA: 'Warfarin',
    drugB: 'Aspirin',
    severity: 'warning',
    mechanism: 'Aspirin inhibits platelet aggregation and may displace warfarin from protein binding',
    clinical_effect: 'Increased bleeding risk',
    management: 'Monitor INR closely, consider alternative analgesic if possible',
    confounding: ['liver_disease', 'thrombocytopenia']
  },
  {
    drugA: 'Metformin',
    drugB: 'Contrast Media',
    severity: 'warning',
    mechanism: 'Contrast media may impair renal function, increasing metformin accumulation risk',
    clinical_effect: 'Lactic acidosis',
    management: 'Hold metformin 48 hours before and after contrast exposure',
    confounding: ['renal_impairment', 'diabetes']
  },
  {
    drugA: 'ACE Inhibitor',
    drugB: 'Potassium Supplement',
    severity: 'warning',
    mechanism: 'Both increase serum potassium levels',
    clinical_effect: 'Hyperkalemia',
    management: 'Monitor potassium levels, reduce supplementation if on ACE inhibitor',
    confounding: ['renal_disease', 'diabetes']
  },
  {
    drugA: 'Statins',
    drugB: 'Fibrates',
    severity: 'warning',
    mechanism: 'Both affect muscle and may increase myopathy risk',
    clinical_effect: 'Rhabdomyolysis, myositis',
    management: 'Use lowest effective doses, monitor CPK levels',
    confounding: ['renal_disease', 'hypothyroidism']
  },
  {
    drugA: 'NSAIDs',
    drugB: 'ACE Inhibitors',
    severity: 'warning',
    mechanism: 'NSAIDs reduce antihypertensive efficacy and increase renal dysfunction',
    clinical_effect: 'Reduced antihypertensive effect, acute kidney injury',
    management: 'Use alternative analgesic, monitor renal function',
    confounding: ['heart_failure', 'renal_disease']
  },
  {
    drugA: 'Clopidogrel',
    drugB: 'Omeprazole',
    severity: 'critical',
    mechanism: 'Omeprazole inhibits CYP2C19, reducing clopidogrel activation',
    clinical_effect: 'Reduced antiplatelet effect, stent thrombosis risk',
    management: 'Use pantoprazole or ranitidine instead',
    confounding: ['poor_metabolizer_cyp2c19']
  },
  {
    drugA: 'Digoxin',
    drugB: 'Amiodarone',
    severity: 'critical',
    mechanism: 'Amiodarone increases digoxin levels via CYP3A4 inhibition',
    clinical_effect: 'Digoxin toxicity',
    management: 'Reduce digoxin dose by 30-50%, monitor levels closely',
    confounding: ['renal_impairment', 'hypokalemia']
  },
  {
    drugA: 'Lithium',
    drugB: 'NSAIDs',
    severity: 'critical',
    mechanism: 'NSAIDs reduce lithium clearance via renal effects',
    clinical_effect: 'Lithium toxicity',
    management: 'Avoid NSAIDs, use acetaminophen instead',
    confounding: ['dehydration', 'renal_disease']
  },
  {
    drugA: 'Tacrolimus',
    drugB: 'Fluconazole',
    severity: 'critical',
    mechanism: 'Fluconazole inhibits CYP3A4, increasing tacrolimus levels',
    clinical_effect: 'Nephrotoxicity, neurotoxicity',
    management: 'Monitor tacrolimus levels, reduce dose significantly',
    confounding: ['renal_disease']
  },
  {
    drugA: 'Dabigatran',
    drugB: 'Verapamil',
    severity: 'warning',
    mechanism: 'Verapamil inhibits P-glycoprotein, increasing dabigatran levels',
    clinical_effect: 'Increased bleeding risk',
    management: 'Consider dose reduction, monitor for bleeding',
    confounding: ['renal_impairment']
  },
  {
    drugA: 'Simvastatin',
    drugB: 'Clarithromycin',
    severity: 'warning',
    mechanism: 'Clarithromycin inhibits CYP3A4, increasing simvastatin levels',
    clinical_effect: 'Myositis, rhabdomyolysis',
    management: 'Use alternative antibiotic or statin',
    confounding: ['renal_disease']
  },
  {
    drugA: 'Warfarin',
    drugB: 'NSAIDs',
    severity: 'critical',
    mechanism: 'NSAIDs inhibit platelet aggregation and may displace warfarin',
    clinical_effect: 'Increased bleeding risk',
    management: 'Avoid combination, monitor INR closely',
    confounding: ['platelet_disorders', 'liver_disease']
  },
  {
    drugA: 'Methotrexate',
    drugB: 'NSAIDs',
    severity: 'warning',
    mechanism: 'NSAIDs reduce methotrexate clearance',
    clinical_effect: 'Methotrexate toxicity, renal dysfunction',
    management: 'Monitor renal function, consider alternative analgesic',
    confounding: ['renal_disease']
  },
  {
    drugA: 'Quinolone',
    drugB: 'Theophylline',
    severity: 'warning',
    mechanism: 'Quinolones inhibit CYP1A2, increasing theophylline levels',
    clinical_effect: 'Theophylline toxicity',
    management: 'Monitor theophylline levels, reduce dose if needed',
    confounding: []
  },
  {
    drugA: 'Cyclosporine',
    drugB: 'Diltiazem',
    severity: 'warning',
    mechanism: 'Diltiazem inhibits CYP3A4, increasing cyclosporine levels',
    clinical_effect: 'Nephrotoxicity, neurotoxicity',
    management: 'Monitor cyclosporine levels and renal function',
    confounding: ['renal_disease']
  }
]

export function checkDrugInteractions(drugs: string[]): DDI[] {
  const interactions: DDI[] = []
  const lowerDrugs = drugs.map(d => d.toLowerCase())

  for (let i = 0; i < lowerDrugs.length; i++) {
    for (let j = i + 1; j < lowerDrugs.length; j++) {
      const ddi = DDI_DATABASE.find(
        interaction =>
          (interaction.drugA.toLowerCase().includes(lowerDrugs[i]) &&
            interaction.drugB.toLowerCase().includes(lowerDrugs[j])) ||
          (interaction.drugA.toLowerCase().includes(lowerDrugs[j]) &&
            interaction.drugB.toLowerCase().includes(lowerDrugs[i]))
      )
      if (ddi) interactions.push(ddi)
    }
  }

  return interactions
}

export function detectConfounders(
  interactions: DDI[],
  patientFactors: { comorbidities?: string[]; genotype?: string; renal_function?: string }
): string[] {
  const confounders: string[] = []

  for (const interaction of interactions) {
    if (!interaction.confounding) continue

    for (const confounder of interaction.confounding) {
      if (patientFactors.comorbidities?.includes(confounder)) {
        confounders.push(`${interaction.drugA} + ${interaction.drugB} with ${confounder}`)
      }
      if (confounder === 'poor_metabolizer_cyp2c19' && patientFactors.genotype?.includes('CYP2C19*3')) {
        confounders.push(`${interaction.drugA} + ${interaction.drugB} with poor metabolizer status`)
      }
    }
  }

  return confounders
}
