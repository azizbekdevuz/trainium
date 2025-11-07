import { Wifi, WifiOff } from 'lucide-react';
import type { Dictionary } from '../../../lib/i18n';

interface ConnectionStatusProps {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError?: string | null;
  dict: Dictionary;
  onRetry: () => void;
}

export function ConnectionStatus({
  isConnected,
  isConnecting,
  connectionError,
  dict,
  onRetry,
}: ConnectionStatusProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 rounded-lg">
      <div className="flex items-center gap-2">
        {isConnected ? (
          <>
            <Wifi className="h-5 w-5 text-green-600" />
            <span className="text-green-800 dark:text-green-300 font-medium">{dict.notifications?.realtimeConnected ?? 'Real-time notifications connected'}</span>
          </>
        ) : (
          <>
            <WifiOff className="h-5 w-5 text-red-600" />
            <span className="text-red-800 dark:text-red-300 font-medium">
              {isConnecting ? (dict.notifications?.connecting ?? 'Connecting...') : (dict.notifications?.realtimeOffline ?? 'Real-time notifications offline')}
            </span>
          </>
        )}
      </div>
      {!isConnected && (
        <button
          onClick={onRetry}
          className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-100 dark:hover:bg-slate-700 dark:text-slate-100 self-start sm:self-auto"
        >
          {dict.notifications?.retry ?? 'Retry'}
        </button>
      )}
      {connectionError && (
        <span className="text-xs text-red-600">{connectionError}</span>
      )}
    </div>
  );
}

