import type { Appearance } from "@whop/elements-react";

// Octacore's look for Whop's checkout. The checkout renders in Whop's frame, which our stylesheet
// and CSS variables can't reach, so the tokens from packages/ui/src/tokens.css are repeated here as
// values and handed to Whop as per-part styles. Keep the two in step.
const OCTA = { 600: "#c2410c", 700: "#9a3412" };
const SCHEMES = {
  light: { canvas: "#f9f8f6", elevated: "#ffffff", fg: "#0f0f0f", fg2: "#5f5f63", fg3: "#86868b", field: "#ffffff", hairline: "rgba(0, 0, 0, 0.1)" },
  dark: { canvas: "#000000", elevated: "#161617", fg: "#f5f5f7", fg2: "#a1a1a6", fg3: "#86868b", field: "#0b0b0c", hairline: "rgba(255, 255, 255, 0.1)" },
};

// The token the checkout sits on: `bg-canvas` (the plan dialog) or `bg-elevated` (the buy sheet).
export type Surface = "canvas" | "elevated";
const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", Inter, system-ui, sans-serif';

export function checkoutAppearance(scheme: "light" | "dark", surface: Surface, { hideSeller = false } = {}): Appearance {
  const c = SCHEMES[scheme];
  // Every column paints the surface itself: Whop's own panel colors don't match ours, and a
  // transparent frame shows whatever is behind it, which needn't be in the same scheme.
  const background = { backgroundColor: c[surface] };
  const input = {
    backgroundColor: c.field,
    border: `1px solid ${c.hairline}`,
    borderRadius: "12px",
    minHeight: "44px",
    fontSize: "15px",
    color: c.fg,
  };
  const focused = { borderColor: OCTA[600], boxShadow: "0 0 0 4px rgba(194, 65, 12, 0.15)" };
  const invalid = { borderColor: "#dc2626", boxShadow: "0 0 0 4px rgba(220, 38, 38, 0.12)" };
  const label = { fontSize: "13px", fontWeight: "500", color: c.fg2 };
  return {
    // Named palettes for whatever the parts below don't cover (radios, links, toggles).
    theme: { appearance: scheme, accentColor: "orange", grayColor: "sand", dangerColor: "red", successColor: "green" },
    variables: { "--radius": "12px" },
    classes: {
      "whop-Checkout": { ...background, fontFamily: FONT, color: c.fg },
      "whop-CheckoutLayout": background,
      "whop-CheckoutDetails": background,
      "whop-CheckoutCollection": background,
      // The dialog around it already says what's being bought and from whom.
      ...(hideSeller && { "whop-CheckoutSeller": { display: "none" }, "whop-CheckoutSellerLogo": { display: "none" } }),
      "whop-CheckoutPrice": { fontWeight: "600", letterSpacing: "-0.025em", color: c.fg },
      "whop-CheckoutPriceContext": { fontSize: "13px", color: c.fg3 },
      "whop-CheckoutItem": { fontWeight: "600", letterSpacing: "-0.01em" },

      "whop-CheckoutPayButton": {
        backgroundColor: OCTA[600],
        color: "#ffffff",
        borderRadius: "9999px",
        minHeight: "48px",
        fontSize: "16px",
        fontWeight: "500",
        boxShadow: "0 8px 24px -8px rgba(194, 65, 12, 0.6)",
      },
      "whop-CheckoutFailedRetry": { backgroundColor: OCTA[600], color: "#ffffff", borderRadius: "9999px", minHeight: "44px" },
      "whop-CheckoutFinishPaymentButton": { backgroundColor: OCTA[600], color: "#ffffff", borderRadius: "9999px", minHeight: "44px" },
      "whop-CheckoutContinue": { color: OCTA[600], fontWeight: "500" },

      "whop-CheckoutRequirementInput": input,
      "whop-CheckoutRequirementLabel": label,
      "whop-CheckoutPromoInput": input,
      "whop-CheckoutPromoRow": { borderRadius: "9999px" },
      "whop-CheckoutPromoApply": { color: OCTA[600], fontWeight: "500" },
      "whop-CheckoutPromoChip": { borderRadius: "9999px", color: OCTA[700] },
      "whop-CardLabel": label,
      "whop-CardFieldInput": input,
      "whop-CardFieldInputFocused": focused,
      "whop-CardFieldInputInvalid": invalid,
      "whop-AddressFieldLabel": label,
      "whop-AddressFieldInput": input,
      "whop-AddressFieldSelect": input,
      "whop-AddressFieldInputInvalid": invalid,
      "whop-CheckoutPhoneVerificationInput": input,

      "whop-CheckoutFieldError": { fontSize: "13px" },
      "whop-CheckoutError": { fontSize: "14px" },
      "whop-CheckoutPolicyLink": { color: c.fg2, textDecoration: "underline" },
      "whop-CheckoutBreakdownToggle": { color: c.fg2 },
      "whop-CheckoutDetailsToggle": { color: c.fg2 },
      "whop-CheckoutCurrencyToggle": { color: OCTA[600] },
      "whop-CheckoutExpressDivider": { color: c.fg3, fontSize: "13px" },
    },
  };
}
