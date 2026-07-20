"use client";

import { SimulationRunner } from "@/application/combat-lab/runner/SimulationRunner";
import { SavedRunsList } from "@/application/combat-lab/runner/SavedRunsList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/common/components/ui/tabs";

export function CombatLabTabs()
{
  return (
    <Tabs defaultValue="new" className="w-full">
      <TabsList>
        <TabsTrigger value="new">Nowa symulacja</TabsTrigger>
        <TabsTrigger value="saved">Zapisane biegi</TabsTrigger>
      </TabsList>
      <TabsContent value="new" className="mt-6">
        <SimulationRunner />
      </TabsContent>
      <TabsContent value="saved" className="mt-6">
        <SavedRunsList />
      </TabsContent>
    </Tabs>
  );
}
