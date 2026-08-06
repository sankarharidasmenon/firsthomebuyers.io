import { motion } from 'framer-motion';

export const TypingIndicator = () => {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3 bg-white dark:bg-[#1E293B] rounded-2xl rounded-tl-sm shadow-sm w-max border border-[rgba(0,0,0,0.05)] dark:border-white/10">
      <motion.div
        className="w-2 h-2 bg-[#94A3B8] rounded-full"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
      />
      <motion.div
        className="w-2 h-2 bg-[#94A3B8] rounded-full"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
      />
      <motion.div
        className="w-2 h-2 bg-[#94A3B8] rounded-full"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
      />
    </div>
  );
};
