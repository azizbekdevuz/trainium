import type { Dictionary } from '../../../lib/i18n/i18n';

interface MessageDisplayProps {
  message: string | null;
  dict: Dictionary;
}

export function MessageDisplay({ message, dict }: MessageDisplayProps) {
  if (!message) return null;

  const isSuccess = message.includes('successfully') || 
    message === (dict.admin?.orders?.detail?.updateSuccess ?? '') || 
    message === (dict.admin?.orders?.detail?.shippingUpdated ?? '');

  return (
    <div className={`p-4 rounded-lg ${
      isSuccess
        ? 'bg-green-50 text-green-700 border border-green-200' 
        : 'bg-red-50 text-red-700 border border-red-200'
    }`}>
      {message}
    </div>
  );
}

