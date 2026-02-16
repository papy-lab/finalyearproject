package com.example.appointmentsystembackend.analytics;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Month;
import java.time.YearMonth;
import java.time.format.TextStyle;
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
import com.example.appointmentsystembackend.feedback.Feedback;
import com.example.appointmentsystembackend.feedback.FeedbackRepository;
import com.example.appointmentsystembackend.schedule.BlockedDateRepository;
import com.example.appointmentsystembackend.schedule.StaffScheduleService;
import com.example.appointmentsystembackend.schedule.WorkSchedule;
import com.example.appointmentsystembackend.settings.SystemSettingsService;
import com.example.appointmentsystembackend.user.Role;
import com.example.appointmentsystembackend.user.User;
import com.example.appointmentsystembackend.user.UserRepository;

@Service
public class AnalyticsService {
	private final AppointmentRepository appointmentRepository;
	private final UserRepository userRepository;
	private final FeedbackRepository feedbackRepository;
	private final SystemSettingsService settingsService;
	private final StaffScheduleService staffScheduleService;
	private final BlockedDateRepository blockedDateRepository;

	public AnalyticsService(AppointmentRepository appointmentRepository, UserRepository userRepository,
			FeedbackRepository feedbackRepository, SystemSettingsService settingsService,
			StaffScheduleService staffScheduleService, BlockedDateRepository blockedDateRepository) {
		this.appointmentRepository = appointmentRepository;
		this.userRepository = userRepository;
		this.feedbackRepository = feedbackRepository;
		this.settingsService = settingsService;
		this.staffScheduleService = staffScheduleService;
		this.blockedDateRepository = blockedDateRepository;
	}

	public AdminReportsResponse getAdminReports(String range, String department) {
		LocalDate today = LocalDate.now();
		boolean allTime = "all".equalsIgnoreCase(range);
		LocalDate startDate = switch (range) {
			case "week" -> today.minusDays(7);
			case "quarter" -> today.minusDays(90);
			case "year" -> today.minusDays(365);
			default -> today.minusDays(30);
		};

		List<Appointment> appointments = appointmentRepository.findAll().stream()
				.filter(apt -> allTime || (!apt.getDate().isBefore(startDate) && !apt.getDate().isAfter(today)))
				.filter(apt -> {
					if ("all".equalsIgnoreCase(department)) {
						return true;
					}
					if (apt.getStaff() == null || apt.getStaff().getDepartment() == null) {
						return false;
					}
					return department.equalsIgnoreCase(apt.getStaff().getDepartment());
				})
				.toList();

		long totalAppointments = appointments.size();
		long completed = appointments.stream().filter(apt -> apt.getStatus() == AppointmentStatus.COMPLETED).count();
		double completionRate = totalAppointments == 0 ? 0 : (completed * 100.0 / totalAppointments);

		double avgResponseHours = appointments.stream()
				.mapToDouble(apt -> {
					LocalDateTime appointmentTime = apt.getDate().atTime(apt.getTime());
					long hours = java.time.Duration.between(apt.getCreatedAt().toLocalDateTime(), appointmentTime).toHours();
					return Math.max(hours, 0);
				})
				.average()
				.orElse(0);

		long activeUsers = userRepository.findAll().stream().filter(User::isActive).count();

		Map<String, Long> serviceCounts = appointments.stream()
				.collect(Collectors.groupingBy(Appointment::getAppointmentType, Collectors.counting()));
		List<AdminReportsResponse.ServiceCount> services = serviceCounts.entrySet().stream()
				.sorted(Map.Entry.<String, Long>comparingByValue().reversed())
				.map(entry -> new AdminReportsResponse.ServiceCount(
						entry.getKey(),
						entry.getValue(),
						totalAppointments == 0 ? 0 : (int) Math.round(entry.getValue() * 100.0 / totalAppointments)))
				.toList();

		List<AdminReportsResponse.StaffSummary> topStaff = userRepository.findAll().stream()
				.filter(user -> user.getRole() == Role.STAFF)
				.map(user -> {
					long completedCount = appointmentRepository.findByStaffId(user.getId()).stream()
							.filter(apt -> apt.getStatus() == AppointmentStatus.COMPLETED)
							.count();
					double rating = feedbackRepository.findByStaffId(user.getId()).stream()
							.mapToInt(Feedback::getRating)
							.average()
							.orElse(0);
					return new AdminReportsResponse.StaffSummary(
							user.getFullName(),
							user.getDepartment() == null ? "General" : user.getDepartment(),
							completedCount,
							roundOneDecimal(rating));
				})
				.sorted(Comparator.comparingLong(AdminReportsResponse.StaffSummary::completed).reversed())
				.limit(5)
				.toList();

		Map<DayOfWeek, Long> weekdayCounts = appointments.stream()
				.collect(Collectors.groupingBy(apt -> apt.getDate().getDayOfWeek(), Collectors.counting()));
		List<AdminReportsResponse.DayCount> weeklyTrend = List.of(
				DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY,
				DayOfWeek.FRIDAY, DayOfWeek.SATURDAY, DayOfWeek.SUNDAY).stream()
				.map(day -> new AdminReportsResponse.DayCount(
						day.getDisplayName(TextStyle.SHORT, Locale.ENGLISH),
						weekdayCounts.getOrDefault(day, 0L)))
				.toList();

		Map<String, Long> departmentCounts = appointments.stream()
				.collect(Collectors.groupingBy(apt -> {
					if (apt.getStaff() == null || apt.getStaff().getDepartment() == null) {
						return "Unassigned";
					}
					return apt.getStaff().getDepartment();
				}, Collectors.counting()));
		List<AdminReportsResponse.DepartmentCount> departmentBreakdown = departmentCounts.entrySet().stream()
				.sorted(Map.Entry.<String, Long>comparingByValue().reversed())
				.map(entry -> new AdminReportsResponse.DepartmentCount(entry.getKey(), entry.getValue()))
				.toList();

		double avgRating = feedbackRepository.findAll().stream()
				.mapToInt(Feedback::getRating)
				.average()
				.orElse(0);
		double satisfactionPercent = avgRating == 0 ? 0 : (avgRating / 5.0) * 100;
		double apiResponsePercent = Math.max(70, 100 - Math.min(avgResponseHours * 4, 30));

		List<AdminReportsResponse.HealthMetric> health = List.of(
				new AdminReportsResponse.HealthMetric("Server Uptime", 99.9, "Excellent"),
				new AdminReportsResponse.HealthMetric("Database Performance", 98.5, "Good"),
				new AdminReportsResponse.HealthMetric("API Response Time", roundOneDecimal(apiResponsePercent), "Good"),
				new AdminReportsResponse.HealthMetric("User Satisfaction", roundOneDecimal(satisfactionPercent),
						avgRating >= 4.5 ? "Excellent" : "Good"));

		return new AdminReportsResponse(
				new AdminReportsResponse.Metrics(totalAppointments, roundOneDecimal(completionRate),
						roundOneDecimal(avgResponseHours), activeUsers),
				services,
				topStaff,
				weeklyTrend,
				departmentBreakdown,
				health);
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
