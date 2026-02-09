package com.example.appointmentsystembackend.settings;

import java.time.LocalTime;
import java.time.OffsetDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "system_settings")
public class SystemSettings {
	@Id
	private Long id;

	@Column(nullable = false)
	private String systemName;

	@Column(nullable = false)
	private String supportEmail;

	@Column(nullable = false)
	private int maxAppointmentsPerDay;

	@Column(nullable = false)
	private int appointmentDuration;

	@Column(nullable = false)
	private boolean adminNotifications;

	@Column(nullable = false)
	private boolean staffNotifications;

	@Column(nullable = false)
	private boolean clientNotifications;

	@Column(nullable = false)
	private boolean maintenanceMode;

	@Column(nullable = false)
	private boolean autoBackup;

	@Column(nullable = false)
	private LocalTime backupTime;

	@Column(nullable = false)
	private boolean twoFactorAuth;

	@Column(nullable = false)
	private int passwordExpiry;

	@Column(nullable = false)
	private OffsetDateTime updatedAt;

	protected SystemSettings() {
	}

	public SystemSettings(Long id) {
		this.id = id;
	}

	@PrePersist
	public void prePersist() {
		if (id == null) {
			id = 1L;
		}
		updatedAt = OffsetDateTime.now();
	}

	@PreUpdate
	public void preUpdate() {
		updatedAt = OffsetDateTime.now();
	}

	public Long getId() {
		return id;
	}

	public String getSystemName() {
		return systemName;
	}

	public void setSystemName(String systemName) {
		this.systemName = systemName;
	}

	public String getSupportEmail() {
		return supportEmail;
	}

	public void setSupportEmail(String supportEmail) {
		this.supportEmail = supportEmail;
	}

	public int getMaxAppointmentsPerDay() {
		return maxAppointmentsPerDay;
	}

	public void setMaxAppointmentsPerDay(int maxAppointmentsPerDay) {
		this.maxAppointmentsPerDay = maxAppointmentsPerDay;
	}

	public int getAppointmentDuration() {
		return appointmentDuration;
	}

	public void setAppointmentDuration(int appointmentDuration) {
		this.appointmentDuration = appointmentDuration;
	}

	public boolean isAdminNotifications() {
		return adminNotifications;
	}

	public void setAdminNotifications(boolean adminNotifications) {
		this.adminNotifications = adminNotifications;
	}

	public boolean isStaffNotifications() {
		return staffNotifications;
	}

	public void setStaffNotifications(boolean staffNotifications) {
		this.staffNotifications = staffNotifications;
	}

	public boolean isClientNotifications() {
		return clientNotifications;
	}

	public void setClientNotifications(boolean clientNotifications) {
		this.clientNotifications = clientNotifications;
	}

	public boolean isMaintenanceMode() {
		return maintenanceMode;
	}

	public void setMaintenanceMode(boolean maintenanceMode) {
		this.maintenanceMode = maintenanceMode;
	}

	public boolean isAutoBackup() {
		return autoBackup;
	}

	public void setAutoBackup(boolean autoBackup) {
		this.autoBackup = autoBackup;
	}

	public LocalTime getBackupTime() {
		return backupTime;
	}

	public void setBackupTime(LocalTime backupTime) {
		this.backupTime = backupTime;
	}

	public boolean isTwoFactorAuth() {
		return twoFactorAuth;
	}

	public void setTwoFactorAuth(boolean twoFactorAuth) {
		this.twoFactorAuth = twoFactorAuth;
	}

	public int getPasswordExpiry() {
		return passwordExpiry;
	}

	public void setPasswordExpiry(int passwordExpiry) {
		this.passwordExpiry = passwordExpiry;
	}

	public OffsetDateTime getUpdatedAt() {
		return updatedAt;
	}
}
