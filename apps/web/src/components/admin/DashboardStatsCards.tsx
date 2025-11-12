'use client';

import { formatCurrency } from '@/lib/utils/format';
import { useState, useEffect } from 'react';
import { Icon } from '../ui/media/Icon';

interface StatsData {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  pendingOrders: number;
  lowStockProducts: number;
}

interface DashboardStatsCardsProps {
  stats: StatsData;
  dict: any;
}

export function DashboardStatsCards({ stats, dict }: DashboardStatsCardsProps) {
  const [animatedStats, setAnimatedStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    totalProducts: 0,
    pendingOrders: 0,
    lowStockProducts: 0
  });

  useEffect(() => {
    const animateNumbers = () => {
      const duration = 2000; // 2 seconds
      const steps = 60;
      const stepDuration = duration / steps;

      const animateValue = (start: number, end: number, setter: (value: number) => void) => {
        const increment = (end - start) / steps;
        let current = start;
        let step = 0;

        const timer = setInterval(() => {
          step++;
          current += increment;
          
          if (step >= steps) {
            current = end;
            clearInterval(timer);
          }
          
          setter(Math.floor(current));
        }, stepDuration);
      };

      animateValue(0, stats.totalOrders, (value) => 
        setAnimatedStats(prev => ({ ...prev, totalOrders: value }))
      );
      animateValue(0, stats.totalRevenue, (value) => 
        setAnimatedStats(prev => ({ ...prev, totalRevenue: value }))
      );
      animateValue(0, stats.totalCustomers, (value) => 
        setAnimatedStats(prev => ({ ...prev, totalCustomers: value }))
      );
      animateValue(0, stats.totalProducts, (value) => 
        setAnimatedStats(prev => ({ ...prev, totalProducts: value }))
      );
      animateValue(0, stats.pendingOrders, (value) => 
        setAnimatedStats(prev => ({ ...prev, pendingOrders: value }))
      );
      animateValue(0, stats.lowStockProducts, (value) => 
        setAnimatedStats(prev => ({ ...prev, lowStockProducts: value }))
      );
    };

    animateNumbers();
  }, [stats]);

  const cards = [
    {
      title: dict.admin?.dashboard?.stats?.totalOrders || 'Total Orders',
      value: animatedStats.totalOrders,
      icon: 'package',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      delay: '0ms'
    },
    {
      title: dict.admin?.dashboard?.stats?.totalRevenue || 'Total Revenue',
      value: formatCurrency(animatedStats.totalRevenue, 'KRW'),
      icon: 'money',
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      delay: '100ms'
    },
    {
      title: dict.admin?.dashboard?.stats?.totalCustomers || 'Total Customers',
      value: animatedStats.totalCustomers,
      icon: 'users',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      delay: '200ms'
    },
    {
      title: dict.admin?.dashboard?.stats?.totalProducts || 'Total Products',
      value: animatedStats.totalProducts,
      icon: 'shopping',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      delay: '300ms'
    },
    {
      title: dict.admin?.dashboard?.stats?.pendingOrders || 'Pending Orders',
      value: animatedStats.pendingOrders,
      icon: 'clock',
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      delay: '400ms'
    },
    {
      title: dict.admin?.dashboard?.stats?.lowStock || 'Low Stock Items',
      value: animatedStats.lowStockProducts,
      icon: 'warning',
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      delay: '500ms'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`
            group relative rounded-xl p-3 sm:p-4 
            bg-white dark:bg-slate-900
            border border-slate-200 dark:border-slate-700
            hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50
            transition-shadow duration-200 ease-out
            hover:border-slate-300 dark:hover:border-slate-600
            min-h-[100px] sm:min-h-[120px]
            overflow-hidden
          `}
          style={{
            animationDelay: card.delay,
            animationFillMode: 'both'
          }}
        >
          {/* Content */}
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className={`
              w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${card.bgColor}
              flex items-center justify-center
              transition-colors duration-200
              flex-shrink-0
            `}>
              <Icon name={card.icon as any} className={`w-5 h-5 sm:w-6 sm:h-6 ${card.color}`} />
            </div>
            <div className="text-right flex-1 min-w-0 ml-2 sm:ml-3">
              <div className="text-sm sm:text-lg font-bold text-slate-900 dark:text-slate-100 break-words leading-tight">
                {card.value}
              </div>
            </div>
          </div>
          
          <h3 className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
            {card.title}
          </h3>
        </div>
      ))}
    </div>
  );
}
