package com.example.appointmentsystembackend.analytics;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Month;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.example.appointmentsystembackend.appointment.Appointment;
import com.example.appointmentsystembackend.appointment.AppointmentRepository;
import com.example.appointmentsystembackend.appointment.AppointmentStatus;
import com.example.appointmentsystembackend.appointment.AppointmentService;
import com.example.appointmentsystembackend.department.DepartmentRepository;
import com.example.appointmentsystembackend.feedback.Feedback;
import com.example.appointmentsystembackend.feedback.FeedbackRepository;
import com.example.appointmentsystembackend.notification.Notification;
import com.example.appointmentsystembackend.notification.NotificationRepository;
import com.example.appointmentsystembackend.schedule.BlockedDateRepository;
import com.example.appointmentsystembackend.schedule.StaffScheduleService;
import com.example.appointmentsystembackend.schedule.WorkSchedule;
import com.example.appointmentsystembackend.servicecatalog.ServiceCatalog;
import com.example.appointmentsystembackend.servicecatalog.ServiceCatalogRepository;
import com.example.appointmentsystembackend.settings.SystemSettingsService;
import com.example.appointmentsystembackend.user.Role;
import com.example.appointmentsystembackend.user.User;
import com.example.appointmentsystembackend.user.UserRepository;

@Service
public class AnalyticsService {
	private final AppointmentRepository appointmentRepository;
	private final AppointmentService appointmentService;
	private final UserRepository userRepository;
	private final FeedbackRepository feedbackRepository;
	private final ServiceCatalogRepository serviceCatalogRepository;
	private final DepartmentRepository departmentRepository;
	private final NotificationRepository notificationRepository;
	private final SystemSettingsService settingsService;
	private final StaffScheduleService staffScheduleService;
	private final BlockedDateRepository blockedDateRepository;

	public AnalyticsService(AppointmentRepository appointmentRepository, AppointmentService appointmentService,
			UserRepository userRepository,
			FeedbackRepository feedbackRepository, ServiceCatalogRepository serviceCatalogRepository,
			DepartmentRepository departmentRepository,
			NotificationRepository notificationRepository,
			SystemSettingsService settingsService,
			StaffScheduleService staffScheduleService, BlockedDateRepository blockedDateRepository) {
		this.appointmentRepository = appointmentRepository;
		this.appointmentService = appointmentService;
		this.userRepository = userRepository;
		this.feedbackRepository = feedbackRepository;
		this.serviceCatalogRepository = serviceCatalogRepository;
		this.departmentRepository = departmentRepository;
		this.notificationRepository = notificationRepository;
		this.settingsService = settingsService;
		this.staffScheduleService = staffScheduleService;
		this.blockedDateRepository = blockedDateRepository;
	}

