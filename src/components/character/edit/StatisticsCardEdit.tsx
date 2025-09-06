import { Statistic } from "@/domain/Character";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import StatisticViewEdit from "@/components/character/edit/StatisticsViewEdit";
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
      </CardContent>
    </Card>
  );
};