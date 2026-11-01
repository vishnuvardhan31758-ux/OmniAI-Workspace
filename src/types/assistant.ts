export interface DeviceControl {
  id: string;
  name: string;
  type: 'pc' | 'mobile' | 'smart-home' | 'iot';
  status: 'online' | 'offline' | 'busy';
  capabilities: string[];
  lastSeen: string;
}

export interface SystemCommand {
  id: string;
  command: string;
  description: string;
  category: 'system' | 'application' | 'file' | 'network' | 'media';
  parameters?: Record<string, any>;
  requiresElevation?: boolean;
}

export interface AssistantTask {
  id: string;
  title: string;
  description: string;
  type: 'automation' | 'reminder' | 'system-control' | 'information';
  status: 'pending' | 'running' | 'completed' | 'failed';
  scheduledFor?: string;
  createdAt: string;
  result?: string;
}

export interface VoiceCommand {
  id: string;
  phrase: string;
  language: 'en' | 'te';
  action: string;
  confidence: number;
  timestamp: string;
}

export interface AssistantSettings {
  language: 'en' | 'te' | 'both';
  voiceEnabled: boolean;
  autoExecuteCommands: boolean;
  deviceControlEnabled: boolean;
  notificationsEnabled: boolean;
  theme: 'light' | 'dark' | 'auto';
}