	public AdminReportsResponse getAdminReports(String range, String department) {
		try {
			appointmentService.autoAssignUnassignedAppointments();
		} catch (Exception ignored) {
			// Keep report endpoint resilient even if backfill hits legacy bad rows.
		}

		LocalDate today = LocalDate.now();
		boolean allTime = "all".equalsIgnoreCase(range);
		LocalDate startDate = switch (range) {
			case "week" -> today.minusDays(7);
			case "quarter" -> today.minusDays(90);
			case "year" -> today.minusDays(365);
			default -> today.minusDays(30);
		};

		List<Appointment> allAppointments = appointmentRepository.findAll();
		List<Appointment> graphAppointments = allAppointments.stream()
				.filter(apt -> "all".equalsIgnoreCase(department) || department.equalsIgnoreCase(resolveDepartmentForReport(apt)))
				.toList();

		List<Appointment> appointments = allAppointments.stream()
				.filter(apt -> allTime || (!apt.getDate().isBefore(startDate) && !apt.getDate().isAfter(today)))
				.filter(apt -> {
					if ("all".equalsIgnoreCase(department)) {
						return true;
					}
					return department.equalsIgnoreCase(resolveDepartmentForReport(apt));
				})
				.toList();

		long totalAppointments = appointments.size();
		long approvedAppointments = graphAppointments.stream().filter(this::isApprovedStatus).count();
		long rejectedAppointments = graphAppointments.stream().filter(this::isRejectedStatus).count();
		long pendingAppointments = graphAppointments.stream().filter(apt -> apt.getStatus() == AppointmentStatus.PENDING).count();
		long totalAppointmentsForGraphs = graphAppointments.size();
		double approvedRate = totalAppointmentsForGraphs == 0 ? 0 : (approvedAppointments * 100.0 / totalAppointmentsForGraphs);
		long assignedAppointments = appointments.stream().filter(apt -> resolveAssignedStaffForReport(apt) != null).count();
		long unassignedAppointments = totalAppointments - assignedAppointments;

		List<User> users = userRepository.findAll();
		long totalUsers = users.size();
		long totalClients = users.stream().filter(user -> user.getRole() == Role.CLIENT).count();
		long totalStaff = users.stream().filter(user -> user.getRole() == Role.STAFF).count();
		long totalAdmins = users.stream().filter(user -> user.getRole() == Role.ADMIN).count();
		long activeUsers = users.stream().filter(User::isActive).count();

		List<com.example.appointmentsystembackend.department.Department> departments = departmentRepository.findAll();
		long totalDepartments = departments.size();
		long activeDepartments = departments.stream().filter(com.example.appointmentsystembackend.department.Department::isActive)
				.count();

		List<ServiceCatalog> services = serviceCatalogRepository.findAll();
		long totalServices = services.size();
		long activeServices = services.stream().filter(ServiceCatalog::isActive).count();

		List<Notification> notifications = notificationRepository.findAll();
		long totalNotifications = notifications.size();
		long unreadNotifications = notifications.stream().filter(notification -> !notification.isRead()).count();

		double averageFeedbackRating = feedbackRepository.findAll().stream()
				.mapToInt(Feedback::getRating)
				.average()
				.orElse(0);

		List<AdminReportsResponse.StatusCount> statusBreakdown = List.of(
				new AdminReportsResponse.StatusCount("Approved", approvedAppointments),
				new AdminReportsResponse.StatusCount("Rejected", rejectedAppointments),
				new AdminReportsResponse.StatusCount("Pending", pendingAppointments));

		LocalDate trendStartDate = graphAppointments.stream()
				.map(Appointment::getDate)
				.min(LocalDate::compareTo)
				.orElse(today.minusDays(6));
		LocalDate trendEndDate = graphAppointments.stream()
				.map(Appointment::getDate)
				.max(LocalDate::compareTo)
				.orElse(today);
		if (trendEndDate.isBefore(trendStartDate)) {
			trendEndDate = trendStartDate;
		}
		Map<LocalDate, Long> completedByDate = graphAppointments.stream()
				.filter(apt -> apt.getStatus() == AppointmentStatus.COMPLETED)
				.collect(Collectors.groupingBy(Appointment::getDate, Collectors.counting()));
		List<AdminReportsResponse.DayCount> weeklyTrend = trendStartDate.datesUntil(trendEndDate.plusDays(1))
				.map(date -> new AdminReportsResponse.DayCount(
						date.toString(),
						completedByDate.getOrDefault(date, 0L)))
				.toList();

		Map<String, Long> departmentCounts = appointments.stream()
				.collect(Collectors.groupingBy(this::resolveDepartmentForReport, Collectors.counting()));
		List<AdminReportsResponse.DepartmentCount> departmentBreakdown = departmentCounts.entrySet().stream()
				.sorted(Map.Entry.<String, Long>comparingByValue().reversed())
				.map(entry -> new AdminReportsResponse.DepartmentCount(entry.getKey(), entry.getValue()))
				.toList();

		Map<String, List<Appointment>> appointmentsByStaff = new LinkedHashMap<>();
		Map<String, User> staffByKey = new LinkedHashMap<>();
		for (Appointment appointment : appointments) {
			User staff = resolveAssignedStaffForReport(appointment);
			if (staff == null) {
				continue;
			}
			String key = staff.getId() != null ? staff.getId().toString() : (staff.getEmail() != null ? staff.getEmail() : staff.getFullName());
			if (key == null || key.isBlank()) {
				continue;
			}
			staffByKey.putIfAbsent(key, staff);
			appointmentsByStaff.computeIfAbsent(key, ignored -> new ArrayList<>()).add(appointment);
		}
		List<AdminReportsResponse.StaffWorkload> staffWorkload = appointmentsByStaff.entrySet().stream()
				.map(entry -> {
					User staff = staffByKey.get(entry.getKey());
					List<Appointment> staffAppointments = entry.getValue();
					long total = staffAppointments.size();
					long approved = staffAppointments.stream().filter(this::isApprovedStatus).count();
					long rejected = staffAppointments.stream().filter(this::isRejectedStatus).count();
					long pending = staffAppointments.stream().filter(apt -> apt.getStatus() == AppointmentStatus.PENDING).count();
					String staffName = staff != null && staff.getFullName() != null ? staff.getFullName() : "Unknown Staff";
					String staffDepartment = staff != null && staff.getDepartment() != null && !staff.getDepartment().isBlank()
							? staff.getDepartment()
							: "General";
					return new AdminReportsResponse.StaffWorkload(
							staffName,
							staffDepartment,
							total,
							approved,
							rejected,
							pending);
				})
				.sorted(Comparator.comparingLong(AdminReportsResponse.StaffWorkload::total).reversed())
				.toList();

		List<AdminReportsResponse.AppointmentReportItem> appointmentRows = allAppointments.stream()
				.sorted(Comparator.comparing(Appointment::getDate).reversed()
						.thenComparing(Appointment::getTime).reversed())
				.map(apt -> {
					String reportStatus;
					if (isApprovedStatus(apt)) {
						reportStatus = "Approved";
					} else if (isRejectedStatus(apt)) {
						reportStatus = "Rejected";
					} else {
						reportStatus = "Pending";
					}
					User resolvedStaff = resolveAssignedStaffForReport(apt);
					return new AdminReportsResponse.AppointmentReportItem(
							apt.getId().toString(),
							apt.getDate().toString(),
							apt.getTime().toString(),
							reportStatus,
							apt.getAppointmentType(),
							resolveDepartmentForReport(apt),
							apt.getClient() != null ? apt.getClient().getFullName() : "Unknown Client",
							apt.getClient() != null ? apt.getClient().getEmail() : "-",
							resolvedStaff != null ? resolvedStaff.getFullName() : "Unassigned",
							resolvedStaff != null ? resolvedStaff.getEmail() : "-");
				})
				.toList();

		return new AdminReportsResponse(
				new AdminReportsResponse.Metrics(totalAppointments, approvedAppointments, rejectedAppointments,
						pendingAppointments, roundOneDecimal(approvedRate), assignedAppointments, unassignedAppointments),
				new AdminReportsResponse.SystemSnapshot(
						totalUsers,
						totalClients,
						totalStaff,
						totalAdmins,
						activeUsers,
						totalDepartments,
						activeDepartments,
						totalServices,
						activeServices,
						totalNotifications,
						unreadNotifications,
						roundOneDecimal(averageFeedbackRating)),
				statusBreakdown,
				weeklyTrend,
				departmentBreakdown,
				staffWorkload,
				appointmentRows);
	}

