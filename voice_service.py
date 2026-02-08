"""
ElevenLabs voice service module for text-to-speech and voice cloning.
Supports default AI voices, cloned voices, and per-user voice selection.
"""
import requests
import io
from typing import Optional, List, Dict, Any, BinaryIO
from pathlib import Path
import json
from config import settings
from logging_config import get_logger

logger = get_logger("voice_service")

# ElevenLabs API endpoints
ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1"
ELEVENLABS_TTS_ENDPOINT = f"{ELEVENLABS_API_BASE}/text-to-speech"
ELEVENLABS_VOICES_ENDPOINT = f"{ELEVENLABS_API_BASE}/voices"
ELEVENLABS_VOICE_CLONE_ENDPOINT = f"{ELEVENLABS_API_BASE}/voices/add"

# Default fallback voice IDs (ElevenLabs pre-built voices)
DEFAULT_VOICES = {
    "assistant": "21m00Tcm4TlvDq8ikWAM",  # Rachel - professional female
    "friendly": "EXAVITQu4vr4xnSDxMaL",  # Bella - friendly female
    "professional": "pNInz6obpgDQGcFmaJgB",  # Adam - professional male
    "calm": "ThT5KcBeYPX3keUQqHPh",  # Dorothy - calm female
    "confident": "VR6AewLTigWG4xSOukaG"  # Arnold - confident male
}

# Default voice settings
DEFAULT_VOICE_SETTINGS = {
    "stability": 0.5,
    "similarity_boost": 0.75,
    "style": 0.0,
    "use_speaker_boost": True
}


