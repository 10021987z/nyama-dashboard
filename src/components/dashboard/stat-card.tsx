import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon?: string;
  className?: string;
}

export function StatCard({ label, value, icon, className }: StatCardProps) {
  return (
    <Card className={cn("shadow-sm", className)}>
      <CardContent className="p-4 text-center">
        {icon && <p className="text-2xl mb-1">{icon}</p>}
        <p className="text-2xl font-black text-gray-900">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}
