import { buildProspect } from "./prospect";
import { parseScenario } from "./scenarios";
import { getAcademyLead } from "./store";

// Rebuilds the same prospect on every request from the scenario, lead and seed the call started with.
export async function prospectFor(env: CloudflareEnv, userId: string, body: { scenario?: unknown; leadId?: unknown; seed?: unknown }) {
  const scenario = parseScenario(body.scenario);
  if (!scenario) return null;
  const lead = typeof body.leadId === "string" ? await getAcademyLead(env.DB, userId, env.SITES_DOMAIN, body.leadId) : null;
  const seed = typeof body.seed === "number" && body.seed >= 0 && body.seed < 1 ? body.seed : Math.random();
  return { scenario, lead, seed, prospect: buildProspect(scenario, lead, seed) };
}
