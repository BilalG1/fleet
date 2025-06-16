import { useApi } from "@/components/api/use-api";
import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, X } from "lucide-react";
import type { RealtimeEvent } from "./types";
import { useChatMessages } from "../use-chat-messages";
import { createMessageWithId, updateMessageById, addToolInputToMessage, updateLastMessageOrCreateWithContent } from "../message-utils";
import { DEFAULT_SESSION_UPDATE } from "./constants";
import type { components } from "@/generated/openapi";
import { SpeechIndicator } from "./speech-indicator";

interface Props {
  taskId: string;
  onExitVoiceMode: () => void;
}

export function VoiceModeBar({ taskId, onExitVoiceMode }: Props) {
  const { $api } = useApi();
  const { setMessages } = useChatMessages(taskId);
  const [isMuted, setIsMuted] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState<"user" | "assistant" | null>(null);
  const mediaStream = useRef<MediaStream>(null);
  const rtcDataChannel = useRef<RTCDataChannel>(null);

  const { data: openaiClientSecret } = $api.useQuery("get", "/auth/openai-session");

  const { mutate: executeToolCalls } = $api.useMutation(
    "post",
    "/task/{task_id}/tool-calls",
    {
      onSuccess: (results) => {
        console.log("Tool call results:", results);
        results.forEach(result => {
          updateLastMessageOrCreateWithContent(
            setMessages,
            "assistant",
            result,
          );
        });
        const clientResponseEvents: any[] = results.map(toolResult => ({
          "type": "conversation.item.create",
          "item": {
            "type": "function_call_output",
            "call_id": toolResult.tool_id,
            "output": toolResult.tool_result
          }
        }));
        clientResponseEvents.forEach(event => {
          rtcDataChannel.current?.send(JSON.stringify(event));
        });
        rtcDataChannel.current?.send(JSON.stringify({"type": "response.create"}));
      },
      onError: (error) => {
        console.error("Tool call failed:", error);
      }
    }
  );

  const init = async (rtcConnection: RTCPeerConnection, ephemeralKey: string) => {
    const audioEl = document.createElement("audio");
    audioEl.autoplay = true;
    rtcConnection.ontrack = e => audioEl.srcObject = e.streams[0];

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStream.current = stream;
    rtcConnection.addTrack(stream.getTracks()[0]);

    const dataChannel = rtcConnection.createDataChannel("oai-events");
    rtcDataChannel.current = dataChannel;
    dataChannel.addEventListener("message", (e) => {
      handleRealtimeEvent(JSON.parse(e.data) as RealtimeEvent);
    });
    dataChannel.addEventListener("open", () => {
      dataChannel.send(JSON.stringify(DEFAULT_SESSION_UPDATE));
    })
    dataChannel.addEventListener("error", (e) => {
      console.error("Data channel error:", e);
    })
    dataChannel.addEventListener("close", () => {
      console.log("Data channel closed");
    })

    const offer = await rtcConnection.createOffer();
    await rtcConnection.setLocalDescription(offer);

    const baseUrl = "https://api.openai.com/v1/realtime";
    const model = "gpt-4o-realtime-preview-2025-06-03";
    const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
      method: "POST",
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${ephemeralKey}`,
        "Content-Type": "application/sdp"
      },
    });

    await rtcConnection.setRemoteDescription({
      type: "answer",
      sdp: await sdpResponse.text(),
    });
    setIsActive(true);
    new Audio('/notification.mp3').play().catch(console.error);

    return rtcConnection
  }

  useEffect(() => {
    if (!openaiClientSecret)
      return;

    const connection = new RTCPeerConnection();
    init(connection, openaiClientSecret);

    return () => {
      connection.close();
      mediaStream.current?.getTracks().forEach(track => track.stop());
      setIsActive(false);
      setActiveSpeaker(null);
    }
  }, [openaiClientSecret]);

  useEffect(() => {
    if (!mediaStream.current)
      return;
    mediaStream.current.getAudioTracks()[0].enabled = !isMuted;
  }, [mediaStream, isMuted]);


  const handleRealtimeEvent = (event: RealtimeEvent) => {
    if (event.type === "conversation.item.created") {
      createMessageWithId(setMessages, event.item.role, event.item.id);
    }

    if (event.type === "conversation.item.input_audio_transcription.delta") {
      updateMessageById(setMessages, event.item_id, event.delta);
    }

    if (event.type === "response.audio_transcript.delta") {
      updateMessageById(setMessages, event.item_id, event.delta);
    }

    if (event.type === "conversation.item.input_audio_transcription.completed") {
      console.log("Transcription completed:", event.transcript);
    }

    if (event.type === "response.audio_transcript.done") {
      console.log("Response transcript done:", event.transcript);
    }

    if (event.type === "response.function_call_arguments.done") {
      console.log("Function call completed:", event.name, event.arguments);
      const parsedArgs = JSON.parse(event.arguments);
      let toolInputBlock: components["schemas"]["ToolInputBlock-Input"];

      if (event.name === "bash") {
        toolInputBlock = {
          type: "tool_input",
          tool_id: event.call_id,
          tool_name: "bash",
          tool_input: parsedArgs
        };
      } else if (event.name === "str_replace_based_edit_tool") {
        toolInputBlock = {
          type: "tool_input",
          tool_id: event.call_id,
          tool_name: "str_replace_based_edit_tool",
          tool_input: parsedArgs.input
        };
      } else {
        console.warn(`Unknown tool name: ${event.name}`);
        return;
      }
      addToolInputToMessage(setMessages, event.item_id, toolInputBlock);
      executeToolCalls({
        body: [toolInputBlock],
        params: { path: { task_id: taskId } }
      });
    }

    if (event.type === "input_audio_buffer.speech_started") {
      setActiveSpeaker("user");
    }

    if (event.type === "input_audio_buffer.speech_stopped") {
      setActiveSpeaker(prev => prev === "user" ? null : prev);
    }

    if (event.type === "output_audio_buffer.started") {
      setActiveSpeaker("assistant");
    }

    if (event.type === "output_audio_buffer.stopped") {
      setActiveSpeaker(prev => prev === "assistant" ? null : prev);
    }

    console.log(JSON.stringify(event, null, 2).slice(0, 300));
  }

  const handleExitVoiceMode = () => {
    new Audio('/notification.mp3').play().catch(console.error);
    onExitVoiceMode();
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-600 w-full h-28 flex flex-col justify-center">
      <div className="flex justify-between items-center my-auto">
        {isMuted ? (
          <MicOff size={40} className="border border-gray-600 rounded-full p-5 w-16 h-16" onClick={() => setIsMuted(a => !a)} />
        ) : (
          <Mic size={40} className="border border-gray-600 rounded-full p-5 w-16 h-16" onClick={() => setIsMuted(a => !a)} />
        )}
        <SpeechIndicator isActive={isActive} activeSpeaker={activeSpeaker} />
        <X size={40} className="border border-gray-600 rounded-full p-5 w-16 h-16" onClick={handleExitVoiceMode} />
      </div>
    </div>
  );
}


