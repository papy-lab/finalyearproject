import { Star, MessageSquare, TrendingUp, Smile, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import StaffLayout from "@/components/layout/StaffLayout";
import DashboardPagination from "@/components/DashboardPagination";
import { api, FeedbackResponse } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface FeedbackItem {
  id: string;
  clientName: string;
  rating: number;
  sentiment: "positive" | "neutral" | "negative";
  comment: string;
  date: string;
  service: string;
  appointmentId: string;
  staffName: string;
}

export default function StaffFeedback() {
  const pageSize = 8;
  const { user } = useAuth();
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFeedback = async () => {
      try {
        setLoading(true);
        if (!user?.id) {
          setFeedbackList([]);
          setError(null);
          return;
        }

        const data = await api.getFeedbackForStaff(user.id);
        const formattedFeedback = data.map((feedback: FeedbackResponse) => {
          const sentimentMap = {
            5: "positive" as const,
            4: "positive" as const,
            3: "neutral" as const,
            2: "negative" as const,
            1: "negative" as const,
          };

          return {
            id: feedback.id,
            clientName: feedback.clientName,
            rating: feedback.rating,
            sentiment:
              sentimentMap[feedback.rating as keyof typeof sentimentMap] ||
              "neutral",
            comment: feedback.comment,
            date: new Date(feedback.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }),
            service:
              feedback.serviceName || feedback.appointmentType || "Service",
            appointmentId: feedback.appointmentId,
            staffName: feedback.staffName,
          };
        });

        setFeedbackList(formattedFeedback);
        setError(null);
      } catch (err) {
        console.error("Error loading feedback:", err);
        setError(err instanceof Error ? err.message : "Failed to load feedback");
        setFeedbackList([]);
      } finally {
        setLoading(false);
      }
    };

    loadFeedback();
  }, [user?.id]);

  const avgRating =
    feedbackList.length > 0
      ? (
          feedbackList.reduce((sum, feedback) => sum + feedback.rating, 0) /
          feedbackList.length
        ).toFixed(1)
      : "0.0";

  const positiveCount = feedbackList.filter(
    (feedback) => feedback.sentiment === "positive",
  ).length;
  const neutralCount = feedbackList.filter(
    (feedback) => feedback.sentiment === "neutral",
  ).length;
  const negativeCount = feedbackList.filter(
    (feedback) => feedback.sentiment === "negative",
  ).length;
  const satisfactionRate =
    feedbackList.length > 0
      ? ((positiveCount / feedbackList.length) * 100).toFixed(0)
      : "0";

  const paginatedFeedbackList = feedbackList.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(feedbackList.length / pageSize));
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [feedbackList.length]);

  if (loading) {
    return (
      <StaffLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading feedback...</p>
          </div>
        </div>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout>
      <div className="p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Feedback & Reviews
            </h2>
            <p className="text-gray-600">
              Feedback sent by clients after their recent appointments
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

          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: "Average Rating",
                value: avgRating,
                icon: Star,
                color: "bg-amber-50 text-amber-600",
              },
              {
                label: "Total Reviews",
                value: feedbackList.length.toString(),
                icon: MessageSquare,
                color: "bg-blue-50 text-blue-600",
              },
              {
                label: "Satisfaction Rate",
                value: `${satisfactionRate}%`,
                icon: TrendingUp,
                color: "bg-green-50 text-green-600",
              },
              {
                label: "Positive Feedback",
                value: positiveCount.toString(),
                icon: Smile,
                color: "bg-emerald-50 text-emerald-600",
              },
            ].map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.label} className={`${metric.color} rounded-xl p-6`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium opacity-75">{metric.label}</p>
                    <Icon className="h-5 w-5 opacity-50" />
                  </div>
                  <p className="text-2xl font-bold">{metric.value}</p>
                </div>
              );
            })}
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Sentiment Analysis
              </h3>
              <div className="space-y-4">
                {[
                  {
                    label: "Positive Feedback",
                    count: positiveCount,
                    percentage:
                      feedbackList.length > 0
                        ? (positiveCount / feedbackList.length) * 100
                        : 0,
                    color: "bg-green-500",
                  },
                  {
                    label: "Neutral",
                    count: neutralCount,
                    percentage:
                      feedbackList.length > 0
                        ? (neutralCount / feedbackList.length) * 100
                        : 0,
                    color: "bg-yellow-500",
                  },
                  {
                    label: "Negative Feedback",
                    count: negativeCount,
                    percentage:
                      feedbackList.length > 0
                        ? (negativeCount / feedbackList.length) * 100
                        : 0,
                    color: "bg-red-500",
                  },
                ].map((sentiment) => (
                  <div key={sentiment.label}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {sentiment.label}
                      </span>
                      <span className="text-sm text-gray-600">
                        {sentiment.count} reviews
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${sentiment.color} h-2 rounded-full`}
                        style={{ width: `${Math.max(sentiment.percentage, 0)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {sentiment.percentage.toFixed(0)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Feedback Overview
              </h3>
              <div className="space-y-3">
                {[
                  {
                    title: "Positive Feedback",
                    subtitle: "Happy customers",
                    count: positiveCount,
                    percentage:
                      feedbackList.length > 0
                        ? ((positiveCount / feedbackList.length) * 100).toFixed(0)
                        : "0",
                    color: "bg-green-100",
                  },
                  {
                    title: "Neutral Feedback",
                    subtitle: "Average experience",
                    count: neutralCount,
                    percentage:
                      feedbackList.length > 0
                        ? ((neutralCount / feedbackList.length) * 100).toFixed(0)
                        : "0",
                    color: "bg-yellow-100",
                  },
                  {
                    title: "Negative Feedback",
                    subtitle: "Needs improvement",
                    count: negativeCount,
                    percentage:
                      feedbackList.length > 0
                        ? ((negativeCount / feedbackList.length) * 100).toFixed(0)
                        : "0",
                    color: "bg-red-100",
                  },
                ].map((item) => (
                  <div key={item.title} className={`${item.color} rounded-lg p-4`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-600">{item.subtitle}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          {item.percentage}%
                        </p>
                        <p className="text-xs text-gray-600">
                          {item.count} reviews
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              All Client Feedback
            </h3>

            {feedbackList.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No feedback received yet</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {paginatedFeedbackList.map((feedback) => (
                  <div
                    key={feedback.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {feedback.clientName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {feedback.service}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < feedback.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{feedback.comment}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">{feedback.date}</p>
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-medium ${
                          feedback.sentiment === "positive"
                            ? "bg-green-100 text-green-800"
                            : feedback.sentiment === "neutral"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {feedback.sentiment.charAt(0).toUpperCase() +
                          feedback.sentiment.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <DashboardPagination
              currentPage={currentPage}
              totalItems={feedbackList.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              itemLabel="feedback entries"
            />
          </div>
        </div>
      </div>
    </StaffLayout>
  );
}
