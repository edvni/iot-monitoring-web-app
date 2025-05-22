import '../styles/Header.css'
import { secureAuth } from '../utils/auth';

const LogoutButton = () => {
    const handleLogout = async () => {
        await secureAuth.logout(); // Clear authentication state
    };

  return (
    <button
      className="logout-button"
      onClick={handleLogout}>Logout</button>
  );
}

export default LogoutButton;