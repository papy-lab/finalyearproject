package com.example.appointmentsystembackend.staff;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.appointmentsystembackend.appointment.AppointmentRepository;
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
	private final PasswordEncoder passwordEncoder;

	public StaffController(UserRepository userRepository, AppointmentRepository appointmentRepository,
			PasswordEncoder passwordEncoder) {
		this.userRepository = userRepository;
		this.appointmentRepository = appointmentRepository;
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
		user.setDepartment(request.department());
		user.setPhone(request.phone());
		userRepository.save(user);
		return new ResponseEntity<>(StaffResponse.from(user, 0L), HttpStatus.CREATED);
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
