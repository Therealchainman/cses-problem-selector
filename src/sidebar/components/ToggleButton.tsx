interface Props {
  isOpen: boolean;
  onClick: () => void;
}

export default function ToggleButton({ isOpen, onClick }: Props) {
  return (
    <button
      className={`toggle-btn ${isOpen ? 'toggle-btn-open' : ''}`}
      onClick={onClick}
      title={isOpen ? 'Close sidebar' : 'Open CSES Finder'}
    >
      <span className="toggle-btn-text">CSES</span>
      <span className="toggle-btn-arrow">{isOpen ? '\u25B6' : '\u25C0'}</span>
    </button>
  );
}
