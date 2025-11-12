import type { OrderData } from './types';
import type { Dictionary } from '../../../lib/i18n/i18n';

interface ShippingSectionProps {
  shipping: NonNullable<OrderData['shipping']>;
  onUpdate: (field: string, value: string) => void;
  dict: Dictionary;
}

export function ShippingSection({ shipping, onUpdate, dict }: ShippingSectionProps) {
  return (
    <section className="rounded-2xl border bg-white p-6">
      <h2 className="text-lg font-semibold mb-4">{dict.admin?.orders?.detail?.shippingHeader ?? 'Shipping Information'}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{dict.admin?.orders?.detail?.fullName ?? 'Full Name'}</label>
          <input
            type="text"
            defaultValue={shipping.fullName}
            onBlur={(e) => e.target.value !== shipping.fullName && onUpdate('fullName', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{dict.admin?.orders?.detail?.phone ?? 'Phone'}</label>
          <input
            type="text"
            defaultValue={shipping.phone}
            onBlur={(e) => e.target.value !== shipping.phone && onUpdate('phone', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">{dict.admin?.orders?.detail?.address1 ?? 'Address Line 1'}</label>
          <input
            type="text"
            defaultValue={shipping.address1}
            onBlur={(e) => e.target.value !== shipping.address1 && onUpdate('address1', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        {shipping.address2 && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">{dict.admin?.orders?.detail?.address2 ?? 'Address Line 2'}</label>
            <input
              type="text"
              defaultValue={shipping.address2}
              onBlur={(e) => e.target.value !== shipping.address2 && onUpdate('address2', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{dict.admin?.orders?.detail?.city ?? 'City'}</label>
          <input
            type="text"
            defaultValue={shipping.city}
            onBlur={(e) => e.target.value !== shipping.city && onUpdate('city', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{dict.admin?.orders?.detail?.postalCode ?? 'Postal Code'}</label>
          <input
            type="text"
            defaultValue={shipping.postalCode}
            onBlur={(e) => e.target.value !== shipping.postalCode && onUpdate('postalCode', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{dict.admin?.orders?.detail?.country ?? 'Country'}</label>
          <input
            type="text"
            defaultValue={shipping.country}
            onBlur={(e) => e.target.value !== shipping.country && onUpdate('country', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{dict.admin?.orders?.detail?.carrier ?? 'Carrier'}</label>
          <input
            type="text"
            defaultValue={shipping.carrier || ''}
            onBlur={(e) => e.target.value !== (shipping.carrier || '') && onUpdate('carrier', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder={dict.admin?.orders?.detail?.carrierPh ?? 'e.g., CJ대한통운, DHL'}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{dict.admin?.orders?.detail?.trackingNo ?? 'Tracking Number'}</label>
          <input
            type="text"
            defaultValue={shipping.trackingNo || ''}
            onBlur={(e) => e.target.value !== (shipping.trackingNo || '') && onUpdate('trackingNo', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder={dict.admin?.orders?.detail?.trackingNoPh ?? 'Enter tracking number'}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{dict.admin?.orders?.detail?.shippingStatus ?? 'Shipping Status'}</label>
          <select
            defaultValue={shipping.status || 'Preparing'}
            onChange={(e) => onUpdate('status', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="Preparing">{dict.timeline?.preparing ?? 'Preparing'}</option>
            <option value="In Transit">{dict.timeline?.onWay ?? 'In Transit'}</option>
            <option value="Delivered">{dict.timeline?.delivered ?? 'Delivered'}</option>
            <option value="Exception">{dict.admin?.orders?.detail?.exception ?? 'Exception'}</option>
          </select>
        </div>
      </div>
    </section>
  );
}

