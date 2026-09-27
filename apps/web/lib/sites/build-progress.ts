// Reads a page as it streams in and reports what's being built, so the builder can show real
// progress instead of raw code.
export const STAGES = [
  "Reading your brief",
  "Choosing a palette and type",
  "Laying out the page",
  "Writing the copy",
  "Finding photos",
  "Polishing the details",
] as const;

export type BuildProgress = {
  stage: number;
  sections: number;
  hasNav: boolean;
  hasFooter: boolean;
  photos: number;
  colors: string[];
  fonts: string[];
  progress: number;
};

export function buildProgress(html: string, expectedLength: number): BuildProgress {
  const lower = html.toLowerCase();
  const count = (needle: string) => lower.split(needle).length - 1;
  const bodyStart = lower.indexOf("<body");
  const body = bodyStart === -1 ? "" : lower.slice(bodyStart);

  const colors = [...new Set(html.match(/#[0-9a-fA-F]{6}\b/g) ?? [])].slice(0, 5);
  const fonts = [
    ...new Set([...html.matchAll(/family=([A-Za-z+]+)/g)].map((m) => decodeURIComponent(m[1].replace(/\+/g, " ")))),
  ].slice(0, 2);
  const sections = body.split("<section").length - 1;
  const photos = count("/img?q=");
  const hasNav = /<(nav|header)[\s>]/.test(body);
  const hasFooter = body.includes("<footer");

  let stage = 0;
  if (lower.includes("<style")) stage = 1;
  if (bodyStart !== -1) stage = 2;
  if (sections > 0) stage = 3;
  if (photos > 0 && sections > 0) stage = 4;
  if (hasFooter) stage = 5;

  return {
    stage,
    sections,
    hasNav,
    hasFooter,
    photos,
    colors,
    fonts,
    progress: Math.min(0.96, 0.04 + html.length / Math.max(expectedLength, 4000)),
  };
}
