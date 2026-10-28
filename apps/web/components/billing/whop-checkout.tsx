"use client";

import { useEffect, useMemo, useState } from "react";
import { Checkout, CheckoutElement, WhopElements } from "@whop/elements-react";
import { loadWhop } from "@whop/elements";
import { checkoutAppearance } from "@/lib/billing/checkout-appearance";

export type CheckoutTheme = "light" | "dark" | "system";

// Whop Elements' checkout for one of our checkout configurations (`ch_…`), which carries the price
// and the metadata the webhook reads. Paying inside it finishes by sending the tab to `returnUrl`
// (with `payment` and `status` appended), so every page that mounts it also handles coming back.
// Loaded with `next/dynamic` and `ssr: false`: the SDK is a browser script from cdn.whop.com.
export default function WhopCheckout({
  id,
  returnUrl,
  theme = "system",
  email,
  hideSeller,
  onReady,
  onPaid,
  onLoadError,
}: {
  id: string;
  returnUrl: string;
  theme?: CheckoutTheme;
  // The buyer's email when we already know it; they can still change it.
  email?: string;
  // Leave out Whop's seller line where the page around the checkout already names who's paid.
  hideSeller?: boolean;
  onReady?: () => void;
  onPaid?: () => void;
  onLoadError?: () => void;
}) {
  // One shared load: loadWhop() injects the script once however often it's called.
  const [elements] = useState(loadWhop);
  const scheme = useScheme(theme);
  const appearance = useMemo(() => checkoutAppearance(scheme, { hideSeller }), [scheme, hideSeller]);

  return (
    <WhopElements
      elements={elements}
      appearance={appearance}
      onLoadError={(error) => {
        console.error("Whop Elements failed to load", error);
        onLoadError?.();
      }}
    >
      <Checkout
        checkoutConfiguration={id}
        returnUrl={new URL(returnUrl, window.location.origin).toString()}
        onLoadingChange={(loading) => !loading && onReady?.()}
        onComplete={(completion) => completion.result === "payment" && onPaid?.()}
      >
        <CheckoutElement buyerEmail={email} />
      </Checkout>
    </WhopElements>
  );
}

function useScheme(theme: CheckoutTheme): "light" | "dark" {
  const [dark, setDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  useEffect(() => {
    if (theme !== "system") return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const change = () => setDark(query.matches);
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, [theme]);
  return theme === "system" ? (dark ? "dark" : "light") : theme;
}
