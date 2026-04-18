import { useEffect, useState } from "react";
import { Star, ThumbsUp } from "lucide-react";
import ClientLayout from "@/components/layout/ClientLayout";
import { useToast } from "@/hooks/use-toast";
import { api, AppointmentResponse } from "@/lib/api";

interface Feedback {
  id: string;
  appointmentId: string;
  rating: number;
  comment: string;
  createdAt: string;
  appointment?: {
    serviceName: string;
  };
}

interface FeedbackStats {
  averageRating: number;
  totalReviews: number;
  satisfactionRate: number;
  positiveFeedback: number;
}

export default function ClientFeedback() {
  const [completedAppointments, setCompletedAppointments] = useState<
    AppointmentResponse[]
  >([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<FeedbackStats>({
    averageRating: 4.7,
    totalReviews: 3,
    satisfactionRate: 67,
    positiveFeedback: 2,
  });
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<string>("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const appointments = await api.listAppointments();

        // Filter for completed appointments
        const completed = appointments.filter(
          (apt) => apt.status === "Completed" || apt.status === "COMPLETED"
        );
        setCompletedAppointments(completed);

        // Mock feedback data for now
        setFeedbacks([
          {
            id: "1",
            appointmentId: "apt-1",
            rating: 5,
            comment:
              "Excellent service! Very professional and helpful staff.",
            createdAt: "2026-02-20",
            appointment: { serviceName: "Annual Filing" },
          },
          {
            id: "2",
            appointmentId: "apt-2",
            rating: 5,
            comment: "Very professional and efficient service.",
            createdAt: "2026-02-15",
            appointment: { serviceName: "Tax Consultation" },
          },
          {
            id: "3",
            appointmentId: "apt-3",
            rating: 4,
            comment: "Good service, could have been faster.",
            createdAt: "2026-02-10",
            appointment: { serviceName: "License Renewal" },
          },
        ]);
      } catch (err) {
        console.error("Failed to load data:", err);
        toast({
          title: "Error",
          description: "Failed to load appointments",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAppointment) {
      toast({
        title: "Error",
        description: "Please select an appointment",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      // Simulate API call to submit feedback
      const newFeedback: Feedback = {
        id: String(feedbacks.length + 1),
        appointmentId: selectedAppointment,
        rating,
        comment,
        createdAt: new Date().toISOString().split("T")[0],
        appointment: {
          serviceName:
            completedAppointments.find((apt) => apt.id === selectedAppointment)
              ?.serviceName || "Service",
        },
      };

      setFeedbacks([newFeedback, ...feedbacks]);

      // Update stats
      const allRatings = [...feedbacks, newFeedback].map((f) => f.rating);
      const avgRating =
        allRatings.reduce((a, b) => a + b, 0) / allRatings.length;
      const positiveCount = allRatings.filter((r) => r >= 4).length;
      const satisfactionRate = Math.round(
        (positiveCount / allRatings.length) * 100
      );

      setStats({
        averageRating: avgRating,
        totalReviews: allRatings.length,
        satisfactionRate,
        positiveFeedback: positiveCount,
      });

      // Reset form
      setSelectedAppointment("");
      setRating(5);
      setComment("");

      toast({
        title: "Success",
        description: "Your feedback has been submitted successfully",
      });
    } catch (err) {
      console.error("Failed to submit feedback:", err);
      toast({
        title: "Error",
        description: "Failed to submit feedback",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ClientLayout>
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-rra-blue"></div>
              <p className="mt-4 text-gray-600">Loading feedback...</p>
            </div>
          </div>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-rra-navy mb-2">
              Feedback & Reviews
            </h1>
            <p className="text-gray-600">
              Share your experience and help us improve our services
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-xs uppercase text-gray-500 mb-2">
                Average Rating
              </p>
              <div className="flex items-center gap-2">
                <p className="text-3xl font-bold text-yellow-500">
                  {stats.averageRating.toFixed(1)}
                </p>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(stats.averageRating)
                          ? "fill-yellow-500 text-yellow-500"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-xs uppercase text-gray-500">Total Reviews</p>
              <p className="text-3xl font-bold text-rra-navy">
                {stats.totalReviews}
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-xs uppercase text-gray-500">Satisfaction</p>
              <p className="text-3xl font-bold text-green-600">
                {stats.satisfactionRate}%
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-xs uppercase text-gray-500">Positive</p>
              <p className="text-3xl font-bold text-green-600">
                {stats.positiveFeedback}
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Submit Feedback Form */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-rra-navy mb-4">
                  Submit Feedback
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Rate your recent appointment experience
                </p>

                <form onSubmit={handleSubmitFeedback} className="space-y-4">
                  {/* Select Appointment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Choose a recent appointment
                    </label>
                    <select
                      value={selectedAppointment}
                      onChange={(e) => setSelectedAppointment(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none text-sm"
                    >
                      <option value="">Select an appointment</option>
                      {completedAppointments.map((apt) => (
                        <option key={apt.id} value={apt.id}>
                          {apt.serviceName || apt.appointmentType} -{" "}
                          {apt.date}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rating
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          className="focus:outline-none transition"
                        >
                          <Star
                            className={`h-6 w-6 ${
                              star <= (hoveredRating || rating)
                                ? "fill-yellow-500 text-yellow-500"
                                : "text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Feedback
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Please share your experience with us..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none text-sm resize-none"
                      rows={4}
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting || !selectedAppointment}
                    className="w-full bg-rra-blue text-white py-2 px-4 rounded-lg font-medium hover:bg-rra-navy transition disabled:bg-gray-400"
                  >
                    {submitting ? "Submitting..." : "Submit Feedback"}
                  </button>
                </form>
              </div>
            </div>

            {/* Recent Feedback */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-rra-navy mb-4">
                  Recent Feedback
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  What our clients are saying
                </p>

                <div className="space-y-4">
                  {feedbacks.length > 0 ? (
                    feedbacks.map((feedback) => (
                      <div
                        key={feedback.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                      >
                        {/* Feedback Header */}
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-gray-900">
                              {feedback.appointment?.serviceName || "Service"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {feedback.createdAt}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < feedback.rating
                                    ? "fill-yellow-500 text-yellow-500"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Comment */}
                        <p className="text-sm text-gray-700 mb-2">
                          {feedback.comment}
                        </p>

                        {/* Helpful Button */}
                        <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-rra-blue transition">
                          <ThumbsUp className="h-4 w-4" />
                          Helpful
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      No feedback yet. Complete an appointment and share your
                      experience.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}