class VoiceService:
    """Service for ElevenLabs voice operations."""
    
    def __init__(self):
        """Initialize voice service with API key."""
        self.api_key = settings.elevenlabs_api_key
        self.default_voice_id = DEFAULT_VOICES["assistant"]
        
        if not self.api_key or self.api_key in ["", "your_elevenlabs_key_here"]:
            logger.warning("ElevenLabs API key not configured. Voice features will use fallback.")
            self.api_key = None
    
    def _get_headers(self) -> Dict[str, str]:
        """Get API headers with authentication."""
        if not self.api_key:
            raise ValueError("ElevenLabs API key not configured")
        return {
            "xi-api-key": self.api_key,
            "Content-Type": "application/json"
        }
    
    def _get_headers_multipart(self) -> Dict[str, str]:
        """Get API headers for multipart requests."""
        if not self.api_key:
            raise ValueError("ElevenLabs API key not configured")
        return {
            "xi-api-key": self.api_key
        }
    
    def text_to_speech(
        self,
        text: str,
        voice_id: Optional[str] = None,
        style: Optional[float] = None,
        stability: Optional[float] = None,
        similarity_boost: Optional[float] = None,
        stream: bool = False
    ) -> Dict[str, Any]:
        """
        Convert text to speech using ElevenLabs API.
        
        Args:
            text: Text to convert to speech
            voice_id: Optional voice ID (uses default if not provided)
            style: Optional style parameter (0.0-1.0)
            stability: Optional stability parameter (0.0-1.0)
            similarity_boost: Optional similarity boost (0.0-1.0)
            stream: Whether to stream the response
        
        Returns:
            Dict with audio_bytes, format, voice_id, and metadata
        """
        if not self.api_key:
            logger.warning("ElevenLabs API key not configured, returning placeholder")
            return {
                "status": "error",
                "error": "ElevenLabs API key not configured",
                "audio_bytes": None,
                "format": "mp3",
                "voice_id": voice_id or self.default_voice_id,
                "message": "Configure ELEVENLABS_API_KEY to use voice features"
            }
        
        # Use provided voice_id or default
        target_voice_id = voice_id or self.default_voice_id
        
        # Prepare voice settings
        voice_settings = DEFAULT_VOICE_SETTINGS.copy()
        if style is not None:
            voice_settings["style"] = style
        if stability is not None:
            voice_settings["stability"] = stability
        if similarity_boost is not None:
            voice_settings["similarity_boost"] = similarity_boost
        
        try:
            url = f"{ELEVENLABS_TTS_ENDPOINT}/{target_voice_id}"
            if stream:
                url += "/stream"
            
            payload = {
                "text": text,
                "model_id": "eleven_monolingual_v1",  # or "eleven_multilingual_v2"
                "voice_settings": voice_settings
            }
            
            response = requests.post(
                url,
                headers=self._get_headers(),
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                audio_bytes = response.content
                return {
                    "status": "success",
                    "audio_bytes": audio_bytes,
                    "format": "mp3",
                    "voice_id": target_voice_id,
                    "text": text,
                    "settings": voice_settings,
                    "size_bytes": len(audio_bytes)
                }
            else:
                # Try fallback voice if original fails
                if voice_id and voice_id != self.default_voice_id:
                    logger.warning(f"Voice {voice_id} failed, trying default voice")
                    return self.text_to_speech(
                        text=text,
                        voice_id=None,
                        style=style,
                        stability=stability,
                        similarity_boost=similarity_boost,
                        stream=stream
                    )
                
                error_msg = f"ElevenLabs API error: {response.status_code} - {response.text}"
                logger.error(error_msg)
                return {
                    "status": "error",
                    "error": error_msg,
                    "audio_bytes": None,
                    "format": "mp3",
                    "voice_id": target_voice_id
                }
        
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error in text_to_speech: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "audio_bytes": None,
                "format": "mp3",
                "voice_id": target_voice_id
            }
    
    def create_cloned_voice(
        self,
        name: str,
        audio_sample_paths: List[str],
        description: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a cloned voice from audio samples.
        
        Args:
            name: Name for the cloned voice
            audio_sample_paths: List of paths to audio sample files
            description: Optional description for the voice
        
        Returns:
            Dict with voice_id, name, and metadata
        """
        if not self.api_key:
            return {
                "status": "error",
                "error": "ElevenLabs API key not configured",
                "voice_id": None
            }
        
        if not audio_sample_paths:
            return {
                "status": "error",
                "error": "At least one audio sample is required",
                "voice_id": None
            }
        
        try:
            # Prepare multipart form data
            files = []
            for i, path in enumerate(audio_sample_paths):
                path_obj = Path(path)
                if not path_obj.exists():
                    return {
                        "status": "error",
                        "error": f"Audio file not found: {path}",
                        "voice_id": None
                    }
                
                with open(path_obj, "rb") as f:
                    files.append(
                        ("files", (path_obj.name, f.read(), "audio/mpeg"))
                    )
            
            data = {
                "name": name,
                "description": description or f"Cloned voice: {name}"
            }
            
            response = requests.post(
                ELEVENLABS_VOICE_CLONE_ENDPOINT,
                headers=self._get_headers_multipart(),
                files=files,
                data=data,
                timeout=120  # Voice cloning can take time
            )
            
            if response.status_code == 200:
                result = response.json()
                voice_id = result.get("voice_id")
                
                logger.info(f"Created cloned voice: {name} (ID: {voice_id})")
                
                return {
                    "status": "success",
                    "voice_id": voice_id,
                    "name": name,
                    "description": description,
                    "metadata": result
                }
            else:
                error_msg = f"ElevenLabs API error: {response.status_code} - {response.text}"
                logger.error(error_msg)
                return {
                    "status": "error",
                    "error": error_msg,
                    "voice_id": None
                }
        
        except Exception as e:
            logger.error(f"Error creating cloned voice: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "voice_id": None
            }
    
    def list_available_voices(self) -> Dict[str, Any]:
        """
        List all available voices (cloned + default).
        
        Returns:
            Dict with voices list and metadata
        """
        if not self.api_key:
            # Return default voices only
            return {
                "status": "success",
                "voices": [
                    {
                        "voice_id": voice_id,
                        "name": name,
                        "category": "default",
                        "description": f"Default {name} voice"
                    }
                    for name, voice_id in DEFAULT_VOICES.items()
                ],
                "count": len(DEFAULT_VOICES),
                "message": "ElevenLabs API key not configured, showing default voices only"
            }
        
        try:
            response = requests.get(
                ELEVENLABS_VOICES_ENDPOINT,
                headers=self._get_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                voices = data.get("voices", [])
                
                # Add default voices to the list
                default_voices = [
                    {
                        "voice_id": voice_id,
                        "name": name,
                        "category": "default",
                        "description": f"Default {name} voice"
                    }
                    for name, voice_id in DEFAULT_VOICES.items()
                ]
                
                # Format cloned voices
                cloned_voices = [
                    {
                        "voice_id": v.get("voice_id"),
                        "name": v.get("name"),
                        "category": "cloned",
                        "description": v.get("description", ""),
                        "labels": v.get("labels", {}),
                        "settings": v.get("settings", {})
                    }
                    for v in voices
                ]
                
                all_voices = default_voices + cloned_voices
                
                return {
                    "status": "success",
                    "voices": all_voices,
                    "count": len(all_voices),
                    "default_count": len(default_voices),
                    "cloned_count": len(cloned_voices)
                }
            else:
                error_msg = f"ElevenLabs API error: {response.status_code} - {response.text}"
                logger.error(error_msg)
                return {
                    "status": "error",
                    "error": error_msg,
                    "voices": [],
                    "count": 0
                }
        
        except Exception as e:
            logger.error(f"Error listing voices: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "voices": [],
                "count": 0
            }
    
    def preview_voice(
        self,
        voice_id: str,
        sample_text: Optional[str] = None,
        tone: Optional[int] = None,
        speed: Optional[int] = None,
        energy: Optional[int] = None,
        stability: Optional[float] = None,
        similarity_boost: Optional[float] = None,
        style: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Generate a short preview audio for a voice with adjustable parameters.
        
        Args:
            voice_id: Voice ID to preview
            sample_text: Optional sample text (uses default if not provided)
            tone: Tone slider value (0-100, maps to style)
            speed: Speed slider value (0-100, affects delivery)
            energy: Energy slider value (0-100, maps to stability/similarity)
            stability: Stability parameter (0.0-1.0)
            similarity_boost: Similarity boost (0.0-1.0)
            style: Style parameter (0.0-1.0)
        
        Returns:
            Dict with preview audio_bytes, waveform data, and metadata
        """
        if not sample_text:
            sample_text = "Hello, this is a preview of my voice. How can I help you today?"
        
        # Generate short preview (limit text length)
        if len(sample_text) > 200:
            sample_text = sample_text[:200] + "..."
        
        # Map slider values to voice settings
        if tone is not None:
            # Tone maps to style (0-100 -> 0.0-1.0)
            style = style or (tone / 100.0)
        
        if energy is not None:
            # Energy affects both stability and similarity
            if stability is None:
                stability = 0.3 + (energy / 100.0) * 0.4  # Range: 0.3-0.7
            if similarity_boost is None:
                similarity_boost = 0.5 + (energy / 100.0) * 0.3  # Range: 0.5-0.8
        
        result = self.text_to_speech(
            text=sample_text,
            voice_id=voice_id,
            style=style,
            stability=stability,
            similarity_boost=similarity_boost
        )
        
        if result.get("status") == "success":
            audio_bytes = result.get("audio_bytes")
            
            # Generate waveform data (simplified - in production, use audio processing library)
            waveform_data = self._generate_waveform_preview(audio_bytes)
            
            return {
                "status": "success",
                "voice_id": voice_id,
                "preview_audio": audio_bytes,
                "preview_url": f"/voice/preview/audio/{voice_id}",  # For playback
                "waveform": waveform_data,
                "format": result.get("format"),
                "sample_text": sample_text,
                "size_bytes": result.get("size_bytes"),
                "settings": {
                    "tone": tone or 50,
                    "speed": speed or 50,
                    "energy": energy or 50,
                    "stability": stability or result.get("settings", {}).get("stability", 0.5),
                    "similarity_boost": similarity_boost or result.get("settings", {}).get("similarity_boost", 0.75),
                    "style": style or result.get("settings", {}).get("style", 0.0)
                }
            }
        else:
            return {
                "status": "error",
                "error": result.get("error", "Failed to generate preview"),
                "voice_id": voice_id
            }
    
    def _generate_waveform_preview(self, audio_bytes: bytes) -> List[float]:
        """
        Generate simplified waveform data for visualization.
        
        In production, use librosa or similar for accurate waveform.
        This is a placeholder that returns mock waveform data.
        """
        # Mock waveform - in production, decode audio and extract samples
        import random
        return [random.uniform(-1.0, 1.0) for _ in range(100)]  # 100 sample points
    
    def get_voice_info(self, voice_id: str) -> Dict[str, Any]:
        """
        Get information about a specific voice.
        
        Args:
            voice_id: Voice ID to get info for
        
        Returns:
            Dict with voice information
        """
        # Check if it's a default voice
        for name, default_id in DEFAULT_VOICES.items():
            if voice_id == default_id:
                return {
                    "voice_id": voice_id,
                    "name": name,
                    "category": "default",
                    "description": f"Default {name} voice"
                }
        
        # Try to get from ElevenLabs API
        if not self.api_key:
            return {
                "status": "error",
                "error": "ElevenLabs API key not configured",
                "voice_id": voice_id
            }
        
        try:
            response = requests.get(
                f"{ELEVENLABS_VOICES_ENDPOINT}/{voice_id}",
                headers=self._get_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                return {
                    "status": "success",
                    **response.json()
                }
            else:
                return {
                    "status": "error",
                    "error": f"Voice not found: {voice_id}",
                    "voice_id": voice_id
                }
        
        except Exception as e:
            logger.error(f"Error getting voice info: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "voice_id": voice_id
            }


# Global voice service instance
voice_service = VoiceService()
