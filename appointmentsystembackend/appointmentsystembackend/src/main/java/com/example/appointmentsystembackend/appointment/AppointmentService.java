package com.example.appointmentsystembackend.appointment;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.DayOfWeek;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.appointmentsystembackend.department.Department;
import com.example.appointmentsystembackend.department.DepartmentRepository;
import com.example.appointmentsystembackend.notification.EmailService;
import com.example.appointmentsystembackend.notification.Notification;
import com.example.appointmentsystembackend.notification.NotificationRepository;
import com.example.appointmentsystembackend.notification.NotificationType;
import com.example.appointmentsystembackend.servicecatalog.ServiceCatalog;
import com.example.appointmentsystembackend.servicecatalog.ServiceCatalogRepository;
import com.example.appointmentsystembackend.user.Role;
import com.example.appointmentsystembackend.user.User;
import com.example.appointmentsystembackend.user.UserRepository;

@Service
@Transactional
public class AppointmentService {
	private static final LocalTime WORK_START = LocalTime.of(8, 0);
	private static final LocalTime WORK_END = LocalTime.of(17, 0);

	private final AppointmentRepository appointmentRepository;
	private final UserRepository userRepository;
	private final ServiceCatalogRepository serviceCatalogRepository;
	private final DepartmentRepository departmentRepository;
	private final NotificationRepository notificationRepository;
	private final EmailService emailService;

	public AppointmentService(AppointmentRepository appointmentRepository, UserRepository userRepository,
			ServiceCatalogRepository serviceCatalogRepository, DepartmentRepository departmentRepository,
			NotificationRepository notificationRepository, EmailService emailService) {
		this.appointmentRepository = appointmentRepository;
		this.userRepository = userRepository;
		this.serviceCatalogRepository = serviceCatalogRepository;
		this.departmentRepository = departmentRepository;
		this.notificationRepository = notificationRepository;
		this.emailService = emailService;
	}

	public List<AppointmentResponse> listForUser(User user) {
		List<Appointment> appointments;
		if (user.getRole() == Role.ADMIN) {
			appointments = appointmentRepository.findAll();
		} else if (user.getRole() == Role.STAFF) {
			appointments = listForStaffScope(user);
		} else {
			appointments = appointmentRepository.findByClientId(user.getId());
		}
		return appointments.stream().map(AppointmentResponse::from).toList();
	}

	private List<Appointment> listForStaffScope(User staff) {
		if (staff.getServiceId() != null) {
			return appointmentRepository.findByServiceId(staff.getServiceId());
		}
		if (staff.getDepartmentId() != null) {
			List<UUID> departmentServiceIds = serviceCatalogRepository.findByDepartmentId(staff.getDepartmentId())
					.stream()
					.map(ServiceCatalog::getId)
					.toList();
			if (!departmentServiceIds.isEmpty()) {
				return appointmentRepository.findByServiceIdIn(departmentServiceIds);
			}
		}
		return List.of();
	}

	public AppointmentResponse createAppointment(User client, AppointmentRequest request) {
		ServiceCatalog selectedService = resolveService(request);
		User staff = resolveAssignedStaff(request, selectedService);
		String location = resolveLocation(request, selectedService, staff);
		LocalDate appointmentDate = LocalDate.parse(request.date());
		LocalTime appointmentTime = LocalTime.parse(request.time());
		validateWorkingDayAndHours(appointmentDate, appointmentTime);
		Appointment appointment = new Appointment(
				client,
				staff,
				selectedService.getId(),
				selectedService.getName(),
				appointmentDate,
				appointmentTime,
				location,
				AppointmentStatus.PENDING,
				request.notes());
		appointmentRepository.save(appointment);
		createClientNotification(
				client,
				NotificationType.CONFIRMATION,
				"Appointment Submitted",
				String.format("Your %s appointment on %s at %s has been submitted and is pending review.",
						selectedService.getName(),
						appointmentDate,
						appointmentTime));
		return AppointmentResponse.from(appointment);
	}

	private ServiceCatalog resolveService(AppointmentRequest request) {
		if (request.serviceId() == null || request.serviceId().isBlank()) {
			throw new IllegalArgumentException("Service is required");
		}
		ServiceCatalog service = serviceCatalogRepository.findById(UUID.fromString(request.serviceId()))
				.orElseThrow(() -> new IllegalArgumentException("Service not found"));
		if (!service.isActive()) {
			throw new IllegalArgumentException("Selected service is not available");
		}
		return service;
	}

	private User resolveAssignedStaff(AppointmentRequest request, ServiceCatalog selectedService) {
		if (request.staffId() != null && !request.staffId().isBlank()) {
			User requestedStaff = userRepository.findById(UUID.fromString(request.staffId()))
					.orElseThrow(() -> new IllegalArgumentException("Staff user not found"));
			if (requestedStaff.getRole() != Role.STAFF || !requestedStaff.isActive()) {
				throw new IllegalArgumentException("Staff user not available");
			}
			validateStaffMatchesServiceDepartment(requestedStaff, selectedService);
			return requestedStaff;
		}

		return chooseBestStaffForService(selectedService)
				.orElseThrow(() -> new IllegalArgumentException(
						"No active staff available in the selected service department"));
	}

