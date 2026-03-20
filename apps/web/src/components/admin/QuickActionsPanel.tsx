'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '../ui/media/Icon';

interface QuickActionsPanelProps {
  dict: any;
  lang: string;
}

export function QuickActionsPanel({ dict, lang }: QuickActionsPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);

  const actions = [
    {
      id: 'new-product',
      title: dict.admin?.dashboard?.quickActions?.newProduct || 'New Product',
      description: dict.admin?.dashboard?.quickActions?.newProductDesc || 'Add a new product to your catalog',
      icon: 'plus',
      href: `/${lang}/admin/products/new`,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      delay: '0ms'
    },
    {
      id: 'send-notification',
      title: dict.admin?.dashboard?.quickActions?.sendNotification || 'Send Notification',
      description: dict.admin?.dashboard?.quickActions?.sendNotificationDesc || 'Send system-wide notifications',
      icon: 'bell',
      href: `/${lang}/admin/notifications`,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      delay: '100ms'
    },
    {
      id: 'view-analytics',
      title: dict.admin?.dashboard?.quickActions?.viewAnalytics || 'View Analytics',
      description: dict.admin?.dashboard?.quickActions?.viewAnalyticsDesc || 'Check business metrics and insights',
      icon: 'analytics',
      href: `/${lang}/admin/analytics`,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      delay: '200ms'
    },
    {
      id: 'visitor-analytics',
      title: dict.admin?.dashboard?.quickActions?.visitorAnalytics || 'Visitor Analytics',
      description: dict.admin?.dashboard?.quickActions?.visitorAnalyticsDesc || 'Traffic, devices, referrers from GA',
      icon: 'globe',
      href: `/${lang}/admin/analytics-seo`,
      color: 'text-cyan-600 dark:text-cyan-400',
      bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
      delay: '250ms'
    },
    {
      id: 'manage-faq',
      title: 'Manage FAQ',
      description: dict.admin?.dashboard?.quickActions?.manageFaqDesc || 'Update frequently asked questions',
      icon: 'lightbulb',
      href: `/${lang}/admin/faq`,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      delay: '300ms'
    }
  ];

  return (
    <div className="glass-surface rounded-2xl shadow-sm border border-ui-default dark:border-ui-subtle p-6 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
          <Icon name="zap" className="w-5 h-5" />
        </div>
        <h3 className="text-xl font-semibold text-ui-primary">
          {dict.admin?.dashboard?.quickActions?.title || 'Quick Actions'}
        </h3>
      </div>
      
      <div className="space-y-4">
        {actions.map((action) => (
          <Link
            key={action.id}
            href={action.href}
            className={`
              block p-4 rounded-xl 
              glass-surface
              border border-ui-default dark:border-ui-subtle
              hover:shadow-md hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50
              transition-shadow duration-200 ease-out
              hover:border-ui-default dark:hover:border-ui-subtle
              group
            `}
            onMouseEnter={() => setHoveredAction(action.id)}
            onMouseLeave={() => setHoveredAction(null)}
          >
            {/* Content */}
            <div className="flex items-center space-x-4">
              <div className={`
                w-12 h-12 rounded-lg ${action.bgColor}
                flex items-center justify-center
                transition-colors duration-200
              `}>
                <Icon name={action.icon as any} className={`w-6 h-6 ${action.color}`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-ui-primary">
                  {action.title}
                </h4>
                <p className="text-sm text-ui-muted dark:text-ui-faint">
                  {action.description}
                </p>
              </div>
              
              <div className="text-ui-faint dark:text-ui-faint group-hover:text-ui-muted dark:group-hover:text-ui-faint transition-colors duration-200">
                <Icon name="arrowRight" className="w-4 h-4" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Additional Quick Stats */}
      <div className="mt-6 pt-6 border-t border-ui-default dark:border-ui-subtle">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg bg-ui-inset dark:bg-ui-elevated hover:bg-ui-inset dark:hover:bg-ui-inset transition-colors">
            <div className="text-lg font-bold text-ui-primary">24/7</div>
            <div className="text-xs text-ui-muted dark:text-ui-faint">{dict.admin?.dashboard?.quickActions?.support || 'Support'}</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-ui-inset dark:bg-ui-elevated hover:bg-ui-inset dark:hover:bg-ui-inset transition-colors">
            <div className="text-lg font-bold text-ui-primary">99.9%</div>
            <div className="text-xs text-ui-muted dark:text-ui-faint">{dict.admin?.dashboard?.quickActions?.uptime || 'Uptime'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
