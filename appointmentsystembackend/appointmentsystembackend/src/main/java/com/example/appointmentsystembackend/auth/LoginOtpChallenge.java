package com.example.appointmentsystembackend.auth;

import java.time.OffsetDateTime;
import java.util.UUID;

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
@Table(name = "login_otp_challenges")
public class LoginOtpChallenge {
	@Id
	@Column(nullable = false, updatable = false)
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@Column(nullable = false)
	private String codeHash;

	@Column(nullable = false)
	private OffsetDateTime expiresAt;

	@Column(nullable = false)
	private boolean used;

	@Column(nullable = false, updatable = false)
	private OffsetDateTime createdAt;

	protected LoginOtpChallenge() {
	}

	public LoginOtpChallenge(User user, String codeHash, OffsetDateTime expiresAt) {
		this.user = user;
		this.codeHash = codeHash;
		this.expiresAt = expiresAt;
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

	public User getUser() {
		return user;
	}

	public String getCodeHash() {
		return codeHash;
	}

	public void setCodeHash(String codeHash) {
		this.codeHash = codeHash;
	}

	public OffsetDateTime getExpiresAt() {
		return expiresAt;
	}

	public void setExpiresAt(OffsetDateTime expiresAt) {
		this.expiresAt = expiresAt;
	}

	public boolean isUsed() {
		return used;
	}

	public void setUsed(boolean used) {
		this.used = used;
	}
}
