import { Statistic } from "@/domain/characters/statistics/Statistic";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/ui/card';
import StatisticView from "@/application/characters/statistics/StatisticView";
import { displayedText } from "@/presentation/translations";


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
          {displayedText[title as keyof typeof displayedText]}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-y-3 lg:gap-y-4">
      {
        statistics.map(([name, value, icon]) => <StatisticView key={name} name={name} statistic={value} icon={icon} />)
      }
      </CardContent>
    </Card>
  );
};