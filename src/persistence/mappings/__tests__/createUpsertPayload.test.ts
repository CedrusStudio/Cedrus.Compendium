import { describe, it, expect } from 'vitest';
import { createUpsertPayload } from '@/persistence/mappings/createUpsertPayload';

describe('createUpsertPayload', () => {
  const createTestItem = (id: string, name: string) => ({ id, name });

  describe('create operations', () => {
    it('should create items that do not exist', () => {
      const existing: string[] = [];
      const incoming = [
        createTestItem('01NEW123', 'New Item 1'),
        createTestItem('01NEW456', 'New Item 2')
      ];

      const result = createUpsertPayload(existing, incoming);

      expect(result.create).toEqual(incoming);
      expect(result.update).toEqual([]);
      expect(result.disconnect).toEqual([]);
      expect(result.connect).toEqual([]);
    });

    it('should not create items that are in idsToConnect', () => {
      const existing: string[] = [];
      const incoming = [
        createTestItem('01NEW123', 'New Item'),
        createTestItem('01CONN456', 'Connected Item')
      ];
      const idsToConnect = ['01CONN456'];

      const result = createUpsertPayload(existing, incoming, idsToConnect);

      expect(result.create).toEqual([createTestItem('01NEW123', 'New Item')]);
      expect(result.connect).toEqual([{ id: '01CONN456' }]);
    });
  });

  describe('update operations', () => {
    it('should update items that exist', () => {
      const existing = ['01EXIST123', '01EXIST456'];
      const incoming = [
        createTestItem('01EXIST123', 'Updated Item 1'),
        createTestItem('01EXIST456', 'Updated Item 2')
      ];

      const result = createUpsertPayload(existing, incoming);

      expect(result.update).toEqual([
        { where: { id: '01EXIST123' }, data: { name: 'Updated Item 1', id: undefined } },
        { where: { id: '01EXIST456' }, data: { name: 'Updated Item 2', id: undefined } }
      ]);
      expect(result.create).toEqual([]);
    });

    it('should remove id from update data', () => {
      const existing = ['01EXIST123'];
      const incoming = [createTestItem('01EXIST123', 'Updated')];

      const result = createUpsertPayload(existing, incoming);

      expect(result.update[0].data).toEqual({ name: 'Updated', id: undefined });
      expect(result.update[0].data.id).toBeUndefined();
    });

    it('should not update items in idsToConnect', () => {
      const existing = ['01EXIST123', '01EXIST456'];
      const incoming = [
        createTestItem('01EXIST123', 'Updated Item'),
        createTestItem('01EXIST456', 'Connected Item')
      ];
      const idsToConnect = ['01EXIST456'];

      const result = createUpsertPayload(existing, incoming, idsToConnect);

      expect(result.update).toEqual([
        { where: { id: '01EXIST123' }, data: { name: 'Updated Item', id: undefined } }
      ]);
      expect(result.connect).toEqual([{ id: '01EXIST456' }]);
    });
  });

  describe('disconnect operations', () => {
    it('should disconnect items that are no longer in incoming', () => {
      const existing = ['01OLD123', '01OLD456', '01OLD789'];
      const incoming = [createTestItem('01OLD123', 'Kept Item')];

      const result = createUpsertPayload(existing, incoming);

      expect(result.disconnect).toEqual([
        { id: '01OLD456' },
        { id: '01OLD789' }
      ]);
    });

    it('should not disconnect items that are still present', () => {
      const existing = ['01KEEP123', '01KEEP456'];
      const incoming = [
        createTestItem('01KEEP123', 'Item 1'),
        createTestItem('01KEEP456', 'Item 2')
      ];

      const result = createUpsertPayload(existing, incoming);

      expect(result.disconnect).toEqual([]);
    });

    it('should disconnect all when incoming is empty', () => {
      const existing = ['01DISC123', '01DISC456'];
      const incoming: { id: string }[] = [];

      const result = createUpsertPayload(existing, incoming);

      expect(result.disconnect).toEqual([
        { id: '01DISC123' },
        { id: '01DISC456' }
      ]);
    });
  });

  describe('connect operations', () => {
    it('should connect ids from idsToConnect', () => {
      const idsToConnect = ['01CONN123', '01CONN456', '01CONN789'];

      const result = createUpsertPayload([], [], idsToConnect);

      expect(result.connect).toEqual([
        { id: '01CONN123' },
        { id: '01CONN456' },
        { id: '01CONN789' }
      ]);
    });

    it('should default to empty connect when idsToConnect not provided', () => {
      const result = createUpsertPayload([], []);

      expect(result.connect).toEqual([]);
    });
  });

  describe('complex scenarios', () => {
    it('should handle mix of create, update, and disconnect', () => {
      const existing = ['01EXIST123', '01EXIST456', '01REMOVE789'];
      const incoming = [
        createTestItem('01EXIST123', 'Updated'),
        createTestItem('01NEW456', 'New Item')
      ];

      const result = createUpsertPayload(existing, incoming);

      expect(result.create).toEqual([createTestItem('01NEW456', 'New Item')]);
      expect(result.update).toEqual([
        { where: { id: '01EXIST123' }, data: { name: 'Updated', id: undefined } }
      ]);
      expect(result.disconnect).toEqual([{ id: '01EXIST456' }, { id: '01REMOVE789' }]);
    });

    it('should handle all operations with idsToConnect', () => {
      const existing = ['01EXIST123', '01REMOVE456'];
      const incoming = [
        createTestItem('01EXIST123', 'Updated'),
        createTestItem('01NEW789', 'New'),
        createTestItem('01CONN999', 'To Connect')
      ];
      const idsToConnect = ['01CONN999', '01EXTERNAL111'];

      const result = createUpsertPayload(existing, incoming, idsToConnect);

      expect(result.create).toEqual([createTestItem('01NEW789', 'New')]);
      expect(result.update).toEqual([
        { where: { id: '01EXIST123' }, data: { name: 'Updated', id: undefined } }
      ]);
      expect(result.disconnect).toEqual([{ id: '01REMOVE456' }]);
      expect(result.connect).toEqual([
        { id: '01CONN999' },
        { id: '01EXTERNAL111' }
      ]);
    });

    it('should handle empty existing and incoming', () => {
      const result = createUpsertPayload([], []);

      expect(result.create).toEqual([]);
      expect(result.update).toEqual([]);
      expect(result.disconnect).toEqual([]);
      expect(result.connect).toEqual([]);
    });

    it('should preserve order in results', () => {
      const existing = ['01A', '01B', '01C'];
      const incoming = [
        createTestItem('01B', 'B Updated'),
        createTestItem('01D', 'D New'),
        createTestItem('01A', 'A Updated')
      ];

      const result = createUpsertPayload(existing, incoming);

      expect(result.update[0].where.id).toBe('01B');
      expect(result.update[1].where.id).toBe('01A');
      expect(result.create[0].id).toBe('01D');
      expect(result.disconnect[0].id).toBe('01C');
    });
  });
});