	public AdminDashboardResponse getAdminDashboard() {
		LocalDate today = LocalDate.now();
		LocalDate startDate = today.minusDays(7);

		List<Appointment> allAppointments = appointmentRepository.findAll();
		List<Appointment> recentAppointments = allAppointments.stream()
				.filter(apt -> !apt.getDate().isBefore(startDate) && !apt.getDate().isAfter(today))
				.toList();

		long totalAppointments = allAppointments.size();
		long completed = allAppointments.stream().filter(apt -> apt.getStatus() == AppointmentStatus.COMPLETED).count();
		double completionRate = totalAppointments == 0 ? 0 : (completed * 100.0 / totalAppointments);

		double avgWaitMinutes = allAppointments.stream()
				.mapToDouble(apt -> {
					LocalDateTime appointmentTime = apt.getDate().atTime(apt.getTime());
					long minutes = java.time.Duration.between(apt.getCreatedAt().toLocalDateTime(), appointmentTime).toMinutes();
					return Math.max(minutes, 0);
				})
				.average()
				.orElse(0);

		long activeStaff = userRepository.findAll().stream()
				.filter(user -> user.getRole() == Role.STAFF)
				.filter(User::isActive)
				.count();

		Map<DayOfWeek, Long> weekdayCounts = recentAppointments.stream()
				.collect(Collectors.groupingBy(apt -> apt.getDate().getDayOfWeek(), Collectors.counting()));
		List<AdminDashboardResponse.DayCount> weeklyTrend = List.of(
				DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY,
				DayOfWeek.FRIDAY, DayOfWeek.SATURDAY, DayOfWeek.SUNDAY).stream()
				.map(day -> new AdminDashboardResponse.DayCount(
						day.getDisplayName(TextStyle.SHORT, Locale.ENGLISH),
						weekdayCounts.getOrDefault(day, 0L)))
				.toList();

		List<AdminDashboardResponse.SystemStatus> systemStatus = List.of(
				new AdminDashboardResponse.SystemStatus("Database", "Operational", "good"),
				new AdminDashboardResponse.SystemStatus("Email Service", "Active", "good"),
				new AdminDashboardResponse.SystemStatus("Backups", "Pending", "warn"));

		List<AdminDashboardResponse.ActivityItem> recentActivity = appointmentRepository.findAll().stream()
				.sorted(Comparator.comparing(Appointment::getCreatedAt).reversed())
				.limit(4)
				.map(apt -> new AdminDashboardResponse.ActivityItem(
						"New appointment booked",
						apt.getClient() != null ? apt.getClient().getFullName() : "Client",
						formatTimeAgo(apt.getCreatedAt().toLocalDateTime())))
				.filter(item -> Objects.nonNull(item.user()))
				.toList();

		return new AdminDashboardResponse(
				new AdminDashboardResponse.Metrics(totalAppointments, activeStaff,
						roundOneDecimal(avgWaitMinutes), roundOneDecimal(completionRate)),
				weeklyTrend,
				systemStatus,
				recentActivity);
	}

