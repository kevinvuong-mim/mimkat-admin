import { LucideIcon } from 'lucide-react';

export interface NavSubItem {
  url: string;
  title: string;
  isNew?: boolean;
  newTab?: boolean;
  icon?: LucideIcon;
  comingSoon?: boolean;
}

export interface NavMainItem {
  url: string;
  title: string;
  isNew?: boolean;
  newTab?: boolean;
  icon?: LucideIcon;
  comingSoon?: boolean;
  subItems?: NavSubItem[];
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}
