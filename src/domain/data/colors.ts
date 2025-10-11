export const colors = 
{
  text: {
    below: 'text-red-500',
    above: 'text-green-500'
  },
  offense: {
    leading: 'text-yellow-400',
    secondary: 'text-blue-400',
  }
};

export const getColorTextChange = (value: number, defaultValue: number) => value < defaultValue 
  ? colors.text.below 
  : value > defaultValue 
    ? colors.text.above : '';
