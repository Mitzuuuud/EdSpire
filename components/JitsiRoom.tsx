"use client";

import { useEffect, useRef } from "react";
import { loadScript } from "@/lib/loadScript";

type Props = {
  roomName: string;                 // e.g., booking/session id
  displayName?: string;             // current user name
  avatarURL?: string;               // optional
  width?: string | number;
  height?: string | number;
};

// NOTE: Jitsi external API injects a global on window.
declare global {
  interface Window {
    JitsiMeetExternalAPI?: any;
  }
}

export default function JitsiRoom({
  roomName,
  displayName = "Guest",
  avatarURL,
  width = "100%",
  height = 600,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<any>(null);

  useEffect(() => {
    let disposed = false;

    async function boot() {
      try {
        console.log("Loading Jitsi script...");
        await loadScript("https://meet.jit.si/external_api.js");
        
        if (disposed || !containerRef.current) {
          console.log("Component disposed or container not available");
          return;
        }

        console.log("Jitsi script loaded, initializing...");
        console.log("Container element:", containerRef.current);
        console.log("Room name:", roomName);
        console.log("Display name:", displayName);

        const domain = "meet.jit.si";
        const options = {
          roomName,
          parentNode: containerRef.current,
          width: '100%',
          height: typeof height === 'number' ? height : 620,
          userInfo: { 
            displayName, 
            avatarURL 
          },
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            enableWelcomePage: false,
            enableClosePage: false,
            prejoinPageEnabled: false,
            enableRecording: true,
            liveStreamingEnabled: false,
            enableScreenShare: true,
            disableDeepLinking: true,
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'desktop', 'chat', 'raisehand', 
              'tileview', 'recording-control', 'hangup'
            ],
            SHOW_CHROME_EXTENSION_BANNER: false,
            SHOW_JITSI_WATERMARK: false,
            SHOW_PROMOTIONAL_CLOSE_PAGE: false,
            SHOW_POWERED_BY: false,
            SHOW_BRAND_WATERMARK: false,
            DEFAULT_BACKGROUND: '#474747',
          },
        };

        console.log("Creating Jitsi API with options:", options);
        apiRef.current = new window.JitsiMeetExternalAPI(domain, options);
        console.log("Jitsi API created successfully");

        // Basic event hooks (optional)
        apiRef.current.addListener("videoConferenceJoined", (data: any) => {
          console.log("Joined room:", roomName, data);
        });
        
        apiRef.current.addListener("videoConferenceLeft", () => {
          console.log("Left the room");
        });
        
        apiRef.current.addListener("readyToClose", () => {
          console.log("Call ended.");
        });

        apiRef.current.addListener("participantJoined", (data: any) => {
          console.log("Participant joined:", data);
        });

        apiRef.current.addListener("participantLeft", (data: any) => {
          console.log("Participant left:", data);
        });

      } catch (error) {
        console.error("Failed to initialize Jitsi:", error);
      }
    }

    boot();
    return () => {
      disposed = true;
      try { 
        apiRef.current?.dispose?.(); 
      } catch (error) {
        console.error("Error disposing Jitsi:", error);
      }
    };
  }, [roomName, displayName, avatarURL, width, height]);

  return (
    <div className="w-full rounded-lg overflow-hidden border border-border/20 shadow-sm bg-card">
      <div 
        ref={containerRef} 
        className="w-full"
        style={{ 
          height: typeof height === 'number' ? `${height}px` : height,
          minHeight: '500px'
        }}
      />
    </div>
  );
}