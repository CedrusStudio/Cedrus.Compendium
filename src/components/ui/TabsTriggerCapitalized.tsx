import { TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export default function TabsTriggerCapitalized({ value, className, overrideValue }: { value: string, className?: string, overrideValue?: string })
{
  return <TabsTrigger value={value} className={cn("capitalize hover:bg-cyan-900 duration-100", className)}>{overrideValue ?? value}</TabsTrigger>
}