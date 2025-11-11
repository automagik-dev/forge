import { 
  LayoutGrid, 
  MessageSquare, 
  PlusCircle, 
  User,
  Search,
  Eye,
  GitCompare
} from 'lucide-react';

export const BottomNavIcons = {
  Tasks: {
    default: <LayoutGrid className="w-6 h-6" />,
    active: <LayoutGrid className="w-6 h-6" strokeWidth={2.5} />
  },
  Chat: {
    default: <MessageSquare className="w-6 h-6" />,
    active: <MessageSquare className="w-6 h-6" strokeWidth={2.5} />
  },
  Review: {
    default: <Eye className="w-6 h-6" />,
    active: <Eye className="w-6 h-6" strokeWidth={2.5} />
  },
  Changes: {
    default: <GitCompare className="w-6 h-6" />,
    active: <GitCompare className="w-6 h-6" strokeWidth={2.5} />
  },
  New: {
    default: <PlusCircle className="w-6 h-6" />,
    active: <PlusCircle className="w-6 h-6" strokeWidth={2.5} />
  },
  Search: {
    default: <Search className="w-6 h-6" />,
    active: <Search className="w-6 h-6" strokeWidth={2.5} />
  },
  Me: {
    default: <User className="w-6 h-6" />,
    active: <User className="w-6 h-6" strokeWidth={2.5} />
  }
};
