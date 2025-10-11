export const colors = 
{
  text: {
    below: 'text-red-500',
    above: 'text-green-500'
  }
};

export const colorTextChange = (value: number, defaultValue: number) => value < defaultValue 
  ? colors.text.below 
  : value > defaultValue 
    ? colors.text.above : '';
