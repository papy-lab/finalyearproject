package com.example.appointmentsystembackend.schedule;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.appointmentsystembackend.user.Role;
import com.example.appointmentsystembackend.user.User;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/staff/schedule")
@Validated
public class StaffScheduleController {
	private final StaffScheduleService service;

	public StaffScheduleController(StaffScheduleService service) {
		this.service = service;
	}

	@GetMapping
	public ResponseEntity<List<WorkScheduleResponse>> getSchedule() {
		User staff = requireStaff();
		List<WorkScheduleResponse> response = service.getOrCreateSchedule(staff).stream()
				.map(WorkScheduleResponse::from)
				.toList();
		return ResponseEntity.ok(response);
	}

	@PutMapping
	public ResponseEntity<List<WorkScheduleResponse>> updateSchedule(
			@Valid @RequestBody List<WorkScheduleRequest> requests) {
		User staff = requireStaff();
		List<WorkScheduleResponse> response = service.updateSchedule(staff, requests).stream()
				.map(WorkScheduleResponse::from)
				.toList();
		return ResponseEntity.ok(response);
	}

	@GetMapping("/blocked")
	public ResponseEntity<List<BlockedDateResponse>> listBlockedDates() {
		User staff = requireStaff();
		List<BlockedDateResponse> response = service.listBlockedDates(staff).stream()
				.map(BlockedDateResponse::from)
				.toList();
		return ResponseEntity.ok(response);
	}

	@PostMapping("/blocked")
	public ResponseEntity<BlockedDateResponse> addBlockedDate(
			@Valid @RequestBody BlockedDateRequest request) {
		User staff = requireStaff();
		return ResponseEntity.ok(BlockedDateResponse.from(service.addBlockedDate(staff, request)));
	}

	@DeleteMapping("/blocked/{id}")
	public ResponseEntity<Void> deleteBlockedDate(@PathVariable String id) {
		User staff = requireStaff();
		service.removeBlockedDate(staff, id);
		return ResponseEntity.noContent().build();
	}

	private User requireStaff() {
		User user = currentUser();
		if (user.getRole() != Role.STAFF) {
			throw new AccessDeniedException("Staff role required");
		}
		return user;
	}

	private User currentUser() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		return (User) authentication.getPrincipal();
	}
}
