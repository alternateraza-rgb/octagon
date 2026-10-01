import { SerpError } from "./serp";

// A data-provider failure as a response the UI can show; anything else is rethrown.
export function providerFailure(error: unknown) {
  if (error instanceof SerpError) return Response.json({ error: error.message }, { status: error.status });
  throw error;
}

export const clean = (value: unknown, max: number) =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
