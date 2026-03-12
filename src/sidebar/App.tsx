import { useCallback } from 'react';
import { useStorage } from './hooks/useStorage';
import ToggleButton from './components/ToggleButton';
import Sidebar from './components/Sidebar';

export default function App() {
  const [isOpen, setIsOpen] = useStorage('csesSidebarOpen', false);

  const toggle = useCallback(() => {
    const next = !isOpen;
    setIsOpen(next);
    // Shift page content
    document.documentElement.style.marginRight = next ? '320px' : '';
  }, [isOpen, setIsOpen]);

  return (
    <>
      <ToggleButton isOpen={isOpen} onClick={toggle} />
      {isOpen && <Sidebar />}
    </>
  );
}
