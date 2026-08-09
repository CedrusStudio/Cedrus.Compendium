import { describe, expect, it } from 'vitest';
import { matchesOwned, narrowToOwned, ownedFilterKey, type OwnedFilter } from '@/application/compendium/characterOwnership';
import type { SearchEntityPayload } from '@/common/global/SearchPayloads';

const query = (search?: Record<string, unknown>, pageSize = 10): SearchEntityPayload =>
  ({ entity: 'stance', search, pagination: { pageNumber: 1, pageSize } } as unknown as SearchEntityPayload);

const owned = (values: string[], pairs: string[] | null = null): OwnedFilter => ({ field: 'name', values, pairs });

describe('narrowToOwned', () => {
  it('replaces the free-text name search with an exact list', () => {
    const q = query({ name: 'posta' });
    narrowToOwned(q, owned(['Postawa Ochronna', 'Postawa Defensywna']), '');

    expect(q.search).toEqual({ name: { anyOf: ['Postawa Ochronna', 'Postawa Defensywna'] } });
  });

  it('intersects with the search box instead of ignoring it', () => {
    // Prisma nie przyjmie `contains` i `in` na tym samym polu, a ciche
    // zignorowanie wpisanego tekstu byłoby gorsze niż brak filtra.
    const q = query({ name: 'ochron' });
    narrowToOwned(q, owned(['Postawa Ochronna', 'Postawa Defensywna']), 'ochron');

    expect(q.search).toEqual({ name: { anyOf: ['Postawa Ochronna'] } });
  });

  it('sends something unmatchable when the character owns nothing here', () => {
    // Pusta lista `in` jest ODRZUCANA przez `hasSearchValue`, czyli filtr by
    // zniknął i pokazałoby się całe kompendium — najgorsza możliwa odpowiedź.
    const q = query({ name: 'x' });
    narrowToOwned(q, owned([]), '');

    const values = (q.search as { name: { anyOf: string[] } }).name.anyOf;
    expect(values).toHaveLength(1);
    expect(values[0]).not.toBe('');
  });

  it('leaves other filters alone and does nothing without a character', () => {
    const q = query({ name: 'x', grade: 3 });
    narrowToOwned(q, null, '');
    expect(q.search).toEqual({ name: 'x', grade: 3 });

    const q2 = query({ name: 'x', grade: 3 });
    narrowToOwned(q2, owned(['A']), '');
    expect((q2.search as { grade: number }).grade).toBe(3);
  });

  it('matches powers by id, because a Power is not named after its specification', () => {
    const q = query({ name: 'swia' });
    narrowToOwned(q, { field: 'id', values: ['spec-1'], pairs: null }, 'swia');

    // Wyszukiwanie po nazwie zostaje — dotyczy innego pola niż `id`.
    expect(q.search).toEqual({ name: 'swia', id: { anyOf: ['spec-1'] } });
  });
});

/**
 * Marek's second report: "page 1 was strangely small". The query returned a
 * page of ALL ranks of the owned families and the rank filter then threw most
 * of it away, so the rest only appeared on scroll.
 */
describe('narrowToOwned — jedno żądanie mieści cały repertuar', () => {
  const ranked = owned(
    ['Postawa Defensywna', 'Postawa Ochronna'],
    ['Postawa Defensywna|4', 'Postawa Ochronna|2'],
  );

  it('podnosi rozmiar strony do iloczynu rodzin i rang', () => {
    const q = query(undefined, 10);
    narrowToOwned(q, ranked, '');

    // 2 rodziny × 2 rangi = 4 — ścisła górna granica tego, co zapytanie zwróci.
    expect((q.pagination as { pageSize: number }).pageSize).toBe(4);
  });

  it('dokłada rangi do zapytania, żeby nie ciągnąć wszystkich pięciu', () => {
    const q = query();
    narrowToOwned(q, ranked, '');

    expect((q.search as { grade: { anyOf: number[] } }).grade).toEqual({ anyOf: [2, 4] });
  });

  it('nie nadpisuje rangi wpisanej ręcznie w filtrze', () => {
    const q = query({ grade: 3 });
    narrowToOwned(q, ranked, '');

    // Ranga z pola „ranga 0-15" ma zawężać dalej, a nie znikać.
    expect((q.search as { grade: number }).grade).toBe(3);
  });

  it('dla list bez rang rozmiar strony to sama liczba nazw', () => {
    const q = query(undefined, 10);
    narrowToOwned(q, owned(['Miecz', 'Topór', 'Łuk']), '');

    expect((q.pagination as { pageSize: number }).pageSize).toBe(3);
    expect((q.search as Record<string, unknown>).grade).toBeUndefined();
  });

  it('nigdy nie schodzi do zera — postać bez wpisów i tak wysyła jedno zapytanie', () => {
    const q = query(undefined, 10);
    narrowToOwned(q, owned([]), '');

    expect((q.pagination as { pageSize: number }).pageSize).toBe(1);
  });
});

describe('matchesOwned', () => {
  const ranked = owned(['Postawa Defensywna'], ['Postawa Defensywna|4']);

  /** Marek's report: a character with rank 4 was shown all five ranks. */
  it('keeps only the rank the character actually has', () => {
    expect(matchesOwned(ranked, { name: 'Postawa Defensywna', grade: 4 })).toBe(true);
    expect(matchesOwned(ranked, { name: 'Postawa Defensywna', grade: 2 })).toBe(false);
  });

  it('passes everything through for unranked lists and with no filter', () => {
    expect(matchesOwned(owned(['Miecz']), { name: 'Miecz' })).toBe(true);
    expect(matchesOwned(null, { name: 'cokolwiek', grade: 9 })).toBe(true);
  });

  it('does not reject a row that simply has no rank', () => {
    expect(matchesOwned(ranked, { name: 'Postawa Defensywna' })).toBe(true);
  });
});

describe('ownedFilterKey', () => {
  it('is stable across value order, so the query cache key does not thrash', () => {
    expect(ownedFilterKey(owned(['B', 'A']))).toBe(ownedFilterKey(owned(['A', 'B'])));
  });

  it('distinguishes ranks — two characters with the same stance at different ranks are different queries', () => {
    expect(ownedFilterKey(owned(['S'], ['S|1']))).not.toBe(ownedFilterKey(owned(['S'], ['S|2'])));
  });

  it('is empty with no filter', () => {
    expect(ownedFilterKey(null)).toBe('');
  });
});
