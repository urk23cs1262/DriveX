import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook for consuming Server-Sent Events
 * Automatically handles reconnection and cleanup
 */
export function useSSE(url, onMessage, onError = null, enabled = true) {
  const eventSourceRef = useRef(null);
  const retryCountRef = useRef(0);
  const maxRetriesRef = useRef(5);

  const connect = useCallback(() => {
    if (!enabled) return;

    try {
      const eventSource = new EventSource(url);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.error) {
            console.error('SSE error:', data.error);
            if (onError) onError(data.error);
          } else {
            retryCountRef.current = 0; // Reset retry count on successful message
            onMessage(data);
          }
        } catch (err) {
          console.error('Failed to parse SSE message:', err);
        }
      };

      eventSource.onerror = (err) => {
        console.error('SSE connection error:', err);
        eventSource.close();

        // Attempt reconnection with exponential backoff
        if (retryCountRef.current < maxRetriesRef.current) {
          const delay = Math.pow(2, retryCountRef.current) * 1000; // 1s, 2s, 4s, 8s, 16s
          retryCountRef.current++;
          console.log(`Reconnecting in ${delay}ms (attempt ${retryCountRef.current}/${maxRetriesRef.current})...`);
          setTimeout(connect, delay);
        } else {
          const errMsg = 'SSE connection failed after multiple retries';
          console.error(errMsg);
          if (onError) onError(errMsg);
        }
      };

      eventSourceRef.current = eventSource;
    } catch (err) {
      console.error('Failed to create EventSource:', err);
      if (onError) onError(err.message);
    }
  }, [url, onMessage, onError, enabled]);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [connect]);

  // Return a function to manually reconnect
  return {
    reconnect: () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      retryCountRef.current = 0;
      connect();
    },
  };
}
