package com.example.appointmentsystembackend.user;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, UUID> {
	Optional<User> findByEmail(String email);
	boolean existsByEmail(String email);
	List<User> findByRoleAndActiveTrue(Role role);
	List<User> findByRoleAndActiveTrueAndDepartmentId(Role role, UUID departmentId);
	List<User> findByRoleAndActiveTrueAndDepartmentIgnoreCase(Role role, String department);
	List<User> findByRoleAndActiveTrueAndDepartmentIdAndServiceId(Role role, UUID departmentId, UUID serviceId);
}
