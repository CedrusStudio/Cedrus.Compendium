import { Statistic } from "@/domain/Character";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/ui/card';
import StatisticView from "@/application/characters/statistics/StatisticView";
import { translate } from "@/domain/data/translations";

type StatisticsViewProps = 
{
  title: string;
  statistics: [string, Statistic, React.ReactNode][];
};

export default function StatisticsCard({ title, statistics }: StatisticsViewProps)
{
  return (
    <Card className="bg-muted">
      <CardHeader>
        <CardTitle className="text-center">
          {translate(title)}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-y-4">
      {
        statistics.map(([name, value, icon]) => <StatisticView key={name} name={name} statistic={value} icon={icon} />)
      }
      </CardContent>
    </Card>
  );
};