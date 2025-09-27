import React from 'react';
import logo from '../logo.png'; 

// Placeholder for icons - can be simple text or SVG if needed for B&W theme
const NewChatIcon = () => '+'; // Example for B&W

const Sidebar = ({ currentView, onNavigate, onNewComparison }) => {
    const navItems = [
        { id: 'chat', label: 'New Comparison', icon: 'C' },
        { id: 'history', label: 'History', icon: 'H' },
        { id: 'settings', label: 'Settings', icon: 'S' },
    ];

    const handleMenuClick = (viewId) => {
        if (viewId === 'chat') {
            onNewComparison(); 
        } else {
            onNavigate(viewId);
        }
    };

    return (
        <div className="w-64 bg-gray-900 text-white flex flex-col h-screen fixed shadow-2xl">
            <div className="p-5 border-b border-gray-800 flex items-center space-x-3">
                <img src={logo} alt="SmartCompare Logo" className="h-10 w-auto" />
                <div>
                    <h1 className="text-xl font-bold text-white">SmartCompare</h1>
                </div>
            </div>
            <nav className="flex-grow p-3 space-y-2">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => handleMenuClick(item.id)}
                        className={`w-full flex items-center space-x-4 px-4 py-3 rounded-lg transition-all duration-200 ease-in-out
                                    ${currentView === item.id 
                                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg' 
                                        : 'hover:bg-gray-800 hover:text-white'}`
                                    }
                    >
                        <span className="text-xl font-bold">{item.icon}</span> 
                        <span className="font-semibold">{item.label}</span>
                    </button>
                ))}
            </nav>
            <div className="p-4 border-t border-gray-700 text-center">
                <p className="text-xs text-gray-500">
                    &copy; {new Date().getFullYear()} SmartCompare
                </p>
            </div>
        </div>
    );
};

export default Sidebar; 