	private java.util.Optional<User> chooseBestStaffForService(ServiceCatalog selectedService) {
		List<User> departmentStaff = new ArrayList<>(userRepository.findByRoleAndActiveTrueAndDepartmentId(
				Role.STAFF,
				selectedService.getDepartmentId()));
		departmentRepository.findById(selectedService.getDepartmentId())
				.map(Department::getName)
				.ifPresent(departmentName -> departmentStaff.addAll(
						userRepository.findByRoleAndActiveTrueAndDepartmentIgnoreCase(Role.STAFF, departmentName)));
		// Legacy fallback: staff may have no department fields but have a serviceId in the same department.
		departmentStaff.addAll(userRepository.findByRoleAndActiveTrue(Role.STAFF).stream()
				.filter(staff -> staff.getServiceId() != null)
				.filter(staff -> serviceCatalogRepository.findById(staff.getServiceId())
						.map(staffService -> selectedService.getDepartmentId().equals(staffService.getDepartmentId()))
						.orElse(false))
				.toList());
		List<User> uniqueStaff = new ArrayList<>(departmentStaff.stream()
				.collect(java.util.stream.Collectors.toMap(
						User::getId,
						staff -> staff,
						(existing, ignored) -> existing,
						LinkedHashMap::new))
				.values());
		return uniqueStaff.stream()
				.filter(staff -> staffBelongsToServiceDepartment(staff, selectedService))
				.min(Comparator
						.comparingLong((User staff) -> appointmentRepository.countByStaffId(staff.getId()))
						.thenComparing(User::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder()))
						.thenComparing(User::getId, Comparator.nullsLast(Comparator.naturalOrder())));
	}

	private void validateStaffMatchesServiceDepartment(User staff, ServiceCatalog selectedService) {
		if (!staffBelongsToServiceDepartment(staff, selectedService)) {
			throw new IllegalArgumentException("Selected staff does not belong to the service department");
		}
	}

	private boolean staffBelongsToServiceDepartment(User staff, ServiceCatalog selectedService) {
		if (staff.getDepartmentId() != null && staff.getDepartmentId().equals(selectedService.getDepartmentId())) {
			return true;
		}
		if (staff.getDepartment() != null && !staff.getDepartment().isBlank()) {
			Department serviceDepartment = departmentRepository.findById(selectedService.getDepartmentId()).orElse(null);
			if (serviceDepartment != null && staff.getDepartment().trim().equalsIgnoreCase(serviceDepartment.getName())) {
				return true;
			}
		}
		if (staff.getServiceId() != null) {
			return serviceCatalogRepository.findById(staff.getServiceId())
					.map(service -> selectedService.getDepartmentId().equals(service.getDepartmentId()))
					.orElse(false);
		}
		return false;
	}

	private String resolveLocation(AppointmentRequest request, ServiceCatalog selectedService, User assignedStaff) {
		if (request != null && request.location() != null && !request.location().isBlank()) {
			return request.location();
		}
		if (assignedStaff != null && assignedStaff.getDepartment() != null && !assignedStaff.getDepartment().isBlank()) {
			return assignedStaff.getDepartment();
		}
		Department department = departmentRepository.findById(selectedService.getDepartmentId()).orElse(null);
		return department != null ? department.getName() : "Main Office";
	}

	public AppointmentResponse updateAppointment(User user, UUID id, AppointmentUpdateRequest request) {
		Appointment appointment = appointmentRepository.findById(id)
				.orElseThrow(() -> new IllegalArgumentException("Appointment not found"));

		if (user.getRole() == Role.CLIENT && !appointment.getClient().getId().equals(user.getId())) {
			throw new IllegalArgumentException("Not allowed");
		}

		AppointmentStatus previousStatus = appointment.getStatus();
		AppointmentStatus requestedStatus = null;
		if (request.status() != null && !request.status().isBlank()) {
			requestedStatus = AppointmentStatus.valueOf(request.status().toUpperCase());
			appointment.setStatus(requestedStatus);
		}
		if (request.date() != null && !request.date().isBlank()) {
			appointment.setDate(LocalDate.parse(request.date()));
		}
		if (request.time() != null && !request.time().isBlank()) {
			appointment.setTime(LocalTime.parse(request.time()));
		}
		if ((request.date() != null && !request.date().isBlank()) || (request.time() != null && !request.time().isBlank())) {
			validateWorkingDayAndHours(appointment.getDate(), appointment.getTime());
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
			ServiceCatalog service = serviceCatalogRepository.findById(appointment.getServiceId())
					.orElseThrow(() -> new IllegalArgumentException("Service not found"));
			if (staff.getRole() != Role.STAFF || !staff.isActive()) {
				throw new IllegalArgumentException("Staff user not available");
			}
			validateStaffMatchesServiceDepartment(staff, service);
			appointment.setStaff(staff);
		}
		if (appointment.getStaff() == null && appointment.getServiceId() != null) {
			ServiceCatalog service = serviceCatalogRepository.findById(appointment.getServiceId()).orElse(null);
			if (service != null) {
				chooseBestStaffForService(service).ifPresent(appointment::setStaff);
			}
		}

		if (requestedStatus != null && requestedStatus != previousStatus
				&& (requestedStatus == AppointmentStatus.COMPLETED
						|| requestedStatus == AppointmentStatus.CANCELLED)) {
			emailService.sendAppointmentStatusEmail(appointment, requestedStatus);
		}
		if (requestedStatus != null && requestedStatus != previousStatus) {
			createStatusNotification(appointment, requestedStatus);
		}

		return AppointmentResponse.from(appointment);
	}

	public int autoAssignUnassignedAppointments() {
		List<Appointment> unassignedAppointments = appointmentRepository.findByStaffIsNull();
		List<Appointment> updatedAppointments = new ArrayList<>();
		int assignedCount = 0;
		for (Appointment appointment : unassignedAppointments) {
			ServiceCatalog service = resolveServiceForExistingAppointment(appointment);
			if (service == null || !service.isActive()) {
				continue;
			}
			java.util.Optional<User> staff = chooseBestStaffForService(service);
			if (staff.isPresent()) {
				appointment.setStaff(staff.get());
				if (appointment.getLocation() == null || appointment.getLocation().isBlank()
						|| "Unassigned".equalsIgnoreCase(appointment.getLocation())) {
					appointment.setLocation(resolveLocation(null, service, staff.get()));
				}
				updatedAppointments.add(appointment);
				assignedCount++;
			}
		}
		if (!updatedAppointments.isEmpty()) {
			appointmentRepository.saveAll(updatedAppointments);
		}
		return assignedCount;
	}

	private ServiceCatalog resolveServiceForExistingAppointment(Appointment appointment) {
		if (appointment.getServiceId() != null) {
			ServiceCatalog byId = serviceCatalogRepository.findById(appointment.getServiceId()).orElse(null);
			if (byId != null) {
				return byId;
			}
		}
		String appointmentType = appointment.getAppointmentType();
		if (appointmentType == null || appointmentType.isBlank()) {
			return null;
		}
		ServiceCatalog byName = serviceCatalogRepository.findFirstByNameIgnoreCaseAndActiveTrue(appointmentType).orElse(null);
		if (byName != null) {
			return byName;
		}
		String normalizedType = normalizeLabel(appointmentType);
		return serviceCatalogRepository.findByActiveTrueOrderByNameAsc().stream()
				.filter(service -> normalizeLabel(service.getName()).equals(normalizedType))
				.findFirst()
				.orElse(null);
	}

	private String normalizeLabel(String value) {
		return value == null ? "" : value.trim().toLowerCase().replaceAll("[^a-z0-9]+", " ");
	}

	private void createStatusNotification(Appointment appointment, AppointmentStatus status) {
		User client = appointment.getClient();
		if (client == null) {
			return;
		}
		String title;
		String message;
		NotificationType type;
		switch (status) {
			case CONFIRMED, SCHEDULED -> {
				title = "Appointment Approved";
				message = String.format("Your %s appointment on %s at %s has been approved.",
						appointment.getAppointmentType(), appointment.getDate(), appointment.getTime());
				type = NotificationType.CONFIRMATION;
			}
			case COMPLETED -> {
				title = "Appointment Completed";
				message = String.format("Your %s appointment on %s was marked as completed.",
						appointment.getAppointmentType(), appointment.getDate());
				type = NotificationType.INFO;
			}
			case CANCELLED -> {
				title = "Appointment Rejected";
				message = String.format("Your %s appointment on %s at %s was rejected/cancelled.",
						appointment.getAppointmentType(), appointment.getDate(), appointment.getTime());
				type = NotificationType.ALERT;
			}
			default -> {
				title = "Appointment Updated";
				message = String.format("Your %s appointment status changed to %s.",
						appointment.getAppointmentType(), status.name().toLowerCase());
				type = NotificationType.INFO;
			}
		}
		createClientNotification(client, type, title, message);
	}

	private void createClientNotification(User client, NotificationType type, String title, String message) {
		notificationRepository.save(new Notification(client, type, title, message, false));
	}

	private void validateWorkingDayAndHours(LocalDate date, LocalTime time) {
		DayOfWeek day = date.getDayOfWeek();
		if (day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY) {
			throw new IllegalArgumentException("Weekend appointments are not allowed. Please choose Monday to Friday.");
		}
		if (time.isBefore(WORK_START) || time.isAfter(WORK_END)) {
			throw new IllegalArgumentException("Appointment time must be within working hours (08:00 - 17:00).");
		}
	}
}
