import { Geist, Inter } from "next/font/google";

// App-wide type. Template typefaces live in ./template-fonts and load only on pages that show templates.
export const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
export const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export const fontVariables = [inter, geist].map((f) => f.variable).join(" ");
