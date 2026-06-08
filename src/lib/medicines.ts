import { products as baseProducts, type Product } from "@/data/products";

export type MedicineDetails = {
  genericName: string;
  description: string;
  uses: string[];
  dosage: string;
  sideEffects: string[];
  prescriptionRequired: boolean;
};

export type Medicine = Product & {
  pricePKR: number;
  oldPricePKR?: number;
  details: MedicineDetails;
};

const USD_TO_PKR = 280;

const CATEGORY_INFO: Record<string, { uses: string[]; dosage: string; sideEffects: string[]; rx: boolean; desc: string }> = {
  "Pain Relief & Fever": {
    uses: ["Mild to moderate pain relief", "Fever reduction", "Headache", "Muscle aches"],
    dosage: "1 tablet every 6-8 hours after food. Do not exceed 4 tablets in 24 hours.",
    sideEffects: ["Nausea", "Stomach upset", "Dizziness", "Rare allergic reactions"],
    rx: false,
    desc: "Effective analgesic and antipyretic used to relieve mild to moderate pain and reduce fever.",
  },
  "Antibiotics": {
    uses: ["Bacterial infections", "Respiratory infections", "Skin infections", "UTIs"],
    dosage: "As prescribed by your doctor. Complete the full course.",
    sideEffects: ["Diarrhea", "Nausea", "Skin rash"],
    rx: true,
    desc: "Broad-spectrum antibiotic used to treat a wide range of bacterial infections.",
  },
  "Cold & Flu": {
    uses: ["Nasal congestion", "Sneezing", "Runny nose", "Allergy symptoms"],
    dosage: "1 tablet/spoon twice daily or as directed.",
    sideEffects: ["Drowsiness", "Dry mouth", "Headache"],
    rx: false,
    desc: "Relieves symptoms of cold, flu, and seasonal allergies.",
  },
  "Stomach & Digestion": {
    uses: ["Acidity", "Heartburn", "Indigestion", "GERD"],
    dosage: "1 tablet/spoon before meals, twice daily.",
    sideEffects: ["Constipation", "Diarrhea", "Headache"],
    rx: false,
    desc: "Reduces stomach acid and relieves acidity, heartburn and indigestion.",
  },
  "Diabetes Medicines": {
    uses: ["Type 2 diabetes management", "Blood sugar control"],
    dosage: "As prescribed by your doctor; usually with meals.",
    sideEffects: ["Hypoglycemia", "Nausea", "Stomach discomfort"],
    rx: true,
    desc: "Helps control blood glucose levels in patients with type 2 diabetes.",
  },
  "Blood Pressure & Heart": {
    uses: ["Hypertension", "Heart disease prevention", "Angina"],
    dosage: "Once daily as prescribed; preferably at the same time each day.",
    sideEffects: ["Dizziness", "Fatigue", "Dry cough", "Headache"],
    rx: true,
    desc: "Cardiovascular medication to manage blood pressure and reduce cardiac risk.",
  },
  "Vitamins & Supplements": {
    uses: ["Nutritional support", "Immunity boost", "Energy and vitality"],
    dosage: "1 tablet daily after meals.",
    sideEffects: ["Generally well tolerated", "Mild stomach upset (rare)"],
    rx: false,
    desc: "Daily multivitamin and mineral supplement for overall health and wellbeing.",
  },
  "Skin & Allergy": {
    uses: ["Skin infections", "Itching", "Allergic reactions", "Eczema"],
    dosage: "Apply thinly to affected area 2-3 times daily, or take 1 tablet daily.",
    sideEffects: ["Skin irritation", "Drowsiness (oral)", "Local burning"],
    rx: false,
    desc: "Treats various skin conditions and allergic reactions effectively.",
  },
  "Children Medicines": {
    uses: ["Pediatric fever", "Cough & cold in children", "Pediatric infections"],
    dosage: "As per child's weight and age. Consult pediatrician.",
    sideEffects: ["Mild drowsiness", "Stomach upset"],
    rx: false,
    desc: "Specially formulated for safe use in infants and children.",
  },
  "Other Common Medicines": {
    uses: ["Various therapeutic uses"],
    dosage: "As prescribed by your doctor.",
    sideEffects: ["Varies - consult package insert"],
    rx: true,
    desc: "Commonly prescribed medication for specific medical conditions.",
  },
};

