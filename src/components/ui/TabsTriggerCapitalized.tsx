import { TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export default function TabsTriggerCapitalized({ value, className }: { value: string, className?: string })
{
  return <TabsTrigger value={value} className={cn("capitalize hover:bg-cyan-900 duration-100", className)}>{value}</TabsTrigger>
}