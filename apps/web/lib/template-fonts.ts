import { Anton, Cormorant_Garamond, Fraunces, Instrument_Serif, Manrope } from "next/font/google";

// Template typefaces — each website template picks its own voice. Only imported by pages that render
// templates (landing, sign-up, template previews), so the dashboard doesn't download them.
export const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], style: ["normal", "italic"] });
export const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});
export const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});
export const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });
export const anton = Anton({ variable: "--font-anton", subsets: ["latin"], weight: "400" });

export const templateFontVariables = [fraunces, cormorant, instrument, manrope, anton].map((f) => f.variable).join(" ");
