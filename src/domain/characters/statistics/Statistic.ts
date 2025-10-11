export type Statistic = 
{
  grade: number;
  value: number;
  bonus: number;
  testBonus: number;
};

export function getStatisticTotalTestValue(statistic: Statistic): number
{
  return statistic.value + statistic.bonus + statistic.testBonus;
}
