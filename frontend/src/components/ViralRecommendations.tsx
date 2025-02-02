import React from 'react';
import { Eye, Calendar, Flame } from 'lucide-react';

interface ViralVideo {
  id: string;
  embedUrl: string;
  views: number;
  shares: number;
  likes: number;
  date: string;
}

interface ViralRecommendationsProps {
  onClose: () => void;
}

const formatViews = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

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

const ViralRecommendations: React.FC<ViralRecommendationsProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Top Viral Recommendations</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {viralVideos.map((video, index) => (
              <div 
                key={video.id}
                className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200"
              >
                <div className="relative w-full" style={{ height: '400px' }}>
                  <iframe
                    src={video.embedUrl}
                    className="absolute inset-0 w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
                <div className="p-4">
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
                        onClick={() => {
                          onClose();
                          // Add message to chat
                          const message = {
                            type: 'assistant' as const,
                            content: `Selected viral reference: Video #${index + 1} with ${formatViews(video.views)} views`,
                          };
                          // You'll need to handle this through a callback if you want to update the chat
                        }}
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
    </div>
  );
};

export default ViralRecommendations;