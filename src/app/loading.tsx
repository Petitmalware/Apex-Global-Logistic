import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main
      id="main-content"
      className="mx-auto grid min-h-svh w-full max-w-7xl gap-6 px-4 py-8 sm:px-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-72 max-w-[70vw]" />
        </div>
        <Skeleton className="hidden h-10 w-28 sm:block" />
      </div>
      <Skeleton className="h-72 w-full" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    </main>
  );
}
