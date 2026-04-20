package com.example.appointmentsystembackend.feedback;

import java.util.List;
import java.util.UUID;
import java.util.Comparator;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.appointmentsystembackend.appointment.Appointment;
import com.example.appointmentsystembackend.appointment.AppointmentRepository;
import com.example.appointmentsystembackend.appointment.AppointmentStatus;
import com.example.appointmentsystembackend.user.User;
import com.example.appointmentsystembackend.user.UserRepository;

@Service
@Transactional
public class FeedbackService {

	private final FeedbackRepository feedbackRepository;
	private final AppointmentRepository appointmentRepository;
	private final UserRepository userRepository;

	public FeedbackService(FeedbackRepository feedbackRepository, AppointmentRepository appointmentRepository,
			UserRepository userRepository) {
		this.feedbackRepository = feedbackRepository;
		this.appointmentRepository = appointmentRepository;
		this.userRepository = userRepository;
	}

	public FeedbackResponse createFeedback(User client, UUID appointmentId, FeedbackRequest request) {
		Appointment appointment = appointmentRepository.findById(appointmentId)
				.orElseThrow(() -> new RuntimeException("Appointment not found"));

		if (!appointment.getClient().getId().equals(client.getId())) {
			throw new RuntimeException("Unauthorized: Can only provide feedback for your own appointments");
		}

		if (appointment.getStatus() != AppointmentStatus.COMPLETED) {
			throw new RuntimeException("Feedback can only be submitted for completed appointments");
		}

		if (feedbackRepository.findByAppointmentId(appointmentId).isPresent()) {
			throw new RuntimeException("Feedback has already been submitted for this appointment");
		}

		if (appointment.getStaff() == null) {
			throw new RuntimeException("This appointment is not assigned to a staff member");
		}

		User staff = userRepository.findById(appointment.getStaff().getId())
				.orElseThrow(() -> new RuntimeException("Staff member not found"));

		Feedback feedback = new Feedback(appointment, staff, client, request.getRating(), request.getComment());
		Feedback savedFeedback = feedbackRepository.save(feedback);

		return FeedbackResponse.from(savedFeedback);
	}

	public List<FeedbackResponse> getFeedbackForStaff(UUID staffId) {
		List<Feedback> feedbacks = feedbackRepository.findByStaffId(staffId);
		return feedbacks.stream()
				.sorted(Comparator.comparing(Feedback::getCreatedAt).reversed())
				.map(FeedbackResponse::from)
				.toList();
	}

	public List<FeedbackResponse> getFeedbackForClient(UUID clientId) {
		List<Feedback> feedbacks = feedbackRepository.findByClientId(clientId);
		return feedbacks.stream()
				.sorted(Comparator.comparing(Feedback::getCreatedAt).reversed())
				.map(FeedbackResponse::from)
				.toList();
	}

	public List<FeedbackResponse> getAllFeedback() {
		List<Feedback> feedbacks = feedbackRepository.findAll();
		return feedbacks.stream()
				.sorted(Comparator.comparing(Feedback::getCreatedAt).reversed())
				.map(FeedbackResponse::from)
				.toList();
	}

	public FeedbackResponse getFeedbackByAppointment(UUID appointmentId) {
		Feedback feedback = feedbackRepository.findByAppointmentId(appointmentId)
				.orElseThrow(() -> new RuntimeException("Feedback not found"));
		return FeedbackResponse.from(feedback);
	}
}
