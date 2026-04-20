package com.example.appointmentsystembackend.feedback;

import java.time.OffsetDateTime;
import java.util.UUID;

public class FeedbackResponse {
	private UUID id;
	private UUID appointmentId;
	private String serviceName;
	private String appointmentType;
	private String appointmentDate;
	private String appointmentTime;
	private UUID staffId;
	private String staffName;
	private UUID clientId;
	private String clientName;
	private int rating;
	private String comment;
	private OffsetDateTime createdAt;

	public FeedbackResponse(UUID id, UUID appointmentId, String serviceName, String appointmentType, String appointmentDate,
			String appointmentTime, UUID staffId, String staffName, UUID clientId, String clientName, int rating,
			String comment, OffsetDateTime createdAt) {
		this.id = id;
		this.appointmentId = appointmentId;
		this.serviceName = serviceName;
		this.appointmentType = appointmentType;
		this.appointmentDate = appointmentDate;
		this.appointmentTime = appointmentTime;
		this.staffId = staffId;
		this.staffName = staffName;
		this.clientId = clientId;
		this.clientName = clientName;
		this.rating = rating;
		this.comment = comment;
		this.createdAt = createdAt;
	}

	public static FeedbackResponse from(Feedback feedback) {
		return new FeedbackResponse(
				feedback.getId(),
				feedback.getAppointment().getId(),
				feedback.getAppointment().getAppointmentType(),
				feedback.getAppointment().getAppointmentType(),
				feedback.getAppointment().getDate().toString(),
				feedback.getAppointment().getTime().toString(),
				feedback.getStaff().getId(),
				feedback.getStaff().getFullName(),
				feedback.getClient().getId(),
				feedback.getClient().getFullName(),
				feedback.getRating(),
				feedback.getComment(),
				feedback.getCreatedAt());
	}

	public UUID getId() {
		return id;
	}

	public UUID getAppointmentId() {
		return appointmentId;
	}

	public String getServiceName() {
		return serviceName;
	}

	public String getAppointmentType() {
		return appointmentType;
	}

	public String getAppointmentDate() {
		return appointmentDate;
	}

	public String getAppointmentTime() {
		return appointmentTime;
	}

	public UUID getStaffId() {
		return staffId;
	}

	public String getStaffName() {
		return staffName;
	}

	public UUID getClientId() {
		return clientId;
	}

	public String getClientName() {
		return clientName;
	}

	public int getRating() {
		return rating;
	}

	public String getComment() {
		return comment;
	}

	public OffsetDateTime getCreatedAt() {
		return createdAt;
	}
}
