'use client';

import { useState } from 'react';
import { Send, AlertCircle, Package, Bell } from 'lucide-react';
import { useI18n } from '../providers/I18nProvider';

export function NotificationClient() {
  const { dict } = useI18n();
  const [formData, setFormData] = useState({
    type: 'SYSTEM_ALERT',
    title: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [checkingStock, setCheckingStock] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      setError(dict.admin?.notifications?.fillAll ?? 'Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess(true);
        setFormData({ type: 'SYSTEM_ALERT', title: '', message: '' });
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await response.json();
        setError(data.error || (dict.admin?.notifications?.sendFailed ?? 'Failed to send notification'));
      }
    } catch {
      setError(dict.admin?.notifications?.network ?? 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckLowStock = async () => {
    setCheckingStock(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/admin/notifications/check-low-stock', {
        method: 'POST',
      });

      if (response.ok) {
        await response.json();
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await response.json();
        setError(data.error || (dict.admin?.notifications?.checkFailed ?? 'Failed to check low stock'));
      }
    } catch {
      setError(dict.admin?.notifications?.network ?? 'Network error. Please try again.');
    } finally {
      setCheckingStock(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ORDER_UPDATE':
        return <Package className="h-5 w-5" />;
      case 'PRODUCT_ALERT':
        return <Bell className="h-5 w-5" />;
      case 'SYSTEM_ALERT':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ORDER_UPDATE':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'PRODUCT_ALERT':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'SYSTEM_ALERT':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-green-800 font-medium">{dict.admin?.notifications?.sent ?? 'Notification sent successfully!'}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">{dict.admin?.notifications?.quickActions ?? 'Quick Actions'}</h2>
        <div className="flex gap-3">
          <button
            onClick={handleCheckLowStock}
            disabled={checkingStock}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {checkingStock ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {dict.admin?.notifications?.checking ?? 'Checking...'}
              </>
            ) : (
              <>
                📦 {dict.admin?.notifications?.checkLowStock ?? 'Check Low Stock'}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">{dict.admin?.notifications?.sendHeader ?? 'Send System Notification'}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {dict.admin?.notifications?.form?.type ?? 'Notification Type'}
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            >
              <option value="SYSTEM_ALERT">{dict.admin?.notifications?.form?.types?.system ?? 'System Alert'}</option>
              <option value="PRODUCT_ALERT">{dict.admin?.notifications?.form?.types?.product ?? 'Product Alert'}</option>
              <option value="ORDER_UPDATE">{dict.admin?.notifications?.form?.types?.order ?? 'Order Update'}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {dict.admin?.notifications?.form?.title ?? 'Title'}
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder={dict.admin?.notifications?.form?.titlePh ?? 'e.g., New Product Available!'}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {dict.admin?.notifications?.form?.message ?? 'Message'}
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder={dict.admin?.notifications?.form?.messagePh ?? 'Enter the notification message...'}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.message.length}/500 {dict.admin?.notifications?.form?.characters ?? 'characters'}
            </p>
          </div>

          {formData.title && formData.message && (
            <div className="p-4 bg-gray-50 border rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">{dict.admin?.notifications?.form?.preview ?? 'Preview:'}</h3>
              <div className={`p-3 border rounded-lg ${getTypeColor(formData.type)}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {getTypeIcon(formData.type)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{formData.title}</h4>
                    <p className="text-sm mt-1 opacity-90">{formData.message}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !formData.title.trim() || !formData.message.trim()}
              className="inline-flex items-center gap-2 px-6 py-2 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {dict.admin?.notifications?.form?.sending ?? 'Sending...'}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  {dict.admin?.notifications?.form?.send ?? 'Send Notification'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">{dict.admin?.notifications?.quickTemplates ?? 'Quick Templates'}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <button
            onClick={() => setFormData({
              type: 'SYSTEM_ALERT',
              title: dict.admin?.notifications?.templates?.maintenanceTitle ?? 'System Maintenance',
              message: dict.admin?.notifications?.templates?.maintenanceMsg ?? 'We will be performing scheduled maintenance on our servers. The website may be temporarily unavailable during this time. We apologize for any inconvenience.'
            })}
            className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <h3 className="font-medium text-sm">{dict.admin?.notifications?.templates?.maintenanceTitle ?? 'System Maintenance'}</h3>
            <p className="text-xs text-gray-600 mt-1">{dict.admin?.notifications?.templates?.maintenanceDesc ?? 'Notify users about scheduled maintenance'}</p>
          </button>
          
          <button
            onClick={() => setFormData({
              type: 'PRODUCT_ALERT',
              title: dict.admin?.notifications?.templates?.newProductTitle ?? 'New Product Launch',
              message: dict.admin?.notifications?.templates?.newProductMsg ?? 'Check out our latest fitness equipment! New products have been added to our catalog with special launch pricing.'
            })}
            className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <h3 className="font-medium text-sm">{dict.admin?.notifications?.templates?.newProductTitle ?? 'New Product Launch'}</h3>
            <p className="text-xs text-gray-600 mt-1">{dict.admin?.notifications?.templates?.newProductDesc ?? 'Announce new products to all users'}</p>
          </button>
          
          <button
            onClick={() => setFormData({
              type: 'SYSTEM_ALERT',
              title: dict.admin?.notifications?.templates?.holidayTitle ?? 'Holiday Schedule',
              message: dict.admin?.notifications?.templates?.holidayMsg ?? "Our customer service will be closed during the holiday period. Orders placed during this time will be processed when we return. Thank you for your understanding."
            })}
            className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <h3 className="font-medium text-sm">{dict.admin?.notifications?.templates?.holidayTitle ?? 'Holiday Schedule'}</h3>
            <p className="text-xs text-gray-600 mt-1">{dict.admin?.notifications?.templates?.holidayDesc ?? 'Inform users about holiday closures'}</p>
          </button>
          
          <button
            onClick={() => setFormData({
              type: 'PRODUCT_ALERT',
              title: dict.admin?.notifications?.templates?.flashTitle ?? 'Flash Sale',
              message: dict.admin?.notifications?.templates?.flashMsg ?? "Limited time offer! Get up to 50% off on selected fitness equipment. Sale ends soon, don't miss out!"
            })}
            className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <h3 className="font-medium text-sm">{dict.admin?.notifications?.templates?.flashTitle ?? 'Flash Sale'}</h3>
            <p className="text-xs text-gray-600 mt-1">{dict.admin?.notifications?.templates?.flashDesc ?? 'Promote special sales and offers'}</p>
          </button>
        </div>
      </div>
    </div>
  );
}
