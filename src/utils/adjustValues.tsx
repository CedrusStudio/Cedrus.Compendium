export const increase = (changeBy: number, setStateAction: React.Dispatch<React.SetStateAction<number>>, sideEffect?: (value: number) => void) => 
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

export const decrease = (changeBy: number, setStateAction: React.Dispatch<React.SetStateAction<number>>, sideEffect?: (value: number) => void) => 
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

export const reset = (defaultValue: number, setStateAction: React.Dispatch<React.SetStateAction<number>>, sideEffect?: (value: number) => void) => 
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
