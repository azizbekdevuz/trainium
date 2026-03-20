import type { OrderData } from './types';
import type { Dictionary } from '../../../lib/i18n/i18n';
import { LocalTime } from '@/components/ui/LocalTime';

interface CustomerSectionProps {
  user: OrderData['user'];
  dict: Dictionary;
}

export function CustomerSection({ user, dict }: CustomerSectionProps) {
  return (
    <section className="glass-surface rounded-2xl border border-[var(--border-default)] p-6">
      <h2 className="text-lg font-semibold mb-4">{dict.admin?.orders?.detail?.customerHeader ?? 'Customer Information'}</h2>
      {user ? (
        <div className="space-y-2">
          <div>
            <span className="text-sm font-medium text-ui-secondary">{dict.admin?.orders?.detail?.name ?? 'Name'}:</span>
            <div className="text-sm">{user.name || (dict.admin?.orders?.detail?.notProvided ?? 'Not provided')}</div>
          </div>
          <div>
            <span className="text-sm font-medium text-ui-secondary">{dict.admin?.orders?.detail?.email ?? 'Email'}:</span>
            <div className="text-sm">{user.email}</div>
          </div>
          <div>
            <span className="text-sm font-medium text-ui-secondary">{dict.admin?.orders?.detail?.customerSince ?? 'Customer Since'}:</span>
            <div className="text-sm"><LocalTime date={user.createdAt} /></div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-ui-faint">{dict.admin?.orders?.detail?.guest ?? 'Guest order'}</div>
      )}
    </section>
  );
}

