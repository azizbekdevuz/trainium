// Tracking number generator for different carriers

export function generateTrackingNumber(carrier?: string): string {
  const now = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  switch (carrier?.toUpperCase()) {
    case 'CJ':
    case 'CJ대한통운':
      return `CJ${now.toString().slice(-8)}${random}`;
    
    case 'HANJIN':
    case '한진택배':
      return `HJ${now.toString().slice(-8)}${random}`;
    
    case 'LOTTE':
    case '롯데택배':
      return `LT${now.toString().slice(-8)}${random}`;
    
    case 'KOREA_POST':
    case '우체국택배':
      return `KP${now.toString().slice(-8)}${random}`;
    
    case 'DHL':
      return `DHL${now.toString().slice(-8)}${random}`;
    
    case 'FEDEX':
      return `FX${now.toString().slice(-8)}${random}`;
    
    case 'UPS':
      return `UPS${now.toString().slice(-8)}${random}`;
    
    default:
      // Default Korean carrier (CJ)
      return `CJ${now.toString().slice(-8)}${random}`;
  }
}

export function generateCarrier(): string {
  const carriers = ['CJ대한통운', '한진택배', '롯데택배', '우체국택배'];
  return carriers[Math.floor(Math.random() * carriers.length)];
}
