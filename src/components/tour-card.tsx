"use client";

import type { CardComponentProps } from "nextstepjs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function TourCard({
  step,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  skipTour,
  arrow,
}: CardComponentProps) {
  const isLast = currentStep === totalSteps - 1;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div
      className={cn(
        "max-w-lg min-w-64 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-lg",
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold tracking-tight">{step.title}</h2>
        {step.icon ? (
          <span className="flex shrink-0 items-center justify-center [&_svg]:pointer-events-none">
            {step.icon}
          </span>
        ) : null}
      </div>

      <div className="mb-4 text-sm text-muted-foreground">{step.content}</div>

      <div className="mb-4 h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between gap-4 text-xs">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={prevStep}
          disabled={currentStep === 0}
          className={cn(!step.showControls && "hidden")}
        >
          Previous
        </Button>
        <span className="shrink-0 whitespace-nowrap text-muted-foreground">
          {currentStep + 1} of {totalSteps}
        </span>
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={nextStep}
          className={cn(!step.showControls && "hidden")}
        >
          {isLast ? "Finish" : "Next"}
        </Button>
      </div>

      {arrow}

      {skipTour && currentStep < totalSteps - 1 ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={skipTour}
          className={cn(
            "mt-4 w-full",
            !step.showSkip && "hidden",
          )}
        >
          Skip tour
        </Button>
      ) : null}
    </div>
  );
}
