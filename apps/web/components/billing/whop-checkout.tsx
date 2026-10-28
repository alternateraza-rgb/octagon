"use client";

import { useEffect, useState } from "react";
import { Checkout, CheckoutElement, WhopElements, type Appearance } from "@whop/elements-react";
import { loadWhop } from "@whop/elements";

export type CheckoutTheme = "light" | "dark" | "system";

// Whop Elements' checkout for one of our checkout configurations (`ch_…`), which carries the price
// and the metadata the webhook reads. Paying inside it finishes by sending the tab to `returnUrl`
// (with `payment` and `status` appended), so every page that mounts it also handles coming back.
// Loaded with `next/dynamic` and `ssr: false`: the SDK is a browser script from cdn.whop.com.
export default function WhopCheckout({
  id,
  returnUrl,
  theme = "system",
  onReady,
  onPaid,
  onLoadError,
}: {
  id: string;
  returnUrl: string;
  theme?: CheckoutTheme;
  onReady?: () => void;
  onPaid?: () => void;
  onLoadError?: () => void;
}) {
  // One shared load: loadWhop() injects the script once however often it's called.
  const [elements] = useState(loadWhop);
  const scheme = useScheme(theme);
  const appearance: Appearance = {
    theme: { appearance: scheme, accentColor: "orange", grayColor: "auto" },
    variables: { "--radius": "12px" },
  };

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
        <CheckoutElement />
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