function genericFor(name: string): string {
  const map: Record<string, string> = {
    Panadol: "Paracetamol", Calpol: "Paracetamol", Disprin: "Aspirin", Brufen: "Ibuprofen",
    Ponstan: "Mefenamic Acid", Arinac: "Ibuprofen + Pseudoephedrine", Naprosyn: "Naproxen",
    Aspirin: "Acetylsalicylic Acid", Augmentin: "Amoxicillin + Clavulanate", Amoxil: "Amoxicillin",
    Cefspan: "Cefixime", Klaricid: "Clarithromycin", Flagyl: "Metronidazole", Ciproxin: "Ciprofloxacin",
    Velosef: "Cephradine", Rocephin: "Ceftriaxone", Actifed: "Triprolidine + Pseudoephedrine",
    Rigix: "Cetirizine", Telfast: "Fexofenadine", Benadryl: "Diphenhydramine", Gaviscon: "Sodium Alginate",
    Nexum: "Esomeprazole", Risek: "Omeprazole", Losec: "Omeprazole", Motilium: "Domperidone",
    Buscopan: "Hyoscine Butylbromide", Glucophage: "Metformin", Januvia: "Sitagliptin",
    Amaryl: "Glimepiride", Norvasc: "Amlodipine", Cozaar: "Losartan", Lipitor: "Atorvastatin",
    Concor: "Bisoprolol", Lasix: "Furosemide", Surbex: "B-Complex + Zinc",
    Centrum: "Multivitamin & Minerals", Neurobion: "Vitamin B1+B6+B12", Fucidin: "Fusidic Acid",
    Betnovate: "Betamethasone + Neomycin", Canesten: "Clotrimazole", Ventolin: "Salbutamol",
    Seretide: "Salmeterol + Fluticasone", Xanax: "Alprazolam", Prozac: "Fluoxetine",
    Zoloft: "Sertraline", Imodium: "Loperamide", Voltaren: "Diclofenac",
  };
  const key = Object.keys(map).find(k => name.toLowerCase().includes(k.toLowerCase()));
  return key ? map[key] : name.split(" ")[0];
}

export const medicines: Medicine[] = baseProducts.map(p => {
  const info = CATEGORY_INFO[p.category] ?? CATEGORY_INFO["Other Common Medicines"];
  return {
    ...p,
    pricePKR: Math.round(p.price * USD_TO_PKR),
    oldPricePKR: p.oldPrice ? Math.round(p.oldPrice * USD_TO_PKR) : undefined,
    details: {
      genericName: genericFor(p.name),
      description: `${p.name} by ${p.brand}. ${info.desc}`,
      uses: info.uses,
      dosage: info.dosage,
      sideEffects: info.sideEffects,
      prescriptionRequired: info.rx,
    },
  };
});

export const formatPKR = (v: number) => `Rs ${v.toLocaleString("en-PK")}`;

export const allManufacturers = Array.from(new Set(medicines.map(m => m.brand))).sort();
export const allCategories = Array.from(new Set(medicines.map(m => m.category)));

function lev(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m || !n) return m + n;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

export function searchMedicines(list: Medicine[], q: string): Medicine[] {
  const query = q.trim().toLowerCase();
  if (!query) return list;
  const tokens = query.split(/\s+/).filter(Boolean);
  const scored = list.map(m => {
    const hay = `${m.name} ${m.brand} ${m.category} ${m.details.genericName}`.toLowerCase();
    let score = 0;
    if (hay.includes(query)) score += 100;
    for (const t of tokens) {
      if (hay.includes(t)) { score += 20; continue; }
      const words = hay.split(/\s+/);
      const best = Math.min(...words.map(w => lev(w, t)));
      if (best <= 2) score += 12 - best * 4;
    }
    return { m, score };
  });
  return scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score).map(s => s.m);
}

export function similarMedicines(m: Medicine, list: Medicine[], n = 4): Medicine[] {
  return list.filter(x => x.id !== m.id && x.category === m.category && x.inStock).slice(0, n);
}
