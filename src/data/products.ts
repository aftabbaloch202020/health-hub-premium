import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";
import p4 from "@/assets/p4.jpg";
import p5 from "@/assets/p5.jpg";
import p6 from "@/assets/p6.jpg";
import p7 from "@/assets/p7.jpg";
import p8 from "@/assets/p8.jpg";
import mPain from "@/assets/m-pain.jpg";
import mAntibiotic from "@/assets/m-antibiotic.jpg";
import mCold from "@/assets/m-cold.jpg";
import mStomach from "@/assets/m-stomach.jpg";
import mDiabetes from "@/assets/m-diabetes.jpg";
import mHeart from "@/assets/m-heart.jpg";
import mSkin from "@/assets/m-skin.jpg";
import mKids from "@/assets/m-kids.jpg";
import mOther from "@/assets/m-other.jpg";
import mVitamin from "@/assets/m-vitamin.jpg";

export const BRAND = {
  name: "MediCare Plus",
  tagline: "Health, Delivered with Care",
  phone: "+92 321 9009251",
  currency: "$",
};

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  badge?: string;
  inStock: boolean;
};

export const categories = [
  { name: "Pain Relief & Fever", icon: "fa-pills", count: 10, color: "oklch(0.62 0.17 25)" },
  { name: "Antibiotics", icon: "fa-capsules", count: 10, color: "oklch(0.62 0.17 160)" },
  { name: "Cold & Flu", icon: "fa-head-side-cough", count: 10, color: "oklch(0.65 0.15 220)" },
  { name: "Stomach & Digestion", icon: "fa-stomach", count: 10, color: "oklch(0.7 0.15 70)" },
  { name: "Diabetes Medicines", icon: "fa-droplet", count: 10, color: "oklch(0.6 0.2 25)" },
  { name: "Blood Pressure & Heart", icon: "fa-heart-pulse", count: 10, color: "oklch(0.55 0.2 15)" },
  { name: "Vitamins & Supplements", icon: "fa-leaf", count: 10, color: "oklch(0.7 0.18 130)" },
  { name: "Skin & Allergy", icon: "fa-hand-sparkles", count: 10, color: "oklch(0.7 0.15 320)" },
  { name: "Children Medicines", icon: "fa-baby", count: 10, color: "oklch(0.75 0.12 20)" },
  { name: "Other Common Medicines", icon: "fa-prescription-bottle-medical", count: 10, color: "oklch(0.6 0.18 200)" },
];

type Seed = [string, string, number, number?];

const make = (
  startId: number,
  category: string,
  image: string,
  items: Seed[]
): Product[] =>
  items.map(([name, brand, price, oldPrice], i) => ({
    id: String(startId + i),
    name,
    brand,
    category,
    price,
    oldPrice,
    rating: 4.3 + ((i * 7) % 7) / 10,
    reviews: 80 + ((i * 53) % 600),
    image,
    badge: i === 0 ? "Best Seller" : i === 2 ? "Hot" : i === 5 ? "New" : undefined,
    inStock: i % 9 !== 7,
  }));

