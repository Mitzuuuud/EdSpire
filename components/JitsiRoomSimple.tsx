"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    JitsiMeetExternalAPI?: any;
  }
}

export default function JitsiRoomSimple({ 
  roomName, 
  displayName = "Guest" 
}: { 
  roomName: string; 
  displayName?: string; 
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;

    async function loadJitsi() {
      try {
        setIsLoading(true);
        setError(null);

        console.log('Starting Jitsi load process...');

        // Load the Jitsi script if not already loaded
        if (!window.JitsiMeetExternalAPI) {
          console.log('Jitsi API not found, loading script...');
          
          const script = document.createElement('script');
          script.src = 'https://meet.jit.si/external_api.js';
          script.async = true;
          document.head.appendChild(script);
          
          await new Promise((resolve, reject) => {
            script.onload = () => {
              console.log('Jitsi script loaded successfully');
              // Wait a bit for the API to be available
              setTimeout(() => {
                if (window.JitsiMeetExternalAPI) {
                  console.log('JitsiMeetExternalAPI is now available');
                  resolve(undefined);
                } else {
                  console.error('JitsiMeetExternalAPI still not available after script load');
                  reject(new Error('JitsiMeetExternalAPI not available'));
                }
              }, 100);
            };
            script.onerror = (err) => {
              console.error('Failed to load Jitsi script:', err);
              reject(new Error('Failed to load Jitsi script'));
            };
          });
        } else {
          console.log('Jitsi API already available');
        }

        if (disposed || !containerRef.current) {
          console.log('Component disposed or container not available');
          return;
        }

        // Double check the API is available
        if (!window.JitsiMeetExternalAPI) {
          throw new Error('JitsiMeetExternalAPI is not available');
        }

        console.log('Creating Jitsi room:', roomName);
        console.log('Container element:', containerRef.current);

        // Clear the container
        containerRef.current.innerHTML = '';

        // Create Jitsi Meet
        const api = new window.JitsiMeetExternalAPI('meet.jit.si', {
          roomName,
          parentNode: containerRef.current,
          width: '100%',
          height: 600,
          userInfo: {
            displayName
          }
        });

        console.log('Jitsi API created successfully:', api);

        apiRef.current = api;
        setIsLoading(false);

        // Add event listeners
        api.addListener('videoConferenceJoined', () => {
          console.log('Successfully joined the room!');
        });

        api.addListener('readyToClose', () => {
          console.log('Meeting ended');
        });

      } catch (err) {
        console.error('Error loading Jitsi:', err);
        setError(err instanceof Error ? err.message : 'Failed to load video conference');
        setIsLoading(false);
      }
    }

    loadJitsi();

    return () => {
      disposed = true;
      if (apiRef.current) {
        try {
          apiRef.current.dispose();
        } catch (e) {
          console.error('Error disposing Jitsi:', e);
        }
      }
    };
  }, [roomName, displayName]);

  if (error) {
    return (
      <div className="w-full h-96 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium">Failed to load video conference</p>
          <p className="text-red-500 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

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
      <div 
        ref={containerRef} 
        className="w-full bg-gray-900 rounded-lg"
        style={{ height: '600px', minHeight: '600px' }}
      />
    </div>
  );
}