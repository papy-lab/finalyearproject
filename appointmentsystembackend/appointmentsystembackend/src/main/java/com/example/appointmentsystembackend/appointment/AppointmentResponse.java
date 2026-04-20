package com.example.appointmentsystembackend.appointment;

import com.example.appointmentsystembackend.user.User;

public record AppointmentResponse(
		String id,
		String serviceId,
		String serviceName,
		String departmentId,
		String departmentName,
		String appointmentType,
		String date,
		String time,
		String location,
		String status,
		String clientName,
		String clientEmail,
		String clientPhone,
		String staffName,
		String staffEmail) {
	public static AppointmentResponse from(Appointment appointment) {
		User client = appointment.getClient();
		User staff = appointment.getStaff();
		String serviceName = appointment.getAppointmentType();
		String date = appointment.getDate() != null ? appointment.getDate().toString() : "";
		String time = appointment.getTime() != null ? appointment.getTime().toString() : "";
		String location = appointment.getLocation() != null ? appointment.getLocation() : "";
		String status = appointment.getStatus() != null ? appointment.getStatus().name().toLowerCase() : "pending";

		return new AppointmentResponse(
				appointment.getId().toString(),
				appointment.getServiceId() != null ? appointment.getServiceId().toString() : null,
				serviceName,
				staff != null && staff.getDepartmentId() != null ? staff.getDepartmentId().toString() : null,
				staff != null ? staff.getDepartment() : null,
				appointment.getAppointmentType() != null ? appointment.getAppointmentType() : "Appointment",
				date,
				time,
				location,
				status,
				client != null ? client.getFullName() : null,
				client != null ? client.getEmail() : null,
				client != null ? client.getPhone() : null,
				staff != null ? staff.getFullName() : null,
				staff != null ? staff.getEmail() : null);
	}
}
