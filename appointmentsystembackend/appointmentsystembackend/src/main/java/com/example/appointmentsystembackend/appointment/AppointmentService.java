package com.example.appointmentsystembackend.appointment;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.appointmentsystembackend.user.Role;
import com.example.appointmentsystembackend.user.User;
import com.example.appointmentsystembackend.user.UserRepository;

@Service
@Transactional
public class AppointmentService {
	private final AppointmentRepository appointmentRepository;
	private final UserRepository userRepository;

	public AppointmentService(AppointmentRepository appointmentRepository, UserRepository userRepository) {
		this.appointmentRepository = appointmentRepository;
		this.userRepository = userRepository;
	}

	public List<AppointmentResponse> listForUser(User user) {
		List<Appointment> appointments;
		if (user.getRole() == Role.ADMIN) {
			appointments = appointmentRepository.findAll();
		} else if (user.getRole() == Role.STAFF) {
			appointments = appointmentRepository.findByStaffId(user.getId());
		} else {
			appointments = appointmentRepository.findByClientId(user.getId());
		}
		return appointments.stream().map(AppointmentResponse::from).toList();
	}

	public AppointmentResponse createAppointment(User client, AppointmentRequest request) {
		User staff = null;
		if (request.staffId() != null && !request.staffId().isBlank()) {
			staff = userRepository.findById(UUID.fromString(request.staffId()))
					.orElseThrow(() -> new IllegalArgumentException("Staff user not found"));
		}
		Appointment appointment = new Appointment(
				client,
				staff,
				request.appointmentType(),
				LocalDate.parse(request.date()),
				LocalTime.parse(request.time()),
				request.location(),
				AppointmentStatus.PENDING,
				request.notes());
		appointmentRepository.save(appointment);
		return AppointmentResponse.from(appointment);
	}

	public AppointmentResponse updateAppointment(User user, UUID id, AppointmentUpdateRequest request) {
		Appointment appointment = appointmentRepository.findById(id)
				.orElseThrow(() -> new IllegalArgumentException("Appointment not found"));

		if (user.getRole() == Role.CLIENT && !appointment.getClient().getId().equals(user.getId())) {
			throw new IllegalArgumentException("Not allowed");
		}

		if (request.status() != null && !request.status().isBlank()) {
			appointment.setStatus(AppointmentStatus.valueOf(request.status().toUpperCase()));
		}
		if (request.date() != null && !request.date().isBlank()) {
			appointment.setDate(LocalDate.parse(request.date()));
		}
		if (request.time() != null && !request.time().isBlank()) {
			appointment.setTime(LocalTime.parse(request.time()));
		}
		if (request.location() != null && !request.location().isBlank()) {
			appointment.setLocation(request.location());
		}
		if (request.notes() != null) {
			appointment.setNotes(request.notes());
		}
		if (request.staffId() != null && !request.staffId().isBlank()) {
			User staff = userRepository.findById(UUID.fromString(request.staffId()))
					.orElseThrow(() -> new IllegalArgumentException("Staff user not found"));
			appointment.setStaff(staff);
		}

		return AppointmentResponse.from(appointment);
	}
}
