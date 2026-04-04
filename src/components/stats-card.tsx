"use client";

import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { motion } from "framer-motion";

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
}

const trendConfig = {
  up: { icon: TrendingUp, color: "text-lime-600", bg: "bg-lime-50" },
  down: { icon: TrendingDown, color: "text-red-500", bg: "bg-red-50" },
  neutral: { icon: Minus, color: "text-gray-400", bg: "bg-gray-50" },
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
}: StatsCardProps) {
  const trendInfo = trend ? trendConfig[trend] : null;
  const TrendIcon = trendInfo?.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {title}
            </CardTitle>
            <div className="rounded-lg bg-lime-50 p-2">
              <Icon className="size-4 text-lime-600" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2">
            <span className="font-heading text-2xl font-semibold tracking-tight text-gray-900">
              {value}
            </span>
            {TrendIcon && trendInfo && (
              <span
                className={`flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium ${trendInfo.bg} ${trendInfo.color}`}
              >
                <TrendIcon className="size-3" />
              </span>
            )}
          </div>
          {subtitle && (
            <CardDescription className="mt-1">{subtitle}</CardDescription>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
