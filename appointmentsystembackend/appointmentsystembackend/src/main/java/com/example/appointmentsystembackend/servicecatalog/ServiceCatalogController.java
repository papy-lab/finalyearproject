package com.example.appointmentsystembackend.servicecatalog;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.appointmentsystembackend.department.Department;
import com.example.appointmentsystembackend.department.DepartmentRepository;
import com.example.appointmentsystembackend.user.Role;
import com.example.appointmentsystembackend.user.User;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/services")
@Validated
public class ServiceCatalogController {
	private final ServiceCatalogRepository serviceCatalogRepository;
	private final DepartmentRepository departmentRepository;

	public ServiceCatalogController(ServiceCatalogRepository serviceCatalogRepository,
			DepartmentRepository departmentRepository) {
		this.serviceCatalogRepository = serviceCatalogRepository;
		this.departmentRepository = departmentRepository;
	}

	@GetMapping
	public ResponseEntity<List<ServiceCatalogResponse>> list() {
		List<ServiceCatalog> services = serviceCatalogRepository.findByActiveTrueOrderByNameAsc();
		List<ServiceCatalogResponse> response = services.stream().map(this::toResponse).toList();
		return ResponseEntity.ok(response);
	}

	@PostMapping
	public ResponseEntity<ServiceCatalogResponse> create(@Valid @RequestBody ServiceCatalogRequest request) {
		requireAdmin();
		UUID departmentId = UUID.fromString(request.departmentId());
		Department department = departmentRepository.findById(departmentId)
				.orElseThrow(() -> new IllegalArgumentException("Department not found"));

		ServiceCatalog service = new ServiceCatalog(
				request.name().trim(),
				request.description(),
				department.getId(),
				request.requirements());
		service.setActive(Boolean.TRUE.equals(request.active()));
		serviceCatalogRepository.save(service);
		return new ResponseEntity<>(ServiceCatalogResponse.from(service, department), HttpStatus.CREATED);
	}

	@PutMapping("/{id}")
	public ResponseEntity<ServiceCatalogResponse> update(@PathVariable UUID id,
			@Valid @RequestBody ServiceCatalogRequest request) {
		requireAdmin();
		ServiceCatalog service = serviceCatalogRepository.findById(id)
				.orElseThrow(() -> new IllegalArgumentException("Service not found"));
		UUID departmentId = UUID.fromString(request.departmentId());
		Department department = departmentRepository.findById(departmentId)
				.orElseThrow(() -> new IllegalArgumentException("Department not found"));
		service.setName(request.name().trim());
		service.setDescription(request.description());
		service.setDepartmentId(department.getId());
		service.setRequirements(request.requirements());
		service.setActive(Boolean.TRUE.equals(request.active()));
		serviceCatalogRepository.save(service);
		return ResponseEntity.ok(ServiceCatalogResponse.from(service, department));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable UUID id) {
		requireAdmin();
		ServiceCatalog service = serviceCatalogRepository.findById(id)
				.orElseThrow(() -> new IllegalArgumentException("Service not found"));
		service.setActive(false);
		serviceCatalogRepository.save(service);
		return ResponseEntity.noContent().build();
	}

	private ServiceCatalogResponse toResponse(ServiceCatalog service) {
		Department department = departmentRepository.findById(service.getDepartmentId()).orElse(null);
		return ServiceCatalogResponse.from(service, department);
	}

	private void requireAdmin() {
		User user = currentUser();
		if (user.getRole() != Role.ADMIN) {
			throw new AccessDeniedException("Admin role required");
		}
	}

	private User currentUser() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		return (User) authentication.getPrincipal();
	}
}
