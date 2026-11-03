import React, { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { AssistantDashboard } from './components/assistant/AssistantDashboard';
import { DeviceControlPanel } from './components/assistant/DeviceControlPanel';
import { VoiceCommandsPanel } from './components/assistant/VoiceCommandsPanel';
import { SystemMonitor } from './components/assistant/SystemMonitor';
import { Projects } from './components/workspace/Projects';
import { History } from './components/workspace/History';
import { SettingsPanel } from './components/auth/SettingsPanel';

function App() {
  const [activeTab, setActiveTab] = useState('assistant');
  const [showSettings, setShowSettings] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'assistant':
        return <AssistantDashboard />;
      case 'device-control':
        return <DeviceControlPanel />;
      case 'voice-commands':
        return <VoiceCommandsPanel />;
      case 'system-monitor':
        return <SystemMonitor />;
      case 'projects':
        return <Projects />;
      case 'history':
        return <History />;
      case 'favorites':
        return <History />;
      case 'settings':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <SettingsPanel onClose={() => setShowSettings(false)} />
          </div>
        );
      default:
        return <AssistantDashboard />;
    }
  };

  return (
    <Router>
      <div className="flex h-screen bg-gray-50">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 overflow-auto">
          <div className="p-8">{renderContent()}</div>
        </main>
        {showSettings && (
          <SettingsPanel onClose={() => setShowSettings(false)} />
        )}
      </div>
    </Router>
  );
}

export default App;