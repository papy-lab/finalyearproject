package com.example.appointmentsystembackend.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import com.example.appointmentsystembackend.appointment.Appointment;
import com.example.appointmentsystembackend.appointment.AppointmentStatus;
import com.example.appointmentsystembackend.user.User;

@Service
public class EmailService {
	private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

	private final JavaMailSender mailSender;
	private final boolean enabled;
	private final String fromAddress;
	public EmailService(JavaMailSender mailSender,
			@Value("${app.mail.enabled:true}") boolean enabled,
			@Value("${app.mail.from:}") String fromAddress) {
		this.mailSender = mailSender;
		this.enabled = enabled;
		this.fromAddress = fromAddress;
	}

	public void sendAppointmentStatusEmail(Appointment appointment, AppointmentStatus status) {
		if (!enabled) {
			logger.debug("Email notifications disabled; skipping appointment email.");
			return;
		}
		User recipient = appointment.getClient();
		if (recipient == null || recipient.getEmail() == null || recipient.getEmail().isBlank()) {
			logger.warn("Appointment client email missing; skipping appointment email.");
			return;
		}

		String statusLabel = status == AppointmentStatus.COMPLETED ? "completed" : "cancelled";
		String subject = "Appointment " + statusLabel;

		StringBuilder body = new StringBuilder();
		body.append("Hello ").append(recipient.getFullName()).append(",\n\n");
		if (status == AppointmentStatus.COMPLETED) {
			body.append("Your appointment has been marked as completed.\n\n");
		} else {
			body.append("Your appointment has been cancelled.\n\n");
		}
		body.append("Appointment details:\n");
		body.append("Type: ").append(appointment.getAppointmentType()).append("\n");
		body.append("Date: ").append(appointment.getDate()).append("\n");
		body.append("Time: ").append(appointment.getTime()).append("\n");
		body.append("Location: ").append(appointment.getLocation()).append("\n");
		if (appointment.getStaff() != null) {
			body.append("Staff: ").append(appointment.getStaff().getFullName()).append("\n");
		}
		if (appointment.getNotes() != null && !appointment.getNotes().isBlank()) {
			body.append("Notes: ").append(appointment.getNotes()).append("\n");
		}
		body.append("\nThank you.");

		SimpleMailMessage message = new SimpleMailMessage();
		message.setTo(recipient.getEmail());
		message.setSubject(subject);
		message.setText(body.toString());
		if (fromAddress != null && !fromAddress.isBlank()) {
			message.setFrom(fromAddress);
		}

		try {
			mailSender.send(message);
		} catch (RuntimeException ex) {
			logger.error("Failed to send appointment email.", ex);
		}
	}

	public void sendPasswordResetCodeEmail(String toEmail, String fullName, String verificationCode) {
		if (!enabled) {
			logger.debug("Email notifications disabled; skipping password reset code email.");
			return;
		}
		if (toEmail == null || toEmail.isBlank()) {
			logger.warn("Password reset recipient email missing; skipping code email.");
			return;
		}

		String subject = "Your password reset verification code";
		String name = (fullName == null || fullName.isBlank()) ? "User" : fullName;
		String body = "Hello " + name + ",\n\n"
				+ "We received a request to reset your password.\n"
				+ "Use this verification code to reset your password:\n\n"
				+ verificationCode + "\n\n"
				+ "This code will expire in 10 minutes.\n"
				+ "If you did not request this, you can ignore this email.\n";

		SimpleMailMessage message = new SimpleMailMessage();
		message.setTo(toEmail);
		message.setSubject(subject);
		message.setText(body);
		if (fromAddress != null && !fromAddress.isBlank()) {
			message.setFrom(fromAddress);
		}

		try {
			mailSender.send(message);
		} catch (RuntimeException ex) {
			logger.error("Failed to send password reset code email.", ex);
		}
	}
}
