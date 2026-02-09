package com.example.appointmentsystembackend.settings;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record SystemSettingsUpdateRequest(
		@NotBlank String systemName,
		@Email @NotBlank String supportEmail,
		@Positive int maxAppointmentsPerDay,
		@Positive int appointmentDuration,
		boolean adminNotifications,
		boolean staffNotifications,
		boolean clientNotifications,
		boolean maintenanceMode,
		boolean autoBackup,
		@NotBlank String backupTime,
		boolean twoFactorAuth,
		@Positive int passwordExpiry) {
}
