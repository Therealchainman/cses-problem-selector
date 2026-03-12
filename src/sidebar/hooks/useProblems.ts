import { useMemo } from 'react';
import { useStorage } from './useStorage';
import type { CsesData } from '../types';

const DEFAULT_DATA: CsesData = { problems: [], lastUpdated: 0, username: '' };

export function useProblems() {
  const [data] = useStorage<CsesData>('csesData', DEFAULT_DATA);

  const sections = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const p of data.problems) {
      if (!seen.has(p.section)) {
        seen.add(p.section);
        result.push(p.section);
      }
    }
    return result;
  }, [data.problems]);

  return {
    problems: data.problems,
    username: data.username,
    lastUpdated: data.lastUpdated,
    sections,
  };
}
