import { useInView, useMotionValue, useSpring } from 'motion/react';
import { useCallback, useEffect, useRef } from 'react';

export default function CountUp({
  to = 0,
  from = 0,
  direction = 'up',
  delay = 0,
  duration = 2,
  className = '',
  startWhen = true,
  separator = '',
  onStart,
  onEnd
}) {
  const ref = useRef(null);

  // always numeric, never undefined
  const startValue = typeof from === 'number' && !isNaN(from) ? from : 0;
  const endValue = typeof to === 'number' && !isNaN(to) ? to : 0;

  const motionValue = useMotionValue(direction === 'down' ? endValue : startValue);

  const damping = 20 + 40 * (1 / duration);
  const stiffness = 100 * (1 / duration);
  const springValue = useSpring(motionValue, { damping, stiffness });

  const isInView = useInView(ref, { once: true, margin: '0px' });

  const getDecimalPlaces = (num) => {
    if (num == null || isNaN(num)) return 0;        // ✅ guard
    const str = Number(num).toString();
    if (str.includes('.')) {
      const decimals = str.split('.')[1];
      if (parseInt(decimals) !== 0) return decimals.length;
    }
    return 0;
  };

  const maxDecimals = Math.max(
    getDecimalPlaces(startValue),
    getDecimalPlaces(endValue)
  );

  const formatValue = useCallback(
    (latest) => {
      const hasDecimals = maxDecimals > 0;
      const options = {
        useGrouping: !!separator,
        minimumFractionDigits: hasDecimals ? maxDecimals : 0,
        maximumFractionDigits: hasDecimals ? maxDecimals : 0,
      };
      const formatted = Intl.NumberFormat('en-US', options).format(latest);
      return separator ? formatted.replace(/,/g, separator) : formatted;
    },
    [maxDecimals, separator]
  );

  // initial display
  useEffect(() => {
    if (ref.current) {
      ref.current.textContent = formatValue(direction === 'down' ? endValue : startValue);
    }
  }, [startValue, endValue, direction, formatValue]);

  // animate when visible
  useEffect(() => {
    if (isInView && startWhen) {
      onStart?.();
      const startTimer = setTimeout(() => {
        motionValue.set(direction === 'down' ? startValue : endValue);
      }, delay * 1000);

      const endTimer = setTimeout(() => onEnd?.(), delay * 1000 + duration * 1000);

      return () => {
        clearTimeout(startTimer);
        clearTimeout(endTimer);
      };
    }
  }, [isInView, startWhen, motionValue, direction, startValue, endValue, delay, onStart, onEnd, duration]);

  // update DOM on spring change
  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      if (ref.current) ref.current.textContent = formatValue(latest);
    });
    return unsubscribe;
  }, [springValue, formatValue]);

  return <span className={className} ref={ref} />;
}
