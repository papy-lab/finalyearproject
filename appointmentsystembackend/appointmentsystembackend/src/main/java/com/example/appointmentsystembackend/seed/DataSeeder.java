package com.example.appointmentsystembackend.seed;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.example.appointmentsystembackend.appointment.Appointment;
import com.example.appointmentsystembackend.appointment.AppointmentRepository;
import com.example.appointmentsystembackend.appointment.AppointmentStatus;
import com.example.appointmentsystembackend.department.Department;
import com.example.appointmentsystembackend.department.DepartmentRepository;
import com.example.appointmentsystembackend.department.DepartmentType;
import com.example.appointmentsystembackend.notification.Notification;
import com.example.appointmentsystembackend.notification.NotificationRepository;
import com.example.appointmentsystembackend.notification.NotificationType;
import com.example.appointmentsystembackend.servicecatalog.ServiceCatalog;
import com.example.appointmentsystembackend.servicecatalog.ServiceCatalogRepository;
import com.example.appointmentsystembackend.user.Role;
import com.example.appointmentsystembackend.user.User;
import com.example.appointmentsystembackend.user.UserRepository;

@Component
public class DataSeeder implements CommandLineRunner {
	private final UserRepository userRepository;
	private final AppointmentRepository appointmentRepository;
	private final DepartmentRepository departmentRepository;
	private final ServiceCatalogRepository serviceCatalogRepository;
	private final NotificationRepository notificationRepository;
	private final PasswordEncoder passwordEncoder;

	public DataSeeder(UserRepository userRepository, AppointmentRepository appointmentRepository,
			DepartmentRepository departmentRepository, ServiceCatalogRepository serviceCatalogRepository,
			NotificationRepository notificationRepository, PasswordEncoder passwordEncoder) {
		this.userRepository = userRepository;
		this.appointmentRepository = appointmentRepository;
		this.departmentRepository = departmentRepository;
		this.serviceCatalogRepository = serviceCatalogRepository;
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

		Department scheduling = departmentRepository.save(new Department(
				"Scheduling",
				"Handles appointment planning and coordination.",
				DepartmentType.OPERATIONAL));

		Department compliance = departmentRepository.save(new Department(
				"Compliance",
				"Supports tax compliance services and reviews.",
				DepartmentType.SUPPORT));

		ServiceCatalog taxConsultation = serviceCatalogRepository.save(new ServiceCatalog(
				"Tax Consultation",
				"Get expert advice on tax matters",
				scheduling.getId(),
				"Bring tax records and national ID"));

		ServiceCatalog licenseRenewal = serviceCatalogRepository.save(new ServiceCatalog(
				"License Renewal",
				"Renew your business license",
				compliance.getId(),
				"Business registration and expiring license"));

		ServiceCatalog annualFiling = serviceCatalogRepository.save(new ServiceCatalog(
				"Annual Filing",
				"Submit your annual filing",
				compliance.getId(),
				"Financial statements and declaration forms"));

		User staff = new User("staff@rra.gov.rw", "Marie Uwase",
				passwordEncoder.encode("demo123"), Role.STAFF);
		staff.setDepartmentId(scheduling.getId());
		staff.setDepartment(scheduling.getName());
		staff.setServiceId(taxConsultation.getId());
		staff.setServiceName(taxConsultation.getName());
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
				taxConsultation.getId(),
				taxConsultation.getName(),
				LocalDate.now().plusDays(2),
				LocalTime.of(10, 0),
				"Kicukiro Office",
				AppointmentStatus.CONFIRMED,
				"Bring tax records"));

		appointmentRepository.save(new Appointment(
				client,
				staff,
				licenseRenewal.getId(),
				licenseRenewal.getName(),
				LocalDate.now().plusDays(7),
				LocalTime.of(14, 30),
				"Kicukiro Office",
				AppointmentStatus.PENDING,
				null));

		appointmentRepository.save(new Appointment(
				client,
				staff,
				annualFiling.getId(),
				annualFiling.getName(),
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