export const products: Product[] = [
  ...make(1001, "Pain Relief & Fever", mPain, [
    ["Panadol 500mg Tablets", "GSK", 3.5, 4.5],
    ["Calpol 250mg Suspension", "GSK", 4.2],
    ["Disprin Tablets", "Reckitt", 2.8, 3.6],
    ["Brufen 400mg Tablets", "Abbott", 5.5],
    ["Ponstan 500mg Tablets", "Pfizer", 6.0, 7.5],
    ["Ansaid 100mg Tablets", "Pfizer", 5.9],
    ["Arinac Forte Tablets", "Abbott", 4.8],
    ["Synflex 275mg Tablets", "Roche", 6.4],
    ["Naprosyn 500mg Tablets", "Roche", 7.2, 9.0],
    ["Aspirin 75mg Tablets", "Bayer", 2.5],
  ]),
  ...make(1101, "Antibiotics", mAntibiotic, [
    ["Augmentin 625mg Tablets", "GSK", 12.0, 15.0],
    ["Amoxil 500mg Capsules", "GSK", 8.5],
    ["Cefspan 400mg Capsules", "Hilton", 22.0, 28.0],
    ["Klaricid 500mg Tablets", "Abbott", 18.5],
    ["Flagyl 400mg Tablets", "Sanofi", 4.9],
    ["Ciproxin 500mg Tablets", "Bayer", 11.0],
    ["Velosef 500mg Capsules", "GSK", 9.4],
    ["Cefim 400mg Capsules", "Sami", 19.0],
    ["Rocephin 1g Injection", "Roche", 25.0, 32.0],
    ["Klarid 500mg Tablets", "Searle", 17.5],
  ]),
  ...make(1201, "Cold & Flu", mCold, [
    ["Actifed Syrup 60ml", "GSK", 4.5, 5.5],
    ["Rigix 10mg Tablets", "Hilton", 3.9],
    ["Telfast 120mg Tablets", "Sanofi", 8.0, 10.0],
    ["Lorinase Tablets", "Searle", 6.5],
    ["Vibramycin 100mg Capsules", "Pfizer", 9.0],
    ["Solvin Cold Tablets", "Searle", 3.2],
    ["Benadryl Cough Syrup", "J&J", 4.8],
    ["Zee Cold Tablets", "Sanofi", 2.9],
    ["Tuspel Cough Syrup", "Hilton", 4.0, 5.0],
    ["Respidon Tablets", "Bosch", 5.5],
  ]),
  ...make(1301, "Stomach & Digestion", mStomach, [
    ["Gaviscon Suspension 150ml", "Reckitt", 6.5, 8.0],
    ["Rennie Antacid Tablets", "Bayer", 4.0],
    ["Nexum 40mg Tablets", "Getz", 9.5, 12.0],
    ["Risek 20mg Capsules", "Getz", 6.0],
    ["Losec 20mg Capsules", "AstraZeneca", 11.0],
    ["Motilium 10mg Tablets", "J&J", 5.5],
    ["Buscopan 10mg Tablets", "Sanofi", 4.9],
    ["Entox-P Sachet", "PharmEvo", 3.5],
    ["Dulcolax 5mg Tablets", "Sanofi", 4.5, 5.8],
    ["Cremaffin Plus Syrup", "Abbott", 5.9],
  ]),
  ...make(1401, "Diabetes Medicines", mDiabetes, [
    ["Glucophage 500mg Tablets", "Merck", 4.5, 5.5],
    ["Galvus 50mg Tablets", "Novartis", 18.0],
    ["Januvia 100mg Tablets", "MSD", 28.0, 35.0],
    ["Amaryl 2mg Tablets", "Sanofi", 9.5],
    ["Diamicron MR 60mg Tablets", "Servier", 12.0],
    ["Gluconorm 1mg Tablets", "Sanofi", 7.0],
    ["Insulatard Penfill 3ml", "Novo Nordisk", 18.5],
    ["Mixtard 30 Penfill 3ml", "Novo Nordisk", 17.0, 20.0],
    ["Novorapid Flexpen 3ml", "Novo Nordisk", 28.0],
    ["Lantus Solostar 3ml", "Sanofi", 35.0],
  ]),
  ...make(1501, "Blood Pressure & Heart", mHeart, [
    ["Norvasc 5mg Tablets", "Pfizer", 8.5, 10.5],
    ["Cozaar 50mg Tablets", "MSD", 11.0],
    ["Cardura 4mg Tablets", "Pfizer", 12.5, 15.0],
    ["Loprin 75mg Tablets", "Atco", 2.8],
    ["Atenolol 50mg Tablets", "Genix", 3.2],
    ["Concor 5mg Tablets", "Merck", 9.5],
    ["Lasix 40mg Tablets", "Sanofi", 3.5],
    ["Capoten 25mg Tablets", "BMS", 5.5],
    ["Lipitor 20mg Tablets", "Pfizer", 14.0, 17.5],
    ["Zestril 10mg Tablets", "AstraZeneca", 8.0],
  ]),
  ...make(1601, "Vitamins & Supplements", mVitamin, [
    ["Surbex-Z Tablets", "Abbott", 6.5, 8.0],
    ["Centrum Multivitamin", "Pfizer", 18.0],
    ["One A Day Multivitamin", "Bayer", 16.5, 20.0],
    ["Neurobion Tablets", "Merck", 7.5],
    ["Sangobion Capsules", "Merck", 9.0],
    ["Calcimax Forte Tablets", "Hilton", 5.8],
    ["Caltrate 600+D3 Tablets", "Pfizer", 12.0],
    ["Feroglobin Capsules", "Vitabiotics", 11.5],
    ["Vitrum Multivitamin", "Unipharm", 14.0, 17.0],
    ["Revital H Capsules", "Sun Pharma", 10.5],
  ]),
  ...make(1701, "Skin & Allergy", mSkin, [
    ["Fucidin Cream 15g", "Leo Pharma", 6.5, 8.0],
    ["Betnovate-N Cream 20g", "GSK", 4.0],
    ["Polyfax Skin Ointment", "GSK", 3.5, 4.5],
    ["Dermovate Cream 25g", "GSK", 9.5],
    ["Canesten Cream 20g", "Bayer", 5.5],
    ["Hydrocortisone 1% Cream", "Genix", 3.8],
    ["Nizoral Shampoo 100ml", "J&J", 12.0],
    ["Xyzal 5mg Tablets", "UCB", 5.0],
    ["Atarax 25mg Tablets", "UCB", 3.9, 5.0],
    ["Claritek 10mg Tablets", "Searle", 6.5],
  ]),
  ...make(1801, "Children Medicines", mKids, [
    ["Panadol Syrup 60ml", "GSK", 3.0, 4.0],
    ["Calpol Syrup 60ml", "GSK", 3.2],
    ["Augmentin Syrup 70ml", "GSK", 8.5, 10.5],
    ["Rigix Syrup 60ml", "Hilton", 4.0],
    ["Ventolin Syrup 100ml", "GSK", 4.5],
    ["Pedialyte ORS 500ml", "Abbott", 5.5],
    ["Infacol Drops 50ml", "Forest", 6.0],
    ["Bonjela Teething Gel", "Reckitt", 5.8, 7.0],
    ["Gripe Water 150ml", "Woodward's", 3.5],
    ["Zincat Syrup 60ml", "Hilton", 4.2],
  ]),
  ...make(1901, "Other Common Medicines", mOther, [
    ["Ventolin Inhaler 200 Doses", "GSK", 9.5, 12.0],
    ["Seretide Inhaler 250mcg", "GSK", 32.0],
    ["Xanax 0.5mg Tablets", "Pfizer", 7.5, 9.5],
    ["Lexotanil 3mg Tablets", "Roche", 6.5],
    ["Valium 5mg Tablets", "Roche", 5.5],
    ["Prozac 20mg Capsules", "Eli Lilly", 11.0],
    ["Zoloft 50mg Tablets", "Pfizer", 13.5],
    ["Imodium 2mg Capsules", "J&J", 4.8],
    ["Voltaren 50mg Tablets", "Novartis", 6.0, 7.5],
    ["Evion 400 Capsules", "Merck", 5.0],
  ]),
];
