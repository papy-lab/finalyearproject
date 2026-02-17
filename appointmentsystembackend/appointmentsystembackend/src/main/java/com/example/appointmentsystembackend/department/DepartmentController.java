package com.example.appointmentsystembackend.department;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.DeleteMapping;

import com.example.appointmentsystembackend.servicecatalog.ServiceCatalogRepository;
import com.example.appointmentsystembackend.user.Role;
import com.example.appointmentsystembackend.user.User;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/departments")
@Validated
public class DepartmentController {
	private final DepartmentRepository departmentRepository;
	private final ServiceCatalogRepository serviceCatalogRepository;

	public DepartmentController(DepartmentRepository departmentRepository, ServiceCatalogRepository serviceCatalogRepository) {
		this.departmentRepository = departmentRepository;
		this.serviceCatalogRepository = serviceCatalogRepository;
	}

	@GetMapping
	public ResponseEntity<List<DepartmentResponse>> list() {
		List<DepartmentResponse> departments = departmentRepository.findByActiveTrueOrderByNameAsc().stream()
				.map(DepartmentResponse::from)
				.toList();
		return ResponseEntity.ok(departments);
	}

	@PostMapping
	public ResponseEntity<DepartmentResponse> create(@Valid @RequestBody DepartmentRequest request) {
		requireAdmin();
		if (departmentRepository.findByNameIgnoreCase(request.name()).isPresent()) {
			throw new IllegalArgumentException("Department name already exists");
		}
		Department department = new Department(request.name().trim(), request.description(), request.type());
		departmentRepository.save(department);
		return new ResponseEntity<>(DepartmentResponse.from(department), HttpStatus.CREATED);
	}

	@PutMapping("/{id}")
	public ResponseEntity<DepartmentResponse> update(@PathVariable UUID id, @Valid @RequestBody DepartmentRequest request) {
		requireAdmin();
		Department department = departmentRepository.findById(id)
				.orElseThrow(() -> new IllegalArgumentException("Department not found"));
		if (departmentRepository.findByNameIgnoreCaseAndIdNot(request.name(), id).isPresent()) {
			throw new IllegalArgumentException("Department name already exists");
		}
		department.setName(request.name().trim());
		department.setDescription(request.description());
		department.setType(request.type());
		departmentRepository.save(department);
		return ResponseEntity.ok(DepartmentResponse.from(department));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable UUID id) {
		requireAdmin();
		Department department = departmentRepository.findById(id)
				.orElseThrow(() -> new IllegalArgumentException("Department not found"));
		if (serviceCatalogRepository.existsByDepartmentIdAndActiveTrue(department.getId())) {
			throw new IllegalArgumentException("Cannot delete department with active services");
		}
		department.setActive(false);
		departmentRepository.save(department);
		return ResponseEntity.noContent().build();
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
