---
name: apple-design
description: Octacore's Apple-inspired design language (HIG principles + Octacore brand tokens). Load before building or restyling any UI in apps/web or packages/ui — pages, components, marketing sections, builder chrome, emails.
---

# Octacore design language — "Apple × Base44"

Octacore should feel like an Apple product page that happens to build websites: calm, confident, content-first, with one warm accent. Base44 gives the *structure* (prompt-first hero, feature sections, pricing, FAQ); Apple gives the *feel*.

## Core principles (from Apple's Human Interface Guidelines)
1. **Clarity** — one idea per section. Big type, short copy, obvious primary action. If a sentence needs a second line on desktop, cut it.
2. **Deference** — UI chrome recedes so content (the user's website, their chat) is the hero. Prefer neutral surfaces, hairlines and translucency over boxes and color.
3. **Depth** — hierarchy through layering: translucent materials, soft large shadows, subtle scale on interaction. Never heavy borders.
4. **Consistency** — use the tokens below; never invent a hex, radius or shadow inline.
5. **Motion with purpose** — springs, not linear easing. Animate to explain (reveal, continuity), not to decorate. Always honor `prefers-reduced-motion`.

## Tokens (defined in `packages/ui/src/tokens.css`, exposed as Tailwind theme)
- **Accent**: `octa-600 #C2410C` (primary buttons, focus, key highlights). Hover `octa-500 #EA580C`, pressed `octa-700 #9A3412`, deepest `octa-800 #7C2D12`, glow `octa-400 #F0661A`. Use the accent sparingly — at most one accented action per view.
- **Neutrals** (Apple grays): canvas `#FFFFFF`, secondary canvas `#F5F5F7`, ink `#1D1D1F`, secondary text `#6E6E73`, tertiary `#86868B`, hairline `rgba(0,0,0,.08)`. Dark mode: canvas `#000000`, elevated `#0B0B0C` / `#161617`, ink `#F5F5F7`, secondary `#A1A1A6`, hairline `rgba(255,255,255,.1)`.
- **Type**: `-apple-system, "SF Pro Display", "SF Pro Text", Inter, system-ui, sans-serif`. Scale: hero 64–96px / weight 600 / tracking −0.03em / leading 1.02; section title 40–56px / 600 / −0.025em; headline 21–28px / 600; body 17px / 400 / leading 1.47; caption 12–14px. Use `text-balance` on headings.
- **Radius**: 12px controls, 18px cards, 28px large panels/tiles, full pill for primary CTAs and chips.
- **Spacing**: 8pt grid. Sections breathe: 120–160px vertical padding desktop, 80px mobile. Max content width 1120px; text columns ≤ 680px.
- **Materials**: `.material` = `bg-white/72 dark:bg-black/60 backdrop-blur-xl backdrop-saturate-150` + hairline border. Use for nav, sidebars, floating toolbars, the hero prompt box.
- **Shadows**: `shadow-soft` (0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)), `shadow-float` (0 24px 64px -12px rgba(0,0,0,.18)). No shadows in dark mode except the accent glow on the primary hero element.

## Components
- **Buttons**: primary = pill, accent fill, white 15–17px label, 44px min height (Apple touch target). Secondary = pill, `#F5F5F7` / `white/10`. Tertiary = accent text link with `›` chevron ("Learn more ›").
- **Inputs**: 44px+ height, 12px radius, hairline border, accent focus ring (`ring-4 ring-octa-600/15`).
- **Cards**: 18–28px radius, secondary canvas fill or material; no borders in light mode unless on white-on-white.
- **Icons**: Lucide at 1.5 stroke, sized to text; never multicolor.
- **Logo**: the Octacore ring mark — octagonal ring with a 45° slot through the top-right corner, brand orange `#B44B23` (`packages/ui/brand/`, master PNG `logo-master.png`). Never recolor (except mono white/black), never stretch, keep clear space ≥ 25% of mark width.

## Copy voice
Short, declarative, confident. "Build it. Ship it. Sell it." Sentence case. No exclamation marks. Numbers over adjectives ("Live in 90 seconds").

## Checklist before shipping UI
- [ ] Looks right in light **and** dark, at 375px and 1440px, no horizontal scroll.
- [ ] One primary action per view; accent used ≤ 2× above the fold.
- [ ] All interactive targets ≥ 44px; visible focus states; semantic HTML; alt text.
- [ ] Motion respects `prefers-reduced-motion`.
- [ ] Only tokens used — no stray hex values.
