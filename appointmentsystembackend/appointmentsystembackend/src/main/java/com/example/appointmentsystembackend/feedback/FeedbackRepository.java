package com.example.appointmentsystembackend.feedback;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface FeedbackRepository extends JpaRepository<Feedback, UUID> {
	List<Feedback> findByStaffId(UUID staffId);
	List<Feedback> findByClientId(UUID clientId);
	Optional<Feedback> findByAppointmentId(UUID appointmentId);
}
