/**
 * Shared TTS helper using the ElevenLabs edge function.
 */

import { SUPABASE_URL, SUPABASE_KEY } from "./supabaseHelpers";

export async function generateTTS(text: string, voiceId: string): Promise<Blob> {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/elevenlabs-tts`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({ text, voiceId }),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `TTS request failed: ${response.status}`);
  }

  return response.blob();
}
