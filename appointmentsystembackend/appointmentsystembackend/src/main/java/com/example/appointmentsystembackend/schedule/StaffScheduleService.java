package com.example.appointmentsystembackend.schedule;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.appointmentsystembackend.user.User;

@Service
@Transactional
public class StaffScheduleService {
	private final WorkScheduleRepository workScheduleRepository;
	private final BlockedDateRepository blockedDateRepository;

	public StaffScheduleService(WorkScheduleRepository workScheduleRepository,
			BlockedDateRepository blockedDateRepository) {
		this.workScheduleRepository = workScheduleRepository;
		this.blockedDateRepository = blockedDateRepository;
	}

	public List<WorkSchedule> getOrCreateSchedule(User staff) {
		List<WorkSchedule> schedules = workScheduleRepository.findByStaffId(staff.getId());
		if (!schedules.isEmpty()) {
			return schedules;
		}
		return createDefaultSchedule(staff);
	}

	public List<WorkSchedule> updateSchedule(User staff, List<WorkScheduleRequest> requests) {
		workScheduleRepository.findByStaffId(staff.getId()).forEach(workScheduleRepository::delete);
		List<WorkSchedule> schedules = requests.stream()
				.map(req -> new WorkSchedule(
						staff,
						req.day(),
						LocalTime.parse(req.startTime()),
						LocalTime.parse(req.endTime()),
						req.isWorking()))
				.toList();
		return workScheduleRepository.saveAll(schedules);
	}

	public List<BlockedDate> listBlockedDates(User staff) {
		return blockedDateRepository.findByStaffId(staff.getId());
	}

	public BlockedDate addBlockedDate(User staff, BlockedDateRequest request) {
		BlockedDate blockedDate = new BlockedDate(
				staff,
				LocalDate.parse(request.date()),
				request.reason());
		return blockedDateRepository.save(blockedDate);
	}

	public void removeBlockedDate(User staff, String blockedDateId) {
		BlockedDate blockedDate = blockedDateRepository.findById(java.util.UUID.fromString(blockedDateId))
				.filter(entry -> entry.getStaff().getId().equals(staff.getId()))
				.orElseThrow(() -> new IllegalArgumentException("Blocked date not found"));
		blockedDateRepository.delete(blockedDate);
	}

	private List<WorkSchedule> createDefaultSchedule(User staff) {
		List<WorkSchedule> schedules = List.of(
				new WorkSchedule(staff, "Monday", LocalTime.of(8, 0), LocalTime.of(17, 0), true),
				new WorkSchedule(staff, "Tuesday", LocalTime.of(8, 0), LocalTime.of(17, 0), true),
				new WorkSchedule(staff, "Wednesday", LocalTime.of(8, 0), LocalTime.of(17, 0), true),
				new WorkSchedule(staff, "Thursday", LocalTime.of(8, 0), LocalTime.of(17, 0), true),
				new WorkSchedule(staff, "Friday", LocalTime.of(8, 0), LocalTime.of(17, 0), true),
				new WorkSchedule(staff, "Saturday", LocalTime.of(9, 0), LocalTime.of(14, 0), true),
				new WorkSchedule(staff, "Sunday", LocalTime.of(0, 0), LocalTime.of(0, 0), false));
		return workScheduleRepository.saveAll(schedules);
	}
}
