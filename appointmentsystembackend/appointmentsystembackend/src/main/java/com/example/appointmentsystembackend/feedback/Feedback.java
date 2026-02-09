package com.example.appointmentsystembackend.feedback;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.example.appointmentsystembackend.appointment.Appointment;
import com.example.appointmentsystembackend.user.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "feedback")
public class Feedback {
	@Id
	@Column(nullable = false, updatable = false)
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "appointment_id", nullable = false)
	private Appointment appointment;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "staff_id", nullable = false)
	private User staff;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "client_id", nullable = false)
	private User client;

	@Column(nullable = false)
	private int rating;

	@Column(nullable = false, length = 1000)
	private String comment;

	@Column(nullable = false)
	private OffsetDateTime createdAt;

	protected Feedback() {
	}

	public Feedback(Appointment appointment, User staff, User client, int rating, String comment) {
		this.appointment = appointment;
		this.staff = staff;
		this.client = client;
		this.rating = rating;
		this.comment = comment;
	}

	@PrePersist
	public void prePersist() {
		if (id == null) {
			id = UUID.randomUUID();
		}
		if (createdAt == null) {
			createdAt = OffsetDateTime.now();
		}
	}

	public UUID getId() {
		return id;
	}

	public Appointment getAppointment() {
		return appointment;
	}

	public User getStaff() {
		return staff;
	}

	public User getClient() {
		return client;
	}

	public int getRating() {
		return rating;
	}

	public String getComment() {
		return comment;
	}

	public OffsetDateTime getCreatedAt() {
		return createdAt;
	}
}
