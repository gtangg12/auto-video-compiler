import React, { useState, useRef } from 'react';
import { MessageSquare, Upload, Send, Video, X, Folder, Link as LinkIcon } from 'lucide-react';

interface Message {
  type: 'user' | 'assistant';
  content: string;
  videos?: string[];
}

type Step = 'initial' | 'reference' | 'chat';

function App() {
  const [step, setStep] = useState<Step>('initial');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<File[]>([]);
  const [referenceVideos, setReferenceVideos] = useState<File[]>([]);
  const [channelUrl, setChannelUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const referenceFileInputRef = useRef<HTMLInputElement>(null);
  const referenceFolderInputRef = useRef<HTMLInputElement>(null);
  const FLASK_BACKEND_URL = 'http://localhost:5000';

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
      if (isReference) {
        setReferenceVideos(videos);
      } else {
        setSelectedVideos(videos);
      }
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isReference: boolean = false) => {
    if (e.target.files) {
      processItems(Array.from(e.target.files), isReference);
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
      setStep('reference');
      setMessages([
        {
          type: 'assistant',
          content: 'Channel linked successfully! Now, please select reference content that you want to use as a style guide.',
        },
      ]);
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

  const handleReferenceSelect = () => {
    if (referenceVideos.length > 0) {
      setStep('chat');
      setMessages(prev => [...prev, {
        type: 'assistant',
        content: 'Great! Reference content selected. You can now start chatting and uploading videos for processing.',
      }]);
      setReferenceVideos([]);
    }
  };

  const removeVideo = (index: number, isReference: boolean = false) => {
    if (isReference) {
      setReferenceVideos(prev => prev.filter((_, i) => i !== index));
    } else {
      setSelectedVideos(prev => prev.filter((_, i) => i !== index));
    }
  };

  const removeAllVideos = (isReference: boolean = false) => {
    if (isReference) {
      setReferenceVideos([]);
    } else {
      setSelectedVideos([]);
    }
  };

  const renderInitialStep = () => (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Get Started</h2>
          <p className="text-gray-600 mb-8">Choose how you want to proceed</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
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
                <>
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
                    Upload Content
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReferenceStep = () => (
    <div className="flex-1 flex flex-col p-8">
      <div className="max-w-4xl w-full mx-auto space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Select Reference Content</h2>
          <p className="text-gray-600">Upload videos that will serve as style guides for processing your content</p>
        </div>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, true)}
        >
          {referenceVideos.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {referenceVideos.map((video, index) => (
                  <div key={index} className="relative">
                    <video
                      src={URL.createObjectURL(video)}
                      controls
                      className="w-full h-32 object-cover rounded"
                    />
                    <button
                      onClick={() => removeVideo(index, true)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => removeAllVideos(true)}
                  className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Remove All
                </button>
                <button
                  onClick={handleReferenceSelect}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Use as Reference
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Video className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-gray-500">
                Drag and drop reference videos here or
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => referenceFileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center space-x-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>Browse File</span>
                </button>
                <button
                  onClick={() => referenceFolderInputRef.current?.click()}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center space-x-2"
                >
                  <Folder className="h-4 w-4" />
                  <span>Browse Folder</span>
                </button>
              </div>
            </div>
          )}
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
                <Video className="mx-auto h-12 w-12 text-gray-400" />
                <p className="text-gray-500">
                  Drag and drop your video here or
                </p>
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
            setReferenceVideos([]);
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
      <input
        type="file"
        ref={referenceFileInputRef}
        onChange={(e) => handleFileSelect(e, true)}
        accept="video/*"
        className="hidden"
      />
      <input
        type="file"
        ref={referenceFolderInputRef}
        onChange={(e) => handleFileSelect(e, true)}
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