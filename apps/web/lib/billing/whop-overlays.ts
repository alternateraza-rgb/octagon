// Whop's checkout embed covers the page with its own overlay while a payment processes and closes it
// shortly after. Called once checkout is over, so none is ever left behind.
export function clearWhopOverlays() {
  document.querySelectorAll<HTMLDialogElement>("dialog[data-whop-checkout-overlay]").forEach((overlay) => {
    try {
      overlay.close();
    } catch {}
    overlay.remove();
  });
  document.body.style.overflow = "";
  document.documentElement.style.overflow = "";
}