	public StaffPerformanceResponse getStaffPerformance(User staff) {
		List<Appointment> staffAppointments = appointmentRepository.findByStaffId(staff.getId());
		long total = staffAppointments.size();
		long completed = staffAppointments.stream().filter(apt -> apt.getStatus() == AppointmentStatus.COMPLETED).count();
		long cancelled = staffAppointments.stream().filter(apt -> apt.getStatus() == AppointmentStatus.CANCELLED).count();
		double completionRate = total == 0 ? 0 : (completed * 100.0 / total);
		double onTimeRate = total == 0 ? 0 : ((total - cancelled) * 100.0 / total);
		List<Feedback> feedback = feedbackRepository.findByStaffId(staff.getId());
		double avgRating = feedback.stream().mapToInt(Feedback::getRating).average().orElse(0);

		LocalDate startMonth = YearMonth.now().minusMonths(7).atDay(1);
		LocalDate endMonth = YearMonth.now().plusMonths(1).atDay(1);
		List<StaffPerformanceResponse.MonthlyCount> monthlyCounts = startMonth.datesUntil(endMonth)
				.filter(date -> date.getDayOfMonth() == 1)
				.map(date -> {
					YearMonth ym = YearMonth.from(date);
					long count = staffAppointments.stream()
							.filter(apt -> YearMonth.from(apt.getDate()).equals(ym))
							.count();
					return new StaffPerformanceResponse.MonthlyCount(
							ym.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH),
							count);
				})
				.toList();

		Map<Integer, Long> ratingCounts = feedback.stream()
				.collect(Collectors.groupingBy(Feedback::getRating, Collectors.counting()));
		List<StaffPerformanceResponse.RatingCount> distribution = List.of(5, 4, 3, 2, 1).stream()
				.map(rating -> new StaffPerformanceResponse.RatingCount(rating, ratingCounts.getOrDefault(rating, 0L)))
				.toList();

		Map<String, Long> serviceCounts = staffAppointments.stream()
				.collect(Collectors.groupingBy(Appointment::getAppointmentType, Collectors.counting()));
		List<StaffPerformanceResponse.ServiceCount> serviceBreakdown = serviceCounts.entrySet().stream()
				.sorted(Map.Entry.<String, Long>comparingByValue().reversed())
				.map(entry -> new StaffPerformanceResponse.ServiceCount(
						entry.getKey(),
						entry.getValue(),
						total == 0 ? 0 : (int) Math.round(entry.getValue() * 100.0 / total)))
				.toList();

		List<StaffPerformanceResponse.Achievement> achievements = buildAchievements(total, completionRate, avgRating);

		List<StaffPerformanceResponse.PerformanceComparison> comparisons = buildComparisons(staff, total, completionRate,
				avgRating, onTimeRate);

		List<StaffPerformanceResponse.RecentFeedback> recentFeedback = feedback.stream()
				.sorted(Comparator.comparing(Feedback::getCreatedAt).reversed())
				.limit(4)
				.map(entry -> new StaffPerformanceResponse.RecentFeedback(
						entry.getClient().getFullName(),
						entry.getRating(),
						entry.getComment(),
						entry.getCreatedAt().toLocalDate().toString()))
				.toList();

