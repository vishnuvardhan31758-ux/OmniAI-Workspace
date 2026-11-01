// Auto-configure OpenAI API key
import { openaiClient } from './ai/openai-client';
import { aiEngine } from './ai/transformers';

// Set the API key
const apiKey = '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';

// Configure the clients
openaiClient.setApiKey(apiKey);
aiEngine.setApiKey(apiKey);

console.log('OpenAI API key configured successfully');

export { apiKey };