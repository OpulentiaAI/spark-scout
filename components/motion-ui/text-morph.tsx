'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';

export function TextMorph({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  const [text, setText] = useState(children);

  useEffect(() => {
    setText(children);
  }, [children]);

  return (
    <div className={className} style={{ display: 'inline-block', minWidth: 4 }}>
      <AnimatePresence mode="wait">
        <motion.span
          key={text}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          className="inline-block"
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

