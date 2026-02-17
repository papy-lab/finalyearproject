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
		return new AppointmentResponse(
				appointment.getId().toString(),
				appointment.getServiceId() != null ? appointment.getServiceId().toString() : null,
				appointment.getAppointmentType(),
				staff != null && staff.getDepartmentId() != null ? staff.getDepartmentId().toString() : null,
				staff != null ? staff.getDepartment() : null,
				appointment.getAppointmentType(),
				appointment.getDate().toString(),
				appointment.getTime().toString(),
				appointment.getLocation(),
				appointment.getStatus().name().toLowerCase(),
				client != null ? client.getFullName() : null,
				client != null ? client.getEmail() : null,
				client != null ? client.getPhone() : null,
				staff != null ? staff.getFullName() : null,
				staff != null ? staff.getEmail() : null);
	}
}
