export const increase = (changeBy: number, setStateAction: React.Dispatch<React.SetStateAction<number>>) => 
{
setStateAction(previousValue => previousValue + changeBy);
};

export const decrease = (changeBy: number, setStateAction: React.Dispatch<React.SetStateAction<number>>) => 
{
setStateAction(previousValue => previousValue - changeBy);
};

export const reset = (defaultValue: number, setStateAction: React.Dispatch<React.SetStateAction<number>>) => 
{
setStateAction(defaultValue);
};
