/**
 * Shared TTS helper using the ElevenLabs edge function.
 */
export async function generateTTS(text: string, voiceId: string): Promise<Blob> {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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
