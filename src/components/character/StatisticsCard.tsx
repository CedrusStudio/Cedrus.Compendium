import { Statistic } from "@/domain/Character";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import StatisticView from "@/components/character/StatisticView";

type StatisticsViewProps = 
{
  title: string;
  statistics: [string, Statistic][];
};

export default function StatisticsCard({ title, statistics }: StatisticsViewProps)
{
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">{title}</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-y-4">
      {
        statistics.map(([name, value]) => <StatisticView key={name} name={name} statistic={value} />)
      }
      </CardContent>
    </Card>
  );
};