'use client';

import { useState, useEffect } from 'react';
import { TrackingEvent, TRACKING_STATUS_MAP } from '../../lib/shipping-tracker';
import { Icon } from '../ui/Icon';

interface TrackingTimelineProps {
  trackingNumber: string;
  carrier?: string;
  events?: TrackingEvent[];
}

export function TrackingTimeline({ trackingNumber, carrier, events: initialEvents }: TrackingTimelineProps) {
  const [events, setEvents] = useState<TrackingEvent[]>(initialEvents || []);
  const [loading, setLoading] = useState(!initialEvents);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialEvents) {
      // In a real implementation, this would fetch from your API
      // For now, we'll use mock data
      fetchTrackingEvents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackingNumber, initialEvents]);

  const fetchTrackingEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock API call - replace with real implementation
      const response = await fetch(`/api/shipping/track/${trackingNumber}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tracking information');
      }
      
      const data = await response.json();
      setEvents(data.events || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tracking information');
      // Fallback to mock data for development
      const mockEvents = await import('../../lib/shipping-tracker').then(m => 
        m.generateMockTrackingEvents(trackingNumber)
      );
      setEvents(mockEvents);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-5">
        <h2 className="font-medium mb-4">Package Tracking</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading tracking information...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border bg-white p-5">
        <h2 className="font-medium mb-4">Package Tracking</h2>
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">⚠️ {error}</div>
          <button 
            onClick={fetchTrackingEvents}
            className="text-blue-500 hover:text-blue-700 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="rounded-2xl border bg-white p-5">
        <h2 className="font-medium mb-4">Package Tracking</h2>
        <div className="text-center py-8 text-gray-500">
          No tracking information available yet.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium">Package Tracking</h2>
        <div className="text-sm text-gray-500">
          {trackingNumber}
        </div>
      </div>
      
      <div className="space-y-4">
        {events.map((event, index) => {
          const statusInfo = TRACKING_STATUS_MAP[event.status] || {
            label: event.status,
            color: 'gray',
            icon: '📦'
          };
          
          const isLatest = index === 0;
          const isCompleted = event.status === 'DELIVERED';
          
          return (
            <div key={event.id} className="flex items-start space-x-3">
              <div className="flex flex-col items-center">
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-full border-2
                  ${isCompleted 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : isLatest 
                      ? 'bg-blue-500 border-blue-500 text-white animate-pulse' 
                      : 'bg-gray-100 border-gray-300 text-gray-400'
                  }
                `}>
                  <span className="text-sm">{statusInfo.icon}</span>
                </div>
                {index < events.length - 1 && (
                  <div className={`
                    w-0.5 h-8 mt-2
                    ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}
                  `} />
                )}
              </div>
              
              <div className="flex-1 pb-6">
                <div className="flex items-center space-x-2">
                  <h3 className={`
                    font-medium text-sm
                    ${isCompleted || isLatest ? 'text-gray-900' : 'text-gray-500'}
                  `}>
                    {statusInfo.label}
                  </h3>
                  {isLatest && !isCompleted && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                {event.location && (
                  <p className="text-xs text-gray-500 mt-1">📍 {event.location}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {event.timestamp.toLocaleString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 pt-4 border-t">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Carrier: {carrier || 'Unknown'}</span>
          <a
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 underline"
            onClick={() => {
              window.alert(`This feature is coming soon! Thanks for your patience.`);
            }}
          >
            Track on carrier website <Icon name="arrowRight" className="w-3 h-3 inline ml-1" />
          </a>
        </div>
      </div>
    </div>
  );
}
