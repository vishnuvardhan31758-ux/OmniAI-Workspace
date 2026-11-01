import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  Cpu, 
  HardDrive, 
  Wifi, 
  Battery, 
  Monitor, 
  Thermometer,
  Activity,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Globe,
  Smartphone
} from 'lucide-react';
import { deviceController } from '../../lib/system/device-controller';
import { translate, Language } from '../../lib/languages';

interface SystemMetrics {
  cpu: { usage: number; temperature?: number };
  memory: { used: number; total: number; percentage: number };
  disk: { used: number; total: number; percentage: number };
  network: { status: string; speed?: number };
  battery?: { level: number; charging: boolean };
  uptime?: number;
}

export function SystemMonitor() {
  const [language, setLanguage] = useState<Language>('en');
  const [systemInfo, setSystemInfo] = useState<Record<string, any>>({});
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: { usage: 0 },
    memory: { used: 0, total: 0, percentage: 0 },
    disk: { used: 0, total: 0, percentage: 0 },
    network: { status: 'unknown' }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadSystemInfo();
    loadMetrics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadMetrics();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadSystemInfo = async () => {
    try {
      const info = await deviceController.getSystemInfo();
      setSystemInfo(info);
    } catch (error) {
      console.error('Failed to load system info:', error);
    }
  };

  const loadMetrics = async () => {
    setIsLoading(true);
    try {
      // Simulate system metrics (in a real app, these would come from system APIs)
      const mockMetrics: SystemMetrics = {
        cpu: { 
          usage: Math.random() * 100,
          temperature: 45 + Math.random() * 20
        },
        memory: {
          used: 4.2 + Math.random() * 2,
          total: 16,
          percentage: 0
        },
        disk: {
          used: 250 + Math.random() * 50,
          total: 512,
          percentage: 0
        },
        network: {
          status: navigator.onLine ? 'connected' : 'disconnected',
          speed: Math.random() * 100
        },
        uptime: Math.floor(Math.random() * 86400) // Random uptime in seconds
      };

      // Calculate percentages
      mockMetrics.memory.percentage = (mockMetrics.memory.used / mockMetrics.memory.total) * 100;
      mockMetrics.disk.percentage = (mockMetrics.disk.used / mockMetrics.disk.total) * 100;

      // Try to get battery info if available
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          mockMetrics.battery = {
            level: Math.round(battery.level * 100),
            charging: battery.charging
          };
        } catch (error) {
          console.log('Battery API not available');
        }
      }

      setMetrics(mockMetrics);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusColor = (percentage: number): string => {
    if (percentage < 50) return 'text-green-600 bg-green-100';
    if (percentage < 80) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {translate('systemMonitor', language)}
          </h1>
          <p className="text-gray-600">Monitor your system performance and health</p>
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
            onClick={loadMetrics}
            variant="outline"
            icon={RefreshCw}
            disabled={isLoading}
            className={isLoading ? 'animate-spin' : ''}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* CPU Usage */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-900">{translate('cpuUsage', language)}</span>
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(metrics.cpu.usage)}`}>
              {Math.round(metrics.cpu.usage)}%
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(metrics.cpu.usage)}`}
              style={{ width: `${metrics.cpu.usage}%` }}
            />
          </div>
          
          {metrics.cpu.temperature && (
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <Thermometer className="w-4 h-4" />
              <span>{Math.round(metrics.cpu.temperature)}°C</span>
            </div>
          )}
        </Card>

        {/* Memory Usage */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-green-600" />
              <span className="font-medium text-gray-900">{translate('memoryUsage', language)}</span>
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(metrics.memory.percentage)}`}>
              {Math.round(metrics.memory.percentage)}%
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(metrics.memory.percentage)}`}
              style={{ width: `${metrics.memory.percentage}%` }}
            />
          </div>
          
          <div className="text-sm text-gray-600">
            {metrics.memory.used.toFixed(1)} GB / {metrics.memory.total} GB
          </div>
        </Card>

        {/* Disk Usage */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <HardDrive className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-gray-900">{translate('diskSpace', language)}</span>
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(metrics.disk.percentage)}`}>
              {Math.round(metrics.disk.percentage)}%
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(metrics.disk.percentage)}`}
              style={{ width: `${metrics.disk.percentage}%` }}
            />
          </div>
          
          <div className="text-sm text-gray-600">
            {Math.round(metrics.disk.used)} GB / {metrics.disk.total} GB
          </div>
        </Card>

        {/* Network Status */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Wifi className="w-5 h-5 text-orange-600" />
              <span className="font-medium text-gray-900">{translate('networkStatus', language)}</span>
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              metrics.network.status === 'connected' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
            }`}>
              {translate(metrics.network.status === 'connected' ? 'online' : 'offline', language)}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {metrics.network.status === 'connected' ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-500" />
            )}
            <span className="text-sm text-gray-600">
              {metrics.network.speed ? `${Math.round(metrics.network.speed)} Mbps` : 'No connection'}
            </span>
          </div>
        </Card>
      </div>

      {/* Detailed System Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Details */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">System Information</h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Monitor className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700">Platform</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {systemInfo.platform || 'Unknown'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700">Language</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {systemInfo.language || 'Unknown'}
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
            
            {metrics.uptime && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">Uptime</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {formatUptime(metrics.uptime)}
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Battery & Power */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Power Status</h2>
          
          {metrics.battery ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Battery className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-gray-900">Battery Level</span>
                </div>
                <span className="text-lg font-bold text-gray-900">
                  {metrics.battery.level}%
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${
                    metrics.battery.level > 20 ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${metrics.battery.level}%` }}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                {metrics.battery.charging ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                )}
                <span className="text-sm text-gray-600">
                  {metrics.battery.charging ? 'Charging' : 'On Battery'}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Battery className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Battery information not available</p>
              <p className="text-sm">This device may not have a battery or the API is not supported</p>
            </div>
          )}
        </Card>
      </div>

      {/* Status Footer */}
      <Card className="bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
          <span>Auto-refresh: Every 30 seconds</span>
        </div>
      </Card>
    </div>
  );
}