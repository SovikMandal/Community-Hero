import { cn } from "./utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "rounded-md bg-gray-200 animate-pulse dark:bg-neutral-800/30 dark:[animation:none]",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
