import { useEffect } from 'react';
import { useStorage } from './hooks/useStorage';
import ToggleButton from './components/ToggleButton';
import Sidebar from './components/Sidebar';

export default function App() {
  const [isOpen, setIsOpen] = useStorage('csesSidebarOpen', false);

  useEffect(() => {
    document.documentElement.style.marginRight = '';
    return () => {
      document.documentElement.style.marginRight = '';
    };
  }, []);

  return (
    <>
      <ToggleButton isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
      {isOpen && <Sidebar />}
    </>
  );
}
