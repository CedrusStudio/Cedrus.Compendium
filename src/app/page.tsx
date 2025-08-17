import Cell from "@/components/character/Cell";
import Section from "@/components/character/Section";

export default function HomePage() 
{
  return (
    <>
      <div className="grid grid-rows-5">

        <div className="row-span-4">

          <div className="grid grid-cols-2">

            <div className="col-span-1">

              <div className="grid grid-rows-12">

                <Section title="Obrona" className="rows-span-5">
                  <p>Opis obrony postaci</p>
                  <Cell label="Pancerz" value={5} />
                  <Cell label="Redukcja" value={5} />
                  <Cell label="Odporność" value={5} />
                  <Cell label="Pancerz" value={5} />
                </Section>

                <Section title="Atak" className="rows-span-5">
                  <p>Opis ataku postaci</p>
                </Section>
                
                <Section title="Postawy">
                  <p>Opis postaw postaci</p>
                </Section>

              </div>

            </div>

            <div className="col-span-1">

              <div className="grid grid-rows-12">

                <Section title="Życie" className="rows-span-2">
                  <p>Opis życia postaci</p>
                </Section>

                <Section title="Umiejętności" className="rows-span-5">
                  <p>Opis umiejętności postaci</p>
                </Section>
                
                <Section title="Cechy" className="rows-span-5">
                  <p>Opis cech postaci</p>
                </Section>

              </div>

            </div>

          </div>

        </div>

        <div className="row-span-1">

          <Section title="Manewry">
            <p>Opis manewrów postaci</p>
          </Section>
          
        </div>

      </div>
    </>
  );
}
