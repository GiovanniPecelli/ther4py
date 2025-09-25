import React from 'react';
import { Home, BarChart3 } from 'lucide-react'; // <--- aggiungi anche BarChart3

const Navbar = ({ currentView, setCurrentView }) => {
  return (
    <nav className="navbar">
      <div className="container">
        <div className="nav-content">
          <div className="nav-brand">
            <h1 className="nav-title">Ther4py</h1>
          </div>
          
          <div className="nav-buttons">
            <button
              onClick={() => setCurrentView('home')}
              className={`nav-button ${currentView === 'home' ? 'active' : ''}`}
              aria-label="Home"
            >
              <Home size={20} />
            </button>

            <button
              onClick={() => setCurrentView('statistics')}
              className={`nav-button ${currentView === 'statistics' ? 'active' : ''}`}
              aria-label="Statistics"
            >
              <BarChart3 size={20} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;