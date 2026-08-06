import { useState, useEffect } from 'react';
import Link from 'next/link';

export const SchemeReferenceCard = ({ schemeId }: { schemeId: string }) => {
  const [scheme, setScheme] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/schemes/${schemeId}`)
      .then(res => res.json())
      .then(data => {
        if (data.scheme) setScheme(data.scheme);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [schemeId]);

  if (loading) {
    return (
      <div className="mt-2 h-[76px] bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-[16px] p-4 animate-pulse" />
    );
  }

  if (!scheme) return null;

  // Prefer official_url, fallback to local scheme details page
  const targetUrl = scheme.official_url || `/schemes/${schemeId}`;
  
  // Format the max grant amount (fallback if empty)
  // Use benefit_value or max_value_cap
  const amountStr = scheme.benefit_value || scheme.max_value_cap || 'View Details';
  
  // Format jurisdiction
  const jurisdiction = scheme.applicable_states ? `${scheme.applicable_states} Government` : 'Official Government Scheme';

  return (
    <Link 
      href={targetUrl}
      target={scheme.official_url ? "_blank" : undefined}
      rel={scheme.official_url ? "noopener noreferrer" : undefined}
      className="mt-2 block w-full min-w-0 box-border bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-[16px] p-4 hover:shadow-md transition-all group no-underline overflow-hidden"
    >
      <div className="flex flex-col gap-3 w-full min-w-0">
        <div className="flex flex-col min-w-0">
          <p className="font-bold text-[#1E293B] dark:text-[#F8FAFC] text-[15px] md:text-[16px] group-hover:text-[#2563EB] transition-colors whitespace-normal break-words leading-[1.4] [overflow-wrap:anywhere]">
            {scheme.scheme_name || 'Government Scheme'}
          </p>
          <p className="text-[13px] md:text-[14px] text-[#64748B] dark:text-[#94A3B8] whitespace-normal break-words mt-0.5">
            {jurisdiction}
          </p>
        </div>
        
        <div className="flex items-center justify-between border-t border-[#F1F5F9] dark:border-white/5 pt-3 mt-1">
          <div className="flex flex-col">
            <span className="text-[12px] text-[#94A3B8] font-medium uppercase tracking-wider mb-0.5">Benefit</span>
            <span className="text-[#16A34A] dark:text-[#4ADE80] font-bold text-[15px]">
              {amountStr}
            </span>
          </div>
          <div className="text-[13px] font-semibold text-[#2563EB] dark:text-[#60A5FA] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            View Details <span aria-hidden="true">&rarr;</span>
          </div>
        </div>
      </div>
    </Link>
  );
};
