export const metadata = { title: { default: "Your website", template: "%s · Octacore" }, robots: { index: false } };

export default function OwnerLayout({ children }: LayoutProps<"/owner">) {
  return <div className="min-h-dvh bg-canvas">{children}</div>;
}
