export const languages = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    deviceControl: 'Device Control',
    automation: 'Automation',
    voiceCommands: 'Voice Commands',
    systemMonitor: 'System Monitor',
    settings: 'Settings',
    
    // Assistant
    assistantTitle: 'Personal AI Assistant',
    assistantSubtitle: 'Your intelligent companion for PC and device control',
    askAssistant: 'Ask your assistant...',
    voiceInput: 'Voice Input',
    executeCommand: 'Execute Command',
    
    // Device Control
    connectedDevices: 'Connected Devices',
    deviceStatus: 'Device Status',
    systemControls: 'System Controls',
    quickActions: 'Quick Actions',
    
    // Commands
    openApplication: 'Open Application',
    closeApplication: 'Close Application',
    systemShutdown: 'Shutdown System',
    systemRestart: 'Restart System',
    volumeControl: 'Volume Control',
    brightnessControl: 'Brightness Control',
    
    // Status
    online: 'Online',
    offline: 'Offline',
    busy: 'Busy',
    connected: 'Connected',
    disconnected: 'Disconnected',
    
    // Actions
    execute: 'Execute',
    cancel: 'Cancel',
    retry: 'Retry',
    configure: 'Configure',
    enable: 'Enable',
    disable: 'Disable',
    
    // System
    cpuUsage: 'CPU Usage',
    memoryUsage: 'Memory Usage',
    diskSpace: 'Disk Space',
    networkStatus: 'Network Status',
    
    // Voice Commands
    listening: 'Listening...',
    processing: 'Processing...',
    commandExecuted: 'Command Executed',
    commandFailed: 'Command Failed',
  },
  
  te: {
    // Navigation
    dashboard: 'డాష్‌బోర్డ్',
    deviceControl: 'పరికర నియంత్రణ',
    automation: 'స్వయంచాలకం',
    voiceCommands: 'వాయిస్ కమాండ్‌లు',
    systemMonitor: 'సిస్టమ్ మానిటర్',
    settings: 'సెట్టింగ్‌లు',
    
    // Assistant
    assistantTitle: 'వ్యక్తిగత AI సహాయకుడు',
    assistantSubtitle: 'మీ PC మరియు పరికర నియంత్రణ కోసం తెలివైన సహాయకుడు',
    askAssistant: 'మీ సహాయకుడిని అడగండి...',
    voiceInput: 'వాయిస్ ఇన్‌పుట్',
    executeCommand: 'కమాండ్ అమలు చేయండి',
    
    // Device Control
    connectedDevices: 'కనెక్ట్ చేయబడిన పరికరాలు',
    deviceStatus: 'పరికర స్థితి',
    systemControls: 'సిస్టమ్ నియంత్రణలు',
    quickActions: 'త్వరిత చర్యలు',
    
    // Commands
    openApplication: 'అప్లికేషన్ తెరవండి',
    closeApplication: 'అప్లికేషన్ మూసివేయండి',
    systemShutdown: 'సిస్టమ్ షట్‌డౌన్',
    systemRestart: 'సిస్టమ్ రీస్టార్ట్',
    volumeControl: 'వాల్యూమ్ నియంత్రణ',
    brightnessControl: 'ప్రకాశం నియంత్రణ',
    
    // Status
    online: 'ఆన్‌లైన్',
    offline: 'ఆఫ్‌లైన్',
    busy: 'బిజీ',
    connected: 'కనెక్ట్ చేయబడింది',
    disconnected: 'డిస్‌కనెక్ట్ చేయబడింది',
    
    // Actions
    execute: 'అమలు చేయండి',
    cancel: 'రద్దు చేయండి',
    retry: 'మళ్లీ ప్రయత్నించండి',
    configure: 'కాన్ఫిగర్ చేయండి',
    enable: 'ప్రారంభించండి',
    disable: 'నిలిపివేయండి',
    
    // System
    cpuUsage: 'CPU వినియోగం',
    memoryUsage: 'మెమరీ వినియోగం',
    diskSpace: 'డిస్క్ స్థలం',
    networkStatus: 'నెట్‌వర్క్ స్థితి',
    
    // Voice Commands
    listening: 'వింటున్నాను...',
    processing: 'ప్రాసెసింగ్...',
    commandExecuted: 'కమాండ్ అమలు చేయబడింది',
    commandFailed: 'కమాండ్ విఫలమైంది',
  }
};

export type Language = keyof typeof languages;
export type TranslationKey = keyof typeof languages.en;

export function translate(key: TranslationKey, lang: Language): string {
  return languages[lang][key] || languages.en[key];
}