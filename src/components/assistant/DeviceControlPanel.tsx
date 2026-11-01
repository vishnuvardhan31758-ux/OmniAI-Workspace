import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Monitor, Smartphone, Tv, Wifi, WifiOff, Power, Volume2, VolumeX, Copyright as Brightness, Settings, RefreshCw, Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import { deviceController } from '../../lib/system/device-controller';
import { translate, Language } from '../../lib/languages';
import { DeviceControl, SystemCommand } from '../../types/assistant';

export function DeviceControlPanel() {
  const [language, setLanguage] = useState<Language>('en');
  const [devices, setDevices] = useState<DeviceControl[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    const deviceList = deviceController.getDevices();
    setDevices(deviceList);
    if (deviceList.length > 0 && !selectedDevice) {
      setSelectedDevice(deviceList[0].id);
    }
  };

  const executeCommand = async (command: SystemCommand) => {
    setIsExecuting(true);
    try {
      const result = await deviceController.executeSystemCommand(command);
      if (result.success) {
        console.log('Command executed successfully:', result.result);
      } else {
        console.error('Command failed:', result.error);
      }
    } catch (error) {
      console.error('Error executing command:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const getDeviceIcon = (type: DeviceControl['type']) => {
    switch (type) {
      case 'pc': return Monitor;
      case 'mobile': return Smartphone;
      case 'smart-home': return Tv;
      default: return Monitor;
    }
  };

  const systemControls = [
    {
      id: 'shutdown',
      label: translate('systemShutdown', language),
      icon: Power,
      command: 'system-shutdown',
      category: 'system' as const,
      color: 'bg-red-500 hover:bg-red-600'
    },
    {
      id: 'restart',
      label: translate('systemRestart', language),
      icon: RefreshCw,
      command: 'system-restart',
      category: 'system' as const,
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      id: 'volume-up',
      label: 'Volume Up',
      icon: Volume2,
      command: 'volume-up',
      category: 'media' as const,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      id: 'volume-down',
      label: 'Volume Down',
      icon: VolumeX,
      command: 'volume-down',
      category: 'media' as const,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      id: 'brightness-up',
      label: 'Brightness Up',
      icon: Brightness,
      command: 'brightness-up',
      category: 'system' as const,
      color: 'bg-yellow-500 hover:bg-yellow-600'
    },
    {
      id: 'brightness-down',
      label: 'Brightness Down',
      icon: Brightness,
      command: 'brightness-down',
      category: 'system' as const,
      color: 'bg-yellow-500 hover:bg-yellow-600'
    }
  ];

  const mediaControls = [
    {
      id: 'play-pause',
      label: 'Play/Pause',
      icon: Play,
      command: 'play-pause',
      category: 'media' as const
    },
    {
      id: 'previous',
      label: 'Previous',
      icon: SkipBack,
      command: 'media-previous',
      category: 'media' as const
    },
    {
      id: 'next',
      label: 'Next',
      icon: SkipForward,
      command: 'media-next',
      category: 'media' as const
    }
  ];

  const selectedDeviceData = devices.find(d => d.id === selectedDevice);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {translate('deviceControl', language)}
          </h1>
          <p className="text-gray-600">Control your devices and system settings</p>
        </div>
        
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="en">English</option>
          <option value="te">తెలుగు</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device Selection */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {translate('connectedDevices', language)}
          </h2>
          
          <div className="space-y-3">
            {devices.map((device) => {
              const Icon = getDeviceIcon(device.type);
              const isSelected = device.id === selectedDevice;
              
              return (
                <button
                  key={device.id}
                  onClick={() => setSelectedDevice(device.id)}
                  className={`w-full p-3 border-2 rounded-lg transition-all duration-200 text-left ${
                    isSelected 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-primary-600' : 'text-gray-600'}`} />
                    <div className="flex-1">
                      <p className={`font-medium ${isSelected ? 'text-primary-900' : 'text-gray-900'}`}>
                        {device.name}
                      </p>
                      <p className="text-sm text-gray-500">{device.type}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {device.status === 'online' ? (
                        <Wifi className="w-4 h-4 text-green-500" />
                      ) : (
                        <WifiOff className="w-4 h-4 text-gray-400" />
                      )}
                      <span className={`w-2 h-2 rounded-full ${
                        device.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* System Controls */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {translate('systemControls', language)}
          </h2>
          
          <div className="grid grid-cols-2 gap-3">
            {systemControls.map((control) => {
              const Icon = control.icon;
              return (
                <button
                  key={control.id}
                  onClick={() => executeCommand({
                    id: Date.now().toString(),
                    command: control.command,
                    description: control.label,
                    category: control.category
                  })}
                  disabled={isExecuting || !selectedDeviceData || selectedDeviceData.status !== 'online'}
                  className={`p-4 rounded-lg text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                    control.color || 'bg-primary-500 hover:bg-primary-600'
                  }`}
                >
                  <Icon className="w-5 h-5 mx-auto mb-2" />
                  <span className="text-sm">{control.label}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Media Controls */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Media Controls</h2>
          
          <div className="space-y-3">
            {mediaControls.map((control) => {
              const Icon = control.icon;
              return (
                <button
                  key={control.id}
                  onClick={() => executeCommand({
                    id: Date.now().toString(),
                    command: control.command,
                    description: control.label,
                    category: control.category
                  })}
                  disabled={isExecuting || !selectedDeviceData || selectedDeviceData.status !== 'online'}
                  className="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3"
                >
                  <Icon className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-900">{control.label}</span>
                </button>
              );
            })}
          </div>

          {/* Device Capabilities */}
          {selectedDeviceData && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Device Capabilities</h3>
              <div className="flex flex-wrap gap-2">
                {selectedDeviceData.capabilities.map((capability) => (
                  <span
                    key={capability}
                    className="px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded-full"
                  >
                    {capability.replace('-', ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Status Bar */}
      <Card className="bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                selectedDeviceData?.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
              }`} />
              <span className="text-sm font-medium text-gray-700">
                {selectedDeviceData ? selectedDeviceData.name : 'No device selected'}
              </span>
            </div>
            
            {selectedDeviceData && (
              <span className="text-sm text-gray-500">
                Last seen: {new Date(selectedDeviceData.lastSeen).toLocaleTimeString()}
              </span>
            )}
          </div>
          
          <Button
            onClick={loadDevices}
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            disabled={isExecuting}
          >
            Refresh
          </Button>
        </div>
      </Card>
    </div>
  );
}