import { motion } from 'framer-motion';

export const SuggestionChips = ({
  suggestions,
  onSelect,
}: {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="flex flex-nowrap overflow-x-auto gap-2 pb-1 scrollbar-hide px-6 w-full box-border">
      {suggestions.map((suggestion, index) => (
        <motion.button
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onSelect(suggestion)}
          className="whitespace-nowrap flex-shrink-0 px-4 min-h-[44px] flex items-center bg-[#F4F8FF] dark:bg-[#1E293B] hover:bg-[#E5EDFF] dark:hover:bg-[#334155] border border-transparent dark:border-[#334155] rounded-full text-[13px] font-semibold text-[#1E3A8A] dark:text-[#93C5FD] transition-colors shadow-sm"
        >
          {suggestion}
        </motion.button>
      ))}
    </div>
  );
};
