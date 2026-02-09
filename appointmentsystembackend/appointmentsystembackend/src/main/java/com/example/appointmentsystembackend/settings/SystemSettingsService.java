package com.example.appointmentsystembackend.settings;

import java.time.LocalTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class SystemSettingsService {
	private final SystemSettingsRepository repository;

	public SystemSettingsService(SystemSettingsRepository repository) {
		this.repository = repository;
	}

	public SystemSettings getSettings() {
		return repository.findById(1L).orElseGet(this::createDefault);
	}

	public SystemSettings update(SystemSettings existing, SystemSettingsUpdateRequest request) {
		existing.setSystemName(request.systemName());
		existing.setSupportEmail(request.supportEmail());
		existing.setMaxAppointmentsPerDay(request.maxAppointmentsPerDay());
		existing.setAppointmentDuration(request.appointmentDuration());
		existing.setAdminNotifications(request.adminNotifications());
		existing.setStaffNotifications(request.staffNotifications());
		existing.setClientNotifications(request.clientNotifications());
		existing.setMaintenanceMode(request.maintenanceMode());
		existing.setAutoBackup(request.autoBackup());
		existing.setBackupTime(LocalTime.parse(request.backupTime()));
		existing.setTwoFactorAuth(request.twoFactorAuth());
		existing.setPasswordExpiry(request.passwordExpiry());
		return repository.save(existing);
	}

	private SystemSettings createDefault() {
		SystemSettings settings = new SystemSettings(1L);
		settings.setSystemName("RRA Appointment System");
		settings.setSupportEmail("support@rra.gov.rw");
		settings.setMaxAppointmentsPerDay(50);
		settings.setAppointmentDuration(30);
		settings.setAdminNotifications(true);
		settings.setStaffNotifications(true);
		settings.setClientNotifications(true);
		settings.setMaintenanceMode(false);
		settings.setAutoBackup(true);
		settings.setBackupTime(LocalTime.of(2, 0));
		settings.setTwoFactorAuth(true);
		settings.setPasswordExpiry(90);
		return repository.save(settings);
	}
}
