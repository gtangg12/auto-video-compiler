import React, { useState, useRef } from 'react';
import { MessageSquare, Upload, Send, Video, X, Folder, Link as LinkIcon, TrendingUp } from 'lucide-react';
import ViralRecommendations from './components/ViralRecommendations';
import MessageInput from './components/MessageInput';

interface Message {
  type: 'user' | 'assistant';
  content: string | string[];
  videos?: string[];
}

type Step = 'initial' | 'chat' | 'viral';

declare module 'react' {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    webkitdirectory?: string;
    directory?: string;
  }
}

function App() {
  const [step, setStep] = useState<Step>('initial');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<File[]>([]);
  const [channelUrl, setChannelUrl] = useState('');
  const [showViralRecommendations, setShowViralRecommendations] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const items = Array.from(e.dataTransfer.items);
    processItems(items);
  };

  const processItems = async (items: DataTransferItem[] | File[]) => {
    const videos: File[] = [];
    
    for (const item of items) {
      if (item instanceof File) {
        if (item.type.startsWith('video/')) {
          videos.push(item);
        }
      } else if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry();
        if (entry?.isDirectory) {
          await processDirectory(entry as FileSystemDirectoryEntry, videos);
        } else if (entry?.isFile) {
          const file = await getFileFromEntry(entry as FileSystemFileEntry);
          if (file.type.startsWith('video/')) {
            videos.push(file);
          }
        }
      }
    }

    if (videos.length > 0) {
      setSelectedVideos(videos);
    }
  };

  const processDirectory = async (dirEntry: FileSystemDirectoryEntry, videos: File[]) => {
    const entries = await readDirectory(dirEntry);
    for (const entry of entries) {
      if (entry.isFile) {
        const file = await getFileFromEntry(entry as FileSystemFileEntry);
        if (file.type.startsWith('video/')) {
          videos.push(file);
        }
      } else if (entry.isDirectory) {
        await processDirectory(entry as FileSystemDirectoryEntry, videos);
      }
    }
  };

  const readDirectory = (dirEntry: FileSystemDirectoryEntry): Promise<FileSystemEntry[]> => {
    return new Promise((resolve) => {
      const reader = dirEntry.createReader();
      reader.readEntries((entries) => resolve(entries));
    });
  };

  const getFileFromEntry = (fileEntry: FileSystemFileEntry): Promise<File> => {
    return new Promise((resolve) => {
      fileEntry.file((file) => resolve(file));
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processItems(Array.from(e.target.files));
    }
  };

  const handleChannelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (channelUrl.trim()) {
      setStep('chat');
      setMessages([
        {
          type: 'assistant',
          content: 'Channel linked successfully! You can now upload your content.',
        },
      ]);
    }
  };

  const handleMessageSubmit = (message: string | string[] | { type: 'assistant' | 'user'; content: string | string[]; videos?: string[] }) => {
    if (typeof message === 'object' && 'type' in message) {
      // If it's already a Message object, just add it to messages
      setMessages(prev => [...prev, message as Message]);
    } else if ((typeof message === 'string' && message.trim()) || Array.isArray(message)) {
      // Create a new Message object for string or string[] input
      const newMessage: Message = {
        type: Array.isArray(message) ? 'assistant' : 'user',
        content: message,
        videos: selectedVideos.map(video => URL.createObjectURL(video))
      };
      
      setMessages(prev => [...prev, newMessage]);
      setSelectedVideos([]);
    }
  };

  const removeVideo = (index: number) => {
    setSelectedVideos(prev => prev.filter((_, i) => i !== index));
  };

  const removeAllVideos = () => {
    setSelectedVideos([]);
  };

  const renderInitialStep = () => (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Get Started</h2>
          <p className="text-gray-600 mb-8">Link your channel to continue</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md">
          <form onSubmit={handleChannelSubmit} className="space-y-4">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mx-auto">
              <LinkIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-center">Link Your Channel</h3>
            <input
              type="url"
              value={channelUrl}
              onChange={(e) => setChannelUrl(e.target.value)}
              placeholder="Enter channel URL"
              className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:border-blue-500"
              required
            />
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Link Channel
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  const renderChatStep = () => (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.type === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-900'
              }`}
            >
              {message.videos && message.videos.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {message.videos.map((video, vIndex) => (
                    <video
                      key={vIndex}
                      src={video}
                      controls
                      className="rounded w-full max-w-[400px] max-h-[300px] mx-auto"
                      crossOrigin="anonymous"
                    />
                  ))}
                </div>
              )}
              {Array.isArray(message.content) ? (
                <ul className="list-disc pl-4 space-y-1">
                  {message.content.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>{message.content}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t bg-white p-4 mt-auto">
        <div className="space-y-4">
          {selectedVideos.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {selectedVideos.map((video, index) => (
                  <div key={index} className="relative">
                    <video
                      src={URL.createObjectURL(video)}
                      controls
                      className="w-full h-32 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => removeVideo(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={removeAllVideos}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Remove All Videos
              </button>
            </div>
          )}

          <MessageInput
            onSubmit={handleMessageSubmit}
            onViralRecommendations={() => setShowViralRecommendations(true)}
          />
        </div>
      </div>

      {showViralRecommendations && (
        <ViralRecommendations onClose={() => setShowViralRecommendations(false)} />
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white p-4">
        <div className="flex items-center space-x-2 mb-6">
          <MessageSquare className="h-6 w-6" />
          <h1 className="text-xl font-bold">Video Chat</h1>
        </div>
        <button 
          onClick={() => {
            setMessages([]);
            setStep('initial');
            setSelectedVideos([]);
            setChannelUrl('');
          }}
          className="w-full py-2 px-4 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
        >
          New Chat
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {step === 'initial' && renderInitialStep()}
        {step === 'chat' && renderChatStep()}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="video/*"
        className="hidden"
      />
      <input
        type="file"
        ref={folderInputRef}
        onChange={handleFileSelect}
        accept="video/*"
        webkitdirectory=""
        directory=""
        multiple
        className="hidden"
      />
    </div>
  );
}

export default App;