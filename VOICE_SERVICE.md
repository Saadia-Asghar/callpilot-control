# ElevenLabs Voice Service Documentation

## Overview

The CallPilot voice service integrates with ElevenLabs API to provide:
- Text-to-speech with multiple voice options
- Voice cloning capabilities
- Per-user voice preferences
- Dynamic voice persona selection

## Configuration

Add your ElevenLabs API key to `.env`:

```env
ELEVENLABS_API_KEY=your_api_key_here
```

Get your API key from: https://elevenlabs.io/app/settings/api-keys

## Default Voices

The service includes pre-configured default voices:

- **assistant** (Rachel) - Professional female voice
- **friendly** (Bella) - Friendly female voice
- **professional** (Adam) - Professional male voice
- **calm** (Dorothy) - Calm female voice
- **confident** (Arnold) - Confident male voice

## API Endpoints

### Text-to-Speech

**POST** `/voice/tts`

Convert text to speech with optional voice selection.

**Request Body:**
```json
{
  "text": "Hello, how can I help you?",
  "voice_id": "optional_voice_id",
  "style": 0.5,
  "stability": 0.5,
  "similarity_boost": 0.75,
  "user_id": 1
}
```

**Response:** Audio file (MP3) with headers:
- `X-Voice-ID`: Voice ID used
- `X-Audio-Size`: Size in bytes

### List Available Voices

**GET** `/voice/list`

Get all available voices (default + cloned).

**Response:**
```json
{
  "status": "success",
  "voices": [
    {
      "voice_id": "21m00Tcm4TlvDq8ikWAM",
      "name": "assistant",
      "category": "default",
      "description": "Default assistant voice"
    },
    {
      "voice_id": "custom_voice_id",
      "name": "My Cloned Voice",
      "category": "cloned",
      "description": "Custom cloned voice"
    }
  ],
  "count": 10,
  "default_count": 5,
  "cloned_count": 5
}
```

### Clone Voice

**POST** `/voice/clone`

Create a cloned voice from audio samples.

**Request Body:**
```json
{
  "name": "My Custom Voice",
  "description": "A friendly customer service voice",
  "audio_sample_paths": [
    "/path/to/sample1.mp3",
    "/path/to/sample2.mp3"
  ]
}
```

**Note:** Audio files must be uploaded first or accessible file paths provided.

**Response:**
```json
{
  "success": true,
  "voice_id": "new_voice_id",
  "name": "My Custom Voice",
  "message": "Voice cloned successfully"
}
```

### Preview Voice

**POST** `/voice/preview`

Generate a short preview audio for a voice.

**Request Body:**
```json
{
  "voice_id": "voice_id_here",
  "sample_text": "Hello, this is a preview"
}
```

**Response:** Audio file (MP3)

### Get Voice Info

**GET** `/voice/info/{voice_id}`

Get detailed information about a specific voice.

**Response:**
```json
{
  "voice_id": "voice_id",
  "name": "Voice Name",
  "category": "default",
  "description": "Voice description"
}
```

### Set Voice Preference

**POST** `/voice/preference`

Set a user's preferred voice.

**Query Parameters:**
- `user_id`: User ID
- `voice_id`: Voice ID to set as preferred
- `voice_name`: Optional friendly name
- `is_default`: Whether this is the default voice (default: true)

**Response:**
```json
{
  "success": true,
  "user_id": 1,
  "voice_id": "voice_id",
  "is_default": true
}
```

### Get Voice Preference

**GET** `/voice/preference/{user_id}`

Get a user's voice preference.

**Response:**
```json
{
  "user_id": 1,
  "voice_id": "voice_id",
  "voice_name": "assistant",
  "category": "default",
  "is_default": true,
  "settings": null
}
```

## Usage Examples

### Python

```python
from voice_service import voice_service

# Generate speech with default voice
result = voice_service.text_to_speech("Hello, world!")
audio_bytes = result["audio_bytes"]

# Generate speech with specific voice
result = voice_service.text_to_speech(
    text="Hello, world!",
    voice_id="21m00Tcm4TlvDq8ikWAM",
    style=0.5
)

# List all voices
voices = voice_service.list_available_voices()
print(f"Available voices: {voices['count']}")

# Clone a voice
result = voice_service.create_cloned_voice(
    name="Customer Service Voice",
    audio_sample_paths=["sample1.mp3", "sample2.mp3"]
)
voice_id = result["voice_id"]

# Preview a voice
preview = voice_service.preview_voice(
    voice_id="voice_id",
    sample_text="This is a preview"
)
```

### cURL

```bash
# Text-to-speech
curl -X POST "http://localhost:8000/voice/tts" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, how can I help you?",
    "user_id": 1
  }' \
  --output response.mp3

# List voices
curl "http://localhost:8000/voice/list"

# Set voice preference
curl -X POST "http://localhost:8000/voice/preference?user_id=1&voice_id=voice_id&is_default=true"

# Get voice preference
curl "http://localhost:8000/voice/preference/1"
```

## Voice Settings

The service supports voice customization:

- **stability** (0.0-1.0): Controls voice consistency
- **similarity_boost** (0.0-1.0): Controls similarity to original voice
- **style** (0.0-1.0): Controls expressiveness
- **use_speaker_boost**: Enhances speaker clarity

Default settings:
```python
{
  "stability": 0.5,
  "similarity_boost": 0.75,
  "style": 0.0,
  "use_speaker_boost": True
}
```

## Error Handling

The service includes robust error handling:

1. **Missing API Key**: Returns placeholder response with error message
2. **Invalid Voice ID**: Falls back to default voice
3. **API Errors**: Returns error details in response
4. **Network Errors**: Logs error and returns error response

## Database Models

### VoicePreference

Stores user voice preferences:
- `user_id`: User ID (None for business default)
- `voice_id`: ElevenLabs voice ID
- `voice_name`: Friendly name
- `voice_category`: default, cloned, custom
- `is_default`: Whether this is the default voice
- `settings`: Voice settings JSON

### ClonedVoice

Stores cloned voice metadata:
- `voice_id`: ElevenLabs voice ID
- `name`: Voice name
- `description`: Voice description
- `owner_user_id`: User who created the voice
- `audio_samples`: List of sample file paths
- `metadata`: Additional metadata from ElevenLabs

## Integration with Agent

The voice service is automatically integrated with the conversation agent:

1. When a user sends a message, the agent checks for user voice preference
2. If found, uses the preferred voice for the response
3. Otherwise, uses the default assistant voice
4. Audio is included in the agent response

## Best Practices

1. **Voice Selection**: Use default voices for general use, cloned voices for specific personas
2. **Audio Samples**: Provide 3-5 high-quality audio samples (10-30 seconds each) for cloning
3. **Voice Settings**: Adjust stability and similarity_boost based on use case
4. **Caching**: Consider caching frequently used voice audio
5. **Error Handling**: Always check response status before using audio_bytes

## Limitations

- ElevenLabs API has rate limits based on subscription tier
- Voice cloning requires API key with cloning permissions
- Audio samples must be in supported formats (MP3, WAV, etc.)
- Maximum text length per request: ~5000 characters

## Support

For issues or questions:
- Check ElevenLabs API documentation: https://elevenlabs.io/docs
- Review API logs in `logs/callpilot_*.log`
- Test with `/voice/list` endpoint to verify API connectivity
