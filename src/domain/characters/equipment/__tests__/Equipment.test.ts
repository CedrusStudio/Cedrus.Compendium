import { describe, it, expect } from 'vitest';
import {
  pathToWeapons,
  pathToArmors,
  pathToShields,
  pathToInventory,
  pathToMounts,
  pathToWeaponsField,
  pathToArmorsField,
  pathToShieldsField,
  pathToInventoryField,
  pathToMountsField,
  splitEquipmentItemTypes,
  type EquipmentItemTypes,
  type EquipmentItemArraysTypes
} from '../Equipment';

describe('Equipment - Path Builders and Parsers', () => {
  describe('pathToWeapons', () => {
    it('should create path to weapon at index 0', () => {
      expect(pathToWeapons(0)).toBe('weapons.0');
    });

    it('should create path to weapon at index 1', () => {
      expect(pathToWeapons(1)).toBe('weapons.1');
    });

    it('should create path to weapon at any positive index', () => {
      expect(pathToWeapons(5)).toBe('weapons.5');
      expect(pathToWeapons(10)).toBe('weapons.10');
      expect(pathToWeapons(99)).toBe('weapons.99');
    });

    it('should handle negative indices', () => {
      expect(pathToWeapons(-1)).toBe('weapons.-1');
    });

    it('should return correct type', () => {
      const path: `weapons.${number}` = pathToWeapons(0);
      expect(path).toBe('weapons.0');
    });
  });

  describe('pathToArmors', () => {
    it('should create path to armor at index 0', () => {
      expect(pathToArmors(0)).toBe('armors.0');
    });

    it('should create path to armor at various indices', () => {
      expect(pathToArmors(1)).toBe('armors.1');
      expect(pathToArmors(5)).toBe('armors.5');
      expect(pathToArmors(10)).toBe('armors.10');
    });

    it('should return correct type', () => {
      const path: `armors.${number}` = pathToArmors(0);
      expect(path).toBe('armors.0');
    });
  });

  describe('pathToShields', () => {
    it('should create path to shield at index 0', () => {
      expect(pathToShields(0)).toBe('shields.0');
    });

    it('should create path to shield at various indices', () => {
      expect(pathToShields(1)).toBe('shields.1');
      expect(pathToShields(3)).toBe('shields.3');
      expect(pathToShields(7)).toBe('shields.7');
    });

    it('should return correct type', () => {
      const path: `shields.${number}` = pathToShields(0);
      expect(path).toBe('shields.0');
    });
  });

  describe('pathToInventory', () => {
    it('should create path to inventory item at index 0', () => {
      expect(pathToInventory(0)).toBe('inventory.0');
    });

    it('should create path to inventory item at various indices', () => {
      expect(pathToInventory(2)).toBe('inventory.2');
      expect(pathToInventory(15)).toBe('inventory.15');
      expect(pathToInventory(50)).toBe('inventory.50');
    });

    it('should return correct type', () => {
      const path: `inventory.${number}` = pathToInventory(0);
      expect(path).toBe('inventory.0');
    });
  });

  describe('pathToMounts', () => {
    it('should create path to mount at index 0', () => {
      expect(pathToMounts(0)).toBe('mounts.0');
    });

    it('should create path to mount at various indices', () => {
      expect(pathToMounts(1)).toBe('mounts.1');
      expect(pathToMounts(4)).toBe('mounts.4');
      expect(pathToMounts(8)).toBe('mounts.8');
    });

    it('should return correct type', () => {
      const path: `mounts.${number}` = pathToMounts(0);
      expect(path).toBe('mounts.0');
    });
  });

  describe('pathToWeaponsField', () => {
    it('should create path to weapon field "name"', () => {
      expect(pathToWeaponsField(0, 'name')).toBe('weapons.0.name');
    });

    it('should create path to weapon field "style"', () => {
      expect(pathToWeaponsField(1, 'style')).toBe('weapons.1.style');
    });

    it('should create path to weapon field "offense"', () => {
      expect(pathToWeaponsField(2, 'offense')).toBe('weapons.2.offense');
    });

    it('should create path to weapon field "damageBonus"', () => {
      expect(pathToWeaponsField(3, 'damageBonus')).toBe('weapons.3.damageBonus');
    });

    it('should create path to weapon field "range"', () => {
      expect(pathToWeaponsField(0, 'range')).toBe('weapons.0.range');
    });

    it('should create path to weapon field "description"', () => {
      expect(pathToWeaponsField(1, 'description')).toBe('weapons.1.description');
    });

    it('should create path to weapon field "tags"', () => {
      expect(pathToWeaponsField(2, 'tags')).toBe('weapons.2.tags');
    });

    it('should create path to weapon field "id"', () => {
      expect(pathToWeaponsField(0, 'id')).toBe('weapons.0.id');
    });
  });

  describe('pathToArmorsField', () => {
    it('should create path to armor field "name"', () => {
      expect(pathToArmorsField(0, 'name')).toBe('armors.0.name');
    });

    it('should create path to armor field "protection"', () => {
      expect(pathToArmorsField(1, 'protection')).toBe('armors.1.protection');
    });

    it('should create path to armor field "immunity"', () => {
      expect(pathToArmorsField(0, 'immunity')).toBe('armors.0.immunity');
    });

    it('should create path to armor field "resistance"', () => {
      expect(pathToArmorsField(2, 'resistance')).toBe('armors.2.resistance');
    });

    it('should create path to armor field "dexterityRestriction"', () => {
      expect(pathToArmorsField(1, 'dexterityRestriction')).toBe('armors.1.dexterityRestriction');
    });

    it('should create path to armor field "strengthRequirement"', () => {
      expect(pathToArmorsField(0, 'strengthRequirement')).toBe('armors.0.strengthRequirement');
    });
  });

  describe('pathToShieldsField', () => {
    it('should create path to shield field "name"', () => {
      expect(pathToShieldsField(0, 'name')).toBe('shields.0.name');
    });

    it('should create path to shield field "block"', () => {
      expect(pathToShieldsField(1, 'block')).toBe('shields.1.block');
    });

    it('should create path to shield field "resistance"', () => {
      expect(pathToShieldsField(2, 'resistance')).toBe('shields.2.resistance');
    });

    it('should create path to shield field "initiativeRestriction"', () => {
      expect(pathToShieldsField(0, 'initiativeRestriction')).toBe('shields.0.initiativeRestriction');
    });
  });

  describe('pathToInventoryField', () => {
    it('should create path to inventory field "name"', () => {
      expect(pathToInventoryField(0, 'name')).toBe('inventory.0.name');
    });

    it('should create path to inventory field "description"', () => {
      expect(pathToInventoryField(1, 'description')).toBe('inventory.1.description');
    });

    it('should create path to inventory field "tags"', () => {
      expect(pathToInventoryField(5, 'tags')).toBe('inventory.5.tags');
    });

    it('should create path to inventory field "id"', () => {
      expect(pathToInventoryField(0, 'id')).toBe('inventory.0.id');
    });
  });

  describe('pathToMountsField', () => {
    it('should create path to mount field "name"', () => {
      expect(pathToMountsField(0, 'name')).toBe('mounts.0.name');
    });

    it('should create path to mount field at various indices', () => {
      expect(pathToMountsField(1, 'id')).toBe('mounts.1.id');
      expect(pathToMountsField(2, 'description')).toBe('mounts.2.description');
    });
  });

  describe('splitEquipmentItemTypes', () => {
    it('should parse weapons path correctly', () => {
      const result = splitEquipmentItemTypes('weapons.0' as EquipmentItemTypes);
      expect(result.name).toBe('weapons');
      expect(result.index).toBe(0);
    });

    it('should parse weapons path with different index', () => {
      const result = splitEquipmentItemTypes('weapons.5' as EquipmentItemTypes);
      expect(result.name).toBe('weapons');
      expect(result.index).toBe(5);
    });

    it('should parse armors path correctly', () => {
      const result = splitEquipmentItemTypes('armors.0' as EquipmentItemTypes);
      expect(result.name).toBe('armors');
      expect(result.index).toBe(0);
    });

    it('should parse armors path with different index', () => {
      const result = splitEquipmentItemTypes('armors.3' as EquipmentItemTypes);
      expect(result.name).toBe('armors');
      expect(result.index).toBe(3);
    });

    it('should parse shields path correctly', () => {
      const result = splitEquipmentItemTypes('shields.1' as EquipmentItemTypes);
      expect(result.name).toBe('shields');
      expect(result.index).toBe(1);
    });

    it('should parse shields path with large index', () => {
      const result = splitEquipmentItemTypes('shields.99' as EquipmentItemTypes);
      expect(result.name).toBe('shields');
      expect(result.index).toBe(99);
    });

    it('should parse inventory path correctly', () => {
      const result = splitEquipmentItemTypes('inventory.0' as EquipmentItemTypes);
      expect(result.name).toBe('inventory');
      expect(result.index).toBe(0);
    });

    it('should parse inventory path with different index', () => {
      const result = splitEquipmentItemTypes('inventory.10' as EquipmentItemTypes);
      expect(result.name).toBe('inventory');
      expect(result.index).toBe(10);
    });

    it('should parse mounts path correctly', () => {
      const result = splitEquipmentItemTypes('mounts.2' as EquipmentItemTypes);
      expect(result.name).toBe('mounts');
      expect(result.index).toBe(2);
    });

    it('should handle large index numbers', () => {
      const result = splitEquipmentItemTypes('weapons.999' as EquipmentItemTypes);
      expect(result.name).toBe('weapons');
      expect(result.index).toBe(999);
    });

    it('should return correct type for name', () => {
      const result = splitEquipmentItemTypes('weapons.0' as EquipmentItemTypes);
      const name: EquipmentItemArraysTypes = result.name;
      expect(['weapons', 'armors', 'shields', 'inventory', 'mounts']).toContain(name);
    });

    it('should return numeric index', () => {
      const result = splitEquipmentItemTypes('weapons.5' as EquipmentItemTypes);
      expect(typeof result.index).toBe('number');
      expect(result.index).toBe(5);
    });
  });

  describe('Integration tests', () => {
    it('should create and parse weapons path correctly', () => {
      const path = pathToWeapons(3);
      const parsed = splitEquipmentItemTypes(path);
      expect(parsed.name).toBe('weapons');
      expect(parsed.index).toBe(3);
    });

    it('should create and parse armors path correctly', () => {
      const path = pathToArmors(7);
      const parsed = splitEquipmentItemTypes(path);
      expect(parsed.name).toBe('armors');
      expect(parsed.index).toBe(7);
    });

    it('should create and parse shields path correctly', () => {
      const path = pathToShields(2);
      const parsed = splitEquipmentItemTypes(path);
      expect(parsed.name).toBe('shields');
      expect(parsed.index).toBe(2);
    });

    it('should create and parse inventory path correctly', () => {
      const path = pathToInventory(15);
      const parsed = splitEquipmentItemTypes(path);
      expect(parsed.name).toBe('inventory');
      expect(parsed.index).toBe(15);
    });

    it('should create and parse mounts path correctly', () => {
      const path = pathToMounts(4);
      const parsed = splitEquipmentItemTypes(path);
      expect(parsed.name).toBe('mounts');
      expect(parsed.index).toBe(4);
    });

    it('should handle round-trip conversion for all equipment types', () => {
      const testCases: Array<{ name: EquipmentItemArraysTypes; index: number }> = [
        { name: 'weapons', index: 0 },
        { name: 'armors', index: 5 },
        { name: 'shields', index: 10 },
        { name: 'inventory', index: 20 },
        { name: 'mounts', index: 3 },
      ];

      testCases.forEach(({ name, index }) => {
        let path: EquipmentItemTypes;
        
        switch (name) {
          case 'weapons':
            path = pathToWeapons(index);
            break;
          case 'armors':
            path = pathToArmors(index);
            break;
          case 'shields':
            path = pathToShields(index);
            break;
          case 'inventory':
            path = pathToInventory(index);
            break;
          case 'mounts':
            path = pathToMounts(index);
            break;
        }

        const parsed = splitEquipmentItemTypes(path);
        expect(parsed.name).toBe(name);
        expect(parsed.index).toBe(index);
      });
    });

    it('should handle field paths for all equipment types', () => {
      expect(pathToWeaponsField(1, 'name')).toBe('weapons.1.name');
      expect(pathToArmorsField(2, 'protection')).toBe('armors.2.protection');
      expect(pathToShieldsField(3, 'block')).toBe('shields.3.block');
      expect(pathToInventoryField(4, 'description')).toBe('inventory.4.description');
      expect(pathToMountsField(5, 'id')).toBe('mounts.5.id');
    });
  });

  describe('Edge cases', () => {
    it('should handle index 0 for all types', () => {
      expect(pathToWeapons(0)).toBe('weapons.0');
      expect(pathToArmors(0)).toBe('armors.0');
      expect(pathToShields(0)).toBe('shields.0');
      expect(pathToInventory(0)).toBe('inventory.0');
      expect(pathToMounts(0)).toBe('mounts.0');
    });

    it('should parse paths with index 0', () => {
      const types: EquipmentItemTypes[] = [
        'weapons.0',
        'armors.0',
        'shields.0',
        'inventory.0',
        'mounts.0',
      ];

      types.forEach(type => {
        const result = splitEquipmentItemTypes(type);
        expect(result.index).toBe(0);
      });
    });

    it('should handle multi-digit indices in parsing', () => {
      const result1 = splitEquipmentItemTypes('weapons.123' as EquipmentItemTypes);
      expect(result1.index).toBe(123);

      const result2 = splitEquipmentItemTypes('inventory.9999' as EquipmentItemTypes);
      expect(result2.index).toBe(9999);
    });

    it('should create field paths with index 0', () => {
      expect(pathToWeaponsField(0, 'name')).toBe('weapons.0.name');
      expect(pathToArmorsField(0, 'protection')).toBe('armors.0.protection');
    });
  });
});
