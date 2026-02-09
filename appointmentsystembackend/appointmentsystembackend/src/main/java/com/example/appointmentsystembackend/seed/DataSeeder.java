package com.example.appointmentsystembackend.seed;

import java.time.LocalDate;
import java.time.LocalTime;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.example.appointmentsystembackend.appointment.Appointment;
import com.example.appointmentsystembackend.appointment.AppointmentRepository;
import com.example.appointmentsystembackend.appointment.AppointmentStatus;
import com.example.appointmentsystembackend.notification.Notification;
import com.example.appointmentsystembackend.notification.NotificationRepository;
import com.example.appointmentsystembackend.notification.NotificationType;
import com.example.appointmentsystembackend.user.Role;
import com.example.appointmentsystembackend.user.User;
import com.example.appointmentsystembackend.user.UserRepository;

@Component
public class DataSeeder implements CommandLineRunner {
	private final UserRepository userRepository;
	private final AppointmentRepository appointmentRepository;
	private final NotificationRepository notificationRepository;
	private final PasswordEncoder passwordEncoder;

	public DataSeeder(UserRepository userRepository, AppointmentRepository appointmentRepository,
			NotificationRepository notificationRepository, PasswordEncoder passwordEncoder) {
		this.userRepository = userRepository;
		this.appointmentRepository = appointmentRepository;
		this.notificationRepository = notificationRepository;
		this.passwordEncoder = passwordEncoder;
	}

	@Override
	public void run(String... args) {
		if (userRepository.count() > 0) {
			return;
		}

		User client = new User("client@rra.gov.rw", "Jean Niyibizi",
				passwordEncoder.encode("demo123"), Role.CLIENT);
		client.setPhone("+250 788 123 456");

		User staff = new User("staff@rra.gov.rw", "Marie Uwase",
				passwordEncoder.encode("demo123"), Role.STAFF);
		staff.setDepartment("Scheduling");
		staff.setPhone("+250 787 234 567");

		User admin = new User("admin@rra.gov.rw", "Director Admin",
				passwordEncoder.encode("demo123"), Role.ADMIN);
		admin.setDepartment("Administration");
		admin.setPhone("+250 786 345 678");

		userRepository.save(client);
		userRepository.save(staff);
		userRepository.save(admin);

		appointmentRepository.save(new Appointment(
				client,
				staff,
				"Tax Consultation",
				LocalDate.now().plusDays(2),
				LocalTime.of(10, 0),
				"Kicukiro Office",
				AppointmentStatus.CONFIRMED,
				"Bring tax records"));

		appointmentRepository.save(new Appointment(
				client,
				staff,
				"License Renewal",
				LocalDate.now().plusDays(7),
				LocalTime.of(14, 30),
				"Kicukiro Office",
				AppointmentStatus.PENDING,
				null));

		appointmentRepository.save(new Appointment(
				client,
				staff,
				"Annual Filing",
				LocalDate.now().plusDays(12),
				LocalTime.of(15, 0),
				"Main Office",
				AppointmentStatus.CONFIRMED,
				null));

		notificationRepository.save(new Notification(
				client,
				NotificationType.REMINDER,
				"Appointment Reminder",
				"Your Tax Consultation appointment is in 2 days.",
				false));

		notificationRepository.save(new Notification(
				client,
				NotificationType.CONFIRMATION,
				"Appointment Confirmed",
				"Your License Renewal appointment has been confirmed.",
				true));

		notificationRepository.save(new Notification(
				client,
				NotificationType.ALERT,
				"Action Required",
				"Please provide additional documents for your Annual Filing appointment.",
				true));
	}
}
