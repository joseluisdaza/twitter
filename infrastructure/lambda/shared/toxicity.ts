import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';

export interface ToxicityResult {
  toxicityScore: number;
  isToxic: boolean;
}

const lambdaClient = new LambdaClient({});
const TOXICITY_LAMBDA_NAME = process.env.TOXICITY_LAMBDA_NAME;

export const detectToxicity = async (text: string): Promise<ToxicityResult | null> => {
  if (!TOXICITY_LAMBDA_NAME || !text.trim()) return null;

  try {
    const response = await lambdaClient.send(new InvokeCommand({
      FunctionName: TOXICITY_LAMBDA_NAME,
      InvocationType: 'RequestResponse',
      Payload: Buffer.from(JSON.stringify({ text })),
    }));

    if (response.FunctionError) {
      console.error('Toxicity lambda returned FunctionError:', response.FunctionError);
      return null;
    }

    const payload = response.Payload ? Buffer.from(response.Payload).toString('utf-8') : '';
    if (!payload) return null;

    const result = JSON.parse(payload) as Partial<ToxicityResult>;
    if (typeof result.toxicityScore !== 'number' || typeof result.isToxic !== 'boolean') {
      return null;
    }

    return {
      toxicityScore: Math.max(0, Math.min(1, result.toxicityScore)),
      isToxic: result.isToxic,
    };
  } catch (error) {
    console.error('Error invoking toxicity lambda:', error);
    return null;
  }
};