import { cn } from "@/lib/utils";
import { Section } from "@/app/section";

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <Section className={cn("animate-pulse border-0 bg-surface", className)} />
  );
}