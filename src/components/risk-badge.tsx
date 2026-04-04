import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Grade = "A" | "B" | "C" | "D";

interface RiskBadgeProps {
  grade: Grade;
  size?: "sm" | "lg";
}

const gradeStyles: Record<Grade, string> = {
  A: "bg-lime-100 text-lime-700 border-lime-300",
  B: "bg-blue-100 text-blue-700 border-blue-300",
  C: "bg-amber-100 text-amber-700 border-amber-300",
  D: "bg-red-100 text-red-700 border-red-300",
};

const sizeStyles = {
  sm: "text-xs px-2 py-0.5",
  lg: "text-sm px-3 py-1",
};

export function RiskBadge({ grade, size = "sm" }: RiskBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-semibold",
        gradeStyles[grade],
        sizeStyles[size]
      )}
    >
      {grade}
    </Badge>
  );
}
