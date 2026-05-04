"use client";

import { useState } from "react";
import { useForm, useWatch, UseFieldArrayReplace } from "react-hook-form";
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/ui/form";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/ui/sheet";
import { Button } from "@/ui/button";
import { Label } from "@/ui/label";
import { Input } from "@/ui/input";
import { Checkbox } from "@/ui/checkbox";
import { Badge } from "@/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { typedZodResolver } from "@/common/global/validation";
import { powerOffenseFormulaSchema, PowerOffenseFormulaDto, PowerSpecificationDto } from "@/persistence/schemas/characters/combat/powerSchema";
import { CreateDefaultPowerOffenseFormula, generateOffensesFromFormula } from "@/domain/characters/combat/Power";
import { toCriticalRangeString, toOffenseString } from "@/domain/characters/combat/Offense";
import { costIcon, formulaIcon } from "@/common/icons";
import { colors } from "@/common/colors";

type GenerateOffensesFromFormulaSheetProps =
{
  replace: UseFieldArrayReplace<PowerSpecificationDto, "offenses">;
};

export default function GenerateOffensesFromFormulaSheet({ replace }: GenerateOffensesFromFormulaSheetProps)
{
  const [open, setOpen] = useState(false);

  const form = useForm<PowerOffenseFormulaDto>
  ({
    resolver: typedZodResolver(powerOffenseFormulaSchema),
    defaultValues: CreateDefaultPowerOffenseFormula(),
    mode: "onChange",
  });

  const watched = useWatch({ control: form.control });

  const previewOffenses = (() =>
  {
    const parsed = powerOffenseFormulaSchema.safeParse(watched);
    if (!parsed.success) return [];
    return generateOffensesFromFormula(parsed.data);
  })();

  const handleGenerate = form.handleSubmit((data) =>
  {
    replace(generateOffensesFromFormula(data));
    setOpen(false);
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" type="button" title="Generuj ofensywy z formuły">
          {formulaIcon}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-lg flex flex-col overflow-hidden">
        <SheetHeader>
          <SheetTitle>Generuj z formuły</SheetTitle>
          <SheetDescription className="text-xs">
            Użyj <code className="bg-muted px-1 rounded">x</code> jako indeks (1, 2, 3…).
            Obsługuje: <code className="bg-muted px-1 rounded">k4</code>, <code className="bg-muted px-1 rounded">3k(x+1)</code>, <code className="bg-muted px-1 rounded">x/2(k6-1)+x</code>.
            Wartości poza zakresem zostaną przycięte.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form className="flex flex-col gap-3 overflow-y-auto flex-1 py-2 px-1" onSubmit={handleGenerate}>

            <div className="grid grid-cols-[72px_1fr] gap-2 items-start">
              <FormulaInput label="Liczba" name="count" type="number" />
              <FormulaInput label="Prefiks opisu" name="descriptionPrefix" />
            </div>

            <FieldGroup label="Kości zaklęcia">
              <FormulaInput label="Ilość" name="offenseAmountFormula" />
              <FormulaInput label="Ranga" name="offenseGradeFormula" />
              <FormulaInput label="Bonus" name="offenseBonusFormula" />
              <FormulaCheckbox label="Widmo" name="offenseIsPhantom" />
              <FormulaInput label="Krytyk: Siła" name="offenseCriticalPowerFormula" />
              <FormulaInput label="Krytyk: Zasięg" name="offenseCriticalRangeFormula" />
            </FieldGroup>

            <FieldGroup label="Obrażenia">
              <FormulaInput label="Ilość" name="damageAmountFormula" />
              <FormulaInput label="Ranga" name="damageGradeFormula" />
              <FormulaInput label="Bonus" name="damageBonusFormula" />
              <FormulaCheckbox label="Widmo" name="damageIsPhantom" />
            </FieldGroup>

            <FieldGroup label="Koszt">
              <FormulaInput label="Formuła" name="costFormula" className="col-span-2" />
            </FieldGroup>

            {previewOffenses.length > 0 && (
              <FieldGroup label="Podgląd">
                <div className="col-span-2 border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 text-xs">
                        <TableHead className="p-1 w-6 text-center">#</TableHead>
                        <TableHead className="p-1">Opis</TableHead>
                        <TableHead className="p-1 text-center">Kości / Krytyk</TableHead>
                        <TableHead className="p-1 text-center">Obr.</TableHead>
                        <TableHead className="p-1 text-center w-14">Koszt</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewOffenses.map((offense, i) =>
                      {
                        const offenseStr = toOffenseString(offense.spellOffense);
                        const damageStr = toOffenseString(offense.spellDamage, false);
                        const critStr = `${toCriticalRangeString(offense.spellOffense)} +${offense.spellOffense.critical.power}`;
                        return (
                          <TableRow key={i} className="hover:bg-muted/30 text-xs">
                            <TableCell className="p-1 text-center text-muted-foreground">{i + 1}</TableCell>
                            <TableCell className="p-1 text-muted-foreground truncate max-w-[60px]">{offense.description}</TableCell>
                            <TableCell className="p-1 text-center">
                              <span className={`font-mono ${colors.offense.leading}`}>{offenseStr}</span>
                              <div className="text-muted-foreground text-[10px]">{critStr}</div>
                            </TableCell>
                            <TableCell className="p-1 text-center font-mono">{damageStr || '—'}</TableCell>
                            <TableCell className="p-1 text-center">
                              <Badge variant="cost" className="h-5 w-12 gap-0.5 text-[10px]">
                                {costIcon}
                                <span>{offense.cost}</span>
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </FieldGroup>
            )}

          </form>
        </Form>

        <SheetFooter className="flex gap-2 pt-2">
          <Button
            type="button"
            className="flex-1"
            onClick={handleGenerate}
            disabled={previewOffenses.length === 0}
          >
            Generuj ({previewOffenses.length})
          </Button>
          <SheetClose asChild>
            <Button variant="outline" type="button">Anuluj</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode })
{
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b pb-0.5">{label}</p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        {children}
      </div>
    </div>
  );
}

type FormulaInputProps =
{
  label: string;
  name: keyof PowerOffenseFormulaDto;
  type?: string;
  className?: string;
};

function FormulaInput({ label, name, type = "text", className }: FormulaInputProps)
{
  return (
    <div className={`flex flex-col gap-0.5 ${className ?? ''}`}>
      <Label className="text-[10px] text-muted-foreground leading-none">{label}</Label>
      <FormField
        name={name as string}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input {...field} type={type} className="h-7 text-sm font-mono px-2" />
            </FormControl>
            <FormMessage className="text-[10px]" />
          </FormItem>
        )}
      />
    </div>
  );
}

type FormulaCheckboxProps =
{
  label: string;
  name: keyof PowerOffenseFormulaDto;
};

function FormulaCheckbox({ label, name }: FormulaCheckboxProps)
{
  return (
    <FormField
      name={name as string}
      render={({ field }) => (
        <FormItem>
          <div className="flex items-center gap-2 mt-4">
            <FormControl>
              <Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <Label className="text-[10px] text-muted-foreground cursor-pointer">{label}</Label>
          </div>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )}
    />
  );
}
