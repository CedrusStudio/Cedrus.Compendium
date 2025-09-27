import { ChangeValueSideEffect } from "@/utils/global/ChangeValueSideEffect";

export const increase = (changeBy: number, setStateAction: React.Dispatch<React.SetStateAction<number>>, sideEffect?: ChangeValueSideEffect) => 
{
    setStateAction
    (
        previousValue => 
        {
            const newValue = previousValue + changeBy;
            sideEffect?.(newValue);
            return newValue;
        }
    );
};

export const decrease = (changeBy: number, setStateAction: React.Dispatch<React.SetStateAction<number>>, sideEffect?: ChangeValueSideEffect) => 
{
    setStateAction
    (
        previousValue => 
        {
            const newValue = previousValue - changeBy;
            sideEffect?.(newValue);
            return newValue;
        }
    );
};

export const reset = (defaultValue: number, setStateAction: React.Dispatch<React.SetStateAction<number>>, sideEffect?: ChangeValueSideEffect) => 
{
    setStateAction
    (
        previousValue => 
        {
            if (previousValue === defaultValue) return previousValue;
            sideEffect?.(defaultValue);
            return defaultValue;
        }
    );
};
