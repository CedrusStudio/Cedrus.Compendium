"use client";

import { Badge } from '@/common/components/ui/badge';
import { toCriticalRangeString, toOffenseString } from '@/domain/characters/combat/Offense';
import { PowerOffense, type PowerSpecification } from '@/domain/characters/combat/Power';
import TagsView from '@/common/components/tags/TagsView';
import { costIcon } from '@/presentation/icons';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/common/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/common/components/ui/table';

type PowerSpecificationViewFieldsProps =
{
  powerSpecification: PowerSpecification;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export default function PowerSpecificationViewFields({ powerSpecification, collapsible = false, defaultOpen = true }: PowerSpecificationViewFieldsProps)
{
  return (
    <div className='flex flex-col w-full gap-3'>

      <div className="flex flex-col gap-2 rounded-md">
        <div className="flex flex-row flex-wrap gap-2 items-center">
          <p className="font-semibold text-lg">{powerSpecification.name}</p>
          <TagsView tags={powerSpecification.tags} variant="secondary" />
        </div>
        {
          powerSpecification.description && <p className="text-sm text-muted-foreground break-words">{powerSpecification.description}</p>
        }
      </div>

      {
        powerSpecification.offenses.length > 0 ? (
          collapsible ? (
            <Accordion type="single" collapsible className="w-full" defaultValue={defaultOpen ? "offenses" : undefined}>
              <AccordionItem value="offenses" className="border-none">
                <AccordionTrigger className="hover:no-underline py-2">
                  <span className="text-sm font-semibold">Skale sił zaklęcia ({powerSpecification.offenses.length})</span>
                </AccordionTrigger>
                <AccordionContent>
                  <PowerOffensesTable offenses={powerSpecification.offenses} />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : (
            <PowerOffensesTable offenses={powerSpecification.offenses} />
          )
        ) : (
          <p className="text-sm text-muted-foreground italic text-center py-4">Brak ofensyw mocy</p>
        ) 
      }

    </div>
  );
};

type PowerOffensesTableProps = 
{
  offenses: PowerOffense[];
};

function PowerOffensesTable({ offenses }: PowerOffensesTableProps)
{
  return (
    <div className="border rounded-md overflow-hidden">
      <Table>

        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-12 text-center">#</TableHead>
            <TableHead className="min-w-[200px]">Opis</TableHead>
            <TableHead className="text-center min-w-[150px]">Ofensywa</TableHead>
            <TableHead className="text-center w-20">Koszt</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
        {
          offenses.map((offense, index) => <PowerOffenseRow key={index} offense={offense} index={index} />)
        }
        </TableBody>
        
      </Table>
    </div>
  );
}

type PowerOffenseRowProps = 
{
  offense: PowerOffense;
  index: number;
};

function PowerOffenseRow({ offense, index }: PowerOffenseRowProps)
{
  const attackString = toOffenseString(offense.spellOffense);
  const damageString = toOffenseString(offense.spellDamage, false);
  const criticalString = `${toCriticalRangeString(offense.spellOffense)}, ${offense.spellOffense.critical.power >= 0 ? "+" : ""}${offense.spellOffense.critical.power}`;

  return (
    <TableRow className="hover:bg-muted/30">

      <TableCell className="text-center font-medium">{index}</TableCell>

      <TableCell>
        <p className="text-sm break-words" title={offense.description}>
          {offense.description || <span className="text-muted-foreground italic">Brak opisu</span>}
        </p>
      </TableCell>

      <TableCell className="text-center">

        <div className="flex flex-wrap gap-1 justify-center">

          <Badge variant="outline" className="font-mono">
            <span>{attackString}</span>
            {damageString && <Badge variant="secondary" className="ml-1">{criticalString}</Badge>}
          </Badge>

          <Badge variant="secondary" className="font-mono text-xs">
            {damageString}
          </Badge>
          
        </div>

      </TableCell>

      <TableCell className="text-center">

        <Badge variant="cost" className="h-8 w-16">
          {costIcon}
          <span className="ml-1">{offense.cost}</span>
        </Badge>

      </TableCell>

    </TableRow>
  );
}