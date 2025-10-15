import React from 'react';
import { X, MapPin, Calendar, Star, Tag } from 'lucide-react';

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
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-4 h-4 ${
            i <= rating ? 'text-yellow-400 fill-current' : 'text-gray-400'
          }`}
        />
      );
    }
    return <div className="flex gap-1">{stars}</div>;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{memory.title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Photos */}
          {memory.photos && memory.photos.length > 0 && (
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-2">
                {memory.photos.map((photo, index) => (
                  <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={photo}
                      alt={`Memory photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {memory.description && (
            <div className="mb-6">
              <p className="text-gray-700 leading-relaxed">{memory.description}</p>
            </div>
          )}

          {/* Details */}
          <div className="space-y-4">
            {/* Country */}
            <div className="flex items-center gap-3 text-gray-600">
              <MapPin className="w-5 h-5" />
              <span>{memory.country_name}</span>
            </div>

            {/* Date */}
            <div className="flex items-center gap-3 text-gray-600">
              <Calendar className="w-5 h-5" />
              <span>{formatDate(memory.memory_date)}</span>
            </div>

            {/* Location */}
            {memory.location && (
              <div className="flex items-center gap-3 text-gray-600">
                <MapPin className="w-5 h-5" />
                <span>{memory.location}</span>
              </div>
            )}

            {/* Rating */}
            {memory.rating && (
              <div className="flex items-center gap-3 text-gray-600">
                <Star className="w-5 h-5" />
                <div className="flex items-center gap-2">
                  {renderStars(memory.rating)}
                  <span className="text-sm">({memory.rating}/5)</span>
                </div>
              </div>
            )}

            {/* Tags */}
            {memory.tags && memory.tags.length > 0 && (
              <div className="flex items-start gap-3 text-gray-600">
                <Tag className="w-5 h-5 mt-0.5" />
                <div className="flex flex-wrap gap-2">
                  {memory.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemoryViewModal;