# TODO

Cache queries -> plus pagination on "characters" -> to fix

====

1. Equipment is:

```js
export type Ekwipunek = 
{
  bronie: Bron[];
  zbroje: Zbroja[];
  tarcze: Tarcza[];
  przedmioty: Przedmiot[]
  konie: Kon[];
};
```

```js
export type Character =
{
    id: string;
    imie: string;
    opis: string;
    cechy: Cechy;
    atrybuty: Atrybuty;
    talenty: Talent[];
    zycie: Zycie;
    defensywy: Defensywa[];
    ofensywy: Ofensywa[];
    equipment: Equipment;
    stances: Mode[];
    states: Mode[];
    maneuvers: Maneuver[];
};
```
