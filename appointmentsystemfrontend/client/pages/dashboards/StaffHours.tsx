import { Calendar, Clock, Plus, X, Settings, ToggleRight, ToggleLeft, Check, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import StaffLayout from "@/components/layout/StaffLayout";
import { api } from "@/lib/api";

interface WorkDay {
  day: string;
  startTime: string;
  endTime: string;
  isWorking: boolean;
}

interface BlockedDate {
  id: string;
  date: string;
  reason?: string | null;
}

interface Appointment {
  id: string;
  clientName: string;
  serviceType: string;
  date: string;
  time: string;
  location: string;
  status: "today" | "upcoming" | "completed";
  description?: string | null;
}

export default function StaffHours() {
  const [schedule, setSchedule] = useState<WorkDay[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({ today: 0, upcoming: 0, completed: 0 });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showBlockTimeModal, setShowBlockTimeModal] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [tempTime, setTempTime] = useState({ start: "", end: "" });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState({ month: new Date().getMonth(), year: new Date().getFullYear() });
  const [activeTab, setActiveTab] = useState<"today" | "upcoming" | "completed">("upcoming");

  useEffect(() => {
    const loadHours = async () => {
      try {
        const data = await api.getStaffHours();
        setSchedule(data.schedule);
        setBlockedDates(data.blockedDates);
        setAppointments(data.appointments);
        setStats(data.stats);
      } catch {
        setSchedule([]);
        setBlockedDates([]);
        setAppointments([]);
        setStats({ today: 0, upcoming: 0, completed: 0 });
      }
    };
    loadHours();
  }, []);

  useEffect(() => {
    const counts = appointments.reduce(
      (acc, apt) => {
        acc[apt.status] += 1;
        return acc;
      },
      { today: 0, upcoming: 0, completed: 0 } as { today: number; upcoming: number; completed: number }
    );
    setStats(counts);
  }, [appointments]);

  const handleToggleWorkDay = (day: string) => {
    setSchedule((prev) =>
      prev.map((d) =>
        d.day === day ? { ...d, isWorking: !d.isWorking } : d
      )
    );
  };

  const handleEditTime = (day: string) => {
    const dayData = schedule.find((d) => d.day === day);
    if (dayData && dayData.isWorking) {
      setEditingDay(day);
      setTempTime({ start: dayData.startTime, end: dayData.endTime });
    }
  };

  const handleSaveTime = () => {
    if (editingDay) {
      setSchedule((prev) =>
        prev.map((d) =>
          d.day === editingDay ? { ...d, startTime: tempTime.start, endTime: tempTime.end } : d
        )
      );
      setEditingDay(null);
    }
  };

  const handleSaveSchedule = async () => {
    try {
      const updated = await api.updateStaffSchedule(schedule);
      setSchedule(updated);
      setSavedMessage(true);
      setShowSettingsModal(false);
      setTimeout(() => setSavedMessage(false), 3000);
    } catch {
      setSavedMessage(false);
    }
  };

  const handleBlockDate = async () => {
    if (!selectedDate) {
      return;
    }
    const isoDate = toIsoDate(selectedDate);
    try {
      const created = await api.addBlockedDate({ date: isoDate });
      setBlockedDates((prev) => [...prev, created]);
      setShowBlockTimeModal(false);
      setSelectedDate(null);
    } catch {
      setShowBlockTimeModal(false);
    }
  };

  const handleUnblockDate = async (dateToRemove: string) => {
    const match = blockedDates.find((entry) => entry.date === dateToRemove);
    if (!match) {
      return;
    }
    try {
      await api.deleteBlockedDate(match.id);
      setBlockedDates((prev) => prev.filter((d) => d.id !== match.id));
    } catch {
      // no-op
    }
  };

  const handleCompleteAppointment = async (id: string) => {
    try {
      await api.updateAppointment(id, { status: "completed" });
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === id ? { ...apt, status: "completed" } : apt))
      );
    } catch {
      // no-op
    }
  };

  const handleCancelAppointment = async (id: string) => {
    try {
      await api.updateAppointment(id, { status: "cancelled" });
      setAppointments((prev) => prev.filter((apt) => apt.id !== id));
    } catch {
      // no-op
    }
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const isDateBlocked = (date: string) => {
    return blockedDates.some((d) => d.date === toIsoDate(date));
  };

  const toIsoDate = (date: string) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }
    return date;
  };

  const totalWorkingDays = schedule.filter((s) => s.isWorking).length;
  const totalHours = schedule.reduce((sum, day) => {
    if (!day.isWorking) return sum;
    const start = parseInt(day.startTime.split(":")[0]);
    const end = parseInt(day.endTime.split(":")[0]);
    return sum + (end - start);
  }, 0);
  const avgHours = totalWorkingDays > 0 ? (totalHours / totalWorkingDays).toFixed(1) : "0";

  const filteredAppointments = appointments.filter((apt) => apt.status === activeTab);

  return (
    <StaffLayout>
      <div className="p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">My Schedule</h2>
              <p className="text-gray-600">Manage your daily appointments and availability</p>
            </div>
          </div>

          {/* Success Message */}
          {savedMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <Calendar className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-600">Schedule updated successfully!</span>
            </div>
          )}

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {[
              { label: "Today's Appointments", value: stats.today, icon: Clock, color: "bg-blue-50 text-blue-600" },
              { label: "Upcoming", value: stats.upcoming, icon: Calendar, color: "bg-green-50 text-green-600" },
              { label: "Completed", value: stats.completed, icon: Clock, color: "bg-purple-50 text-purple-600" }
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className={`${stat.color} rounded-xl p-6`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium opacity-75">{stat.label}</p>
                    <Icon className="h-5 w-5 opacity-50" />
                  </div>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
              );
            })}
          </div>

          {/* Appointments and Calendar Section */}
          <div className="grid lg:grid-cols-3 gap-8 mb-8">
            {/* Calendar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Calendar</h3>
                <p className="text-sm text-gray-600 mb-6">Select a date to view appointments</p>

                <div className="border border-gray-300 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-center text-gray-900 font-semibold text-sm flex-1">
                      {monthNames[currentMonth.month]} {currentMonth.year}
                    </h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setCurrentMonth((prev) => ({
                            month: prev.month === 0 ? 11 : prev.month - 1,
                            year: prev.month === 0 ? prev.year - 1 : prev.year
                          }))
                        }
                        className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded text-sm"
                      >
                        &lt;
                      </button>
                      <button
                        onClick={() =>
                          setCurrentMonth((prev) => ({
                            month: prev.month === 11 ? 0 : prev.month + 1,
                            year: prev.month === 11 ? prev.year + 1 : prev.year
                          }))
                        }
                        className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded text-sm"
                      >
                        &gt;
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-xs">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                      <div key={day} className="text-xs font-semibold text-gray-600 py-2">
                        {day}
                      </div>
                    ))}
                    {Array.from({ length: getFirstDayOfMonth(currentMonth.month, currentMonth.year) }).map((_, i) => (
                      <div key={`empty-${i}`} className="py-2"></div>
                    ))}
                    {Array.from({ length: getDaysInMonth(currentMonth.month, currentMonth.year) }).map((_, i) => {
                      const date = i + 1;
                      const dateStr = `${monthNames[currentMonth.month].slice(0, 3)} ${date}, ${currentMonth.year}`;
                      const blocked = isDateBlocked(dateStr);
                      return (
                        <button
                          key={date}
                          className={`py-1 rounded text-xs font-medium transition ${
                            blocked ? "bg-red-100 text-red-700 border border-red-300" : "text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          {date}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Appointments Tabs */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                  {["today", "upcoming", "completed"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as typeof activeTab)}
                      className={`flex-1 py-4 px-4 text-sm font-medium transition text-center ${
                        activeTab === tab
                          ? "text-gray-900 border-b-2 border-gray-900"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Appointments List */}
                <div className="p-6 space-y-4">
                  {filteredAppointments.length > 0 ? (
                    filteredAppointments.map((apt) => (
                      <div key={apt.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="font-semibold text-gray-900">{apt.clientName}</p>
                              {activeTab === "completed" && (
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                                  Completed
                                </span>
                              )}
                              {activeTab !== "completed" && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                  {activeTab === "upcoming" ? "Upcoming" : "Today"}
                                </span>
                              )}
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>{apt.serviceType}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>{apt.time} - {apt.date}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                <span>{apt.location}</span>
                              </div>
                              {apt.description && (
                                <p className="text-gray-500 mt-2">{apt.description}</p>
                              )}
                            </div>
                          </div>

                          {activeTab !== "completed" && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleCompleteAppointment(apt.id)}
                                className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition flex items-center gap-1"
                              >
                                <Check className="h-4 w-4" />
                                Complete
                              </button>
                              <button
                                onClick={() => handleCancelAppointment(apt.id)}
                                className="px-3 py-1 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 transition"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600">No appointments for this period</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Availability Management */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Availability Management</h3>
                <p className="text-sm text-gray-600">Set your working hours and time off</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBlockTimeModal(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2 font-medium text-sm"
                >
                  <Plus className="h-5 w-5" />
                  Block Time
                </button>
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2 font-medium text-sm"
                >
                  <Settings className="h-5 w-5" />
                  Set Working Hours
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8 pb-8 border-b border-gray-200">
              <div>
                <p className="text-sm text-gray-600">Working Days</p>
                <p className="text-2xl font-bold text-gray-900">{totalWorkingDays}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Hours/Week</p>
                <p className="text-2xl font-bold text-gray-900">{totalHours}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Hours/Day</p>
                <p className="text-2xl font-bold text-gray-900">{avgHours}</p>
              </div>
            </div>

            {/* Current Working Hours */}
            <div className="mb-8">
              <h4 className="font-medium text-gray-900 mb-4">Current Working Hours</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {schedule.map((day) => (
                  <div key={day.day} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="font-medium text-gray-900 mb-1 text-sm">{day.day}</p>
                    {day.isWorking ? (
                      <p className="text-xs text-gray-600">{day.startTime} - {day.endTime}</p>
                    ) : (
                      <p className="text-xs text-gray-500">Unavailable</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Blocked Dates */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Blocked Dates</h4>

              {blockedDates.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {blockedDates.map((blocked) => (
                    <div
                      key={blocked.id}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-red-200 transition cursor-pointer"
                      onClick={() => handleUnblockDate(blocked.date)}
                    >
                      {blocked.date}
                      <X className="h-3 w-3" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">No blocked dates</p>
              )}
            </div>
          </div>

          {/* Block Time Modal */}
          {showBlockTimeModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Block Time</h2>
                    <p className="text-sm text-gray-600">Mark specific dates as unavailable for appointments</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowBlockTimeModal(false);
                      setSelectedDate(null);
                    }}
                    className="p-1 hover:bg-gray-100 rounded-lg transition"
                  >
                    <X className="h-5 w-5 text-gray-600" />
                  </button>
                </div>

                <div className="p-6">
                  <h3 className="font-medium text-gray-900 mb-4">Select Date</h3>

                  {/* Calendar Navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() =>
                        setCurrentMonth((prev) => ({
                          month: prev.month === 0 ? 11 : prev.month - 1,
                          year: prev.month === 0 ? prev.year - 1 : prev.year
                        }))
                      }
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <ChevronLeft className="h-5 w-5 text-gray-600" />
                    </button>
                    <h4 className="text-center font-semibold text-gray-900 min-w-40">
                      {monthNames[currentMonth.month]} {currentMonth.year}
                    </h4>
                    <button
                      onClick={() =>
                        setCurrentMonth((prev) => ({
                          month: prev.month === 11 ? 0 : prev.month + 1,
                          year: prev.month === 11 ? prev.year + 1 : prev.year
                        }))
                      }
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <ChevronRight className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>

                  {/* Calendar Grid */}
                  <div className="border border-gray-300 rounded-lg p-4">
                    <div className="grid grid-cols-7 gap-2 text-center mb-2">
                      {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                        <div key={day} className="text-xs font-semibold text-gray-600 py-2">
                          {day}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                      {Array.from({ length: getFirstDayOfMonth(currentMonth.month, currentMonth.year) }).map((_, i) => (
                        <div key={`empty-${i}`} className="py-2"></div>
                      ))}
                      {Array.from({ length: getDaysInMonth(currentMonth.month, currentMonth.year) }).map((_, i) => {
                        const date = i + 1;
                        const dateStr = `${monthNames[currentMonth.month].slice(0, 3)} ${date}, ${currentMonth.year}`;
                        const isSelected = selectedDate === dateStr;
                        const blocked = isDateBlocked(dateStr);

                        return (
                          <button
                            key={date}
                            onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                            className={`py-2 rounded text-sm font-medium transition ${
                              isSelected
                                ? "bg-gray-900 text-white"
                                : blocked
                                ? "bg-red-100 text-red-700 border border-red-300"
                                : "text-gray-600 hover:bg-gray-100"
                            }`}
                          >
                            {date}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Status Message */}
                  {selectedDate && isDateBlocked(selectedDate) && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700 font-medium">This date is currently blocked</p>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="flex gap-3 p-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowBlockTimeModal(false);
                      setSelectedDate(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    Cancel
                  </button>
                  {selectedDate && isDateBlocked(selectedDate) ? (
                    <button
                      onClick={() => {
                        handleUnblockDate(toIsoDate(selectedDate));
                        setShowBlockTimeModal(false);
                        setSelectedDate(null);
                      }}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                    >
                      Unlock Date
                    </button>
                  ) : (
                    <button
                      onClick={handleBlockDate}
                      disabled={!selectedDate}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-medium"
                    >
                      Block Date
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Working Hours Settings Modal */}
          {showSettingsModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
                <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b border-gray-200">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Working Hours Settings</h2>
                    <p className="text-sm text-gray-600">Configure your availability for each day of the week</p>
                  </div>
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg transition"
                  >
                    <X className="h-5 w-5 text-gray-600" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  {schedule.map((day) => (
                    <div
                      key={day.day}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{day.day}</p>
                      </div>

                      <button
                        onClick={() => handleToggleWorkDay(day.day)}
                        className="flex items-center"
                      >
                        {day.isWorking ? (
                          <ToggleRight className="h-6 w-6 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-gray-400" />
                        )}
                      </button>

                      {day.isWorking && (
                        <div className="flex items-center gap-2">
                          {editingDay === day.day ? (
                            <>
                              <input
                                type="time"
                                value={tempTime.start}
                                onChange={(e) => setTempTime({ ...tempTime, start: e.target.value })}
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                              <span className="text-gray-600">to</span>
                              <input
                                type="time"
                                value={tempTime.end}
                                onChange={(e) => setTempTime({ ...tempTime, end: e.target.value })}
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                              <button
                                onClick={handleSaveTime}
                                className="px-2 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700"
                              >
                                Save
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded">
                                {day.startTime}
                              </span>
                              <span className="text-gray-400">to</span>
                              <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded">
                                {day.endTime}
                              </span>
                              <button
                                onClick={() => handleEditTime(day.day)}
                                className="text-green-600 hover:text-green-700 text-sm font-medium"
                              >
                                Edit
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      {!day.isWorking && (
                        <p className="text-sm text-gray-500">Unavailable</p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="sticky bottom-0 bg-white flex gap-3 p-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSchedule}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </StaffLayout>
  );
}
