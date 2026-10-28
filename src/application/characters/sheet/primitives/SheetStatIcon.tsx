import { attributesIcons, characteristicIcons, immunityIcon, resistanceIcon, reductionIcons } from "@/common/icons";
import { ReactNode } from "react";

const icons: Record<string, ReactNode> = {
  ...characteristicIcons,
  ...attributesIcons,
  immunity: immunityIcon(),
  resistance: resistanceIcon(),
  fullReduction: reductionIcons.full,
  blockReduction: reductionIcons.block,
  directReduction: reductionIcons.direct,
};

export function SheetStatLabel({ statKey, label }: { statKey: string; label: string })
{
  const hasIcon = Object.prototype.hasOwnProperty.call(icons, statKey);

  return (
    <span className="sheet-stat-label">
      <SheetStatIcon statKey={statKey} />
      <span className={hasIcon ? "sheet-stat-name" : undefined}>{label}</span>
    </span>
  );
}

/** Reuse the app's symbols, with physical dimensions defined by print CSS. */
export default function SheetStatIcon({ statKey }: { statKey: string })
{
  if (!Object.prototype.hasOwnProperty.call(icons, statKey)) return null;

  return <span className="sheet-stat-icon" aria-hidden="true">{icons[statKey]}</span>;
}
