import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Mic, MicOff, Monitor, Smartphone, Tv, Cpu, HardDrive, Wifi, Battery, Volume2, Copyright as Brightness, Power, Settings, Globe, MessageSquare, Zap } from 'lucide-react';
import { deviceController } from '../../lib/system/device-controller';
import { speechRecognition } from '../../lib/voice/speech-recognition';
import { translate, Language } from '../../lib/languages';
import { DeviceControl, VoiceCommand, SystemCommand } from '../../types/assistant';

export function AssistantDashboard() {
  const [language, setLanguage] = useState<Language>('en');
  const [devices, setDevices] = useState<DeviceControl[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null);
  const [systemInfo, setSystemInfo] = useState<Record<string, any>>({});
  const [assistantInput, setAssistantInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);

  useEffect(() => {
    loadDevices();
    loadSystemInfo();
    speechRecognition.setLanguage(language);
  }, [language]);

  const loadDevices = async () => {
    const deviceList = deviceController.getDevices();
    setDevices(deviceList);
  };

  const loadSystemInfo = async () => {
    const info = await deviceController.getSystemInfo();
    setSystemInfo(info);
  };

  const handleVoiceInput = async () => {
    if (!speechRecognition.isSupported()) {
      alert(translate('voiceInput', language) + ' not supported');
      return;
    }

    if (isListening) {
      speechRecognition.stopListening();
      setIsListening(false);
      return;
    }

    try {
      setIsListening(true);
      const command = await speechRecognition.startListening();
      setIsListening(false);
      
      if (command) {
        setLastCommand(command);
        await executeVoiceCommand(command);
      }
    } catch (error) {
      setIsListening(false);
      console.error('Voice recognition error:', error);
    }
  };

  const executeVoiceCommand = async (voiceCommand: VoiceCommand) => {
    const systemCommand: SystemCommand = {
      id: Date.now().toString(),
      command: voiceCommand.action,
      description: voiceCommand.phrase,
      category: getCommandCategory(voiceCommand.action),
      parameters: parseCommandParameters(voiceCommand.phrase)
    };

    const result = await deviceController.executeSystemCommand(systemCommand);
    
    if (result.success) {
      setCommandHistory(prev => [...prev, `✓ ${voiceCommand.phrase}`]);
    } else {
      setCommandHistory(prev => [...prev, `✗ ${voiceCommand.phrase}: ${result.error}`]);
    }
  };

  const getCommandCategory = (action: string): SystemCommand['category'] => {
    if (action.includes('media')) return 'media';
    if (action.includes('volume') || action.includes('brightness')) return 'system';
    if (action.includes('open') || action.includes('close')) return 'application';
    if (action.includes('shutdown') || action.includes('restart')) return 'system';
    return 'system';
  };

  const parseCommandParameters = (phrase: string): Record<string, any> => {
    const params: Record<string, any> = {};
    
    // Extract application names
    const appMatch = phrase.match(/open\s+(\w+)/i) || phrase.match(/తెరవండి\s+(\w+)/i);
    if (appMatch) {
      params.name = appMatch[1];
    }

    return params;
  };

  const handleTextCommand = async () => {
    if (!assistantInput.trim()) return;

    const voiceCommand: VoiceCommand = {
      id: Date.now().toString(),
      phrase: assistantInput,
      language,
      action: speechRecognition['parseCommand'](assistantInput),
      confidence: 1.0,
      timestamp: new Date().toISOString()
    };

    await executeVoiceCommand(voiceCommand);
    setAssistantInput('');
  };

  const getDeviceIcon = (type: DeviceControl['type']) => {
    switch (type) {
      case 'pc': return Monitor;
      case 'mobile': return Smartphone;
      case 'smart-home': return Tv;
      default: return Monitor;
    }
  };

  const getStatusColor = (status: DeviceControl['status']) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-100';
      case 'offline': return 'text-gray-600 bg-gray-100';
      case 'busy': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const quickActions = [
    { 
      id: 'volume-up', 
      icon: Volume2, 
      label: translate('volumeControl', language),
      command: 'volume-up'
    },
    { 
      id: 'brightness-up', 
      icon: Brightness, 
      label: translate('brightnessControl', language),
      command: 'brightness-up'
    },
    { 
      id: 'system-info', 
      icon: Cpu, 
      label: translate('systemMonitor', language),
      command: 'get-system-info'
    },
    { 
      id: 'shutdown', 
      icon: Power, 
      label: translate('systemShutdown', language),
      command: 'system-shutdown'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <Zap className="w-8 h-8 text-primary-600" />
            <span>{translate('assistantTitle', language)}</span>
          </h1>
          <p className="text-gray-600">{translate('assistantSubtitle', language)}</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="en">English</option>
            <option value="te">తెలుగు</option>
          </select>
          
          <Button
            onClick={handleVoiceInput}
            variant={isListening ? 'secondary' : 'primary'}
            icon={isListening ? MicOff : Mic}
            className={isListening ? 'animate-pulse' : ''}
          >
            {isListening ? translate('listening', language) : translate('voiceInput', language)}
          </Button>
        </div>
      </div>

      {/* Voice Command Status */}
      {lastCommand && (
        <Card className="border-primary-200 bg-primary-50">
          <div className="flex items-center space-x-3">
            <MessageSquare className="w-5 h-5 text-primary-600" />
            <div>
              <p className="font-medium text-primary-900">
                {translate('commandExecuted', language)}
              </p>
              <p className="text-sm text-primary-700">
                "{lastCommand.phrase}" (Confidence: {Math.round(lastCommand.confidence * 100)}%)
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Assistant Input */}
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {translate('askAssistant', language)}
            </h2>
            
            <div className="space-y-4">
              <div className="flex space-x-3">
                <Input
                  placeholder={translate('askAssistant', language)}
                  value={assistantInput}
                  onChange={setAssistantInput}
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && handleTextCommand()}
                />
                <Button
                  onClick={handleTextCommand}
                  disabled={!assistantInput.trim()}
                >
                  {translate('executeCommand', language)}
                </Button>
              </div>

              {/* Command History */}
              {commandHistory.length > 0 && (
                <div className="max-h-32 overflow-y-auto bg-gray-50 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Commands:</h4>
                  {commandHistory.slice(-5).map((cmd, index) => (
                    <div key={index} className="text-sm text-gray-600 py-1">
                      {cmd}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {translate('quickActions', language)}
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => {
                      const cmd: VoiceCommand = {
                        id: Date.now().toString(),
                        phrase: action.label,
                        language,
                        action: action.command,
                        confidence: 1.0,
                        timestamp: new Date().toISOString()
                      };
                      executeVoiceCommand(cmd);
                    }}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-center"
                  >
                    <Icon className="w-6 h-6 mx-auto mb-2 text-primary-600" />
                    <span className="text-sm font-medium text-gray-700">{action.label}</span>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Device Control & System Info */}
        <div className="space-y-6">
          {/* Connected Devices */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {translate('connectedDevices', language)}
            </h2>
            
            <div className="space-y-3">
              {devices.map((device) => {
                const Icon = getDeviceIcon(device.type);
                return (
                  <div key={device.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">{device.name}</p>
                        <p className="text-sm text-gray-500">{device.type}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(device.status)}`}>
                      {translate(device.status, language)}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* System Monitor */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {translate('systemMonitor', language)}
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">Platform</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {systemInfo.platform || 'Unknown'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Wifi className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">{translate('networkStatus', language)}</span>
                </div>
                <span className={`text-sm font-medium ${systemInfo.onLine ? 'text-green-600' : 'text-red-600'}`}>
                  {systemInfo.onLine ? translate('online', language) : translate('offline', language)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Cpu className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">CPU Cores</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {systemInfo.hardwareConcurrency || 'N/A'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}