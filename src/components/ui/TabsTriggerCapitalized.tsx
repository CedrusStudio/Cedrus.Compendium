import { TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export default function TabsTriggerCapitalized({ value, className }: { value: string, className?: string })
{
  return <TabsTrigger value={value} className={cn("capitalize", className)}>{value}</TabsTrigger>
}