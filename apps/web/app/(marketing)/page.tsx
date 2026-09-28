import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { Nav } from "@/components/marketing/nav";
import { Hero } from "@/components/marketing/hero";
import {
  Agents,
  Design,
  Faq,
  Footer,
  Pillars,
  Sendoff,
  Stack,
  Story,
  Templates,
} from "@/components/marketing/sections";
import { HOME_JSON_LD } from "@/lib/seo";
import { templateFontVariables } from "@/lib/template-fonts";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function LandingPage() {
  // The marketing site is light-only, like Base44 — the app itself follows the system theme.
  return (
    <div data-theme="light" className={`${templateFontVariables} bg-canvas text-fg`}>
      <JsonLd data={HOME_JSON_LD} />
      <Nav />
      <main>
        <Hero />
        <Stack />
        <Pillars />
        <Design />
        <Templates />
        <Agents />
        <Story />
        <Faq />
        <Sendoff />
      </main>
      <Footer />
    </div>
  );
}
