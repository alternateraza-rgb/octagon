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

export default function LandingPage() {
  // The marketing site is light-only, like Base44 — the app itself follows the system theme.
  return (
    <div data-theme="light" className="bg-canvas text-fg">
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
