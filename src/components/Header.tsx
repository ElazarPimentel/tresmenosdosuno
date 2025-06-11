import Link from 'next/link';

interface HeaderProps {
  onToggleDarkMode: () => void;
  isDarkMode: boolean;
}

export default function Header({ onToggleDarkMode, isDarkMode }: HeaderProps) {
  return (
    <header className="header">
      <div className="container">
        <nav className="nav">
          <div className="nav__logo">
            <Link href="/" className="header__logo">
              3-2.1
            </Link>
          </div>

          <button 
            type="button"
            className="nav__theme-toggle"
            onClick={onToggleDarkMode}
            aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </nav>
      </div>
    </header>
  );
} 