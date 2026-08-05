/** Blank ruled lines for handwritten notes during a session. */
export default function WriteLines({ lines }: { lines: number })
{
  if (lines <= 0) return null;

  return (
    <div className="sheet-writelines">
      {Array.from({ length: lines }, (_, index) => <div key={index} className="sheet-writeline" />)}
    </div>
  );
};
