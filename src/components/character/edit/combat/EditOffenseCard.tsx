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
import Subcard from '@/components/global/Subcard';

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

      <CardContent className={ `grid grid-cols-1 gap-1 ${offense.secondaryWeapon ? `md:grid-cols-9` : `md:grid-cols-6` }` }>

        <EditWeaponOffenseSubcard name='Leading Arm' offense={offense.leadingWeapon} control={control} />
        
        { 
          offense.secondaryWeapon &&  <EditWeaponOffenseSubcard name='Secondary Arm' offense={offense.secondaryWeapon} control={control} />
        }

        <EditDamageBonusSubcard damageBonus={offense.damageBonus} control={control} />

      </CardContent>
      
    </Card>
  );
};

type EditWeaponOffenseSubcardProps =
{
  name: string;
  offense: WeaponOffense;
  control: Control<UpsertCharacterCombatType>;
}

function EditWeaponOffenseSubcard({ name, offense, control }: EditWeaponOffenseSubcardProps)
{
  return (
    <Subcard  name={name} className='col-span-3' callback={() => {}}>
        <div className="p-4 rounded-md w-full">
            <h4 className="font-semibold">{offense.amount}</h4>
            <p className="text-sm text-muted-foreground">{offense.bonus}</p>
        </div>
    </Subcard>
  );
}

function EditDamageBonusSubcard({ damageBonus, control }: { damageBonus: DamageOffense, control: Control<UpsertCharacterCombatType> })
{
  return (
    <Subcard name={"Damage Bonus"} className='col-span-3' callback={() => {}}>
        <div className="p-4 rounded-md w-full">
            <h4 className="font-semibold">{damageBonus.amount}</h4>
            <p className="text-sm text-muted-foreground">{damageBonus.bonus}</p>
        </div>
    </Subcard>
  );
}