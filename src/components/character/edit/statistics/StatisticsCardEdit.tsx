import { Statistic } from "@/domain/Character";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import StatisticViewEdit from "@/components/character/edit/statistics/StatisticsViewEdit";
import { UpsertCharacterStatisticsType } from "@/persistence/characterSchemas";
import { Control } from "react-hook-form";
import { PathsFrom} from "@/utils/pathTypes";
import { attributesIcons, characteristicIcons } from "@/utils/icons";

export type AllowedRoots = "characteristics" | "attributes";

// Only allow paths inside these roots
type StatsRoot = Pick<UpsertCharacterStatisticsType, AllowedRoots>;
export type StatisticPath = PathsFrom<StatsRoot, Statistic>;

type StatisticsCardEditProps<TStats extends Record<string, Statistic>> = 
{
  title: AllowedRoots
  statistics: TStats;
  control: Control<UpsertCharacterStatisticsType>;
};

export default function StatisticsCardEdit<TStats extends Record<string, Statistic>>({ title, statistics, control }: StatisticsCardEditProps<TStats>)
{
  const icons = title === "attributes" ? attributesIcons : characteristicIcons;

  return (
    <Card className="bg-muted">
      <CardHeader>
        <CardTitle className="text-center capitalize">
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-y-4">

        <div className="grid grid-cols-5 gap-5 items-center border-b border-border/50 pb-2">
          <div className="text-sm font-semibold text-muted-foreground text-center capitalize">
            {title.slice(0, -1)}
          </div>

          <div className="text-sm font-semibold text-muted-foreground text-center mr-6">Grade</div>
          <div className="text-sm font-semibold text-muted-foreground text-center">Value</div>
          <div className="text-sm font-semibold text-muted-foreground text-center mr-1">Bonus</div>
          <div className="text-sm font-semibold text-muted-foreground text-center mr-4">Test Bonus</div>
        </div>

      <div className="grid grid-rows-5 gap-y-4 items-center">
      {
        Object.entries(statistics).map(([name, value]) => 
          <StatisticViewEdit 
            key={name}
            name={name} 
            statistic={value} 
            icon={icons[name]} 
            control={control}
            fieldPath={`${title}.${name}` as StatisticPath}
          />)
      }
      </div> 

      </CardContent>
    </Card>
  );
};