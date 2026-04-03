import { type LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  colorClass?: string;
  iconBgClass?: string;
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorClass = "text-gray-900",
  iconBgClass = "bg-green-100",
}: KpiCardProps) {
  const TrendIcon =
    trend === undefined
      ? Minus
      : trend.value > 0
      ? TrendingUp
      : trend.value < 0
      ? TrendingDown
      : Minus;

  const trendColor =
    trend === undefined
      ? "text-gray-500"
      : trend.value > 0
      ? "text-green-600"
      : trend.value < 0
      ? "text-red-600"
      : "text-gray-500";

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={cn("mt-1 text-3xl font-black", colorClass)}>
              {value}
            </p>
            {subtitle && (
              <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend !== undefined && (
              <div className={cn("mt-2 flex items-center gap-1 text-xs font-medium", trendColor)}>
                <TrendIcon className="h-3.5 w-3.5" />
                <span>
                  {trend.value > 0 ? "+" : ""}
                  {trend.value.toFixed(1)}% {trend.label}
                </span>
              </div>
            )}
          </div>
          <div className={cn("rounded-xl p-3", iconBgClass)}>
            <Icon className="h-6 w-6" style={{ color: "#1B4332" }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
