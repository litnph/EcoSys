import { animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { formatCurrency } from "@/shared/lib/formatters";

type AnimatedAmountProps = {
  value: number;
  currency?: string;
  className?: string;
};

/**
 * Tween formatted currency when the numeric value changes (e.g. net worth after transactions).
 */
export function AnimatedAmount({
  value,
  currency = "VND",
  className,
}: AnimatedAmountProps) {
  const [text, setText] = useState(() => formatCurrency(value, currency));
  const prev = useRef(value);
  const didMount = useRef(false);

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      prev.current = value;
      setText(formatCurrency(value, currency));
      return;
    }

    const from = prev.current;
    if (from === value) return;
    prev.current = value;

    const ctrl = animate(from, value, {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        setText(formatCurrency(v, currency));
      },
    });
    return () => ctrl.stop();
  }, [value, currency]);

  return <span className={className}>{text}</span>;
}
