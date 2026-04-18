import { useEffect, useState } from "react";
import { Calendar, Mail, Phone, MapPin, Edit2, AlertCircle } from "lucide-react";
import ClientLayout from "@/components/layout/ClientLayout";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { api, AppointmentResponse, UserProfile } from "@/lib/api";

export default function ClientProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [stats, setStats] = useState({
    today: 0,
    upcoming: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);

        // Load profile
        const profileData = await api.me();
        setProfile(profileData);
        setFormData({
          fullName: profileData.fullName,
          email: profileData.email,
          phone: profileData.phone || "",
        });

        // Load appointments
        const appointmentsData = await api.listAppointments();
        setAppointments(appointmentsData);

        // Calculate stats
        const today = new Date().toISOString().split("T")[0];
        const todayCount = appointmentsData.filter(
          (apt) => apt.date === today
        ).length;
        const upcomingCount = appointmentsData.filter(
          (apt) =>
            apt.date > today &&
            (apt.status === "Confirmed" || apt.status === "CONFIRMED")
        ).length;
        const completedCount = appointmentsData.filter(
          (apt) => apt.status === "Completed" || apt.status === "COMPLETED"
        ).length;

        setStats({
          today: todayCount,
          upcoming: upcomingCount,
          completed: completedCount,
        });
      } catch (err) {
        console.error("Failed to load profile:", err);
        toast({
          title: "Error",
          description: "Failed to load profile information",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [toast]);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      // In a real app, you would call an API endpoint to update the profile
      // For now, we'll just simulate it
      await new Promise((resolve) => setTimeout(resolve, 500));

      setProfile({
        ...profile!,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
      });

      setIsEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (err) {
      console.error("Failed to update profile:", err);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ClientLayout>
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-rra-blue"></div>
              <p className="mt-4 text-gray-600">Loading profile...</p>
            </div>
          </div>
        </div>
      </ClientLayout>
    );
  }

  if (!profile) {
    return (
      <ClientLayout>
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-red-800">Failed to load profile information</p>
            </div>
          </div>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-rra-navy mb-2">My Profile</h1>
            <p className="text-gray-600">
              Manage your personal information and account settings
            </p>
          </div>

          {/* Profile Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6">
              {/* Avatar */}
              <div className="flex items-center justify-center w-24 h-24 bg-rra-navy text-white rounded-full text-3xl font-bold flex-shrink-0">
                {profile.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </div>

              {/* Basic Info */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-rra-navy mb-1">
                  {profile.fullName}
                </h2>
                <p className="text-gray-600 capitalize mb-2">
                  {profile.role} Account
                </p>
                <p className="text-sm text-gray-500">
                  Member since January 2024
                </p>
              </div>

              {/* Edit Button */}
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-rra-blue text-white rounded-lg font-medium hover:bg-rra-navy transition"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit Profile
                </button>
              )}
            </div>

            {/* Personal Information */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-rra-navy mb-4">
                Personal Information
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {isEditing
                  ? "Update your personal details and contact information"
                  : "Your personal details and contact information"}
              </p>

              {isEditing ? (
                // Edit Form
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fullName: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phone: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none"
                      placeholder="+250..."
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="flex-1 bg-rra-blue text-white py-2 px-4 rounded-lg font-medium hover:bg-rra-navy transition disabled:bg-gray-400"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          fullName: profile.fullName,
                          email: profile.email,
                          phone: profile.phone || "",
                        });
                      }}
                      className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Full Name
                    </label>
                    <p className="flex items-center gap-2 text-gray-900">
                      {profile.fullName}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Email
                    </label>
                    <p className="flex items-center gap-2 text-gray-900">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {profile.email}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Phone
                    </label>
                    <p className="flex items-center gap-2 text-gray-900">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {profile.phone || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Account Type
                    </label>
                    <p className="text-gray-900 capitalize">{profile.role}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Appointment Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs uppercase text-gray-500">
                  Today's Appointments
                </p>
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-rra-navy">{stats.today}</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs uppercase text-gray-500">
                  Upcoming
                </p>
                <Calendar className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-3xl font-bold text-rra-navy">
                {stats.upcoming}
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs uppercase text-gray-500">
                  Completed
                </p>
                <Calendar className="h-5 w-5 text-purple-500" />
              </div>
              <p className="text-3xl font-bold text-rra-navy">
                {stats.completed}
              </p>
            </div>
          </div>

          {/* Account Status */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-rra-navy mb-4">
              Account Status
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <p className="font-medium text-green-900">Account Active</p>
                  <p className="text-sm text-green-700">
                    Your account is active and in good standing
                  </p>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div>
                  <p className="font-medium text-blue-900">
                    Two-Factor Authentication
                  </p>
                  <p className="text-sm text-blue-700">Not enabled</p>
                </div>
                <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                  Enable
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    Change Password
                  </p>
                  <p className="text-sm text-gray-600">
                    Update your password regularly
                  </p>
                </div>
                <button className="text-rra-blue hover:text-rra-navy font-medium text-sm">
                  Change
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}
