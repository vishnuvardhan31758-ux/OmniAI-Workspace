import { DeviceControl, SystemCommand } from '../../types/assistant';

class DeviceController {
  private devices: DeviceControl[] = [];
  private isElectronApp = false;

  constructor() {
    this.checkElectronEnvironment();
    this.initializeDevices();
  }

  private checkElectronEnvironment() {
    // Check if running in Electron for native system access
    this.isElectronApp = typeof window !== 'undefined' && 
                        window.process && 
                        window.process.type === 'renderer';
  }

  private initializeDevices() {
    // Initialize default PC device
    this.devices.push({
      id: 'local-pc',
      name: 'Local PC',
      type: 'pc',
      status: 'online',
      capabilities: [
        'file-management',
        'application-control',
        'system-control',
        'media-control',
        'network-control'
      ],
      lastSeen: new Date().toISOString()
    });

    // Detect other devices (mock for web environment)
    this.detectDevices();
  }

  private async detectDevices() {
    // In a real implementation, this would scan for network devices
    // For now, we'll add some mock devices
    const mockDevices: DeviceControl[] = [
      {
        id: 'smartphone-1',
        name: 'Android Phone',
        type: 'mobile',
        status: 'online',
        capabilities: ['notifications', 'media-control', 'location'],
        lastSeen: new Date().toISOString()
      },
      {
        id: 'smart-tv-1',
        name: 'Smart TV',
        type: 'smart-home',
        status: 'offline',
        capabilities: ['media-control', 'volume-control', 'power-control'],
        lastSeen: new Date(Date.now() - 3600000).toISOString()
      }
    ];

    this.devices.push(...mockDevices);
  }

  getDevices(): DeviceControl[] {
    return this.devices;
  }

  getDevice(id: string): DeviceControl | undefined {
    return this.devices.find(device => device.id === id);
  }

  async executeSystemCommand(command: SystemCommand): Promise<{ success: boolean; result?: string; error?: string }> {
    try {
      if (this.isElectronApp) {
        return await this.executeNativeCommand(command);
      } else {
        return await this.executeWebCommand(command);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async executeNativeCommand(command: SystemCommand): Promise<{ success: boolean; result?: string }> {
    // This would use Electron's main process to execute system commands
    // For security, commands should be whitelisted and validated
    
    const { ipcRenderer } = window.require('electron');
    
    try {
      const result = await ipcRenderer.invoke('execute-system-command', command);
      return { success: true, result };
    } catch (error) {
      throw new Error(`Failed to execute native command: ${error}`);
    }
  }

  private async executeWebCommand(command: SystemCommand): Promise<{ success: boolean; result?: string }> {
    // Web-based commands (limited functionality)
    switch (command.category) {
      case 'media':
        return this.executeMediaCommand(command);
      case 'application':
        return this.executeApplicationCommand(command);
      case 'system':
        return this.executeWebSystemCommand(command);
      default:
        return {
          success: false,
          result: 'Command not supported in web environment. Install desktop app for full functionality.'
        };
    }
  }

  private async executeMediaCommand(command: SystemCommand): Promise<{ success: boolean; result?: string }> {
    switch (command.command) {
      case 'play-pause':
        // Use Media Session API if available
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 
            navigator.mediaSession.playbackState === 'playing' ? 'paused' : 'playing';
          return { success: true, result: 'Media playback toggled' };
        }
        break;
      case 'volume-up':
      case 'volume-down':
        return { success: false, result: 'Volume control requires desktop app' };
    }
    return { success: false, result: 'Media command not supported' };
  }

  private async executeApplicationCommand(command: SystemCommand): Promise<{ success: boolean; result?: string }> {
    switch (command.command) {
      case 'open-url':
        if (command.parameters?.url) {
          window.open(command.parameters.url, '_blank');
          return { success: true, result: `Opened ${command.parameters.url}` };
        }
        break;
      case 'open-application':
        // Limited to web applications
        const webApps: Record<string, string> = {
          'gmail': 'https://gmail.com',
          'youtube': 'https://youtube.com',
          'github': 'https://github.com',
          'calendar': 'https://calendar.google.com'
        };
        
        const appName = command.parameters?.name?.toLowerCase();
        if (appName && webApps[appName]) {
          window.open(webApps[appName], '_blank');
          return { success: true, result: `Opened ${appName}` };
        }
        break;
    }
    return { success: false, result: 'Application command requires desktop app' };
  }

  private async executeWebSystemCommand(command: SystemCommand): Promise<{ success: boolean; result?: string }> {
    switch (command.command) {
      case 'get-system-info':
        const info = {
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform,
          cookieEnabled: navigator.cookieEnabled,
          onLine: navigator.onLine
        };
        return { success: true, result: JSON.stringify(info, null, 2) };
      
      case 'get-battery-info':
        if ('getBattery' in navigator) {
          try {
            const battery = await (navigator as any).getBattery();
            const batteryInfo = {
              level: Math.round(battery.level * 100),
              charging: battery.charging,
              chargingTime: battery.chargingTime,
              dischargingTime: battery.dischargingTime
            };
            return { success: true, result: JSON.stringify(batteryInfo, null, 2) };
          } catch (error) {
            return { success: false, result: 'Battery API not supported' };
          }
        }
        break;
    }
    return { success: false, result: 'System command requires desktop app' };
  }

  async getSystemInfo(): Promise<Record<string, any>> {
    if (this.isElectronApp) {
      const { ipcRenderer } = window.require('electron');
      return await ipcRenderer.invoke('get-system-info');
    } else {
      return {
        platform: navigator.platform,
        userAgent: navigator.userAgent,
        language: navigator.language,
        onLine: navigator.onLine,
        cookieEnabled: navigator.cookieEnabled,
        hardwareConcurrency: navigator.hardwareConcurrency,
        maxTouchPoints: navigator.maxTouchPoints
      };
    }
  }
}

export const deviceController = new DeviceController();