import "./styles/Header.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import { Link, NavLink } from "react-router";

const Header = () => {
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
    </header>
  );
};

export default Header;
