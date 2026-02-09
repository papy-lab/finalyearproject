import { TrendingUp, Star, Clock, Target, Award } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import StaffLayout from "@/components/layout/StaffLayout";
import { api, StaffPerformanceResponse } from "@/lib/api";

export default function StaffPerformance() {
  const [performance, setPerformance] = useState<StaffPerformanceResponse | null>(null);

  useEffect(() => {
    const loadPerformance = async () => {
      try {
        const data = await api.getStaffPerformance();
        setPerformance(data);
      } catch {
        setPerformance(null);
      }
    };
    loadPerformance();
  }, []);

  const maxMonthly = useMemo(() => {
    if (!performance || performance.appointmentsByMonth.length === 0) {
      return 1;
    }
    return Math.max(...performance.appointmentsByMonth.map((m) => m.value), 1);
  }, [performance]);

  return (
    <StaffLayout>
      <div className="p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-rra-navy mb-2">Performance Dashboard</h2>
            <p className="text-gray-600">Track your performance metrics and achievements</p>
          </div>

          {/* Key Metrics */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: "Total Appointments",
                value: performance?.metrics.totalAppointments ?? 0,
                change: "+",
                color: "bg-blue-50 text-rra-blue",
                icon: Target
              },
              {
                label: "Completion Rate",
                value: performance ? `${performance.metrics.completionRate.toFixed(1)}%` : "0%",
                change: "+",
                color: "bg-green-50 text-rra-green",
                icon: TrendingUp
              },
              {
                label: "Avg. Rating",
                value: performance ? performance.metrics.avgRating.toFixed(1) : "0.0",
                change: "+",
                color: "bg-yellow-50 text-yellow-600",
                icon: Star
              },
              {
                label: "On-Time Rate",
                value: performance ? `${performance.metrics.onTimeRate.toFixed(1)}%` : "0%",
                change: "+",
                color: "bg-purple-50 text-purple-600",
                icon: Clock
              }
            ].map((metric, idx) => {
              const Icon = metric.icon;
              return (
                <div key={idx} className={`${metric.color} rounded-xl p-6`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium opacity-75">{metric.label}</p>
                    <Icon className="h-5 w-5 opacity-50" />
                  </div>
                  <div className="flex items-end justify-between">
                    <p className="text-2xl font-bold">{metric.value}</p>
                    <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">
                      {metric.change}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts Section */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Appointments by Month */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-rra-navy mb-6">Appointments by Month</h3>
              <div className="h-64 flex items-end justify-between gap-2 px-2">
                {(performance?.appointmentsByMonth || []).map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-gradient-to-t from-rra-blue to-rra-green rounded-t-lg transition hover:opacity-80"
                      style={{ height: `${(item.value / maxMonthly) * 100}%` }}
                      title={`${item.month}: ${item.value}`}
                    />
                    <span className="text-xs text-gray-600">{item.month}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Feedback & Ratings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-rra-navy mb-6">Client Feedback Distribution</h3>
              <div className="space-y-4">
                {(performance?.feedbackDistribution || []).map((feedback, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {feedback.rating} {feedback.rating === 1 ? "Star" : "Stars"}
                      </span>
                      <span className="text-sm text-gray-600">{feedback.count} reviews</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-rra-green h-2 rounded-full"
                        style={{ width: `${performance && performance.metrics.totalAppointments > 0 ? (feedback.count / performance.metrics.totalAppointments) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Performance Summary */}
          <div className="grid lg:grid-cols-3 gap-8 mb-8">
            {/* Service Type Breakdown */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-rra-navy mb-6">Service Types Handled</h3>
              <div className="space-y-3">
                {(performance?.serviceBreakdown || []).map((service, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">{service.name}</span>
                      <span className="text-sm font-semibold text-rra-blue">{service.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-rra-blue h-2 rounded-full"
                        style={{ width: `${service.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Achievements */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <Award className="h-6 w-6 text-rra-gold" />
                <h3 className="text-lg font-semibold text-rra-navy">Achievements</h3>
              </div>
              <div className="space-y-3">
                {(performance?.achievements || []).map((achievement, idx) => (
                  <div key={idx} className="p-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
                    <p className="font-medium text-gray-900">{achievement.badge}</p>
                    <p className="text-xs text-gray-600">
                      {achievement.description} - {achievement.date}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Comparison */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-rra-navy mb-6">Performance vs. Team Average</h3>
              <div className="space-y-4">
                {(performance?.comparisons || []).map((comparison, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">{comparison.metric}</span>
                      <span className="text-xs font-semibold text-rra-green">
                        +{(comparison.yours - comparison.average).toFixed(1)}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-rra-green h-2 rounded-full"
                          style={{ width: `${Math.min(comparison.yours, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>You: {comparison.yours.toFixed(1)}</span>
                        <span>Avg: {comparison.average.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Feedback */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-rra-navy mb-6">Recent Client Feedback</h3>
            <div className="space-y-4">
              {(performance?.recentFeedback || []).map((feedback, idx) => (
                <div key={idx} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{feedback.client}</p>
                      <p className="text-xs text-gray-600">{feedback.date}</p>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < feedback.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{feedback.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </StaffLayout>
  );
}
