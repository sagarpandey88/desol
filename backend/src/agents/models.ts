import { AzureChatOpenAI } from '@langchain/openai';

/**
 * Central Azure OpenAI model configuration.
 * Configure via environment variables:
 *   AZURE_OPENAI_ENDPOINT          e.g. https://my-resource.openai.azure.com/
 *   AZURE_OPENAI_KEY               your Azure OpenAI API key
 *   AZURE_OPENAI_MODEL             e.g. gpt-4o
 *   AZURE_OPENAI_DEPLOYMENT_NAME   your deployment name
 *   AZURE_OPENAI_API_VERSION       e.g. 2024-02-01
 */

function createAzureModel(overrides: { temperature?: number; streaming?: boolean } = {}): AzureChatOpenAI {
  const endpoint = (process.env.AZURE_OPENAI_ENDPOINT ?? '').replace(/\/$/, '');
  return new AzureChatOpenAI({
    azureOpenAIApiKey: process.env.AZURE_OPENAI_KEY,
    azureOpenAIBasePath: `${endpoint}/openai/deployments`,
    azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
    azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION ?? '2024-02-01',
    model: process.env.AZURE_OPENAI_MODEL,
    temperature: overrides.temperature ?? 1,
    streaming: overrides.streaming ?? false,
  });
}

export function getSupervisorModel(): AzureChatOpenAI {
  return createAzureModel({ temperature: 1 });
}

export function getSpecialistModel(): AzureChatOpenAI {
  return createAzureModel({ temperature: 1 });
}

export function getEditAgentModel(): AzureChatOpenAI {
  return createAzureModel({ temperature: 1, streaming: true });
}
