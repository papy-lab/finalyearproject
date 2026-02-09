package com.example.appointmentsystembackend.schedule;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BlockedDateRepository extends JpaRepository<BlockedDate, UUID> {
	List<BlockedDate> findByStaffId(UUID staffId);
}
