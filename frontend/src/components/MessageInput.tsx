import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';

interface Command {
  id: string;
  label: string;
  color: string;
}

interface MessageInputProps {
  onSubmit: (message: string | string[] | { 
    type: 'assistant' | 'user'; 
    content: string | string[] | JSX.Element; 
    videos?: string[] 
  }) => void;
  onViralRecommendations: () => void;
}

const COMMANDS: Command[] = [
  { id: 'create_video', label: '@create_video', color: 'text-blue-500' },
  { id: 'viral_recommendations', label: '@viral_recommendations', color: 'text-purple-500' },
];

const MessageInput: React.FC<MessageInputProps> = ({ onSubmit, onViralRecommendations }) => {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Command[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const lastAtSymbol = input.lastIndexOf('@', cursorPosition);
    if (lastAtSymbol !== -1) {
      const query = input.slice(lastAtSymbol, cursorPosition).toLowerCase();
      const filtered = COMMANDS.filter(cmd => 
        cmd.label.toLowerCase().startsWith(query)
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [input, cursorPosition]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    setCursorPosition(e.target.selectionStart || 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !showSuggestions) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (input.trim()) {
      onSubmit(input);  // Submit the message first

      try {
        const response = await fetch('http://127.0.0.1:5000/create_video', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data: input }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create video');
        }

        // Get the video blob from the response
        const videoBlob = await response.blob();
        const videoUrl = URL.createObjectURL(videoBlob);
        
        // Submit the message with enhanced video player
        onSubmit({
          type: 'assistant',
          content: (
            <div className="video-message w-full flex justify-center">
              <div className="video-container bg-gray-900 rounded-lg overflow-hidden shadow-lg" style={{ width: '150%', maxWidth: '1200px' }}>
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <video
                    src={videoUrl}
                    controls
                    controlsList="nodownload"
                    className="absolute inset-0 w-full h-full object-contain"
                    style={{
                      backgroundColor: '#000'
                    }}
                    playsInline
                    preload="metadata"
                  >
                    <track kind="captions" />
                    Your browser does not support the video tag.
                  </video>
                </div>
                <div className="p-4 bg-gray-800 text-white">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Generated Video</span>
                    <a
                      href={videoUrl}
                      download="generated-video.mp4"
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      Download
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ),
          videos: [] // Remove the video URL from the videos array since we're using JSX
        });


        
      } catch (error) {
        console.error('Error creating video:', error);
        onSubmit({
          type: 'assistant',
          content: error instanceof Error ? error.message : 'Failed to create video. Please try again.',
          videos: []
        });
      }
      
      setInput('');
      setShowSuggestions(false);
    }
  };

  const insertCommand = (command: Command) => {
    const lastAtSymbol = input.lastIndexOf('@', cursorPosition);
    const newInput = input.slice(0, lastAtSymbol) + command.label + ' ' + input.slice(cursorPosition);
    setInput(newInput);
    setShowSuggestions(false);

    if (command.id === 'viral_recommendations') {
      onViralRecommendations();
    }

    // Focus back on input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const highlightCommand = (text: string) => {
    return COMMANDS.reduce((acc, cmd) => {
      const parts = acc.split(cmd.label);
      return parts.join(`<span class="${cmd.color}">${cmd.label}</span>`);
    }, text);
  };

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type @ to use commands..."
          className="flex-1 rounded-lg border border-gray-300 p-2 focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={handleSubmit}
          className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>

      {showSuggestions && (
        <div className="absolute bottom-full mb-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          {suggestions.map((cmd) => (
            <button
              key={cmd.id}
              onClick={() => insertCommand(cmd)}
              className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${cmd.color}`}
            >
              {cmd.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageInput;