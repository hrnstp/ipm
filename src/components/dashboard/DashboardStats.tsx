import { Globe2, TrendingUp, Users, FolderOpen } from 'lucide-react';

interface Stats {
  solutions: number;
  connections: number;
  projects: number;
  municipalities: number;
}

interface DashboardStatsProps {
  stats: Stats;
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statItems = [
    {
      label: 'Solutions',
      value: stats.solutions,
      icon: TrendingUp,
      color: 'text-emerald-600',
    },
    {
      label: 'Connections',
      value: stats.connections,
      icon: Users,
      color: 'text-blue-600',
    },
    {
      label: 'Projects',
      value: stats.projects,
      icon: FolderOpen,
      color: 'text-orange-600',
    },
    {
      label: 'Municipalities',
      value: stats.municipalities,
      icon: Globe2,
      color: 'text-gray-400 dark:text-gray-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {statItems.map((item) => (
        <div
          key={item.label}
          className="bg-white dark:bg-[#111111] rounded-xl p-6 border border-gray-200 dark:border-[#1a1a1a]"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{item.label}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{item.value}</p>
            </div>
            <item.icon className={`w-8 h-8 ${item.color}`} />
          </div>
        </div>
      ))}
    </div>
  );
}
