"use client";

import { useState } from "react";

export default function JitsiRoomIframe({ 
  roomName, 
  displayName = "Guest" 
}: { 
  roomName: string; 
  displayName?: string; 
}) {
  const [isLoading, setIsLoading] = useState(true);

  // Create the Jitsi Meet URL with parameters
  const jitsiUrl = `https://meet.jit.si/${encodeURIComponent(roomName)}?userInfo.displayName=${encodeURIComponent(displayName)}&config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.prejoinPageEnabled=false&interfaceConfig.SHOW_JITSI_WATERMARK=false&interfaceConfig.SHOW_POWERED_BY=false`;

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className="w-full relative">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading video conference...</p>
          </div>
        </div>
      )}
      <iframe
        src={jitsiUrl}
        width="100%"
        height="600"
        className="rounded-lg border border-gray-200"
        allow="camera; microphone; fullscreen; display-capture; autoplay"
        onLoad={handleIframeLoad}
        title={`Jitsi Meet - ${roomName}`}
      />
    </div>
  );
}