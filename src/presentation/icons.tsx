import { LuBicepsFlexed, LuPlus, LuRefreshCcw } from "react-icons/lu";
import { GiRollingDices, GiRun, GiSwordsEmblem } from "react-icons/gi";
import { GiAbdominalArmor } from "react-icons/gi";

import { LuBrain } from "react-icons/lu";
import { GiEagleEmblem } from "react-icons/gi";
import { GiFlowerTwirl } from "react-icons/gi";

import { GiCrossedSwords } from "react-icons/gi";
import { GiSpinningSword } from "react-icons/gi";
import { BsLightning } from "react-icons/bs";
import { GiArcheryTarget } from "react-icons/gi";
import { GiHighPunch } from "react-icons/gi";
import { GiEmbrassedEnergy } from "react-icons/gi";
import { GiDodging } from "react-icons/gi";

import { GiChessKnight } from "react-icons/gi";
import { GiMeditation } from "react-icons/gi";
import { ReactNode } from "react";

import { IoShieldOutline } from "react-icons/io5";
import { IoShieldHalfOutline } from "react-icons/io5";
import { IoShield } from "react-icons/io5";

import { GiDiceShield } from "react-icons/gi";
import { GiCrenulatedShield } from "react-icons/gi";

import { TbEdit, TbSum } from "react-icons/tb";
import { MdPublishedWithChanges } from "react-icons/md";

import { MdOutlineHealthAndSafety } from "react-icons/md";
import { LuMinus } from "react-icons/lu";
import { IoMdCopy } from "react-icons/io";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { RiDeleteBack2Line, RiResetLeftFill } from "react-icons/ri";
import { GrNext } from "react-icons/gr";

export const characteristicIcons: Record<string, ReactNode> = 
{
  strength: <LuBicepsFlexed className="w-5 h-5" />,
  dexterity: <GiRun className="w-5 h-5" />,
  constitution: <GiAbdominalArmor className="w-5 h-5" />,
  mind: <LuBrain className="w-5 h-5" />,
  charisma: <GiEagleEmblem className="w-5 h-5" />,
  spellborn: <GiFlowerTwirl className="w-5 h-5" />
};

export const attributesIcons: Record<string, ReactNode> = 
{
  fencing: <GiCrossedSwords className="w-5 h-5" />,
  artifice: <GiSpinningSword className="w-5 h-5" />,
  precision: <GiArcheryTarget className="w-5 h-5" />,
  initiative: <BsLightning className="w-5 h-5" />,
  martialArt: <GiHighPunch className="w-5 h-5" />,
  horsemanship: <GiChessKnight className="w-5 h-5" />,

  fortitude: <GiEmbrassedEnergy className="w-5 h-5" />,
  reflex: <GiDodging className="w-5 h-5" />,
  willpower: <GiMeditation className="w-5 h-5" />
};

export const reductionIcons: Record<string, ReactNode> = 
{
  full: <IoShield className="w-5 h-5" />,
  block: <IoShieldHalfOutline className="w-5 h-5" />,
  direct: <IoShieldOutline className="w-5 h-5" />
};

export const immunityIcon = (className?: string) => <GiDiceShield className={className} />;
export const resistanceIcon = (className?: string) => <GiCrenulatedShield className={className} />;

export const sumIcon = <TbSum className="w-5 h-5" />;
export const currentValueIcon = <MdPublishedWithChanges className="w-5 h-5" />;

export const healthIcon = <MdOutlineHealthAndSafety className="w-5 h-5" />;

export const rollIcon = <GiRollingDices className="w-5 h-5" />;

export const battleIcon = (className: string) => <GiSwordsEmblem className={className} />;

export const addIcon = (className: string) => <LuPlus className={className} />;
export const removeIcon = (className: string) => <LuMinus className={className} />;
export const cooldownIcon = (className?: string) => <LuRefreshCcw className={className} />;
export const resetIcon = (className?: string) => <RiResetLeftFill className={className} />;
export const nextIcon = (className?: string) => <GrNext className={className} />;
export const removePreviousIcon = (className?: string) => <RiDeleteBack2Line className={className} />;

export const copyIcon = <IoMdCopy className="w-5 h-5" />;

export const upIcon = <ChevronUp />;
export const downIcon = <ChevronDown />;

export const leftIcon = <ChevronLeft />;
export const rightIcon = <ChevronRight />;

export const editIcon = <TbEdit />

export const spellIcon = (className: string) => <LuPlus className={className} />;