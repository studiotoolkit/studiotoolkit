import { NavLink } from "react-router-dom";
import "./Header.css";
import { useTheme } from "../ThemeContext";
import { useState, useRef, useEffect } from "react";

export default function Header() {
  const { isDark: dark, setIsDark } = useTheme();
  const setDark = (fn: boolean | ((prev: boolean) => boolean)) => setIsDark(fn);
  const [helpOpen, setHelpOpen] = useState(false);
  const helpRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) {
        setHelpOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="header">
      <div className="header-container">
        <NavLink to="/" className="header-logo-link">
          <img
            src="/studio-toolkit-logo.png"
            alt="Studio Toolkit"
            className="header-logo-img"
          />
          <span className="header-version">v1.0</span>
        </NavLink>

        <nav className="header-nav">
          {/* Demo — solo */}
          <div className="nav-group">
            <NavLink to="/demo-all">Demo</NavLink>
          </div>

          {/* Build tools */}
          <div className="nav-group">
            <NavLink to="/build-color-wheel">Color Wheel</NavLink>
            <NavLink to="/build-color-from-image">Color From Image</NavLink>
            <NavLink to="/build-palette-generator">Palette Generator</NavLink>
            <NavLink to="/build-color-palette">Color Palette</NavLink>
          </div>

          {/* Help dropdown */}
          <div className="nav-group nav-group--help" ref={helpRef}>
            <button
              className={`help-trigger${helpOpen ? " help-trigger--open" : ""}`}
              onClick={() => setHelpOpen((v) => !v)}
              aria-haspopup="true"
              aria-expanded={helpOpen}
            >
              Help
              <svg
                className="help-chevron"
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {helpOpen && (
              <div className="help-dropdown" role="menu">
                <NavLink
                  to="/color-palettes"
                  role="menuitem"
                  onClick={() => setHelpOpen(false)}
                >
                  Color Palettes
                </NavLink>
                <NavLink
                  to="/60-30-10"
                  role="menuitem"
                  onClick={() => setHelpOpen(false)}
                >
                  60-30-10
                </NavLink>
                <NavLink
                  to="/color-from-image-help"
                  role="menuitem"
                  onClick={() => setHelpOpen(false)}
                >
                  Color From Image
                </NavLink>
                <NavLink
                  to="/radium-help"
                  role="menuitem"
                  onClick={() => setHelpOpen(false)}
                >
                  Radium Colors
                </NavLink>
              </div>
            )}
          </div>
        </nav>

        <div className="header-actions">
          <a
            href="https://github.com/studiotoolkit"
            target="_blank"
            rel="noopener noreferrer"
            className="header-icon-btn"
            aria-label="GitHub"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.468-2.382 1.236-3.22-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.3 1.23a11.52 11.52 0 0 1 3.003-.404c1.02.005 2.047.138 3.003.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.652.242 2.873.118 3.176.77.838 1.235 1.91 1.235 3.22 0 4.61-2.804 5.625-5.476 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.694.825.576C20.565 21.796 24 17.298 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>
          <button
            className="header-icon-btn"
            aria-label="Toggle theme"
            onClick={() => setDark((d: boolean) => !d)}
          >
            {dark ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 4.354a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 12 4.354zm0 13a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75zm7.196-9.446a.75.75 0 0 1 0 1.06l-1.06 1.062a.75.75 0 1 1-1.062-1.061l1.061-1.061a.75.75 0 0 1 1.061 0zm-12.728 9.9a.75.75 0 0 1 0 1.061l-1.06 1.06a.75.75 0 0 1-1.062-1.06l1.061-1.061a.75.75 0 0 1 1.061 0zM20.25 12a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5H19.5a.75.75 0 0 1 .75.75zm-13 0a.75.75 0 0 1-.75.75H5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 7.25 12zm11.136 5.196a.75.75 0 0 1-1.061 0l-1.061-1.06a.75.75 0 1 1 1.06-1.062l1.062 1.061a.75.75 0 0 1 0 1.061zM6.025 6.025a.75.75 0 0 1 0 1.06L4.964 8.147a.75.75 0 0 1-1.06-1.061l1.06-1.061a.75.75 0 0 1 1.061 0zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M21.752 15.002A9.718 9.718 0 0 1 18 15.75 9.75 9.75 0 0 1 8.25 6a9.72 9.72 0 0 1 .248-2.252A9.75 9.75 0 1 0 21.752 15z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
