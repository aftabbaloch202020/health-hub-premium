import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";
import p4 from "@/assets/p4.jpg";
import p5 from "@/assets/p5.jpg";
import p6 from "@/assets/p6.jpg";
import p7 from "@/assets/p7.jpg";
import p8 from "@/assets/p8.jpg";

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
  { name: "Medicines", icon: "fa-pills", count: 1240, color: "oklch(0.62 0.17 160)" },
  { name: "Vitamins", icon: "fa-leaf", count: 380, color: "oklch(0.7 0.18 80)" },
  { name: "Baby Care", icon: "fa-baby", count: 215, color: "oklch(0.75 0.12 20)" },
  { name: "Diabetes Care", icon: "fa-droplet", count: 96, color: "oklch(0.6 0.2 25)" },
  { name: "Personal Care", icon: "fa-soap", count: 540, color: "oklch(0.65 0.15 320)" },
  { name: "Beauty", icon: "fa-spa", count: 410, color: "oklch(0.7 0.18 350)" },
  { name: "Health Devices", icon: "fa-heart-pulse", count: 87, color: "oklch(0.55 0.2 20)" },
  { name: "Supplements", icon: "fa-capsules", count: 305, color: "oklch(0.6 0.18 200)" },
  { name: "Herbal", icon: "fa-seedling", count: 178, color: "oklch(0.6 0.18 145)" },
  { name: "Fitness", icon: "fa-dumbbell", count: 142, color: "oklch(0.5 0.18 260)" },
  { name: "Skincare", icon: "fa-hand-sparkles", count: 268, color: "oklch(0.75 0.1 60)" },
  { name: "Oral Care", icon: "fa-tooth", count: 124, color: "oklch(0.55 0.18 220)" },
];

export const products: Product[] = [
  { id: "1", name: "Paracetamol 500mg Tablets", brand: "GenericPharma", category: "Medicines", price: 4.99, oldPrice: 6.5, rating: 4.7, reviews: 312, image: p1, badge: "Best Seller", inStock: true },
  { id: "2", name: "Vitamin C 1000mg Supplement", brand: "VitaGlow", category: "Vitamins", price: 14.5, oldPrice: 19.99, rating: 4.9, reviews: 840, image: p2, badge: "-27%", inStock: true },
  { id: "3", name: "Digital Blood Pressure Monitor", brand: "PulseTech", category: "Health Devices", price: 49.0, oldPrice: 69.0, rating: 4.6, reviews: 188, image: p3, badge: "New", inStock: true },
  { id: "4", name: "Gentle Baby Lotion 250ml", brand: "TenderCare", category: "Baby Care", price: 8.75, rating: 4.8, reviews: 421, image: p4, inStock: true },
  { id: "5", name: "Vitamin E Glow Serum 30ml", brand: "DermaLux", category: "Skincare", price: 22.0, oldPrice: 28.0, rating: 4.7, reviews: 256, image: p5, badge: "Hot", inStock: true },
  { id: "6", name: "Whey Protein Powder 2lb", brand: "FitFuel", category: "Fitness", price: 39.99, rating: 4.5, reviews: 612, image: p6, inStock: true },
  { id: "7", name: "Organic Honey with Herbs 500g", brand: "PureNature", category: "Herbal", price: 12.5, oldPrice: 16.0, rating: 4.9, reviews: 198, image: p7, badge: "Organic", inStock: false },
  { id: "8", name: "Whitening Toothpaste + Brush", brand: "SmileCo", category: "Oral Care", price: 6.25, rating: 4.4, reviews: 144, image: p8, inStock: true },
];
