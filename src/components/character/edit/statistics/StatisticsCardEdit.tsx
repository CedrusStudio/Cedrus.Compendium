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

type StatisticsCardEditProps = 
{
  title: "Characteristics" | "Attributes"
  statistics: [string, Statistic, React.ReactNode][];
  control: Control<UpsertCharacterStatisticsType>;
};

export default function StatisticsCardEdit({ title, statistics, control }: StatisticsCardEditProps)
{
  return (
    <Card className="bg-muted">
      <CardHeader>
        <CardTitle className="text-center">
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-y-4">

        <div className="grid grid-cols-5 gap-5 items-center border-b border-border/50 pb-2">
          <div className="text-sm font-semibold text-muted-foreground text-center">
            {title.slice(0, -1)}
          </div>

          <div className="text-sm font-semibold text-muted-foreground text-center mr-6">Grade</div>
          <div className="text-sm font-semibold text-muted-foreground text-center">Value</div>
          <div className="text-sm font-semibold text-muted-foreground text-center mr-1">Bonus</div>
          <div className="text-sm font-semibold text-muted-foreground text-center mr-4">Test Bonus</div>
        </div>

      <div className="grid grid-rows-5 gap-y-4 items-center">
      {
        statistics.map(([name, value, icon]) => 
          <StatisticViewEdit 
            key={name}
            name={name} 
            statistic={value} 
            icon={icon} 
            control={control}
            fieldPath={`${title.toLowerCase()}.${name}`}
          />)
      }
      </div> 

      </CardContent>
    </Card>
  );
};