import { useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  isActive: boolean;
  activeSpeaker: "user" | "assistant" | null;
}

export function SpeechIndicator({ isActive, activeSpeaker }: Props) {
  const [now] = useState(Date.now())

  const getBarColor = () => {
    if (activeSpeaker === "user") return "from-blue-500 to-blue-300";
    if (activeSpeaker === "assistant") return "from-red-500 to-red-300";
    return "from-gray-400 to-gray-300";
  };

  return (
      <div className="flex items-center space-x-2">
        <div className="flex items-end space-x-1 h-12">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-2 bg-gradient-to-t rounded-full transition-all duration-500",
                activeSpeaker ? 'animate-pulse' : 'opacity-30',
                getBarColor(),
              )}
              style={{
                height: isActive ? `${30 + Math.sin(now / 200 + i) * 15}px` : '12px',
                animationDelay: `${i * 0.1}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
      </div>
  );
}