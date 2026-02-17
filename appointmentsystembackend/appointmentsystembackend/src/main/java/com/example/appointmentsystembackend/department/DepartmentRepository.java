package com.example.appointmentsystembackend.department;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface DepartmentRepository extends JpaRepository<Department, UUID> {
	Optional<Department> findByNameIgnoreCase(String name);
	Optional<Department> findByNameIgnoreCaseAndIdNot(String name, UUID id);

	List<Department> findByActiveTrueOrderByNameAsc();
}
