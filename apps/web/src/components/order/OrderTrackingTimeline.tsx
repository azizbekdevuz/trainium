'use client';

import { OrderStatus } from '@prisma/client';
import { useI18n } from '../providers/I18nProvider';
import { formatDateTime } from '../../lib/date-utils';
import { Icon } from '../ui/Icon';

interface OrderTrackingTimelineProps {
  orderStatus: OrderStatus;
  shippingStatus?: string | null;
  trackingNo?: string | null;
  carrier?: string | null;
  createdAt: Date;
}

export function OrderTrackingTimeline({ 
  orderStatus, 
  trackingNo, 
  carrier,
  createdAt 
}: OrderTrackingTimelineProps) {
  const { dict } = useI18n();
  
  // Get tracking events based on order status
  const getTrackingEvents = () => {
    const events = [];
    
    // Preparing phase
    if (['PAID', 'FULFILLING'].includes(orderStatus)) {
      events.push({
        id: 'preparing',
        status: 'PREPARING',
        label: dict.timeline?.preparing ?? 'Preparing for Shipment',
        description: dict.timeline?.preparingDesc ?? 'Your order is being prepared for shipping',
        icon: 'package',
        completed: true,
        current: orderStatus === 'FULFILLING',
        timestamp: createdAt
      });
    }
    
    // Shipped phase
    if (['SHIPPED', 'DELIVERED'].includes(orderStatus)) {
      events.push({
        id: 'shipped',
        status: 'SHIPPED',
        label: dict.timeline?.shipped ?? 'Package Shipped',
        description: trackingNo ? `${dict.orderPage?.tracking ?? 'Tracking'}: ${trackingNo}` : (dict.timeline?.onWay ?? 'Your package is on its way'),
        icon: 'truck',
        completed: orderStatus === 'DELIVERED',
        current: orderStatus === 'SHIPPED',
        timestamp: createdAt
      });
    }
    
    // Delivered phase
    if (orderStatus === 'DELIVERED') {
      events.push({
        id: 'delivered',
        status: 'DELIVERED',
        label: dict.timeline?.delivered ?? 'Package Delivered',
        description: dict.timeline?.deliveredDesc ?? 'Your package has been delivered successfully',
        icon: 'home',
        completed: true,
        current: false,
        timestamp: createdAt
      });
    }
    
    // If no tracking events yet, show waiting state
    if (events.length === 0) {
      events.push({
        id: 'waiting',
        status: 'WAITING',
        label: dict.timeline?.waiting ?? 'Waiting for Shipment',
        description: dict.timeline?.waitingDesc ?? 'Your order will be prepared for shipping soon',
        icon: 'clock',
        completed: false,
        current: true,
        timestamp: createdAt
      });
    }
    
    return events;
  };

  const trackingEvents = getTrackingEvents();

  if (trackingEvents.length === 0) {
    return (
      <div className="rounded-2xl border bg-white p-5">
        <h2 className="font-medium mb-4">{dict.track?.resultsTitle ?? 'Package Tracking'}</h2>
        <div className="text-center py-8 text-gray-500">
          {dict.timeline?.noInfoYet ?? 'No tracking information available yet.'}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium">{dict.track?.resultsTitle ?? 'Package Tracking'}</h2>
        {trackingNo && (
          <div className="text-sm text-gray-500 font-mono">
            {trackingNo}
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        {trackingEvents.map((event, index) => {
          const iconName = event.icon;
          const isLast = index === trackingEvents.length - 1;
          
          return (
            <div key={event.id} className="flex items-start space-x-3">
              <div className="flex flex-col items-center">
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-full border-2
                  ${event.current 
                    ? 'bg-blue-500 border-blue-500 text-white animate-pulse' 
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
                    {event.label}
                  </h3>
                  {event.current && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      {dict.timeline?.current ?? 'Current'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                <p className="text-xs text-gray-500 mt-1">{formatDateTime(event.timestamp)}</p>
              </div>
            </div>
          );
        })}
      </div>
      
      {trackingNo && (
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{dict.orderPage?.carrier ?? 'Carrier'}: {carrier || (dict.timeline?.unknown ?? 'Unknown')}</span>
            <a
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700 underline"
              onClick={() => {
                window.alert(dict.timeline?.comingSoon ?? 'This feature is coming soon! Thanks for your patience.');
              }}
            >
              {dict.timeline?.trackOnCarrier ?? 'Track on carrier website'} <Icon name="arrowRight" className="w-3 h-3 inline ml-1" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
