import { AreaChart, Layers, AppWindow, Activity } from 'lucide-react';

type NavLink = 
{
  href: string;
  label: string;
  icon: React.ReactNode;
};

const links: NavLink[] = 
[
  {
    href: '/',
    label: 'character',
    icon: <Activity />,
  },
  {
    href: '/combat',
    label: 'combat',
    icon: <Layers />,
  }
];

export default links;