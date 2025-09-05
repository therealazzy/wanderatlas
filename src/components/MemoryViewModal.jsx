import React from 'react';
import { X, Calendar, MapPin, Star, Tag } from 'lucide-react';

const MemoryViewModal = ({ memory, onClose }) => {
  if (!memory) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={16}
            className={i < rating ? 'text-yellow-400 fill-current' : 'text-gray-400'}
          />
        ))}
      </div>
    );
  };

  const renderTags = (tags) => {
    if (!tags || tags.length === 0) return null;
    const tagList = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
    return (
      <div className="flex flex-wrap gap-2">
        {tagList.map((tag, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-full"
          >
            #{tag}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">{memory.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Country and Date */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2 text-gray-300">
              <MapPin size={18} />
              <span className="font-medium">{memory.country_name || 'Unknown Country'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Calendar size={18} />
              <span>{formatDate(memory.memory_date)}</span>
            </div>
          </div>

          {/* Rating */}
          {memory.rating && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Star size={18} className="text-yellow-400" />
                <span className="text-gray-300 font-medium">Rating</span>
              </div>
              {renderStars(memory.rating)}
            </div>
          )}

          {/* Description */}
          {memory.description && (
            <div className="mb-4">
              <h3 className="text-white font-medium mb-2">Description</h3>
              <p className="text-gray-300 leading-relaxed">{memory.description}</p>
            </div>
          )}

          {/* Location */}
          {memory.location && (
            <div className="mb-4">
              <h3 className="text-white font-medium mb-2">Location</h3>
              <p className="text-gray-300">{memory.location}</p>
            </div>
          )}

          {/* Tags */}
          {memory.tags && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Tag size={18} className="text-cyan-400" />
                <span className="text-white font-medium">Tags</span>
              </div>
              {renderTags(memory.tags)}
            </div>
          )}

          {/* Photos placeholder */}
          {memory.photos && memory.photos.length > 0 && (
            <div className="mb-4">
              <h3 className="text-white font-medium mb-2">Photos</h3>
              <div className="grid grid-cols-2 gap-2">
                {memory.photos.map((photo, index) => (
                  <div
                    key={index}
                    className="aspect-square bg-gray-800 rounded-lg flex items-center justify-center text-gray-400"
                  >
                    <span className="text-sm">Photo {index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 bg-gray-800/50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemoryViewModal;
