export type UltravoxCreateCallResponse = {
  callId: string;
  clientVersion: string;
  created: string;
  joined: string;
  ended: string;
  endReason: string;
  firstSpeaker: string;
  firstSpeakerSettings: {
    user: {
      fallback: {
        delay: string;
        text: string;
      };
    };
    agent: {
      uninterruptible: boolean;
      text: string;
      delay: string;
    };
  };
  inactivityMessages: Array<{
    duration: string;
    message: string;
    endBehavior: string;
  }>;
  initialOutputMedium: string;
  joinTimeout: string;
  joinUrl: string;
  languageHint: string;
  maxDuration: string;
  medium: {
    webRtc: Record<string, unknown>;
    twilio: Record<string, unknown>;
    serverWebSocket: {
      inputSampleRate: number;
      outputSampleRate: number;
      clientBufferSizeMs: number;
    };
    telnyx: Record<string, unknown>;
    plivo: Record<string, unknown>;
    exotel: Record<string, unknown>;
  };
  model: string;
  recordingEnabled: boolean;
  systemPrompt: string;
  temperature: number;
  timeExceededMessage: string;
  voice: string;
  externalVoice: {
    elevenLabs?: {
      voiceId: string;
      model: string;
      speed: number;
      useSpeakerBoost: boolean;
      style: number;
      similarityBoost: number;
      stability: number;
      pronunciationDictionaries: Array<{
        dictionaryId: string;
        versionId: string;
      }>;
    };
    cartesia?: {
      voiceId: string;
      model: string;
      speed: number;
      emotion: string;
    };
    playHt?: {
      userId: string;
      voiceId: string;
      model: string;
      speed: number;
      quality: string;
      temperature: number;
      emotion: number;
      voiceGuidance: number;
      styleGuidance: number;
      textGuidance: number;
      voiceConditioningSeconds: number;
    };
    lmnt?: {
      voiceId: string;
      model: string;
      speed: number;
      conversational: boolean;
    };
  };
  transcriptOptional: boolean;
  errorCount: number;
  vadSettings: {
    turnEndpointDelay: string;
    minimumTurnDuration: string;
    minimumInterruptionDuration: string;
    frameActivationThreshold: number;
  };
  shortSummary: string;
  summary: string;
  experimentalSettings: any;
  metadata: Record<string, unknown>;
  initialState: Record<string, unknown>;
  requestContext: any;
};
