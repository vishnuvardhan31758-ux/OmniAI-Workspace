import React from 'react';
import { 
  Zap,
  FolderOpen, 
  History, 
  Heart,
  Settings,
  Monitor,
  Mic,
  Activity,
  Smartphone
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'assistant', label: 'AI Assistant', icon: Zap, badge: 'SMART' },
  { id: 'device-control', label: 'Device Control', icon: Monitor },
  { id: 'voice-commands', label: 'Voice Commands', icon: Mic },
  { id: 'system-monitor', label: 'System Monitor', icon: Activity },
];

const bottomItems = [
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'history', label: 'History', icon: History },
  { id: 'favorites', label: 'Favorites', icon: Heart },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">SmartAssist</h1>
            <p className="text-sm text-gray-500">Personal AI Assistant</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 py-6">
        <div className="px-3 mb-6">
          <h2 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Assistant
          </h2>
          <nav className="mt-3 space-y-1">
            {menuItems.map(({ id, label, icon: Icon, badge }) => (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className={`
                  w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
                  ${activeTab === id
                    ? 'bg-gradient-to-r from-primary-50 to-secondary-50 text-primary-700 border-r-2 border-primary-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-center">
                  <Icon className={`mr-3 h-5 w-5 ${activeTab === id ? 'text-primary-700' : 'text-gray-400'}`} />
                  {label}
                </div>
                {badge && (
                  <span className="px-2 py-1 text-xs font-bold bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-full">
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="px-3">
          <h2 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Workspace
          </h2>
          <nav className="mt-3 space-y-1">
            {bottomItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className={`
                  w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
                  ${activeTab === id
                    ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className={`mr-3 h-5 w-5 ${activeTab === id ? 'text-primary-700' : 'text-gray-400'}`} />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <p className="text-sm font-medium text-gray-900">SmartAssist</p>
          <p className="text-xs text-gray-500">Your intelligent companion</p>
        </div>
      </div>
    </div>
  );
}