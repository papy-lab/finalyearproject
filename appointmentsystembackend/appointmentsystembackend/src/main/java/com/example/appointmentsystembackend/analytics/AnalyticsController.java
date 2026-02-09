package com.example.appointmentsystembackend.analytics;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.appointmentsystembackend.user.Role;
import com.example.appointmentsystembackend.user.User;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {
	private final AnalyticsService analyticsService;

	public AnalyticsController(AnalyticsService analyticsService) {
		this.analyticsService = analyticsService;
	}

	@GetMapping("/admin/reports")
	public ResponseEntity<AdminReportsResponse> adminReports(
			@RequestParam(defaultValue = "month") String range,
			@RequestParam(defaultValue = "all") String department) {
		requireRole(Role.ADMIN);
		return ResponseEntity.ok(analyticsService.getAdminReports(range, department));
	}

	@GetMapping("/staff/performance")
	public ResponseEntity<StaffPerformanceResponse> staffPerformance() {
		User staff = requireRole(Role.STAFF);
		return ResponseEntity.ok(analyticsService.getStaffPerformance(staff));
	}

	@GetMapping("/staff/hours")
	public ResponseEntity<StaffHoursResponse> staffHours() {
		User staff = requireRole(Role.STAFF);
		return ResponseEntity.ok(analyticsService.getStaffHours(staff));
	}

	@GetMapping("/client/history")
	public ResponseEntity<ClientHistoryResponse> clientHistory(@RequestParam(defaultValue = "2024") int year) {
		User client = requireRole(Role.CLIENT);
		return ResponseEntity.ok(analyticsService.getClientHistory(client, year));
	}

	private User requireRole(Role role) {
		User user = currentUser();
		if (user.getRole() != role) {
			throw new AccessDeniedException(role.name() + " role required");
		}
		return user;
	}

	private User currentUser() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		return (User) authentication.getPrincipal();
	}
}
