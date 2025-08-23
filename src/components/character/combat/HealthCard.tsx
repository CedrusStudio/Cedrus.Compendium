"use client";

import { Health, Statistic } from '@/domain/Character';

import {
  Card,
  CardContent,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import FieldView from '@/components/character/FieldView';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

type HealthCardProps = 
{
  health: Health;
  constitution: Statistic;
  fortitude: Statistic;
};

export default function HealthCard(input: HealthCardProps)
{
  const totalHealth = calculateTotalHealth(input.health, input.constitution, input.fortitude);
  const [currentHealth, setCurrentHealth] = useState<number>(totalHealth);
  const [healthChangeAmount, setHealthChangeAmount] = useState<number>(1);

  const [currentBarrier, setCurrentBarrier] = useState<number>(input.health.barrier);
  const [barrierChangeAmount, setBarrierChangeAmount] = useState<number>(1);
  
  const [isOpen, setIsOpen] = useState(false)

  const increase = (changeBy: number, setStateAction: React.Dispatch<React.SetStateAction<number>>) => 
  {
    setStateAction(previousValue => previousValue + changeBy);
  };

  const decrease = (changeBy: number, setStateAction: React.Dispatch<React.SetStateAction<number>>) => 
  {
    setStateAction(previousValue => previousValue - changeBy);
  };

  const reset = (defaultValue: number, setStateAction: React.Dispatch<React.SetStateAction<number>>) => 
  {
    setStateAction(defaultValue);
  };

  return (
    <Card className='bg-muted'>

      <div className='grid grid-cols-2'>
        {/* Health */}
        <CardContent className='flex flex-col gap-y-4'>
          <CardTitle className='font-bold text-2xl capitalize text-center text-primary'>Health</CardTitle>

          <FieldView name="Total" value={totalHealth} />
          <FieldView name="Current" value={currentHealth} />
          
          <div className='flex gap-x-4 items-center justify-center flex-wrap'>
            <Input type="number" value={healthChangeAmount} onChange={(e) => setHealthChangeAmount(Number(e.target.value))} className="w-16 text-center" />
            <Button variant='outline' onClick={() => increase(healthChangeAmount, setCurrentHealth)} className="w-16">Increase</Button>
            <Button variant='outline' onClick={() => decrease(healthChangeAmount, setCurrentHealth)} className="w-16">Decrease</Button>
            <Button variant='outline' onClick={() => reset(totalHealth, setCurrentHealth)} className="w-16">Reset</Button>
          </div>
        </CardContent>

        {/* Barrier */}
        <CardContent className='flex flex-col gap-y-4'>
          <CardTitle className='font-bold text-2xl capitalize text-center text-primary'>Barrier</CardTitle>

          <FieldView name="Total" value={input.health.barrier} />
          <FieldView name="Current" value={currentBarrier} />
          
          <div className='flex gap-x-4 items-center justify-center  flex-wrap'>
            <Input type="number" value={barrierChangeAmount} onChange={(e) => setBarrierChangeAmount(Number(e.target.value))} className="w-16 text-center" />
            <Button variant='outline' onClick={() => increase(barrierChangeAmount, setCurrentBarrier)} className="w-16">Increase</Button>
            <Button variant='outline' onClick={() => decrease(barrierChangeAmount, setCurrentBarrier)} className="w-16">Decrease</Button>
            <Button variant='outline' onClick={() => reset(input.health.barrier, setCurrentBarrier)} className="w-16">Reset</Button>
          </div>
        </CardContent>
      </div>

      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="">

        <div className="flex items-center justify-center gap-4 px-4">
          <CollapsibleTrigger asChild>
            <Button variant="default">
              {isOpen ? 'Show less' : 'Show more'}
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent className="flex flex-col gap-2">

          <CardContent className='flex flex-col gap-y-4 mt-8'>
          {
            Object.entries(input.health)
              .filter(([name]) => name !== 'barrier')
              .map(([name, value]) => <FieldView key={name} name={name} value={value} />)
          }
          </CardContent>
      
        </CollapsibleContent>

      </Collapsible>
    </Card>
  );
};

function calculateTotalHealth(health: Health, constitution: Statistic, fortitude: Statistic): number
{
  return health.vitality 
    + health.toughness * constitution.value
    + constitution.testBonus 
    + fortitude.value
    + health.bonus;
}