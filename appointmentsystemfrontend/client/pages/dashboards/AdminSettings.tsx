import { Settings, Lock, Bell, Eye, Mail, Globe, Zap, AlertCircle, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { api, SystemSettingsResponse } from "@/lib/api";

export default function AdminSettings() {
  const [settings, setSettings] = useState<SystemSettingsResponse | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsePositiveInt = (value: string, fallback: number) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return fallback;
    }
    return parsed;
  };

  const handleChange = (field: string, value: any) => {
    setSettings((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        [field]: value,
      };
    });
    setSaved(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!settings || saving) {
      return;
    }
    if (!settings.systemName.trim()) {
      setError("System name is required.");
      return;
    }
    if (!settings.supportEmail.trim()) {
      setError("Support email is required.");
      return;
    }

    setSaving(true);
    setError(null);
    const { updatedAt, ...payload } = settings;
    try {
      const updated = await api.updateSettings(payload);
      setSettings(updated);
      setLastUpdated(updated.updatedAt);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaved(false);
      setError(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getSettings();
        setSettings(data);
        setLastUpdated(data.updatedAt);
      } catch (err) {
        setSettings(null);
        setError(err instanceof Error ? err.message : "Failed to load settings.");
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-rra-navy mb-2">System Settings</h2>
            <p className="text-gray-600">Manage system configuration and preferences</p>
          </div>

          {/* Success Message */}
          {saved && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-rra-green" />
              <span className="text-sm font-medium text-rra-green">Settings saved successfully!</span>
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium text-red-700">{error}</span>
            </div>
          )}
          {loading && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-sm font-medium text-rra-blue">Loading system settings...</span>
            </div>
          )}

          {/* General Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="h-6 w-6 text-rra-blue" />
              <h3 className="text-xl font-semibold text-rra-navy">General Settings</h3>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">System Name</label>
                <input
                  type="text"
                  value={settings?.systemName || ""}
                  onChange={(e) => handleChange("systemName", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Support Email</label>
                <input
                  type="email"
                  value={settings?.supportEmail || ""}
                  onChange={(e) => handleChange("supportEmail", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Max Appointments per Day</label>
                  <input
                    type="number"
                    value={settings?.maxAppointmentsPerDay ?? 0}
                    onChange={(e) =>
                      handleChange("maxAppointmentsPerDay", parsePositiveInt(e.target.value, settings?.maxAppointmentsPerDay ?? 1))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Appointment Duration (minutes)</label>
                  <input
                    type="number"
                    value={settings?.appointmentDuration ?? 0}
                    onChange={(e) =>
                      handleChange("appointmentDuration", parsePositiveInt(e.target.value, settings?.appointmentDuration ?? 1))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="h-6 w-6 text-rra-blue" />
              <h3 className="text-xl font-semibold text-rra-navy">Notification Settings</h3>
            </div>

            <div className="space-y-4">
              {[
                { key: "adminNotifications", label: "Admin Notifications", description: "Receive notifications about system events" },
                { key: "staffNotifications", label: "Staff Notifications", description: "Notify staff about new appointments" },
                { key: "clientNotifications", label: "Client Notifications", description: "Send confirmations and reminders to clients" }
              ].map((setting) => (
                <div key={setting.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{setting.label}</p>
                    <p className="text-sm text-gray-600">{setting.description}</p>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!settings?.[setting.key as keyof SystemSettingsResponse]}
                      onChange={(e) => handleChange(setting.key, e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-rra-blue focus:ring-2 focus:ring-rra-blue"
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Backup & Maintenance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="h-6 w-6 text-rra-blue" />
              <h3 className="text-xl font-semibold text-rra-navy">Backup & Maintenance</h3>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Automatic Backups</p>
                  <p className="text-sm text-gray-600">Enable automatic daily backups</p>
                </div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!settings?.autoBackup}
                    onChange={(e) => handleChange("autoBackup", e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-rra-blue focus:ring-2 focus:ring-rra-blue"
                  />
                </label>
              </div>

              {settings?.autoBackup && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Backup Time</label>
                  <input
                    type="time"
                    value={settings?.backupTime || "02:00"}
                    onChange={(e) => handleChange("backupTime", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none"
                  />
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    Maintenance Mode
                  </p>
                  <p className="text-sm text-gray-600">System will be unavailable to users</p>
                </div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!settings?.maintenanceMode}
                    onChange={(e) => handleChange("maintenanceMode", e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-2 focus:ring-orange-600"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <Lock className="h-6 w-6 text-rra-blue" />
              <h3 className="text-xl font-semibold text-rra-navy">Security Settings</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-600">Require 2FA for admin accounts</p>
                </div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!settings?.twoFactorAuth}
                    onChange={(e) => handleChange("twoFactorAuth", e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-rra-blue focus:ring-2 focus:ring-rra-blue"
                  />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Password Expiry (days)</label>
                <input
                  type="number"
                  value={settings?.passwordExpiry ?? 0}
                  onChange={(e) =>
                    handleChange("passwordExpiry", parsePositiveInt(e.target.value, settings?.passwordExpiry ?? 1))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none"
                />
                <p className="text-xs text-gray-600 mt-2">
                  Users will be required to change password every {settings?.passwordExpiry ?? 0} days
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : "Not yet updated"}
            </div>
            <button
              onClick={handleSave}
              disabled={loading || saving || !settings}
              className="bg-rra-blue text-white px-6 py-2 rounded-lg hover:opacity-90 transition font-medium"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
