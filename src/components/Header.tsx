import LogoutButton from "./LogoutButton";
import '../styles/Header.css';

function Header () {
  return (
    <header className="app-header">
      <h1 className="app-title">RuuviTag sensor data</h1>
      <div className="header-buttons">
        <LogoutButton />
      </div>
    </header>
  );
}

export default Header;