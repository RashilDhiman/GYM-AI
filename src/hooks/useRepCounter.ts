import { useRef } from 'react';
import type { RepPhase } from '../types/gym';

export function useRepCounter(onRep: () => void) {
  const lastPhaseRef = useRef<RepPhase>('neutral');

  const updateRepPhase = (phase: RepPhase) => {
    const prev = lastPhaseRef.current;
    if (prev === 'down' && phase === 'up') {
      onRep();
    }
    lastPhaseRef.current = phase;
  };

  return { updateRepPhase };
}

