import "./styles/Header.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { useState } from "react";

import { Link, NavLink } from "react-router";

const Header = () => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="header">
      <div className="navbar">
        <NavLink className="logo" to="/">
          BINGE
        </NavLink>

        <nav className="nav-links">
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/movies">Movies</Link>
            </li>
            <li>
              <Link to="/TV-Shows">TV Shows</Link>
            </li>
            <li>
              <Link to="/New-Releases">New Releases</Link>
            </li>
          </ul>
        </nav>

        <div className="search">
          <i className="bi bi-search"></i>
          <input type="text" placeholder="Search..." />
        </div>
      </div>

      {/* Mobile Hamburger Toggle */}
      <button
        className="mobile-menu-btn"
        onClick={toggleMobileMenu}
        aria-label="Toggle navigation menu"
      >
        <i className={`bi ${isMobileMenuOpen ? "bi-x-lg" : "bi-list"}`}></i>
      </button>

      {/* Mobile Navigation Overlay */}
      <div className={`mobile-menu ${isMobileMenuOpen ? "open" : ""}`}>
        <nav className="mobile-nav-links">
          <ul>
            <li>
              <Link to="/" onClick={closeMobileMenu}>
                Home
              </Link>
            </li>
            <li>
              <Link to="/movies" onClick={closeMobileMenu}>
                Movies
              </Link>
            </li>
            <li>
              <Link to="/TV-Shows" onClick={closeMobileMenu}>
                TV Shows
              </Link>
            </li>
            <li>
              <Link to="/New-Releases" onClick={closeMobileMenu}>
                New Releases
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
