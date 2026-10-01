-- The first contact hunt accepted addresses that were only mentioned near a business's name, which
-- picked up neighbours' and directories' emails ("medium" confidence). Those are cleared so the
-- stricter hunt (lib/agents/contacts.ts) looks again the next time someone adds the business or
-- presses "Look again". Emails users typed in themselves (lead.emailOverride) are untouched.
update "business"
set "email" = null, "emailSource" = null, "emailConfidence" = null, "contactStatus" = 'none', "huntedAt" = 0
where "contactStatus" = 'found' and coalesce("emailConfidence", 'low') != 'high';
