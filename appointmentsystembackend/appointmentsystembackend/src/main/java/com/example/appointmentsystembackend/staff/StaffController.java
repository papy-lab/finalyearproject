package com.example.appointmentsystembackend.staff;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.appointmentsystembackend.appointment.Appointment;
import com.example.appointmentsystembackend.appointment.AppointmentRepository;
import com.example.appointmentsystembackend.department.Department;
import com.example.appointmentsystembackend.department.DepartmentRepository;
import com.example.appointmentsystembackend.schedule.BlockedDateRepository;
import com.example.appointmentsystembackend.schedule.WorkScheduleRepository;
import com.example.appointmentsystembackend.servicecatalog.ServiceCatalog;
import com.example.appointmentsystembackend.servicecatalog.ServiceCatalogRepository;
import com.example.appointmentsystembackend.user.Role;
import com.example.appointmentsystembackend.user.User;
import com.example.appointmentsystembackend.user.UserRepository;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/staff")
@Validated
public class StaffController {
	private final UserRepository userRepository;
	private final AppointmentRepository appointmentRepository;
	private final DepartmentRepository departmentRepository;
	private final ServiceCatalogRepository serviceCatalogRepository;
	private final WorkScheduleRepository workScheduleRepository;
	private final BlockedDateRepository blockedDateRepository;
	private final PasswordEncoder passwordEncoder;

	public StaffController(UserRepository userRepository, AppointmentRepository appointmentRepository,
			DepartmentRepository departmentRepository, ServiceCatalogRepository serviceCatalogRepository,
			WorkScheduleRepository workScheduleRepository, BlockedDateRepository blockedDateRepository,
			PasswordEncoder passwordEncoder) {
		this.userRepository = userRepository;
		this.appointmentRepository = appointmentRepository;
		this.departmentRepository = departmentRepository;
		this.serviceCatalogRepository = serviceCatalogRepository;
		this.workScheduleRepository = workScheduleRepository;
		this.blockedDateRepository = blockedDateRepository;
		this.passwordEncoder = passwordEncoder;
	}

	@GetMapping
	public ResponseEntity<List<StaffResponse>> list() {
		requireAdmin();
		List<StaffResponse> staff = userRepository.findAll().stream()
				.filter(user -> user.getRole() == Role.STAFF)
				.map(user -> StaffResponse.from(user, appointmentRepository.countByStaffId(user.getId())))
				.toList();
		return ResponseEntity.ok(staff);
	}

	@PostMapping
	public ResponseEntity<StaffResponse> create(@Valid @RequestBody StaffRequest request) {
		requireAdmin();
		if (userRepository.existsByEmail(request.email())) {
			throw new IllegalArgumentException("Email already registered");
		}
		User user = new User(request.email(), request.fullName(),
				passwordEncoder.encode(request.password()), Role.STAFF);
		applyDepartmentAndService(user, request.departmentId(), request.serviceId(), request.department());
		user.setPhone(request.phone());
		userRepository.save(user);
		return new ResponseEntity<>(StaffResponse.from(user, 0L), HttpStatus.CREATED);
	}

	@PatchMapping("/{id}")
	public ResponseEntity<StaffResponse> update(@PathVariable UUID id, @Valid @RequestBody StaffUpdateRequest request) {
		requireAdmin();
		User user = userRepository.findById(id)
				.orElseThrow(() -> new IllegalArgumentException("Staff user not found"));
		if (user.getRole() != Role.STAFF) {
			throw new IllegalArgumentException("User is not staff");
		}
		user.setEmail(request.email());
		user.setFullName(request.fullName());
		user.setPhone(request.phone());
		if (request.active() != null) {
			user.setActive(request.active());
		}
		applyDepartmentAndService(user, request.departmentId(), request.serviceId(), request.department());
		userRepository.save(user);
		return ResponseEntity.ok(StaffResponse.from(user, appointmentRepository.countByStaffId(user.getId())));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable UUID id) {
		requireAdmin();
		User user = userRepository.findById(id)
				.orElseThrow(() -> new IllegalArgumentException("Staff user not found"));
		if (user.getRole() != Role.STAFF) {
			throw new IllegalArgumentException("User is not staff");
		}

		List<Appointment> assignedAppointments = appointmentRepository.findByStaffId(user.getId());
		if (!assignedAppointments.isEmpty()) {
			assignedAppointments.forEach(appointment -> appointment.setStaff(null));
			appointmentRepository.saveAll(assignedAppointments);
		}
		// Remove dependent schedule records before deleting staff user.
		workScheduleRepository.deleteAll(workScheduleRepository.findByStaffId(user.getId()));
		blockedDateRepository.deleteAll(blockedDateRepository.findByStaffId(user.getId()));

		userRepository.delete(user);
		return ResponseEntity.noContent().build();
	}

	private void applyDepartmentAndService(User user, String departmentId, String serviceId, String fallbackDepartmentName) {
		Department department = resolveDepartment(departmentId);
		ServiceCatalog service = resolveService(serviceId);
		if (service != null) {
			if (department == null) {
				department = departmentRepository.findById(service.getDepartmentId())
						.orElseThrow(() -> new IllegalArgumentException("Department not found for selected service"));
			} else if (!service.getDepartmentId().equals(department.getId())) {
				throw new IllegalArgumentException("Selected service does not belong to selected department");
			}
			user.setServiceId(service.getId());
			user.setServiceName(service.getName());
		} else {
			user.setServiceId(null);
			user.setServiceName(null);
		}
		if (department != null) {
			user.setDepartmentId(department.getId());
			user.setDepartment(department.getName());
		} else {
			user.setDepartmentId(null);
			user.setDepartment(fallbackDepartmentName);
		}
	}

	private Department resolveDepartment(String departmentId) {
		if (departmentId == null || departmentId.isBlank()) {
			return null;
		}
		return departmentRepository.findById(java.util.UUID.fromString(departmentId))
				.orElseThrow(() -> new IllegalArgumentException("Department not found"));
	}

	private ServiceCatalog resolveService(String serviceId) {
		if (serviceId == null || serviceId.isBlank()) {
			return null;
		}
		return serviceCatalogRepository.findById(java.util.UUID.fromString(serviceId))
				.orElseThrow(() -> new IllegalArgumentException("Service not found"));
	}

	private void requireAdmin() {
		User user = currentUser();
		if (user.getRole() != Role.ADMIN) {
			throw new AccessDeniedException("Admin role required");
		}
	}

	private User currentUser() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		return (User) authentication.getPrincipal();
	}
}
