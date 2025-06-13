export async function parseSSEStreamHelper<T>(
  response: Response,
  onMessage: (data: T) => void,
  onError?: (error: Error) => void
): Promise<void> {
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  if (!response.body) {
    throw new Error("Response body is null");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }
      
      // Decode the current chunk and add it to our buffer
      buffer += decoder.decode(value, { stream: true });
      
      // Process complete messages
      const messages = buffer.split("\n\n");
      
      // Keep the last incomplete message in the buffer
      buffer = messages.pop() || "";
      
      for (const message of messages) {
        if (message.trim() === "") continue;
        
        // Handle multi-line messages
        const lines = message.split("\n");
        let data = "";
        
        for (const line of lines) {
          if (line.startsWith("data:")) {
            data += line.slice(5).trim();
          }
        }
        
        if (data) {
          try {
            const parsedData = JSON.parse(data) as T;
            onMessage(parsedData);
          } catch (error) {
            if (onError && error instanceof Error) {
              onError(error);
            } else {
              console.error("Error parsing SSE message:", error);
            }
          }
        }
      }
    }
  } catch (error) {
    if (onError && error instanceof Error) {
      onError(error);
    } else {
      throw error;
    }
  } finally {
    // Ensure the reader is released
    reader.releaseLock();
  }
}