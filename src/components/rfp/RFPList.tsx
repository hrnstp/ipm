// Компонент списка RFP
// Вынесен из ProcurementRFP.tsx для улучшения читаемости

import { RFP, Bid } from '../../shared/types/database.types';

interface RFPListProps {
  rfps: RFP[];
  myBids: Bid[];
  filter: 'all' | 'published' | 'closed';
  onRFPSelect: (rfp: RFP) => void;
  getDaysUntilDeadline: (deadline: string) => number;
}

export default function RFPList({ rfps, myBids, filter, onRFPSelect, getDaysUntilDeadline }: RFPListProps) {
  const filteredRFPs = rfps.filter((rfp) => {
    if (filter === 'all') return true;
    return rfp.status === filter;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {filteredRFPs.map((rfp) => {
        const daysLeft = rfp.deadline ? getDaysUntilDeadline(rfp.deadline) : null;
        const hasBid = myBids.some((b) => b.rfp_id === rfp.id);

        return (
          <div
            key={rfp.id}
            className="bg-themed-secondary border border-themed-primary rounded-xl p-6 hover:shadow-lg transition cursor-pointer"
            onClick={() => onRFPSelect(rfp)}
          >
            {/* RFP Card Content */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      rfp.status === 'published'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : rfp.status === 'closed'
                        ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                    }`}
                  >
                    {rfp.status}
                  </span>
                  {hasBid && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                      Bid Submitted
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-themed-primary mb-1">{rfp.title}</h3>
                <p className="text-sm text-themed-tertiary line-clamp-2">{rfp.description}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-themed-tertiary">
              {rfp.municipality && (
                <span className="flex items-center gap-1">
                  <span>{rfp.municipality.city_name}</span>
                </span>
              )}
              {daysLeft !== null && (
                <span className={daysLeft < 7 ? 'text-red-600 dark:text-red-400' : ''}>
                  {daysLeft} days left
                </span>
              )}
              {rfp.bid_count !== undefined && (
                <span>{rfp.bid_count} bid{rfp.bid_count !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

