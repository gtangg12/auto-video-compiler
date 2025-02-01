import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Upload, Send, Video, X, Folder, Link as LinkIcon, CheckCircle, Flame, Eye, Calendar } from 'lucide-react';

interface Message {
  type: 'user' | 'assistant';
  content: string;
  videos?: string[];
}

interface ViralVideo {
  id: string;
  embedUrl: string;
  views: number;
  shares: number;
  likes: number;
  date: string;
}

type Step = 'initial' | 'reference' | 'chat';

function App() {
  const [step, setStep] = useState<Step>('initial');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<File[]>([]);
  const [selectedViralVideo, setSelectedViralVideo] = useState<ViralVideo | null>(null);
  const [channelUrl, setChannelUrl] = useState('');
  const [isChannelLinked, setIsChannelLinked] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const FLASK_BACKEND_URL = 'http://localhost:5000';

  const viralVideos: ViralVideo[] = [
    {
      id: '1',
      embedUrl: 'https://www.tiktok.com/embed/v2/7466562464654691614',
      views: 2500000,
      shares: 150000,
      likes: 450000,
      date: '2024-03-15',
    },
    {
      id: '2',
      embedUrl: 'https://www.tiktok.com/embed/v2/7466562464654691614',
      views: 1800000,
      shares: 120000,
      likes: 380000,
      date: '2024-03-14',
    },
    {
      id: '3',
      embedUrl: 'https://www.tiktok.com/embed/v2/7466562464654691614',
      views: 1200000,
      shares: 90000,
      likes: 250000,
      date: '2024-03-13',
    }
  ];

  useEffect(() => {
    // Load TikTok embed script
    const script = document.createElement('script');
    script.src = 'https://www.tiktok.com/embed.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent, isReference: boolean = false) => {
    e.preventDefault();
    setIsDragging(false);
    
    const items = Array.from(e.dataTransfer.items);
    processItems(items, isReference);
  };

  const processItems = async (items: DataTransferItem[] | File[], isReference: boolean = false) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() || selectedVideos.length > 0) {
      const newMessage: Message = {
        type: 'user',
        content: input,
        videos: selectedVideos.map(video => URL.createObjectURL(video))
      };
      
      setMessages([...messages, newMessage]);
      setInput('');
      setSelectedVideos([]);
      
      const assistantMessage: Message = {
        type: 'assistant',
        content: 'Here is the processed video:',
        videos: [`${FLASK_BACKEND_URL}/video`]
      };
      setMessages(prev => [...prev, assistantMessage]);
    }
  };

  const handleChannelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (channelUrl.trim()) {
      setIsChannelLinked(true);
    }
  };

  const handleContinueToReference = () => {
    if (isChannelLinked || selectedVideos.length > 0) {
      setStep('reference');
      setMessages([
        {
          type: 'assistant',
          content: `${isChannelLinked ? 'Channel linked' : 'Content uploaded'} successfully! Now, please select reference content that you want to use as a style guide.`,
        },
      ]);
      setSelectedVideos([]);
    }
  };

  const handleContentUpload = () => {
    if (selectedVideos.length > 0) {
      setStep('reference');
      setMessages([
        {
          type: 'assistant',
          content: 'Content uploaded successfully! Now, please select reference content that you want to use as a style guide.',
        },
      ]);
      setSelectedVideos([]);
    }
  };

  const handleViralVideoSelect = (video: ViralVideo) => {
    setSelectedViralVideo(video);
    setStep('chat');
    setMessages(prev => [...prev, {
      type: 'assistant',
      content: 'Preferences received. You can now start chatting and uploading videos for processing.',
    }]);
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  const removeVideo = (index: number) => {
    setSelectedVideos(prev => prev.filter((_, i) => i !== index));
  };

  const removeAllVideos = () => {
    setSelectedVideos([]);
  };

  const renderInitialStep = () => (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Get Started</h2>
          <p className="text-gray-600 mb-8">Link your channel and/or upload your content to continue</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <form onSubmit={handleChannelSubmit} className="space-y-4">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mx-auto">
                <LinkIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-center">Link Your Channel</h3>
              <div className="relative">
                <input
                  type="url"
                  value={channelUrl}
                  onChange={(e) => setChannelUrl(e.target.value)}
                  placeholder="Enter channel URL"
                  className={`w-full rounded-lg border ${isChannelLinked ? 'border-green-500' : 'border-gray-300'} p-3 focus:outline-none focus:border-blue-500`}
                  required
                />
                {isChannelLinked && (
                  <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                )}
              </div>
              <button
                type="submit"
                disabled={isChannelLinked}
                className={`w-full py-3 px-4 rounded-lg ${
                  isChannelLinked 
                    ? 'bg-green-500 cursor-default'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white transition-colors`}
              >
                {isChannelLinked ? 'Channel Linked' : 'Link Channel'}
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="space-y-4">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mx-auto">
                <Upload className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-center">Upload Content</h3>
              <div
                className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                  isDragging ? 'border-green-500 bg-green-50' : 'border-gray-300'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e)}
              >
                <Video className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 mb-2">
                  Drag and drop your videos here or
                </p>
                <div className="flex justify-center space-x-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Browse File
                  </button>
                  <button
                    type="button"
                    onClick={() => folderInputRef.current?.click()}
                    className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Browse Folder
                  </button>
                </div>
              </div>
              {selectedVideos.length > 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {selectedVideos.map((video, index) => (
                      <div key={index} className="relative">
                        <video
                          src={URL.createObjectURL(video)}
                          controls
                          className="w-full h-24 object-cover rounded"
                        />
                        <button
                          onClick={() => removeVideo(index)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleContentUpload}
                    className="w-full py-3 px-4 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                  >
                    Continue with Selected Videos
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Continue button */}
        {(isChannelLinked || selectedVideos.length > 0) && (
          <div className="flex justify-center">
            <button
              onClick={handleContinueToReference}
              className="px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-lg font-semibold"
            >
              Continue to Reference Selection
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderReferenceStep = () => (
    <div className="flex-1 flex flex-col p-8">
      <div className="max-w-6xl w-full mx-auto space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Top Recommended Viral Content</h2>
          <p className="text-gray-600">Select one of these trending videos as your style reference</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {viralVideos.map((video, index) => (
            <div 
              key={video.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="relative w-full" style={{ height: '400px' }}>
                <iframe
                  src={video.embedUrl}
                  className="absolute inset-0 w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
              <div className="p-4 border-t border-gray-100">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 mr-1 text-gray-500" />
                      <span className="text-gray-600">{formatViews(video.views)} views</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                      <span className="text-gray-600">{video.date}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center">
                      <svg className="h-4 w-4 mr-1 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                        <polyline points="16 6 12 2 8 6" />
                        <line x1="12" y1="2" x2="12" y2="15" />
                      </svg>
                      <span className="text-gray-600">{formatViews(video.shares)} shares</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="h-4 w-4 mr-1 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                      </svg>
                      <span className="text-gray-600">{formatViews(video.likes)} likes</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center">
                      <Flame className="h-5 w-5 text-orange-500 mr-2" />
                      <span className="font-semibold text-gray-900">Trending #{index + 1}</span>
                    </div>
                    <button
                      onClick={() => handleViralVideoSelect(video)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Select
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderChatStep = () => (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                      className="rounded w-full"
                      crossOrigin="anonymous"
                    />
                  ))}
                </div>
              )}
              <p>{message.content}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t bg-white p-4">
        <form onSubmit={handleSubmit}>
          <div
            className={`mb-4 border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e)}
          >
            {selectedVideos.length > 0 ? (
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
                  onClick={() => removeAllVideos()}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Remove All Videos
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center space-x-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center space-x-2"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Browse File</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => folderInputRef.current?.click()}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center space-x-2"
                  >
                    <Folder className="h-4 w-4" />
                    <span>Browse Folder</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-lg border border-gray-300 p-2 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>
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
            setSelectedViralVideo(null);
            setChannelUrl('');
            setIsChannelLinked(false);
          }}
          className="w-full py-2 px-4 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
        >
          New Chat
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {step === 'initial' && renderInitialStep()}
        {step === 'reference' && renderReferenceStep()}
        {step === 'chat' && renderChatStep()}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileSelect(e)}
        accept="video/*"
        className="hidden"
      />
      <input
        type="file"
        ref={folderInputRef}
        onChange={(e) => handleFileSelect(e)}
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