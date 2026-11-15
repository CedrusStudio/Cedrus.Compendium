export function pilotReviewSourceRecords()
{
  let id = 0;
  const record = (name: string, grade: number, description: string, extra = {}): Record<string, unknown> => ({
    id: (++id).toString(16).toUpperCase().padStart(26, "0"), name, grade, description,
    price: 1, tags: [], structuredRequirements: null, replaces: [], effects: null, simulatable: null, unsupportedReason: null,
    characterIds: ["private-character"], ...extra,
  });
  return new Map([
    ["Maneuver", [
      ...[1, 2, 3].map(grade => record("Koci Instynkt", grade, `Dodaje 1 niewrażliwości${grade === 1 ? "" : " i"} ${grade} odporności.`, { effects: [{ type: "stat", mode: "self", duration: 1, immunity: 1 }], simulatable: true })),
      ...[1, 2, 3].map(grade => record("Stadne Wycie", grade, `Dodaje 1 odporności${grade === 1 ? "" : ` i ${grade - 1} redukcji`} każdemu ze stada. Tylko jedno na rundę.`, { effects: [{ type: "stat", mode: "self", duration: 1, resistance: 1 }], simulatable: true })),
    ]],
    ["Stance", [1, 2, 4, 6, 8, 11].map((resistance, index) => record("Postawa Defensywna", index + 1, `Zwiększa odporność o ${resistance}, zmniejsza obrażenia o ${index + 1}.`))],
    ["State", [record("Ostrość Umysłu", 1, "Dodaje +2 do obrażeń.")]],
  ]);
}
