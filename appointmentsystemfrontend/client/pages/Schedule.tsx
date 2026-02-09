import { Link, useNavigate } from "react-router-dom";
import { MapPin, ArrowLeft, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import ClientLayout from "@/components/layout/ClientLayout";
import { api } from "@/lib/api";

const APPOINTMENT_TYPES = [
  { id: "tax-consultation", label: "Tax Consultation", description: "Get expert advice on tax matters" },
  { id: "license-renewal", label: "License Renewal", description: "Renew your business license" },
  { id: "compliance-review", label: "Compliance Review", description: "Review compliance status" },
  { id: "annual-filing", label: "Annual Filing", description: "Submit your annual filing" },
  { id: "document-submission", label: "Document Submission", description: "Submit required documents" },
  { id: "audit-meeting", label: "Audit Meeting", description: "Discuss audit matters" }
];

const OFFICE_LOCATIONS = [
  { id: "kicukiro", name: "Kicukiro Office", address: "Kicukiro, Kigali" },
  { id: "main", name: "Main Office", address: "Central Business District, Kigali" },
  { id: "north", name: "Northern Office", address: "Northern Region, Rwanda" },
  { id: "south", name: "Southern Office", address: "Southern Region, Rwanda" }
];

const TIME_SLOTS = [
  "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "01:00 PM", "01:30 PM", "02:00 PM",
  "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM"
];

export default function Schedule() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);

  // Form state
  const [appointmentType, setAppointmentType] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedOffice, setSelectedOffice] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const isStepValid = () => {
    switch(step) {
      case 1:
        return appointmentType;
      case 2:
        return selectedDate && selectedTime;
      case 3:
        return selectedOffice;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (isStepValid()) {
      setStep(step + 1);
    } else {
      toast({
        title: "Please complete this step",
        description: "All fields are required to proceed",
        variant: "destructive",
      });
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = () => {
    if (!appointmentType || !selectedDate || !selectedTime || !selectedOffice) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const submitAppointment = async () => {
      try {
        await api.createAppointment({
          appointmentType: getAppointmentTypeLabel(),
          date: selectedDate,
          time: to24HourTime(selectedTime),
          location: getOfficeLabel(),
          notes,
        });
        setSubmitted(true);
        toast({
          title: "Success",
          description: "Your appointment has been booked successfully!",
        });
        setTimeout(() => {
          navigate("/appointments");
        }, 2000);
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to book appointment",
          variant: "destructive",
        });
      }
    };

    submitAppointment();
  };

  const getAppointmentTypeLabel = () => {
    return APPOINTMENT_TYPES.find(t => t.id === appointmentType)?.label || "";
  };

  const getOfficeLabel = () => {
    return OFFICE_LOCATIONS.find(o => o.id === selectedOffice)?.name || "";
  };

  const to24HourTime = (time: string) => {
    const [clock, meridiem] = time.split(" ");
    const [rawHours, rawMinutes] = clock.split(":");
    let hours = Number(rawHours);
    const minutes = Number(rawMinutes);
    if (meridiem === "PM" && hours < 12) {
      hours += 12;
    }
    if (meridiem === "AM" && hours === 12) {
      hours = 0;
    }
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  if (submitted) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="bg-white rounded-2xl shadow-xl p-12 max-w-md text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 rounded-full p-4">
              <Check className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-rra-navy mb-3">Appointment Confirmed!</h2>
          <p className="text-gray-600 mb-2">Your appointment has been successfully booked.</p>
          <div className="bg-blue-50 rounded-lg p-4 my-6 text-left text-sm">
            <p className="mb-2"><strong className="text-rra-navy">Type:</strong> {getAppointmentTypeLabel()}</p>
            <p className="mb-2"><strong className="text-rra-navy">Date:</strong> {selectedDate}</p>
            <p className="mb-2"><strong className="text-rra-navy">Time:</strong> {selectedTime}</p>
            <p><strong className="text-rra-navy">Location:</strong> {getOfficeLabel()}</p>
          </div>
          <p className="text-gray-600 text-sm mb-6">Redirecting to appointments...</p>
          <button
            onClick={() => navigate("/appointments")}
            className="w-full bg-rra-blue text-white py-2 rounded-lg font-medium hover:bg-rra-navy transition"
          >
            View My Appointments
          </button>
        </div>
      </div>
    );
  }

  return (
    <ClientLayout>
      <div className="p-4 sm:p-8">
          <div className="max-w-2xl mx-auto">
            {/* Page Header */}
            <div className="mb-8 flex items-center gap-4">
              <Link
                to="/dashboard"
                className="p-2 hover:bg-gray-200 rounded-lg transition"
              >
                <ArrowLeft className="h-6 w-6 text-gray-600" />
              </Link>
              <div>
                <h2 className="text-3xl font-bold text-rra-navy">Book an Appointment</h2>
                <p className="text-gray-600 mt-1">Step {step} of 4</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-8 flex gap-2">
              {[1, 2, 3, 4].map((num) => (
                <div
                  key={num}
                  className={`flex-1 h-2 rounded-full transition ${
                    num <= step ? "bg-rra-blue" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>

            {/* Step 1: Appointment Type */}
            {step === 1 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
                <h3 className="text-xl font-semibold text-rra-navy mb-6">What type of appointment do you need?</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {APPOINTMENT_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setAppointmentType(type.id)}
                      className={`p-4 rounded-lg border-2 text-left transition ${
                        appointmentType === type.id
                          ? "border-rra-blue bg-blue-50"
                          : "border-gray-200 hover:border-rra-blue"
                      }`}
                    >
                      <p className="font-semibold text-rra-navy">{type.label}</p>
                      <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Date & Time */}
            {step === 2 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
                <h3 className="text-xl font-semibold text-rra-navy mb-6">When would you like to meet?</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                    <input
                      type="date"
                      min={getMinDate()}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">Please select a date at least 1 day in advance</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Select Time</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {TIME_SLOTS.map((time) => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`py-2 px-3 rounded-lg text-sm font-medium transition ${
                            selectedTime === time
                              ? "bg-rra-blue text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Office Location */}
            {step === 3 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
                <h3 className="text-xl font-semibold text-rra-navy mb-6">Where would you like to meet?</h3>
                <div className="space-y-3">
                  {OFFICE_LOCATIONS.map((office) => (
                    <button
                      key={office.id}
                      onClick={() => setSelectedOffice(office.id)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition ${
                        selectedOffice === office.id
                          ? "border-rra-blue bg-blue-50"
                          : "border-gray-200 hover:border-rra-blue"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <MapPin className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                          selectedOffice === office.id ? "text-rra-blue" : "text-gray-400"
                        }`} />
                        <div>
                          <p className="font-semibold text-rra-navy">{office.name}</p>
                          <p className="text-sm text-gray-600">{office.address}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Review & Notes */}
            {step === 4 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
                <h3 className="text-xl font-semibold text-rra-navy mb-6">Review Your Appointment</h3>

                {/* Summary */}
                <div className="bg-blue-50 rounded-lg p-6 mb-6 border border-blue-200">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Appointment Type</p>
                      <p className="font-semibold text-rra-navy">{getAppointmentTypeLabel()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Date & Time</p>
                      <p className="font-semibold text-rra-navy">{selectedDate} at {selectedTime}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600 mb-1">Location</p>
                      <p className="font-semibold text-rra-navy">{getOfficeLabel()}</p>
                    </div>
                  </div>
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any additional information or requirements..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none resize-none"
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 justify-between">
              <button
                onClick={handlePrevious}
                disabled={step === 1}
                className={`px-6 py-3 rounded-lg font-medium transition ${
                  step === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Previous
              </button>

              {step < 4 ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-rra-blue text-white rounded-lg font-medium hover:bg-rra-navy transition"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition flex items-center gap-2"
                >
                  <Check className="h-5 w-5" />
                  Confirm Booking
                </button>
              )}
            </div>
          </div>
      </div>
    </ClientLayout>
  );
}
