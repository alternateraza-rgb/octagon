import { Atelier, Ironside } from "./lifestyle";
import { Bloom, CommonGrounds, Nonna } from "./hospitality";
import { Forma, Harbor, Kestrel } from "./services";
import type { Category, Template } from "./types";

export type { Category, Template } from "./types";

export const TEMPLATES: Template[] = [
  { slug: "nonnas-table", name: "Nonna's Table", category: "Food & drink", blurb: "Italian restaurant", Component: Nonna },
  { slug: "atelier-noir", name: "Atelier Noir", category: "Beauty & wellness", blurb: "Hair salon", Component: Atelier },
  { slug: "kestrel-co", name: "Kestrel & Co.", category: "Professional", blurb: "Law firm", Component: Kestrel },
  { slug: "ironside", name: "Ironside", category: "Beauty & wellness", blurb: "Strength gym", Component: Ironside },
  { slug: "harbor-dental", name: "Harbor Dental", category: "Professional", blurb: "Dental clinic", Component: Harbor },
  { slug: "common-grounds", name: "Common Grounds", category: "Food & drink", blurb: "Coffee house", Component: CommonGrounds },
  { slug: "bloom-and-branch", name: "Bloom & Branch", category: "Home & lifestyle", blurb: "Florist", Component: Bloom },
  { slug: "forma", name: "Forma Studio", category: "Home & lifestyle", blurb: "Architecture studio", Component: Forma },
];

export const CATEGORIES: Category[] = ["Food & drink", "Beauty & wellness", "Professional", "Home & lifestyle"];

export const getTemplate = (slug: string) => TEMPLATES.find((t) => t.slug === slug);
