import { AlertCircle, Star } from "lucide-react";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import DashboardPagination from "@/components/DashboardPagination";
import { api, FeedbackResponse } from "@/lib/api";

export default function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState<FeedbackResponse[]>([]);
  const [pageSize, setPageSize] = useState(8);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFeedback = async () => {
      try {
        setLoading(true);
        const data = await api.getAllFeedback();
        setFeedbacks(data);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load feedback",
        );
        setFeedbacks([]);
      } finally {
        setLoading(false);
      }
    };
    loadFeedback();
  }, []);

  const averageRating =
    feedbacks.length > 0
      ? (
          feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
        ).toFixed(1)
      : "0.0";

  const totalReviews = feedbacks.length;

  const satisfactionRate =
    feedbacks.length > 0
      ? Math.round(
          (feedbacks.filter((f) => f.rating >= 4).length / feedbacks.length) *
            100,
        )
      : 0;

  const ratingDistribution = Array.from({ length: 5 }, (_, i) => {
    const rating = i + 1;
    const count = feedbacks.filter((f) => f.rating === rating).length;
    return { rating, count };
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  const paginatedFeedbacks = feedbacks.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(feedbacks.length / pageSize));
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [feedbacks.length, pageSize]);

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-rra-navy mb-2">
              Feedback & Reviews
            </h2>
            <p className="text-gray-600">
              Share your experience and help us improve our services
            </p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Statistics Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
              <p className="text-sm font-medium text-gray-600 mb-2">
                Average Rating
              </p>
              <div className="flex items-center gap-3">
                <div className="text-3xl font-bold text-yellow-600">
                  {averageRating}
                </div>
                <div className="flex gap-1">
                  {renderStars(Math.round(parseFloat(averageRating)))}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
              <p className="text-sm font-medium text-gray-600 mb-2">
                Total Reviews
              </p>
              <p className="text-3xl font-bold text-blue-600">{totalReviews}</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
              <p className="text-sm font-medium text-gray-600 mb-2">
                Satisfaction Rate
              </p>
              <p className="text-3xl font-bold text-green-600">
                {satisfactionRate}%
              </p>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Rating Distribution */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-rra-navy mb-6">
                Rating Distribution
              </h3>
              <div className="space-y-3">
                {ratingDistribution.map(({ rating, count }) => (
                  <div key={rating} className="flex items-center gap-3">
                    <div className="flex gap-1 w-20">{renderStars(rating)}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{
                          width: `${totalReviews > 0 ? (count / totalReviews) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-8 text-right">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Feedback */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-rra-navy">
                  Recent Feedback
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  What our clients are saying
                </p>
              </div>

              {loading ? (
                <div className="p-6">
                  <p className="text-center text-gray-500">
                    Loading feedback...
                  </p>
                </div>
              ) : feedbacks.length === 0 ? (
                <div className="p-6">
                  <p className="text-center text-gray-500">
                    No feedback available yet
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                  {paginatedFeedbacks.map((feedback) => (
                    <div
                      key={feedback.id}
                      className="p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {feedback.serviceName || feedback.appointmentType}
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {feedback.clientName} - {feedback.staffName}
                          </p>
                        </div>
                        <div className="flex gap-0.5">
                          {renderStars(feedback.rating)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        {feedback.comment}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(feedback.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* All Feedback Table */}
          {!loading && feedbacks.length > 0 && (
            <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-rra-navy">
                  All Feedback
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                        Staff
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                        Service
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                        Rating
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                        Comment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedFeedbacks.map((feedback) => (
                      <tr
                        key={feedback.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {feedback.clientName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {feedback.staffName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {feedback.serviceName || feedback.appointmentType}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-0.5">
                            {renderStars(feedback.rating)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                          {feedback.comment}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(feedback.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <DashboardPagination
                currentPage={currentPage}
                totalItems={feedbacks.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                pageSizeOptions={[3, 5, 8, 10, 20]}
                itemLabel="feedback entries"
              />
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
