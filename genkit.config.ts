import { googleAI } from '@genkit-ai/googleai';
import { configureGenkit } from '@genkit-ai/core';

export default configureGenkit({
  plugins: [
    googleAI(), // Kích hoạt plugin Google AI
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
