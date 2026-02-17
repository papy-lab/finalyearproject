package com.example.appointmentsystembackend.appointment;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {
	List<Appointment> findByClientId(UUID clientId);
	List<Appointment> findByStaffId(UUID staffId);
	List<Appointment> findByStaffIdOrStaffIsNull(UUID staffId);
	List<Appointment> findByStaffIsNull();
	List<Appointment> findByServiceId(UUID serviceId);
	List<Appointment> findByServiceIdIn(List<UUID> serviceIds);
	long countByStaffId(UUID staffId);
	long countByClientId(UUID clientId);
}
