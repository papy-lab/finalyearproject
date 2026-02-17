package com.example.appointmentsystembackend.servicecatalog;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceCatalogRepository extends JpaRepository<ServiceCatalog, UUID> {
	List<ServiceCatalog> findByActiveTrueOrderByNameAsc();
	List<ServiceCatalog> findByDepartmentId(UUID departmentId);
	Optional<ServiceCatalog> findFirstByNameIgnoreCaseAndActiveTrue(String name);
	boolean existsByDepartmentIdAndActiveTrue(UUID departmentId);
}
