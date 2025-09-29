"use client";

import { DamageOffense, Offense, WeaponOffense } from '@/domain/Character';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { UpsertCharacterCombatType } from "@/persistence/characterSchemas";
import { Control } from "react-hook-form";

type EditOffenseCardProps =
{
    offense: Offense;
    control: Control<UpsertCharacterCombatType>;
}

export default function EditOffenseCard({ offense, control }: EditOffenseCardProps)
{
  return (
    <Card className='bg-muted'>

      <CardHeader>
        <CardTitle className='font-bold text-2xl capitalize text-center text-primary'>
          Offense
        </CardTitle>
      </CardHeader>

      <CardContent className='grid grid-cols-1 lg:grid-cols-3 '>
        <div>
          <CardTitle className='font-bold text-xl capitalize text-center text-primary'>
            Leading Arm
          </CardTitle>
          <EditWeaponOffenseView offense={offense.leadingWeapon} />
        </div>

        { 
          offense.secondaryWeapon && (
            <div>
              <CardTitle className='font-bold text-xl capitalize text-center text-primary'>
                Secondary Arm
              </CardTitle>
              <EditWeaponOffenseView offense={offense.secondaryWeapon} />
            </div>
          )
        }

        <div>
          <CardTitle className='font-bold text-xl capitalize text-center text-primary'>
            Damage Bonus
          </CardTitle>
          <EditDamageBonusView damageBonus={offense.damageBonus} />
        </div>

      </CardContent>
      
    </Card>
  );
};

function EditWeaponOffenseView({ offense }: { offense: WeaponOffense })
{
  return (
    <div className="flex flex-row gap-4 m-1 items-center border rounded-md p-2">
        <div className="p-4 rounded-md w-full">
            <h4 className="font-semibold">{offense.amount}</h4>
            <p className="text-sm text-muted-foreground">{offense.bonus}</p>
        </div>
    </div>
  );
}

function EditDamageBonusView({ damageBonus }: { damageBonus: DamageOffense })
{
  return (
    <div className="flex flex-row gap-4 m-1 items-center border rounded-md p-2">

        <div className="p-4 rounded-md w-full">
            <h4 className="font-semibold">{damageBonus.amount}</h4>
            <p className="text-sm text-muted-foreground">{damageBonus.bonus}</p>
        </div>
    </div>
  );
}