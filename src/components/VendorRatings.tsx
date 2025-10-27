import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Star, Search, Award, TrendingUp, MessageSquare, Clock, Users } from 'lucide-react';

interface VendorWithRating {
  id: string;
  full_name: string;
  organization: string;
  country: string;
  avgRating: number;
  ratingCount: number;
  ratings: any[];
}

export default function VendorRatings() {
  const { profile } = useAuth();
  const [vendors, setVendors] = useState<VendorWithRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<VendorWithRating | null>(null);

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      const { data: vendorProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, organization, country')
        .eq('role', 'developer');

      if (profilesError) throw profilesError;

      const vendorsWithRatings = await Promise.all(
        (vendorProfiles || []).map(async (vendor) => {
          const { data: ratings, error: ratingsError } = await supabase
            .from('vendor_ratings')
            .select('*')
            .eq('vendor_id', vendor.id);

          if (ratingsError) throw ratingsError;

          const avgRating =
            ratings && ratings.length > 0
              ? ratings.reduce((sum, r) => sum + r.overall_rating, 0) / ratings.length
              : 0;

          return {
            ...vendor,
            avgRating,
            ratingCount: ratings?.length || 0,
            ratings: ratings || [],
          };
        })
      );

      setVendors(vendorsWithRatings.filter((v) => v.ratingCount > 0).sort((a, b) => b.avgRating - a.avgRating));
    } catch (error) {
      console.error('Error loading vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter(
    (vendor) =>
      vendor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.organization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-12 text-themed-secondary">Loading vendor ratings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-themed-primary flex items-center gap-3">
          <Award className="w-8 h-8 text-emerald-600" />
          Vendor Ratings & Reviews
        </h2>
        <p className="text-themed-secondary mt-1">
          Browse ratings and reviews from municipalities for solution developers
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-themed-tertiary w-5 h-5" />
        <input
          type="text"
          placeholder="Search vendors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-themed-primary rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-themed-primary text-themed-primary"
        />
      </div>

      {filteredVendors.length === 0 ? (
        <div className="text-center py-12">
          <Award className="w-12 h-12 text-themed-tertiary mx-auto mb-4" />
          <p className="text-themed-secondary">No vendor ratings found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredVendors.map((vendor) => (
            <div
              key={vendor.id}
              onClick={() => setSelectedVendor(vendor)}
              className="bg-themed-secondary border border-themed-primary rounded-xl p-6 hover:shadow-lg transition cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-themed-primary mb-1">{vendor.full_name}</h3>
                  <p className="text-sm text-themed-secondary">{vendor.organization}</p>
                  <p className="text-xs text-themed-tertiary mt-1">{vendor.country}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl font-bold text-themed-primary">{vendor.avgRating.toFixed(1)}</span>
                    <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                  </div>
                  <p className="text-xs text-themed-tertiary">{vendor.ratingCount} reviews</p>
                </div>
              </div>

              <div className="space-y-2">
                {vendor.ratings.slice(0, 2).map((rating) => (
                  <div key={rating.id} className="bg-themed-primary rounded-lg p-3 border border-themed-primary">
                    <div className="flex items-center justify-between mb-1">
                      {renderStars(rating.overall_rating)}
                      <span className="text-xs text-themed-tertiary">
                        {new Date(rating.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {rating.review_text && (
                      <p className="text-sm text-themed-secondary line-clamp-2 mt-2">{rating.review_text}</p>
                    )}
                  </div>
                ))}
              </div>

              {vendor.ratings.length > 2 && (
                <p className="text-sm text-emerald-600 mt-3 font-medium">
                  View all {vendor.ratings.length} reviews →
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedVendor && (
        <VendorDetailModal vendor={selectedVendor} onClose={() => setSelectedVendor(null)} />
      )}
    </div>
  );
}

function VendorDetailModal({ vendor, onClose }: { vendor: VendorWithRating; onClose: () => void }) {
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  const avgQuality =
    vendor.ratings.reduce((sum, r) => sum + (r.quality_rating || 0), 0) / vendor.ratings.length || 0;
  const avgTimeline =
    vendor.ratings.reduce((sum, r) => sum + (r.timeline_rating || 0), 0) / vendor.ratings.length || 0;
  const avgCommunication =
    vendor.ratings.reduce((sum, r) => sum + (r.communication_rating || 0), 0) / vendor.ratings.length || 0;
  const avgSupport =
    vendor.ratings.reduce((sum, r) => sum + (r.support_rating || 0), 0) / vendor.ratings.length || 0;
  const wouldRecommendCount = vendor.ratings.filter((r) => r.would_recommend).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-themed-secondary rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-themed-primary">
        <div className="sticky top-0 bg-themed-secondary border-b border-themed-primary p-6 flex justify-between items-start z-10">
          <div>
            <h2 className="text-2xl font-bold text-themed-primary mb-1">{vendor.full_name}</h2>
            <p className="text-themed-secondary">{vendor.organization}</p>
          </div>
          <button onClick={onClose} className="text-themed-tertiary hover:text-themed-primary transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl p-6 text-center border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-900 dark:text-yellow-100 mb-2">Overall Rating</p>
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-5xl font-bold text-yellow-900 dark:text-yellow-100">
                {vendor.avgRating.toFixed(1)}
              </span>
              <Star className="w-12 h-12 fill-yellow-400 text-yellow-400" />
            </div>
            <p className="text-yellow-700 dark:text-yellow-300">Based on {vendor.ratingCount} reviews</p>
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
              {wouldRecommendCount} of {vendor.ratingCount} would recommend
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-themed-primary rounded-lg p-4 border border-themed-primary text-center">
              <TrendingUp className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-themed-tertiary mb-1">Quality</p>
              <p className="text-xl font-bold text-themed-primary">{avgQuality.toFixed(1)}</p>
            </div>
            <div className="bg-themed-primary rounded-lg p-4 border border-themed-primary text-center">
              <Clock className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-themed-tertiary mb-1">Timeline</p>
              <p className="text-xl font-bold text-themed-primary">{avgTimeline.toFixed(1)}</p>
            </div>
            <div className="bg-themed-primary rounded-lg p-4 border border-themed-primary text-center">
              <MessageSquare className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <p className="text-sm text-themed-tertiary mb-1">Communication</p>
              <p className="text-xl font-bold text-themed-primary">{avgCommunication.toFixed(1)}</p>
            </div>
            <div className="bg-themed-primary rounded-lg p-4 border border-themed-primary text-center">
              <Users className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-themed-tertiary mb-1">Support</p>
              <p className="text-xl font-bold text-themed-primary">{avgSupport.toFixed(1)}</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-themed-primary mb-4">Reviews</h3>
            <div className="space-y-4">
              {vendor.ratings.map((rating) => (
                <div key={rating.id} className="bg-themed-primary rounded-lg p-4 border border-themed-primary">
                  <div className="flex items-center justify-between mb-3">
                    {renderStars(rating.overall_rating)}
                    <span className="text-sm text-themed-tertiary">
                      {new Date(rating.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {rating.review_text && (
                    <p className="text-themed-secondary mb-3 leading-relaxed">{rating.review_text}</p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    {rating.quality_rating && (
                      <div className="flex items-center gap-1">
                        <span className="text-themed-tertiary">Quality:</span>
                        <span className="font-medium text-themed-primary">{rating.quality_rating}/5</span>
                      </div>
                    )}
                    {rating.timeline_rating && (
                      <div className="flex items-center gap-1">
                        <span className="text-themed-tertiary">Timeline:</span>
                        <span className="font-medium text-themed-primary">{rating.timeline_rating}/5</span>
                      </div>
                    )}
                    {rating.communication_rating && (
                      <div className="flex items-center gap-1">
                        <span className="text-themed-tertiary">Communication:</span>
                        <span className="font-medium text-themed-primary">{rating.communication_rating}/5</span>
                      </div>
                    )}
                    {rating.support_rating && (
                      <div className="flex items-center gap-1">
                        <span className="text-themed-tertiary">Support:</span>
                        <span className="font-medium text-themed-primary">{rating.support_rating}/5</span>
                      </div>
                    )}
                  </div>

                  {rating.would_recommend && (
                    <div className="mt-3 pt-3 border-t border-themed-primary">
                      <span className="inline-flex items-center gap-1 text-sm text-emerald-600 font-medium">
                        <Award className="w-4 h-4" />
                        Would recommend
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
