import { Statistic } from "@/domain/characters/statistics/Statistic";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/ui/card';
import EditStatisticView from "@/application/characters/edit/statistics/EditStatisticView";
import { UpsertCharacterStatisticsType } from "@/persistence/characterSchemas";
import { PathsFrom} from "@/common/global/pathTypes";
import { attributesIcons, characteristicIcons } from "@/domain/data/icons";
import { translate } from "@/domain/data/translations";

export type AllowedRoots = "characteristics" | "attributes";

// Only allow paths inside these roots
type StatsRoot = Pick<UpsertCharacterStatisticsType, AllowedRoots>;
export type StatisticPath = PathsFrom<StatsRoot, Statistic>;

type StatisticsCardEditProps<TStats extends Record<string, Statistic>> = 
{
  title: AllowedRoots;
  statistics: TStats;
};

export default function EditStatisticsCard<TStats extends Record<string, Statistic>>({ title, statistics }: StatisticsCardEditProps<TStats>)
{
  const icons = title === "attributes" ? attributesIcons : characteristicIcons;
  const overwriteTitle = title === "attributes" ? translate("attributes") : translate("characteristics");
  const overwriteTitleSingular = title === "attributes" ? translate("attribute") : translate("characteristic");

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

          <div className="text-sm font-semibold text-muted-foreground text-center mr-6 capitalize">{translate("grade")}</div>
          <div className="text-sm font-semibold text-muted-foreground text-center capitalize">{translate("value")}</div>
          <div className="text-sm font-semibold text-muted-foreground text-center mr-1 capitalize">{translate("bonus")}</div>
          <div className="text-sm font-semibold text-muted-foreground text-center mr-4 capitalize">{translate("testBonus")}</div>
        </div>

      <div className="grid grid-rows-5 gap-y-4 items-center">
      {
        Object.entries(statistics).map(([name, value]) => (
          <EditStatisticView 
            key={name}
            name={name} 
            statistic={value} 
            icon={icons[name]} 
            fieldPath={`${title}.${name}` as StatisticPath}
          />
        ))
      }
      </div> 

      </CardContent>
    </Card>
  );
};