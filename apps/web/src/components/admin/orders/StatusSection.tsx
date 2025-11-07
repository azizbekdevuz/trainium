import type { OrderStatus } from '@prisma/client';
import type { StatusOption } from './types';
import type { Dictionary } from '../../../lib/i18n';

interface StatusSectionProps {
  currentStatus: OrderStatus;
  selectedStatus: OrderStatus;
  onStatusChange: (status: OrderStatus) => void;
  onUpdate: () => void;
  isUpdating: boolean;
  statusOptions: StatusOption[];
  updatedAt: string;
  dict: Dictionary;
}

export function StatusSection({
  currentStatus,
  selectedStatus,
  onStatusChange,
  onUpdate,
  isUpdating,
  statusOptions,
  updatedAt,
  dict,
}: StatusSectionProps) {
  const currentStatusConfig = statusOptions.find(s => s.value === currentStatus);

  return (
    <section className="rounded-2xl border bg-white p-6">
      <h2 className="text-lg font-semibold mb-4">{dict.admin?.orders?.detail?.statusHeader ?? 'Order Status'}</h2>
      <div className="flex items-center gap-4 mb-4">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${currentStatusConfig?.color}`}>
          {currentStatusConfig?.label}
        </span>
        <span className="text-sm text-gray-500">
          {(dict.admin?.orders?.detail?.updated ?? 'Updated')} {new Date(updatedAt).toLocaleString()}
        </span>
      </div>
      
      <div className="flex items-center gap-3">
        <select
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value as OrderStatus)}
          className="h-10 rounded-lg border px-3 flex-1 max-w-xs"
          disabled={isUpdating}
        >
          {statusOptions.map((status) => (
            <option 
              key={status.value} 
              value={status.value}
              disabled={status.disabled}
            >
              {status.label}
            </option>
          ))}
        </select>
        <button
          onClick={onUpdate}
          disabled={isUpdating || selectedStatus === currentStatus}
          className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isUpdating ? (dict.common?.updating ?? 'Updating...') : (dict.admin?.orders?.detail?.updateCta ?? 'Update Status')}
        </button>
      </div>
      {selectedStatus !== currentStatus && (
        <p className="text-sm text-blue-600 mt-2">
          {(dict.admin?.orders?.detail?.willChange ?? 'Status will change from')} <strong>{currentStatus}</strong> {(dict.admin?.orders?.detail?.to ?? 'to')} <strong>{selectedStatus}</strong>
        </p>
      )}
    </section>
  );
}

