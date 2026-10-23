import { Skeleton } from "@/components/ui/skeleton";

const Loading = () => {
  return (
    <div className="flex flex-1 flex-col gap-4 p-8">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full max-w-md" />
      <Skeleton className="h-4 w-full max-w-sm" />
    </div>
  );
};

export default Loading;
