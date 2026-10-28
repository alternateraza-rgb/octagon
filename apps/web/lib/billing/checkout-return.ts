// Whop Elements sends the buyer back to the checkout's `returnUrl` whatever happened, with `status`
// appended: `failed` or `canceled` means nothing was charged. Fulfilment still comes from the webhook.
export function paymentFailed(status: string | null | undefined) {
  return status === "failed" || status === "canceled";
}
