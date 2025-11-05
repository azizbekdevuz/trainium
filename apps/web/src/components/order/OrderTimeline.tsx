'use client';

import { OrderStatus } from '@prisma/client';
import { getTimelineEventsForStatus } from '../../lib/order-status';
import { useI18n } from '../providers/I18nProvider';
import { formatDateTime } from '../../lib/date-utils';
import { Icon } from '../ui/Icon';

// Icon mapping using Lucide icons
const iconMap: Record<string, string> = {
  '📝': 'success',
  '💳': 'clock',
  '📦': 'package',
  '🚚': 'truck',
  '✅': 'home',
  '❌': 'cancel',
  '↩️': 'undo',
};

interface OrderTimelineProps {
  orderStatus: OrderStatus;
  shippingStatus?: string | null;
  trackingNo?: string | null;
  createdAt: Date;
}

export function OrderTimeline({ orderStatus, trackingNo, createdAt }: OrderTimelineProps) {
  const { dict } = useI18n();
  // Get timeline events using unified status system
  const timelineEvents = getTimelineEventsForStatus(orderStatus);
  
  // Handle special cases for canceled/refunded orders
  const isCanceledOrRefunded = orderStatus === 'CANCELED' || orderStatus === 'REFUNDED';
  
  // Get events to display
  const eventsToShow = isCanceledOrRefunded 
    ? timelineEvents.filter(event => event.status === 'PENDING' || event.status === orderStatus as any)
    : timelineEvents;

  return (
    <section className="rounded-2xl border bg-white p-5">
      <h2 className="font-medium mb-4">{dict.timeline?.orderTimeline ?? 'Order Timeline'}</h2>
      <div className="space-y-4">
        {eventsToShow.map((event, index) => {
          const iconName = iconMap[event.icon] || 'success';
          const isLast = index === eventsToShow.length - 1;
          
          // Localize label/description by status
          let label: string = event.label;
          let description: string = event.description;
          switch (event.status) {
            case 'PENDING':
              label = dict.timeline?.orderPlaced ?? label;
              description = dict.timeline?.orderPlacedDesc ?? description;
              break;
            case 'PAID':
              label = dict.timeline?.paymentConfirmed ?? label;
              description = dict.timeline?.paymentConfirmedDesc ?? description;
              break;
            case 'FULFILLING':
              label = dict.timeline?.orderFulfilling ?? label;
              description = dict.timeline?.orderFulfillingDesc ?? description;
              break;
            case 'SHIPPED':
              label = dict.timeline?.orderShipped ?? label;
              // Enhanced description for shipped orders with tracking
              description = trackingNo ? `${dict.timeline?.trackingPrefix ?? 'Tracking'}: ${trackingNo}` : (dict.timeline?.onWay ?? description);
              break;
            case 'DELIVERED':
              label = dict.timeline?.delivered ?? label;
              description = dict.timeline?.deliveredDesc ?? description;
              break;
          }

          // Handle labels for canceled/refunded orders without widening event.status
          if (isCanceledOrRefunded && event.status !== 'PENDING') {
            if (orderStatus === 'CANCELED') {
              label = dict.timeline?.canceled ?? label;
              description = dict.timeline?.canceledDesc ?? description;
            } else if (orderStatus === 'REFUNDED') {
              label = dict.timeline?.refunded ?? label;
              description = dict.timeline?.refundedDesc ?? description;
            }
          }
          if (event.status === 'SHIPPED' && trackingNo) {
            description = `Tracking: ${trackingNo}`;
          }
          
          return (
            <div key={event.status} className="flex items-start space-x-3">
              <div className="flex flex-col items-center">
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-full border-2
                  ${event.current 
                    ? 'bg-green-500 border-green-500 text-white animate-ping' 
                    : event.completed 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : 'bg-gray-100 border-gray-300 text-gray-400 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-500'
                  }
                `}>
                  <Icon name={iconName as any} className="w-4 h-4" />
                </div>
                {!isLast && (
                  <div className={`
                    w-0.5 h-8 mt-2
                    ${event.completed ? 'bg-green-500' : 'bg-gray-200'}
                  `} />
                )}
              </div>
              
              <div className="flex-1 pb-6">
                <div className="flex items-center space-x-2">
                  <h3 className={`
                    font-medium text-sm
                    ${event.completed || event.current ? 'text-gray-900' : 'text-gray-500'}
                  `}>
                    {label}
                  </h3>
                  {event.current && (
                    <span className="animate-pulse px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      {dict.timeline?.current ?? 'Current'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{description}</p>
                {event.completed && (
                  <p className="text-xs text-gray-500 mt-1">
                    {event.status === 'PENDING' ? formatDateTime(createdAt) : (dict.timeline?.completed ?? 'Completed')}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
