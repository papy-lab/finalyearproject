package com.example.appointmentsystembackend.feedback;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.appointmentsystembackend.user.Role;
import com.example.appointmentsystembackend.user.User;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/feedback")
@Validated
public class FeedbackController {

	private final FeedbackService feedbackService;

	public FeedbackController(FeedbackService feedbackService) {
		this.feedbackService = feedbackService;
	}

	@PostMapping("/{appointmentId}")
	public ResponseEntity<FeedbackResponse> createFeedback(@PathVariable UUID appointmentId,
			@Valid @RequestBody FeedbackRequest request) {
		User user = currentUser();
		FeedbackResponse response = feedbackService.createFeedback(user, appointmentId, request);
		return new ResponseEntity<>(response, HttpStatus.CREATED);
	}

	@GetMapping("/staff/{staffId}")
	public ResponseEntity<List<FeedbackResponse>> getFeedbackForStaff(@PathVariable UUID staffId) {
		List<FeedbackResponse> feedbacks = feedbackService.getFeedbackForStaff(staffId);
		return ResponseEntity.ok(feedbacks);
	}

	@GetMapping("/client/{clientId}")
	public ResponseEntity<List<FeedbackResponse>> getFeedbackForClient(@PathVariable UUID clientId) {
		List<FeedbackResponse> feedbacks = feedbackService.getFeedbackForClient(clientId);
		return ResponseEntity.ok(feedbacks);
	}

	@GetMapping("/all")
	public ResponseEntity<List<FeedbackResponse>> getAllFeedback() {
		User user = currentUser();
		if (user.getRole() != Role.ADMIN) {
			return new ResponseEntity<>(HttpStatus.FORBIDDEN);
		}
		List<FeedbackResponse> feedbacks = feedbackService.getAllFeedback();
		return ResponseEntity.ok(feedbacks);
	}

	@GetMapping("/appointment/{appointmentId}")
	public ResponseEntity<FeedbackResponse> getFeedbackByAppointment(@PathVariable UUID appointmentId) {
		FeedbackResponse feedback = feedbackService.getFeedbackByAppointment(appointmentId);
		return ResponseEntity.ok(feedback);
	}

	private User currentUser() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		return (User) authentication.getPrincipal();
	}
}
