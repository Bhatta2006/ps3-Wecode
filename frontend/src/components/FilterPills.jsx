import { motion } from 'framer-motion';

export default function FilterPills({ types, active, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {types.map(type => (
        <button
          key={type}
          onClick={() => onChange(type)}
          className={`relative px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border ${
            active === type
              ? 'bg-white text-black border-white'
              : 'border-white/10 text-gray-400 hover:border-white/30 hover:text-white bg-transparent'
          }`}
        >
          {active === type && (
            <motion.div
              layoutId="pill-active"
              className="absolute inset-0 bg-white rounded-full"
              style={{ zIndex: -1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          {type}
        </button>
      ))}
    </div>
  );
}
