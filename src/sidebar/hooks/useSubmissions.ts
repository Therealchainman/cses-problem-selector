import { useStorage } from './useStorage';
import type { CsesSubmissions } from '../types';

const DEFAULT: CsesSubmissions = { entries: [] };

export function useSubmissions() {
  const [data] = useStorage<CsesSubmissions>('csesSubmissions', DEFAULT);
  return { submissions: data.entries.slice(0, 10) };
}
