import React from 'react';
import { Clock, ExternalLink, Edit, Trash2, MoreHorizontal, AlertTriangle } from 'lucide-react';
import { Website } from '@/types/types';
import { useRouter } from 'next/navigation';

interface WebsiteTableProps {
  websites: Website[];
  lastRefresh: Date | null;  // 🔥 NEW
}


export function WebsiteTable({ websites, lastRefresh }: WebsiteTableProps) {
  const router=useRouter();
  const formatTimeAgo = (lastChecked: string | Date, lastRefresh: Date | null) => {
    if (!lastChecked || !lastRefresh) return "Never";

    const lastCheckedDate = new Date(lastChecked);
    const diffMs = lastRefresh.getTime() - lastCheckedDate.getTime(); // 🔥 difference based on lastRefresh
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

    if (diffSeconds < 60) return `${diffSeconds} second${diffSeconds !== 1 ? 's' : ''} ago`; 
    if (diffMinutes < 60) return rtf.format(-diffMinutes, "minute");
    if (diffHours < 24) return rtf.format(-diffHours, "hour");
    return rtf.format(-diffDays, "day");
  };

  const getStatusBadge = (status: Website['status']) => {
    switch (status) {
      case 'up':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
            Up
          </span>
        );
      case 'down':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
            Down
          </span>
        );
      case 'checking':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
            Checking
          </span>
        );
    }
  };



  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-750 border-b border-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Website
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Response Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Last Checked
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {websites.map((website) => (
              <tr key={website.id} className="hover:bg-slate-750 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <div className="text-slate-400 text-sm flex items-center gap-1">
                      <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                      {website.url}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(website.status)}
                </td>
              
                <td className="px-6 py-4">
                  <span className="text-white">
                    {website.responseTime ? `${website.responseTime}ms` : '-'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock className="w-4 h-4" />
                    {website.status === 'checking' ? (
                      <span className="text-amber-400">Checking...</span>
                    ) : (
                      formatTimeAgo(website.lastChecked, lastRefresh)
                    )}
                  </div>
                </td>
 
                <td className="px-10 py-4">
                  <div className="flex items-center gap-1">
                    <button onClick={()=>{
                      router.push(`/website/${website.id}`)
                    }}
                      className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors cursor-pointer"
                      title="View Details"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
               
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {websites.length === 0 && (
        <div className="px-6 py-12 text-center">
          <div className="text-slate-400 mb-2">No websites found</div>
          <div className="text-slate-500 text-sm">
            Add your first website to start monitoring
          </div>
        </div>
      )}
    </div>
  );
}