import { useEffect, useState } from "react";
import {
  Star,
  ThumbsUp,
  Send,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import ClientLayout from "@/components/layout/ClientLayout";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  api,
  AppointmentResponse,
  MessageRequest,
} from "@/lib/api";

interface Feedback {
  id: string;
  appointmentId: string;
  rating: number;
  comment: string;
  createdAt: string;
  appointment?: {
    serviceName: string;
    date?: string;
    time?: string;
  };
}

interface Message {
  id: string;
  appointmentId: string;
  senderId: string;
  senderName: string;
  senderRole: "client" | "staff" | "admin";
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface FeedbackStats {
  averageRating: number;
  totalReviews: number;
  satisfactionRate: number;
  positiveFeedback: number;
}

export default function ClientFeedback() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [completedAppointments, setCompletedAppointments] = useState<
    AppointmentResponse[]
  >([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [stats, setStats] = useState<FeedbackStats>({
    averageRating: 0,
    totalReviews: 0,
    satisfactionRate: 0,
    positiveFeedback: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<string>("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAppointmentForMessage, setSelectedAppointmentForMessage] =
    useState<string>("");
  const [messageSubject, setMessageSubject] = useState("");
  const [messageText, setMessageText] = useState("");
  const [submittingMessage, setSubmittingMessage] = useState(false);
  const [activeTab, setActiveTab] = useState<"feedback" | "messages">(
    "feedback",
  );

  const formatDisplayDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const formatDisplayTime = (time?: string) => {
    if (!time) {
      return "";
    }

    const [hours, minutes] = time.split(":").map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return time;
    }

    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatFeedbackForList = (feedbackData: Awaited<
    ReturnType<typeof api.getFeedbackForClient>
  >) =>
    feedbackData.map((feedback) => ({
      id: feedback.id,
      appointmentId: feedback.appointmentId,
      rating: feedback.rating,
      comment: feedback.comment,
      createdAt: feedback.createdAt,
      appointment: {
        serviceName: feedback.serviceName || feedback.appointmentType || "Service",
        date: feedback.appointmentDate,
        time: feedback.appointmentTime,
      },
    }));

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const userId = user?.id ?? "";
      let feedbackAppointmentIds = new Set<string>();

      try {
        const feedbackData = userId ? await api.getFeedbackForClient(userId) : [];
        const formattedFeedbacks = formatFeedbackForList(feedbackData);
        setFeedbacks(formattedFeedbacks);
        feedbackAppointmentIds = new Set(
          feedbackData.map((feedback) => feedback.appointmentId),
        );

        if (formattedFeedbacks.length > 0) {
          const ratings = formattedFeedbacks.map((item) => item.rating);
          const positiveCount = ratings.filter((value) => value >= 4).length;
          setStats({
            averageRating:
              ratings.reduce((sum, value) => sum + value, 0) / ratings.length,
            totalReviews: ratings.length,
            satisfactionRate: Math.round(
              (positiveCount / ratings.length) * 100,
            ),
            positiveFeedback: positiveCount,
          });
        } else {
          setStats({
            averageRating: 0,
            totalReviews: 0,
            satisfactionRate: 0,
            positiveFeedback: 0,
          });
        }
      } catch (err) {
        console.error("Failed to load feedback:", err);
        setFeedbacks([]);
        setStats({
          averageRating: 0,
          totalReviews: 0,
          satisfactionRate: 0,
          positiveFeedback: 0,
        });
      }

      try {
        const currentYear = new Date().getFullYear();
        const [currentHistory, previousHistory] = await Promise.all([
          api.getClientHistory(currentYear),
          api.getClientHistory(currentYear - 1),
        ]);

        const completedHistory = [
          ...currentHistory.completedAppointments,
          ...previousHistory.completedAppointments,
        ];

        const eligibleAppointments = completedHistory
          .filter((appointment) => !feedbackAppointmentIds.has(appointment.id))
          .map(
            (appointment): AppointmentResponse => ({
              id: appointment.id,
              serviceId: null,
              serviceName: appointment.title,
              departmentId: null,
              departmentName: null,
              appointmentType: appointment.title,
              date: appointment.date,
              time: appointment.time,
              location: appointment.officer || "",
              status: "completed",
              clientName: user?.fullName ?? null,
              clientEmail: user?.email ?? null,
              clientPhone: user?.phone ?? null,
              staffName: appointment.officer || null,
              staffEmail: null,
            }),
          )
          .sort((a, b) =>
            `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`),
          );

        setCompletedAppointments(eligibleAppointments);
      } catch (err) {
        console.error("Failed to load recent appointments:", err);
        setCompletedAppointments([]);
        toast({
          title: "Error",
          description: "Failed to load recent completed appointments",
          variant: "destructive",
        });
      }

      try {
        const messagesData = userId ? await api.getMessagesForClient(userId) : [];
        setMessages(messagesData);
      } catch (err) {
        console.log("Messages not available", err);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast, user?.id]);

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

    if (!comment.trim()) {
      toast({
        title: "Error",
        description: "Please provide feedback comments",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const feedbackResponse = await api.createFeedback(selectedAppointment, {
        rating,
        comment,
      });

      const newFeedback: Feedback = {
        id: feedbackResponse.id,
        appointmentId: selectedAppointment,
        rating: feedbackResponse.rating,
        comment: feedbackResponse.comment,
        createdAt: feedbackResponse.createdAt,
        appointment: {
          serviceName:
            feedbackResponse.serviceName ||
            feedbackResponse.appointmentType ||
            completedAppointments.find((apt) => apt.id === selectedAppointment)
              ?.serviceName ||
            completedAppointments.find((apt) => apt.id === selectedAppointment)
              ?.appointmentType ||
            "Service",
          date: feedbackResponse.appointmentDate,
          time: feedbackResponse.appointmentTime,
        },
      };

      const nextFeedbacks = [newFeedback, ...feedbacks];
      setFeedbacks(nextFeedbacks);
      setCompletedAppointments((current) =>
        current.filter((appointment) => appointment.id !== selectedAppointment),
      );

      const allRatings = nextFeedbacks.map((item) => item.rating);
      const positiveCount = allRatings.filter((value) => value >= 4).length;
      setStats({
        averageRating:
          allRatings.reduce((sum, value) => sum + value, 0) / allRatings.length,
        totalReviews: allRatings.length,
        satisfactionRate: Math.round(
          (positiveCount / allRatings.length) * 100,
        ),
        positiveFeedback: positiveCount,
      });

      setSelectedAppointment("");
      setRating(5);
      setComment("");

      toast({
        title: "Success",
        description:
          "Your feedback was sent to the staff and admin dashboards for review",
      });
    } catch (err) {
      console.error("Failed to submit feedback:", err);
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to submit feedback",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAppointmentForMessage) {
      toast({
        title: "Error",
        description: "Please select an appointment",
        variant: "destructive",
      });
      return;
    }

    if (!messageSubject.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message subject",
        variant: "destructive",
      });
      return;
    }

    if (!messageText.trim()) {
      toast({
        title: "Error",
        description: "Please enter your message",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmittingMessage(true);
      const messageResponse = await api.createMessage(
        selectedAppointmentForMessage,
        {
          subject: messageSubject,
          message: messageText,
        } as MessageRequest,
      );

      const newMessage: Message = {
        id: messageResponse.id,
        appointmentId: selectedAppointmentForMessage,
        senderId: messageResponse.senderId,
        senderName: messageResponse.senderName,
        senderRole: messageResponse.senderRole,
        subject: messageResponse.subject,
        message: messageResponse.message,
        read: false,
        createdAt: messageResponse.createdAt,
      };

      setMessages([newMessage, ...messages]);
      setSelectedAppointmentForMessage("");
      setMessageSubject("");
      setMessageText("");

      toast({
        title: "Success",
        description: "Your message has been sent to staff and admin",
      });
    } catch (err) {
      console.error("Failed to submit message:", err);
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSubmittingMessage(false);
    }
  };

  if (loading) {
    return (
      <ClientLayout>
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-rra-blue"></div>
              <p className="mt-4 text-gray-600">
                Loading feedback and messages...
              </p>
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-rra-navy mb-2">
              Feedback & Messages
            </h1>
            <p className="text-gray-600">
              Share your feedback and send messages to our staff and admin team
            </p>
          </div>

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
              <p className="text-xs uppercase text-gray-500">Messages Sent</p>
              <p className="text-3xl font-bold text-blue-600">
                {messages.filter((message) => message.senderRole === "client").length}
              </p>
            </div>
          </div>

          <div className="mb-6 flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("feedback")}
              className={`px-6 py-3 font-medium transition ${
                activeTab === "feedback"
                  ? "text-rra-blue border-b-2 border-rra-blue"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Star className="h-4 w-4 inline mr-2" />
              Feedback & Reviews
            </button>
            <button
              onClick={() => setActiveTab("messages")}
              className={`px-6 py-3 font-medium transition ${
                activeTab === "messages"
                  ? "text-rra-blue border-b-2 border-rra-blue"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <MessageSquare className="h-4 w-4 inline mr-2" />
              Messages
            </button>
          </div>

          {activeTab === "feedback" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-rra-navy mb-4">
                    Submit Feedback
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Choose a recent completed appointment, type your feedback,
                    and send it directly to staff and admin for review.
                  </p>

                  <form onSubmit={handleSubmitFeedback} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Recent appointments
                      </label>
                      {completedAppointments.length === 0 ? (
                        <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
                          No completed appointments available
                        </div>
                      ) : (
                        <select
                          value={selectedAppointment}
                          onChange={(e) =>
                            setSelectedAppointment(e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none text-sm"
                        >
                          <option value="">Select an appointment</option>
                          {completedAppointments.map((appointment) => (
                            <option key={appointment.id} value={appointment.id}>
                              {appointment.serviceName ||
                                appointment.appointmentType}{" "}
                              • {formatDisplayDate(appointment.date)}
                              {appointment.time
                                ? ` at ${formatDisplayTime(appointment.time)}`
                                : ""}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

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

              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-rra-navy mb-4">
                    Recent Feedback
                  </h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Your latest submitted reviews
                  </p>

                  <div className="space-y-4">
                    {feedbacks.length > 0 ? (
                      feedbacks.map((feedback) => (
                        <div
                          key={feedback.id}
                          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium text-gray-900">
                                {feedback.appointment?.serviceName || "Service"}
                              </p>
                              <p className="text-xs text-gray-500">
                                {feedback.appointment?.date
                                  ? `${formatDisplayDate(feedback.appointment.date)}${
                                      feedback.appointment.time
                                        ? ` at ${formatDisplayTime(feedback.appointment.time)}`
                                        : ""
                                    }`
                                  : formatDisplayDate(feedback.createdAt)}
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

                          <p className="text-sm text-gray-700 mb-2">
                            {feedback.comment}
                          </p>

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
          )}

          {activeTab === "messages" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-rra-navy mb-4">
                    Send Message
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Send a message to our staff and admin team regarding your
                    appointment
                  </p>

                  <form onSubmit={handleSubmitMessage} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Appointment
                      </label>
                      {completedAppointments.length === 0 ? (
                        <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
                          No appointments available
                        </div>
                      ) : (
                        <select
                          value={selectedAppointmentForMessage}
                          onChange={(e) =>
                            setSelectedAppointmentForMessage(e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none text-sm"
                        >
                          <option value="">Select an appointment</option>
                          {completedAppointments.map((appointment) => (
                            <option key={appointment.id} value={appointment.id}>
                              {appointment.serviceName ||
                                appointment.appointmentType}{" "}
                              • {formatDisplayDate(appointment.date)}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={messageSubject}
                        onChange={(e) => setMessageSubject(e.target.value)}
                        placeholder="e.g., Follow-up on appointment..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message
                      </label>
                      <textarea
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type your message here..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none text-sm resize-none"
                        rows={5}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {messageText.length}/500 characters
                      </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-800">
                          Your message will be sent to the staff member who
                          handled your appointment and to the admin team for
                          review.
                        </p>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={
                        submittingMessage || !selectedAppointmentForMessage
                      }
                      className="w-full bg-rra-blue text-white py-2 px-4 rounded-lg font-medium hover:bg-rra-navy transition disabled:bg-gray-400 flex items-center justify-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      {submittingMessage ? "Sending..." : "Send Message"}
                    </button>
                  </form>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-rra-navy mb-4">
                    Message History
                  </h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Messages exchanged with staff and admin
                  </p>

                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {messages.length > 0 ? (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`border rounded-lg p-4 ${
                            message.senderRole === "client"
                              ? "bg-blue-50 border-blue-200 ml-6"
                              : "bg-gray-50 border-gray-200 mr-6"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium text-gray-900 flex items-center gap-2">
                                {message.senderName}
                                <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded-full capitalize">
                                  {message.senderRole}
                                </span>
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDisplayDate(message.createdAt)}
                              </p>
                            </div>
                            {!message.read && message.senderRole !== "client" && (
                              <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                New
                              </span>
                            )}
                          </div>

                          <p className="text-sm font-medium text-gray-900 mb-1">
                            {message.subject}
                          </p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {message.message}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 mb-2">No messages yet</p>
                        <p className="text-gray-400 text-sm">
                          Send a message to get started
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ClientLayout>
  );
}
