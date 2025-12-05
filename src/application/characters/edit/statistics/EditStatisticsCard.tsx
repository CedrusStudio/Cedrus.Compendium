import { Statistic } from "@/domain/characters/statistics/Statistic";
import { DataCard } from '@/common/components/cards/DataCard';
import EditStatisticView from "@/application/characters/edit/statistics/EditStatisticView";
import { type StatisticsDto } from "@/persistence/schemas/characters/statistics/statisticsSchema";
import { PathsFrom} from "@/common/global/pathTypes";
import { attributesIcons, characteristicIcons } from "@/common/icons";
import { displayedText } from "@/common/translations";

export type AllowedRoots = "characteristics" | "attributes";

// Only allow paths inside these roots
type StatsRoot = Pick<StatisticsDto, AllowedRoots>;
export type StatisticPath = PathsFrom<StatsRoot, Statistic>;

type StatisticsCardEditProps<TStats extends Record<string, Statistic>> = 
{
  title: AllowedRoots;
  statistics: TStats;
};

export default function EditStatisticsCard<TStats extends Record<string, Statistic>>({ title, statistics }: StatisticsCardEditProps<TStats>)
{
  const icons = title === "attributes" ? attributesIcons : characteristicIcons;
  const overwriteTitle = title === "attributes" ? displayedText.attributes : displayedText.characteristics;
  const overwriteTitleSingular = title === "attributes" ? displayedText.attribute : displayedText.characteristic;

  return (
    <DataCard 
      title={overwriteTitle} 
      variant="muted"
      contentClassName="flex flex-col gap-y-4"
    >

        <div className="grid grid-cols-5 gap-5 items-center border-b border-border/50 pb-2">
          <div className="text-sm font-semibold text-muted-foreground text-center capitalize">
            {overwriteTitleSingular}
          </div>

          <div className="text-sm font-semibold text-muted-foreground text-center mr-6 capitalize">{displayedText.grade}</div>
          <div className="text-sm font-semibold text-muted-foreground text-center capitalize">{displayedText.value}</div>
          <div className="text-sm font-semibold text-muted-foreground text-center mr-1 capitalize">{displayedText.bonus}</div>
          <div className="text-sm font-semibold text-muted-foreground text-center mr-4 capitalize">{displayedText.testBonus}</div>
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

    </DataCard>
  );
};