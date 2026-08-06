import { AIAvatar } from './AIAvatar';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const AIChatCard = ({ onClick }: { onClick: () => void }) => {
  return (
    <motion.button
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(59,130,246,0.08)' }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full text-left bg-[#F4F8FF] dark:bg-card border border-[#E5EDFF] dark:border-border rounded-[16px] overflow-hidden relative flex items-center justify-between p-4 transition-all cursor-pointer"
    >
      <div className="flex flex-col gap-1 z-10 max-w-[70%]">
        <div className="flex items-center gap-2">
          <div className="bg-[#1E293B] dark:bg-white rounded-full p-1 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white dark:text-[#1E293B]">
              <path d="M12 8V4H8" />
              <rect width="16" height="12" x="4" y="8" rx="2" />
              <path d="M2 14h2" />
              <path d="M20 14h2" />
              <path d="M15 13v2" />
              <path d="M9 13v2" />
            </svg>
          </div>
          <span className="font-bold text-[#1E293B] dark:text-foreground text-[14px] tracking-tight">Ask FirstHomeBuyer AI</span>
        </div>
        <p className="text-[#475569] dark:text-muted-foreground text-[12.5px] leading-snug pr-4">
          Get instant answers about your eligibility & ways to save more.
        </p>
        <div className="mt-1 inline-flex items-center justify-center gap-1.5 bg-[#2563EB] text-white font-semibold text-[13px] px-4 py-2 rounded-full w-max hover:bg-[#1D4ED8] transition-colors shadow-sm">
          Chat with AI <ArrowRight size={14} />
        </div>
      </div>
      <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10 translate-x-[5%]">
        <AIAvatar size={100} />
      </div>
    </motion.button>
  );
};
