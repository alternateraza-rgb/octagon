// Route-level loading states: shaped like the page they stand in for, so navigation feels instant.
export function ChatSkeleton() {
  return (
    <div className="flex h-full flex-col" aria-busy aria-label="Loading">
      <div className="mx-auto w-full max-w-[760px] flex-1 space-y-8 px-5 py-10">
        <div className="shimmer ml-auto h-11 w-2/5 rounded-[18px]" />
        <div className="space-y-3">
          <div className="shimmer h-4 w-11/12 rounded-full" />
          <div className="shimmer h-4 w-4/5 rounded-full" />
          <div className="shimmer h-4 w-3/5 rounded-full" />
        </div>
      </div>
      <div className="px-3 pb-10 sm:px-5">
        <div className="shimmer mx-auto h-[60px] max-w-[760px] rounded-[24px]" />
      </div>
    </div>
  );
}

export function SitesSkeleton() {
  return (
    <div className="mx-auto max-w-[1120px] px-5 pt-12 sm:pt-16" aria-busy aria-label="Loading">
      <div className="shimmer h-12 w-56 rounded-[14px]" />
      <div className="shimmer mt-4 h-5 w-96 max-w-full rounded-full" />
      <div className="shimmer mt-9 h-[132px] max-w-[760px] rounded-[24px]" />
      <div className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i}>
            <div className="shimmer aspect-[16/10] rounded-[20px]" />
            <div className="shimmer mt-3 h-4 w-1/2 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function BuilderSkeleton() {
  return (
    <div className="flex h-full" aria-busy aria-label="Loading">
      <div className="hidden w-[400px] shrink-0 flex-col border-r border-hairline p-4 lg:flex">
        <div className="shimmer h-8 w-40 rounded-full" />
        <div className="shimmer ml-auto mt-8 h-16 w-3/4 rounded-[18px]" />
        <div className="shimmer mt-4 h-12 w-full rounded-[14px]" />
        <div className="shimmer mt-auto h-[60px] rounded-[22px]" />
      </div>
      <div className="flex flex-1 flex-col bg-canvas-2">
        <div className="h-14 border-b border-hairline" />
        <div className="shimmer m-6 flex-1 rounded-[18px]" />
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-[1120px] px-5 pt-12 sm:pt-16" aria-busy aria-label="Loading">
      <div className="shimmer h-12 w-64 rounded-[14px]" />
      <div className="shimmer mt-4 h-5 w-80 max-w-full rounded-full" />
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="shimmer h-56 rounded-[28px]" />
        ))}
      </div>
    </div>
  );
}