		return new StaffPerformanceResponse(
				new StaffPerformanceResponse.StaffMetrics(total, roundOneDecimal(completionRate),
						roundOneDecimal(avgRating), roundOneDecimal(onTimeRate)),
				monthlyCounts,
				distribution,
				serviceBreakdown,
				achievements,
				comparisons,
				recentFeedback);
	}

	public ClientHistoryResponse getClientHistory(User client, int year) {
		List<Appointment> clientAppointments = appointmentRepository.findByClientId(client.getId());
		int durationMinutes = settingsService.getSettings().getAppointmentDuration();

		List<Appointment> completed = clientAppointments.stream()
				.filter(apt -> apt.getStatus() == AppointmentStatus.COMPLETED)
				.toList();
		List<Appointment> cancelled = clientAppointments.stream()
				.filter(apt -> apt.getStatus() == AppointmentStatus.CANCELLED)
				.toList();

		double avgRating = completed.stream()
				.map(apt -> feedbackRepository.findByAppointmentId(apt.getId()).map(Feedback::getRating).orElse(0))
				.filter(rating -> rating > 0)
				.mapToInt(Integer::intValue)
				.average()
				.orElse(0);

		List<ClientHistoryResponse.CompletedAppointment> completedResponse = completed.stream()
				.map(apt -> {
					int rating = feedbackRepository.findByAppointmentId(apt.getId())
							.map(Feedback::getRating)
							.orElse(0);
					return new ClientHistoryResponse.CompletedAppointment(
							apt.getId().toString(),
							apt.getDate().toString(),
							apt.getTime().toString(),
							apt.getAppointmentType(),
							durationMinutes + " min",
							apt.getStaff() != null ? apt.getStaff().getFullName() : "Unassigned",
							apt.getNotes() == null ? "No notes" : apt.getNotes(),
							rating);
				})
				.toList();

		List<ClientHistoryResponse.CancelledAppointment> cancelledResponse = cancelled.stream()
				.map(apt -> new ClientHistoryResponse.CancelledAppointment(
						apt.getId().toString(),
						apt.getDate().toString(),
						apt.getAppointmentType(),
						apt.getNotes() == null ? "Cancelled" : apt.getNotes(),
						false))
				.toList();

		Map<Month, Long> monthlyCounts = completed.stream()
				.filter(apt -> apt.getDate().getYear() == year)
				.collect(Collectors.groupingBy(apt -> apt.getDate().getMonth(), Collectors.counting()));
		List<ClientHistoryResponse.MonthlyCount> monthlyBreakdown = List.of(Month.values()).stream()
				.map(month -> new ClientHistoryResponse.MonthlyCount(
						month.getDisplayName(TextStyle.FULL, Locale.ENGLISH),
						monthlyCounts.getOrDefault(month, 0L)))
				.toList();

		return new ClientHistoryResponse(
				new ClientHistoryResponse.HistoryStats(
						completed.size(),
						cancelled.size(),
						durationMinutes,
						roundOneDecimal(avgRating)),
				completedResponse,
				cancelledResponse,
				monthlyBreakdown);
	}

	public StaffHoursResponse getStaffHours(User staff) {
		List<WorkSchedule> schedule = staffScheduleService.getOrCreateSchedule(staff);
		List<StaffHoursResponse.ScheduleEntry> scheduleEntries = schedule.stream()
				.map(entry -> new StaffHoursResponse.ScheduleEntry(
						entry.getDayOfWeek(),
						entry.getStartTime().toString(),
						entry.getEndTime().toString(),
						entry.isWorking()))
				.toList();

		List<StaffHoursResponse.BlockedEntry> blockedEntries = blockedDateRepository.findByStaffId(staff.getId()).stream()
				.map(entry -> new StaffHoursResponse.BlockedEntry(
						entry.getId().toString(),
						entry.getDate().toString(),
						entry.getReason()))
				.toList();

		LocalDate today = LocalDate.now();
		List<Appointment> staffAppointments = appointmentRepository.findByStaffId(staff.getId());
		List<StaffHoursResponse.StaffAppointment> appointmentResponses = staffAppointments.stream()
				.filter(apt -> apt.getStatus() != AppointmentStatus.CANCELLED)
				.map(apt -> {
					String status;
					if (apt.getStatus() == AppointmentStatus.COMPLETED) {
						status = "completed";
					} else if (apt.getDate().isEqual(today)) {
						status = "today";
					} else if (apt.getDate().isAfter(today)) {
						status = "upcoming";
					} else {
						status = "completed";
					}
					return new StaffHoursResponse.StaffAppointment(
							apt.getId().toString(),
							apt.getClient().getFullName(),
							apt.getAppointmentType(),
							apt.getDate().toString(),
							apt.getTime().toString(),
							apt.getLocation(),
							status,
							apt.getNotes());
				})
				.sorted(Comparator.comparing(StaffHoursResponse.StaffAppointment::date))
				.toList();

		long todayCount = appointmentResponses.stream().filter(apt -> "today".equals(apt.status())).count();
		long upcomingCount = appointmentResponses.stream().filter(apt -> "upcoming".equals(apt.status())).count();
		long completedCount = appointmentResponses.stream().filter(apt -> "completed".equals(apt.status())).count();

		return new StaffHoursResponse(
				scheduleEntries,
				blockedEntries,
				appointmentResponses,
				new StaffHoursResponse.StaffAppointmentStats(todayCount, upcomingCount, completedCount));
	}

	private List<StaffPerformanceResponse.Achievement> buildAchievements(long total, double completionRate,
			double avgRating) {
		List<StaffPerformanceResponse.Achievement> achievements = new java.util.ArrayList<>();
		String date = YearMonth.now().getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH) + " "
				+ LocalDate.now().getYear();
		if (avgRating >= 4.8) {
			achievements.add(new StaffPerformanceResponse.Achievement("Perfect Score", date, "5-star rating streak"));
		}
		if (completionRate >= 95) {
			achievements.add(new StaffPerformanceResponse.Achievement("Efficiency", date, "95%+ completion rate"));
		}
		if (total >= 100) {
			achievements.add(new StaffPerformanceResponse.Achievement("Milestone", date, "100+ appointments"));
		}
		if (total >= 50) {
			achievements.add(new StaffPerformanceResponse.Achievement("Top Performer", date, "High workload handled"));
		}
		return achievements;
	}

	private List<StaffPerformanceResponse.PerformanceComparison> buildComparisons(User staff, long total,
			double completionRate, double avgRating, double onTimeRate) {
		List<User> staffUsers = userRepository.findAll().stream()
				.filter(user -> user.getRole() == Role.STAFF)
				.toList();
		Map<String, Double> averages = new LinkedHashMap<>();
		averages.put("Appointments", staffUsers.stream()
				.mapToLong(user -> appointmentRepository.findByStaffId(user.getId()).size())
				.average()
				.orElse(0));
		averages.put("Completion Rate", staffUsers.stream()
				.mapToDouble(user -> {
					List<Appointment> appointments = appointmentRepository.findByStaffId(user.getId());
					long totalAppointments = appointments.size();
					long completed = appointments.stream().filter(apt -> apt.getStatus() == AppointmentStatus.COMPLETED).count();
					return totalAppointments == 0 ? 0 : (completed * 100.0 / totalAppointments);
				})
				.average()
				.orElse(0));
		averages.put("Client Rating", staffUsers.stream()
				.mapToDouble(user -> feedbackRepository.findByStaffId(user.getId()).stream()
						.mapToInt(Feedback::getRating).average().orElse(0))
				.average()
				.orElse(0));
		averages.put("On-Time Rate", staffUsers.stream()
				.mapToDouble(user -> {
					List<Appointment> appointments = appointmentRepository.findByStaffId(user.getId());
					long totalAppointments = appointments.size();
					long cancelled = appointments.stream().filter(apt -> apt.getStatus() == AppointmentStatus.CANCELLED).count();
					return totalAppointments == 0 ? 0 : ((totalAppointments - cancelled) * 100.0 / totalAppointments);
				})
				.average()
				.orElse(0));

		return List.of(
				new StaffPerformanceResponse.PerformanceComparison("Appointments", total, averages.get("Appointments")),
				new StaffPerformanceResponse.PerformanceComparison("Completion Rate", roundOneDecimal(completionRate),
						roundOneDecimal(averages.get("Completion Rate"))),
				new StaffPerformanceResponse.PerformanceComparison("Client Rating", roundOneDecimal(avgRating),
						roundOneDecimal(averages.get("Client Rating"))),
				new StaffPerformanceResponse.PerformanceComparison("On-Time Rate", roundOneDecimal(onTimeRate),
						roundOneDecimal(averages.get("On-Time Rate"))));
	}

	private double roundOneDecimal(double value) {
		return Math.round(value * 10.0) / 10.0;
	}

	private boolean isApprovedStatus(Appointment appointment) {
		AppointmentStatus status = appointment.getStatus();
		return status == AppointmentStatus.CONFIRMED
				|| status == AppointmentStatus.SCHEDULED
				|| status == AppointmentStatus.COMPLETED;
	}

	private boolean isRejectedStatus(Appointment appointment) {
		return appointment.getStatus() == AppointmentStatus.CANCELLED;
	}

	private String resolveDepartmentForReport(Appointment appointment) {
		User resolvedStaff = resolveAssignedStaffForReport(appointment);
		if (resolvedStaff != null && resolvedStaff.getDepartment() != null
				&& !resolvedStaff.getDepartment().isBlank()) {
			return resolvedStaff.getDepartment();
		}
		ServiceCatalog service = resolveServiceForReport(appointment);
		if (service != null && service.getDepartmentId() != null) {
			return departmentRepository.findById(service.getDepartmentId())
					.map(dept -> dept.getName())
					.orElse("Unknown Department");
		}
		return "Unassigned";
	}

	private User resolveAssignedStaffForReport(Appointment appointment) {
		try {
			if (appointment.getStaff() != null) {
				return appointment.getStaff();
			}
			ServiceCatalog service = resolveServiceForReport(appointment);
			if (service == null || service.getDepartmentId() == null) {
				return null;
			}
			List<User> candidates = new ArrayList<>(userRepository.findByRoleAndActiveTrueAndDepartmentId(
					Role.STAFF,
					service.getDepartmentId()));
			departmentRepository.findById(service.getDepartmentId())
					.map(dept -> dept.getName())
					.ifPresent(deptName -> candidates.addAll(
							userRepository.findByRoleAndActiveTrueAndDepartmentIgnoreCase(Role.STAFF, deptName)));
			candidates.addAll(userRepository.findByRoleAndActiveTrue(Role.STAFF).stream()
					.filter(staff -> staff.getServiceId() != null)
					.filter(staff -> serviceCatalogRepository.findById(staff.getServiceId())
							.map(staffService -> service.getDepartmentId().equals(staffService.getDepartmentId()))
							.orElse(false))
					.toList());
			return candidates.stream()
					.filter(staff -> staff.getId() != null)
					.collect(Collectors.toMap(User::getId, user -> user, (existing, ignored) -> existing, LinkedHashMap::new))
					.values().stream()
					.min(Comparator
							.comparingLong((User staff) -> appointmentRepository.countByStaffId(staff.getId()))
							.thenComparing(User::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder()))
							.thenComparing(User::getId, Comparator.nullsLast(Comparator.naturalOrder())))
					.orElse(null);
		} catch (Exception ignored) {
			return null;
		}
	}

	private ServiceCatalog resolveServiceForReport(Appointment appointment) {
		if (appointment.getServiceId() != null) {
			ServiceCatalog byId = serviceCatalogRepository.findById(appointment.getServiceId()).orElse(null);
			if (byId != null) {
				return byId;
			}
		}
		if (appointment.getAppointmentType() == null || appointment.getAppointmentType().isBlank()) {
			return null;
		}
		ServiceCatalog byName = serviceCatalogRepository
				.findFirstByNameIgnoreCaseAndActiveTrue(appointment.getAppointmentType())
				.orElse(null);
		if (byName != null) {
			return byName;
		}
		String normalizedType = normalizeLabel(appointment.getAppointmentType());
		return serviceCatalogRepository.findByActiveTrueOrderByNameAsc().stream()
				.filter(item -> normalizeLabel(item.getName()).equals(normalizedType))
				.findFirst()
				.orElse(null);
	}

	private String normalizeLabel(String value) {
		return value == null ? "" : value.trim().toLowerCase().replaceAll("[^a-z0-9]+", " ");
	}

	private String formatTimeAgo(LocalDateTime time) {
		LocalDateTime now = LocalDateTime.now();
		long minutes = java.time.Duration.between(time, now).toMinutes();
		if (minutes < 1) {
			return "just now";
		}
		if (minutes < 60) {
			return minutes + " mins ago";
		}
		long hours = minutes / 60;
		if (hours < 24) {
			return hours + " hours ago";
		}
		long days = hours / 24;
		return days + " days ago";
	}

}
