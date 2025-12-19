import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

type SkeletonProps = HTMLAttributes<HTMLDivElement>;

const Skeleton = ({ className, ...props }: SkeletonProps) => {
  return (
    <div
      className={cn(
        "animate-pulse rounded-sm border border-border/60 bg-muted/70",
        className
      )}
      {...props}
    />
  );
};

export { Skeleton };
