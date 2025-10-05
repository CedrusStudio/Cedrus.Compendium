import { Statistic } from "@/domain/Character";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/ui/card';
import EditStatisticView from "@/application/characters/edit/statistics/EditStatisticView";
import { UpsertCharacterStatisticsType } from "@/persistence/characterSchemas";
import { Control } from "react-hook-form";
import { PathsFrom} from "@/common/global/pathTypes";
import { attributesIcons, characteristicIcons } from "@/domain/data/icons";

export type AllowedRoots = "characteristics" | "attributes";

// Only allow paths inside these roots
type StatsRoot = Pick<UpsertCharacterStatisticsType, AllowedRoots>;
export type StatisticPath = PathsFrom<StatsRoot, Statistic>;

type StatisticsCardEditProps<TStats extends Record<string, Statistic>> = 
{
  title: AllowedRoots;
  statistics: TStats;
  control: Control<UpsertCharacterStatisticsType>;
};

export default function EditStatisticsCard<TStats extends Record<string, Statistic>>({ title, statistics, control }: StatisticsCardEditProps<TStats>)
{
  const icons = title === "attributes" ? attributesIcons : characteristicIcons;
  const overwriteTitle = title === "attributes" ? "atrybuty" : "cechy";
  const overwriteTitleSingular = title === "attributes" ? "atrybut" : "cecha";

  return (
    <Card className="bg-muted">
      <CardHeader>
        <CardTitle className="text-center capitalize">
          {overwriteTitle}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-y-4">

        <div className="grid grid-cols-5 gap-5 items-center border-b border-border/50 pb-2">
          <div className="text-sm font-semibold text-muted-foreground text-center capitalize">
            {overwriteTitleSingular}
          </div>

          <div className="text-sm font-semibold text-muted-foreground text-center mr-6">Ranga</div>
          <div className="text-sm font-semibold text-muted-foreground text-center">Wartość</div>
          <div className="text-sm font-semibold text-muted-foreground text-center mr-1">Bonus</div>
          <div className="text-sm font-semibold text-muted-foreground text-center mr-4">Bonus Testu</div>
        </div>

      <div className="grid grid-rows-5 gap-y-4 items-center">
      {
        Object.entries(statistics).map(([name, value]) => (
          <EditStatisticView 
            key={name}
            name={name} 
            statistic={value} 
            icon={icons[name]} 
            control={control}
            fieldPath={`${title}.${name}` as StatisticPath}
          />
        ))
      }
      </div> 

      </CardContent>
    </Card>
  );
};