import { LoadingSkeleton } from "@/components/shared/loading-skeleton";

export default function ProductsLoading() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 space-y-6">
      <LoadingSkeleton variant="page" />
    </div>
  );
}
