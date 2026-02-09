package com.example.appointmentsystembackend.settings;

public record SystemSettingsResponse(
		String systemName,
		String supportEmail,
		int maxAppointmentsPerDay,
		int appointmentDuration,
		boolean adminNotifications,
		boolean staffNotifications,
		boolean clientNotifications,
		boolean maintenanceMode,
		boolean autoBackup,
		String backupTime,
		boolean twoFactorAuth,
		int passwordExpiry,
		String updatedAt) {
	public static SystemSettingsResponse from(SystemSettings settings) {
		return new SystemSettingsResponse(
				settings.getSystemName(),
				settings.getSupportEmail(),
				settings.getMaxAppointmentsPerDay(),
				settings.getAppointmentDuration(),
				settings.isAdminNotifications(),
				settings.isStaffNotifications(),
				settings.isClientNotifications(),
				settings.isMaintenanceMode(),
				settings.isAutoBackup(),
				settings.getBackupTime().toString(),
				settings.isTwoFactorAuth(),
				settings.getPasswordExpiry(),
				settings.getUpdatedAt().toString());
	}
}
