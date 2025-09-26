import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Import useNavigate and useLocation

// Define the structure for navigation items
interface NavItem {
  name: string;
  path: string;
}

// List of navigation items - easily changeable here
const navItems: NavItem[] = [
  { name: 'Home', path: '/' },
  // { name: 'About', path: '/about' },
  { name: 'Services', path: '/services' },
  // { name: 'Contact', path: '/contact' },
  { name: 'Login', path: '/auth/login'}
];

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate(); // Initialize useNavigate hook
  const location = useLocation(); // Initialize useLocation hook to get current path

  // Function to toggle the mobile menu's open/close state
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Function to handle navigation and close the mobile menu
  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false); // Close the mobile menu after navigation
  };

  return (
    <nav className="bg-green-800 p-4 shadow-lg font-inter mb-auto">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo/Brand Name */}
        <div className="text-gray-100 text-2xl font-bold rounded-md px-2 py-1">
          <button onClick={() => handleNavigation('/')} className="hover:text-gray-400 transition-colors duration-300 focus:outline-none">
            EE Tutors
          </button>
        </div>

        {/* Mobile menu button (hamburger icon) */}
        <div className="md:hidden">
          <button
            onClick={toggleMenu}
            className="text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-md p-2 transition-colors duration-300"
            aria-label="Toggle navigation"
          >
            {isOpen ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                ></path>
              </svg>
            )}
          </button>
        </div>

        {/* Desktop navigation links */}
        <div className="hidden md:flex space-x-8">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => handleNavigation(item.path)}
              // Conditionally apply active class based on current path
              className={`
                text-gray-100 hover:text-gray-400 hover:border-b hover:border-gray-400
                transition-colors duration-300 text-lg px-3 py-2
                ${location.pathname === item.path ? 'border-b-2 border-gray-100' : ''}
              `}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile navigation links (conditionally rendered) */}
      {isOpen && (
        <div className="md:hidden mt-4 bg-green-700 rounded-lg shadow-inner">
          <div className="flex flex-col space-y-2 p-4">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.path)}
                // Conditionally apply active class for mobile menu
                className={`
                  block text-gray-300 hover:bg-green-600 px-4 py-2 rounded-md
                  transition-colors duration-300 text-left w-full
                  ${location.pathname === item.path ? 'bg-green-600 font-semibold' : ''}
                `}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
