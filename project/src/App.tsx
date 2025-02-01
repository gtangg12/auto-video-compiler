import React, { useState, useRef } from 'react';
import { MessageSquare, Upload, Send, Video, X } from 'lucide-react';

interface Message {
  type: 'user' | 'assistant';
  content: string;
  video?: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      const videoUrl = URL.createObjectURL(file);
      setVideoPreview(videoUrl);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      const videoUrl = URL.createObjectURL(file);
      setVideoPreview(videoUrl);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() || videoPreview) {
      const newMessage: Message = {
        type: 'user',
        content: input,
        video: videoPreview || undefined
      };
      
      setMessages([...messages, newMessage]);
      setInput('');
      setVideoPreview(null);
      
      // Simulate assistant response
      setTimeout(() => {
        const assistantMessage: Message = {
          type: 'assistant',
          content: 'I received your message and video. How can I help you with it?'
        };
        setMessages(prev => [...prev, assistantMessage]);
      }, 1000);
    }
  };

  const removeVideo = () => {
    setVideoPreview(null);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white p-4">
        <div className="flex items-center space-x-2 mb-6">
          <MessageSquare className="h-6 w-6" />
          <h1 className="text-xl font-bold">Video Chat</h1>
        </div>
        <button 
          onClick={() => setMessages([])}
          className="w-full py-2 px-4 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
        >
          New Chat
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
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
                {message.video && (
                  <video
                    src={message.video}
                    controls
                    className="mb-2 rounded max-w-md"
                  />
                )}
                <p>{message.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
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
              onDrop={handleDrop}
            >
              {videoPreview ? (
                <div className="relative inline-block">
                  <video
                    src={videoPreview}
                    controls
                    className="max-h-48 rounded"
                  />
                  <button
                    onClick={removeVideo}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Video className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="text-gray-500">
                    Drag and drop your video heree or{' '}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-500 hover:text-blue-600"
                    >
                      browse
                    </button>
                  </p>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="video/*"
                className="hidden"
              />
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
    </div>
  );
}

export default App;