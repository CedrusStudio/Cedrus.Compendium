import { z } from "zod";
import { weaponSchema } from "@/persistence/schemas/characters/equipment/weaponSchema";
import { armorSchema } from "@/persistence/schemas/characters/equipment/armorSchema";
import { shieldSchema } from "@/persistence/schemas/characters/equipment/shieldSchema";
import { itemSchema } from "@/persistence/schemas/characters/equipment/itemSchema";
import { mountSchema } from "@/persistence/schemas/characters/equipment/mountSchema";

export const equipmentSchema = z.object
({
  weapons: z.array(weaponSchema).max(10, { message: "Możesz mieć najwyżej 10 broni." }),
  armors: z.array(armorSchema).max(10, { message: "Możesz mieć najwyżej 10 zbroi." }),
  shields: z.array(shieldSchema).max(10, { message: "Możesz mieć najwyżej 10 tarcz." }),
  inventory: z.array(itemSchema).max(100, { message: "Możesz mieć najwyżej 100 przedmiotów w ekwipunku." }),
  mounts: z.array(mountSchema).max(10, { message: "Możesz mieć najwyżej 10 wierzchowców." }),
});

export type EquipmentDto = z.infer<typeof equipmentSchema>;