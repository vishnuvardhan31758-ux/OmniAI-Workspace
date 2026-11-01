import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  MessageSquare, 
  Settings,
  Play,
  Pause,
  Trash2,
  Download,
  Languages
} from 'lucide-react';
import { speechRecognition } from '../../lib/voice/speech-recognition';
import { deviceController } from '../../lib/system/device-controller';
import { translate, Language } from '../../lib/languages';
import { VoiceCommand, SystemCommand } from '../../types/assistant';

export function VoiceCommandsPanel() {
  const [language, setLanguage] = useState<Language>('en');
  const [isListening, setIsListening] = useState(false);
  const [voiceCommands, setVoiceCommands] = useState<VoiceCommand[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [currentCommand, setCurrentCommand] = useState<VoiceCommand | null>(null);

  useEffect(() => {
    speechRecognition.setLanguage(language);
  }, [language]);

  const startListening = async () => {
    if (!speechRecognition.isSupported()) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    try {
      setIsListening(true);
      setIsRecording(true);
      
      const command = await speechRecognition.startListening();
      
      if (command) {
        setCurrentCommand(command);
        setVoiceCommands(prev => [command, ...prev]);
        await executeCommand(command);
      }
    } catch (error) {
      console.error('Voice recognition error:', error);
      alert('Voice recognition failed: ' + (error as Error).message);
    } finally {
      setIsListening(false);
      setIsRecording(false);
    }
  };

  const stopListening = () => {
    speechRecognition.stopListening();
    setIsListening(false);
    setIsRecording(false);
  };

  const executeCommand = async (voiceCommand: VoiceCommand) => {
    const systemCommand: SystemCommand = {
      id: Date.now().toString(),
      command: voiceCommand.action,
      description: voiceCommand.phrase,
      category: getCommandCategory(voiceCommand.action),
      parameters: parseCommandParameters(voiceCommand.phrase)
    };

    try {
      const result = await deviceController.executeSystemCommand(systemCommand);
      
      // Update command with result
      setVoiceCommands(prev => 
        prev.map(cmd => 
          cmd.id === voiceCommand.id 
            ? { ...cmd, result: result.success ? 'success' : 'failed' }
            : cmd
        )
      );
    } catch (error) {
      console.error('Command execution error:', error);
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

  const clearHistory = () => {
    setVoiceCommands([]);
    setCurrentCommand(null);
  };

  const exportHistory = () => {
    const data = JSON.stringify(voiceCommands, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'voice-commands-history.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const predefinedCommands = {
    en: [
      { phrase: 'Open Chrome', action: 'open-application', params: { name: 'chrome' } },
      { phrase: 'Volume up', action: 'volume-up' },
      { phrase: 'Volume down', action: 'volume-down' },
      { phrase: 'Brightness up', action: 'brightness-up' },
      { phrase: 'Brightness down', action: 'brightness-down' },
      { phrase: 'Play music', action: 'media-play' },
      { phrase: 'Pause music', action: 'media-pause' },
      { phrase: 'Shutdown system', action: 'system-shutdown' },
      { phrase: 'Restart system', action: 'system-restart' }
    ],
    te: [
      { phrase: 'క్రోమ్ తెరవండి', action: 'open-application', params: { name: 'chrome' } },
      { phrase: 'వాల్యూమ్ పెంచండి', action: 'volume-up' },
      { phrase: 'వాల్యూమ్ తగ్గించండి', action: 'volume-down' },
      { phrase: 'ప్రకాశం పెంచండి', action: 'brightness-up' },
      { phrase: 'ప్రకాశం తగ్గించండి', action: 'brightness-down' },
      { phrase: 'సంగీతం ప్లే చేయండి', action: 'media-play' },
      { phrase: 'సంగీతం పాజ్ చేయండి', action: 'media-pause' },
      { phrase: 'సిస్టమ్ షట్‌డౌన్ చేయండి', action: 'system-shutdown' },
      { phrase: 'సిస్టమ్ రీస్టార్ట్ చేయండి', action: 'system-restart' }
    ]
  };

  const testPredefinedCommand = async (command: any) => {
    const voiceCommand: VoiceCommand = {
      id: Date.now().toString(),
      phrase: command.phrase,
      language,
      action: command.action,
      confidence: 1.0,
      timestamp: new Date().toISOString()
    };

    setCurrentCommand(voiceCommand);
    setVoiceCommands(prev => [voiceCommand, ...prev]);
    await executeCommand(voiceCommand);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {translate('voiceCommands', language)}
          </h1>
          <p className="text-gray-600">Control your system using voice commands</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Voice Input */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {translate('voiceInput', language)}
          </h2>
          
          <div className="text-center space-y-4">
            <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center transition-all duration-300 ${
              isRecording 
                ? 'bg-red-100 border-4 border-red-500 animate-pulse' 
                : 'bg-primary-100 border-4 border-primary-500'
            }`}>
              {isListening ? (
                <MicOff className="w-16 h-16 text-red-600" />
              ) : (
                <Mic className="w-16 h-16 text-primary-600" />
              )}
            </div>
            
            <div>
              <Button
                onClick={isListening ? stopListening : startListening}
                variant={isListening ? 'secondary' : 'primary'}
                size="lg"
                className="w-full"
                disabled={!speechRecognition.isSupported()}
              >
                {isListening 
                  ? translate('listening', language) 
                  : translate('voiceInput', language)
                }
              </Button>
              
              {!speechRecognition.isSupported() && (
                <p className="text-sm text-red-600 mt-2">
                  Speech recognition not supported in this browser
                </p>
              )}
            </div>

            {currentCommand && (
              <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                <p className="font-medium text-primary-900">Last Command:</p>
                <p className="text-primary-700">"{currentCommand.phrase}"</p>
                <p className="text-sm text-primary-600">
                  Confidence: {Math.round(currentCommand.confidence * 100)}%
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Predefined Commands */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Quick Commands
          </h2>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {predefinedCommands[language].map((command, index) => (
              <button
                key={index}
                onClick={() => testPredefinedCommand(command)}
                className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{command.phrase}</span>
                  <Play className="w-4 h-4 text-primary-600" />
                </div>
                <span className="text-sm text-gray-500">{command.action}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Command History */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Command History</h2>
          <div className="flex space-x-2">
            <Button
              onClick={exportHistory}
              variant="ghost"
              size="sm"
              icon={Download}
              disabled={voiceCommands.length === 0}
            >
              Export
            </Button>
            <Button
              onClick={clearHistory}
              variant="ghost"
              size="sm"
              icon={Trash2}
              disabled={voiceCommands.length === 0}
            >
              Clear
            </Button>
          </div>
        </div>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {voiceCommands.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No voice commands yet. Try speaking a command!</p>
            </div>
          ) : (
            voiceCommands.map((command) => (
              <div
                key={command.id}
                className="p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">"{command.phrase}"</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm text-gray-500">
                        Action: {command.action}
                      </span>
                      <span className="text-sm text-gray-500">
                        Confidence: {Math.round(command.confidence * 100)}%
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(command.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Languages className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500 uppercase">
                      {command.language}
                    </span>
                    {(command as any).result && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        (command as any).result === 'success' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {(command as any).result}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}