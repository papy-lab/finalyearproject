import { Star, ThumbsUp, MessageSquare, TrendingUp, Smile, AlertCircle } from "lucide-react";
import { useState } from "react";
import StaffLayout from "@/components/layout/StaffLayout";

interface FeedbackItem {
  id: string;
  clientName: string;
  rating: number;
  sentiment: "positive" | "neutral" | "negative";
  comment: string;
  date: string;
  service: string;
}

export default function StaffFeedback() {
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([
    {
      id: "1",
      clientName: "Jean Pierre Mugabo",
      rating: 5,
      sentiment: "positive",
      comment: "Excellent service! Very professional and helpful. Resolved my tax issues quickly.",
      date: "Nov 10, 2025",
      service: "Income Tax Consultation"
    },
    {
      id: "2",
      clientName: "Marie Claire",
      rating: 4,
      sentiment: "neutral",
      comment: "Good service, but had to wait a bit longer than expected.",
      date: "Nov 9, 2025",
      service: "Customs Clearance"
    },
    {
      id: "3",
      clientName: "Emmanuel Karitanire",
      rating: 5,
      sentiment: "positive",
      comment: "Great experience! Clear explanations and thorough assistance.",
      date: "Nov 8, 2025",
      service: "Audit Request"
    }
  ]);

  const [selectedAppointment, setSelectedAppointment] = useState("");
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const avgRating = (feedbackList.reduce((sum, f) => sum + f.rating, 0) / feedbackList.length).toFixed(1);
  const positiveCount = feedbackList.filter(f => f.sentiment === "positive").length;
  const neutralCount = feedbackList.filter(f => f.sentiment === "neutral").length;
  const negativeCount = feedbackList.filter(f => f.sentiment === "negative").length;
  const satisfactionRate = ((positiveCount / feedbackList.length) * 100).toFixed(0);

  const handleSubmitFeedback = () => {
    if (!selectedAppointment || rating === 0 || !feedbackText.trim()) {
      alert("Please fill in all fields");
      return;
    }

    setSubmitted(true);
    setTimeout(() => {
      setSelectedAppointment("");
      setRating(0);
      setFeedbackText("");
      setSubmitted(false);
    }, 2000);
  };

  return (
    <StaffLayout>
      <div className="p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Feedback & Reviews</h2>
            <p className="text-gray-600">Share your experience and help us improve our services</p>
          </div>

          {/* Key Metrics */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Average Rating", value: avgRating, icon: Star, color: "bg-yellow-50 text-yellow-600" },
              { label: "Total Reviews", value: feedbackList.length, icon: MessageSquare, color: "bg-blue-50 text-blue-600" },
              { label: "Satisfaction Rate", value: `${satisfactionRate}%`, icon: ThumbsUp, color: "bg-green-50 text-green-600" },
              { label: "Positive Feedback", value: `${positiveCount}`, icon: Smile, color: "bg-purple-50 text-purple-600" }
            ].map((metric, idx) => {
              const Icon = metric.icon;
              return (
                <div key={idx} className={`${metric.color} rounded-xl p-6`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium opacity-75">{metric.label}</p>
                    <Icon className="h-5 w-5 opacity-50" />
                  </div>
                  <p className="text-2xl font-bold">{metric.value}</p>
                </div>
              );
            })}
          </div>

          {/* Sentiment Analysis */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Sentiment Distribution */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Sentiment Analysis</h3>
              <div className="space-y-4">
                {[
                  { label: "Positive Feedback", count: positiveCount, percentage: (positiveCount / feedbackList.length) * 100, emoji: "😊", color: "bg-green-500" },
                  { label: "Neutral", count: neutralCount, percentage: (neutralCount / feedbackList.length) * 100, emoji: "😐", color: "bg-yellow-500" },
                  { label: "Negative Feedback", count: negativeCount, percentage: (negativeCount / feedbackList.length) * 100, emoji: "😞", color: "bg-red-500" }
                ].map((sentiment, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{sentiment.emoji}</span>
                        <span className="text-sm font-medium text-gray-900">{sentiment.label}</span>
                      </div>
                      <span className="text-sm text-gray-600">{sentiment.count} reviews</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${sentiment.color} h-2 rounded-full`}
                        style={{ width: `${Math.max(sentiment.percentage, 5)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{sentiment.percentage.toFixed(0)}%</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Sentiment Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Feedback Overview</h3>
              <div className="space-y-3">
                {[
                  { title: "Positive Feedback", subtitle: "Happy customers", count: positiveCount, percentage: ((positiveCount / feedbackList.length) * 100).toFixed(0), color: "bg-green-100" },
                  { title: "Neutral Feedback", subtitle: "Average experience", count: neutralCount, percentage: ((neutralCount / feedbackList.length) * 100).toFixed(0), color: "bg-yellow-100" },
                  { title: "Negative Feedback", subtitle: "Needs improvement", count: negativeCount, percentage: ((negativeCount / feedbackList.length) * 100).toFixed(0), color: "bg-red-100" }
                ].map((item, idx) => (
                  <div key={idx} className={`${item.color} rounded-lg p-4`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-600">{item.subtitle}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">{item.percentage}%</p>
                        <p className="text-xs text-gray-600">{item.count} reviews</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Feedback Section */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Feedback Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Submit Feedback</h3>
              <p className="text-sm text-gray-600 mb-6">Rate your recent appointment experience</p>

              {submitted && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                  <ThumbsUp className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Feedback submitted successfully!</span>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">Select Appointment</label>
                  <select
                    value={selectedAppointment}
                    onChange={(e) => setSelectedAppointment(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  >
                    <option value="">Choose a recent appointment</option>
                    <option value="apt1">Jean Pierre - Tax Consultation (Nov 10)</option>
                    <option value="apt2">Marie Claire - Customs Clearance (Nov 9)</option>
                    <option value="apt3">Emmanuel - Audit Request (Nov 8)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="transition transform hover:scale-110"
                      >
                        <Star
                          className={`h-8 w-8 ${
                            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">Your Feedback</label>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Please share your experience with us..."
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>

                <button
                  onClick={handleSubmitFeedback}
                  className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-medium"
                >
                  Submit Feedback
                </button>
              </div>
            </div>

            {/* Recent Feedback */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Feedback</h3>
              <p className="text-sm text-gray-600 mb-6">What our clients are saying</p>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {feedbackList.map((feedback) => (
                  <div key={feedback.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-gray-900">{feedback.clientName}</p>
                        <p className="text-sm text-gray-600">{feedback.service}</p>
                      </div>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < feedback.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{feedback.comment}</p>
                    <p className="text-xs text-gray-500">{feedback.date}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </StaffLayout>
  );
}
