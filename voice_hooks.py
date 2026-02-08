"""
Voice hooks for text-to-speech and speech-to-text integration.
Now uses ElevenLabs voice service for TTS.
"""
from typing import Optional
from config import settings
from voice_service import voice_service


def text_to_speech(text: str, voice_id: Optional[str] = None, style: Optional[float] = None) -> dict:
    """
    Convert text to speech audio using ElevenLabs.
    
    Args:
        text: Text to convert to speech
        voice_id: Optional voice ID for ElevenLabs (uses default if not provided)
        style: Optional style parameter (0.0-1.0)
    
    Returns:
        Dict with audio_bytes, format, and metadata
    """
    return voice_service.text_to_speech(text=text, voice_id=voice_id, style=style)


def speech_to_text(audio_data: bytes, language: str = "en") -> dict:
    """
    Convert speech audio to text.
    
    This is a placeholder function. Replace with actual Whisper integration:
    - Use OpenAI Whisper API or local Whisper model
    - Process audio and return transcript
    
    Args:
        audio_data: Audio file bytes
        language: Language code (default: "en")
    
    Returns:
        Dict with transcript text
    """
    # Placeholder implementation
    # TODO: Integrate with Whisper API
    # Example for OpenAI Whisper:
    # from openai import OpenAI
    # client = OpenAI(api_key=settings.openai_api_key)
    # with open("temp_audio.mp3", "wb") as f:
    #     f.write(audio_data)
    # transcript = client.audio.transcriptions.create(
    #     model="whisper-1",
    #     file=open("temp_audio.mp3", "rb")
    # )
    # return {"text": transcript.text, "language": language}
    
    return {
        "status": "placeholder",
        "text": "",
        "message": "STT placeholder - integrate with Whisper",
        "language": language
    }


def process_voice_input(audio_data: bytes) -> str:
    """
    Process voice input and return text transcript.
    
    Convenience wrapper around speech_to_text.
    
    Args:
        audio_data: Audio file bytes
    
    Returns:
        Transcript text string
    """
    result = speech_to_text(audio_data)
    return result.get("text", "")


def generate_voice_response(text: str, voice_id: Optional[str] = None, style: Optional[float] = None) -> dict:
    """
    Generate voice response from text.
    
    Convenience wrapper around text_to_speech.
    
    Args:
        text: Text to convert to speech
        voice_id: Optional voice ID (uses default if not provided)
        style: Optional style parameter (0.0-1.0)
    
    Returns:
        Dict with audio data
    """
    return text_to_speech(text, voice_id=voice_id, style=style)
