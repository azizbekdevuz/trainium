// Shipping tracking integration utilities
// This provides a foundation for integrating with carrier APIs like SweetTracker, AfterShip, etc.

export interface TrackingEvent {
  id: string;
  status: string;
  description: string;
  location?: string;
  timestamp: Date;
  carrier?: string;
  trackingNumber: string;
}

export interface CarrierInfo {
  name: string;
  code: string;
  trackingUrl: string;
  phone?: string;
}

// Common Korean carriers
export const KOREAN_CARRIERS: Record<string, CarrierInfo> = {
  'CJ': {
    name: 'CJ대한통운',
    code: 'CJ',
    trackingUrl: 'https://www.cjlogistics.com/ko/tool/parcel/tracking',
    phone: '1588-1255'
  },
  'HANJIN': {
    name: '한진택배',
    code: 'HANJIN',
    trackingUrl: 'https://www.hanjin.co.kr/kor/CMS/DeliveryMgr/WaybillResult.do',
    phone: '1588-0011'
  },
  'LOTTE': {
    name: '롯데택배',
    code: 'LOTTE',
    trackingUrl: 'https://www.lotteglogis.com/home/reservation/tracking/index',
    phone: '1588-2121'
  },
  'KOREA_POST': {
    name: '우체국택배',
    code: 'KOREA_POST',
    trackingUrl: 'https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm',
    phone: '1588-1300'
  }
};

// International carriers
export const INTERNATIONAL_CARRIERS: Record<string, CarrierInfo> = {
  'DHL': {
    name: 'DHL',
    code: 'DHL',
    trackingUrl: 'https://www.dhl.com/track',
    phone: '+82-2-1588-0001'
  },
  'FEDEX': {
    name: 'FedEx',
    code: 'FEDEX',
    trackingUrl: 'https://www.fedex.com/track',
    phone: '+82-2-1588-0002'
  },
  'UPS': {
    name: 'UPS',
    code: 'UPS',
    trackingUrl: 'https://www.ups.com/track',
    phone: '+82-2-1588-0003'
  }
};

export function detectCarrier(trackingNumber: string): CarrierInfo | null {
  // Simple carrier detection based on tracking number patterns
  const upper = trackingNumber.toUpperCase();
  
  if (upper.startsWith('CJ') || upper.startsWith('12')) {
    return KOREAN_CARRIERS.CJ;
  }
  if (upper.startsWith('HJ') || upper.startsWith('13')) {
    return KOREAN_CARRIERS.HANJIN;
  }
  if (upper.startsWith('LT') || upper.startsWith('14')) {
    return KOREAN_CARRIERS.LOTTE;
  }
  if (upper.startsWith('KP') || upper.startsWith('15')) {
    return KOREAN_CARRIERS.KOREA_POST;
  }
  if (upper.startsWith('DHL') || upper.startsWith('1Z')) {
    return INTERNATIONAL_CARRIERS.DHL;
  }
  if (upper.startsWith('FX') || upper.startsWith('FDX')) {
    return INTERNATIONAL_CARRIERS.FEDEX;
  }
  if (upper.startsWith('UPS') || upper.startsWith('1Z')) {
    return INTERNATIONAL_CARRIERS.UPS;
  }
  
  return null;
}

export function generateTrackingUrl(trackingNumber: string, carrier?: CarrierInfo): string {
  if (carrier) {
    return `${carrier.trackingUrl}?trackingNumber=${encodeURIComponent(trackingNumber)}`;
  }
  
  const detectedCarrier = detectCarrier(trackingNumber);
  if (detectedCarrier) {
    return `${detectedCarrier.trackingUrl}?trackingNumber=${encodeURIComponent(trackingNumber)}`;
  }
  
  // Fallback to generic tracking
  return `https://www.google.com/search?q=${encodeURIComponent(trackingNumber)}+tracking`;
}

// Mock tracking events for development/testing
export function generateMockTrackingEvents(trackingNumber: string): TrackingEvent[] {
  const carrier = detectCarrier(trackingNumber);
  const now = new Date();
  
  const events: TrackingEvent[] = [
    {
      id: '1',
      status: 'PICKED_UP',
      description: 'Package picked up from sender',
      location: 'Seoul, South Korea',
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      carrier: carrier?.code,
      trackingNumber
    },
    {
      id: '2',
      status: 'IN_TRANSIT',
      description: 'Package in transit to destination',
      location: 'Incheon, South Korea',
      timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      carrier: carrier?.code,
      trackingNumber
    },
    {
      id: '3',
      status: 'OUT_FOR_DELIVERY',
      description: 'Package out for delivery',
      location: 'Local delivery facility',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      carrier: carrier?.code,
      trackingNumber
    }
  ];
  
  return events;
}

// Status mapping for display
export const TRACKING_STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
  'PICKED_UP': { label: 'Picked Up', color: 'blue', icon: '📦' },
  'IN_TRANSIT': { label: 'In Transit', color: 'yellow', icon: '🚚' },
  'OUT_FOR_DELIVERY': { label: 'Out for Delivery', color: 'orange', icon: '🚛' },
  'DELIVERED': { label: 'Delivered', color: 'green', icon: '✅' },
  'EXCEPTION': { label: 'Exception', color: 'red', icon: '⚠️' },
  'RETURNED': { label: 'Returned', color: 'gray', icon: '↩️' }
};
