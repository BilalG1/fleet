interface ConversationItemInputAudioTranscriptionDelta {
  type: "conversation.item.input_audio_transcription.delta";
  event_id: string;
  item_id: string;
  content_index: number;
  delta: string;
}

interface ConversationItemInputAudioTranscriptionCompleted {
  type: "conversation.item.input_audio_transcription.completed";
  event_id: string;
  item_id: string;
  content_index: number;
  transcript: string;
}

interface ResponseAudioTranscriptDelta {
  type: "response.audio_transcript.delta";
  event_id: string;
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  delta: string;
}

interface ResponseAudioTranscriptDone {
  type: "response.audio_transcript.done";
  event_id: string;
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  transcript: string;
}

interface ResponseFunctionCallArgumentsDone {
  type: "response.function_call_arguments.done";
  event_id: string;
  response_id: string;
  item_id: string;
  output_index: number;
  call_id: string;
  name: string;
  arguments: string;
}

interface InputAudioContent {
  type: "input_audio";
  transcript: string | null;
}

interface RealtimeItem {
  id: string;
  object: "realtime.item";
  type: "message";
  status: "completed";
  role: "user" | "assistant";
  content: InputAudioContent[];
}

interface ConversationItemCreated {
  type: "conversation.item.created";
  event_id: string;
  previous_item_id: string | null;
  item: RealtimeItem;
}

interface InputAudioBufferSpeechStarted {
  type: "input_audio_buffer.speech_started";
  event_id: string;
  audio_start_ms: number;
  item_id: string;
}

interface InputAudioBufferSpeechStopped {
  type: "input_audio_buffer.speech_stopped";
  event_id: string;
  audio_end_ms: number;
  item_id: string;
}

interface OutputAudioBufferStarted {
  type: "output_audio_buffer.started";
  event_id: string;
  response_id: string;
}

interface OutputAudioBufferStopped {
  type: "output_audio_buffer.stopped";
  event_id: string;
  response_id: string;
}

export type RealtimeEvent = 
  | ConversationItemInputAudioTranscriptionDelta
  | ConversationItemInputAudioTranscriptionCompleted
  | ResponseAudioTranscriptDelta
  | ResponseAudioTranscriptDone
  | ResponseFunctionCallArgumentsDone
  | ConversationItemCreated
  | InputAudioBufferSpeechStarted
  | InputAudioBufferSpeechStopped
  | OutputAudioBufferStarted
  | OutputAudioBufferStopped;