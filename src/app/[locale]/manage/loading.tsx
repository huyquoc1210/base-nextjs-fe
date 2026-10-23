import { Skeleton } from "@/components/ui/skeleton";

const Loading = () => {
  return (
    <div className="p-8">
      <Skeleton className="h-8 w-48" />
    </div>
  );
};

export default Loading;
