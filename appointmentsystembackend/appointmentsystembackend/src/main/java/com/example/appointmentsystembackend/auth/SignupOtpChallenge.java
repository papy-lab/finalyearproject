package com.example.appointmentsystembackend.auth;

import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "signup_otp_challenges")
public class SignupOtpChallenge {
	@Id
	@Column(nullable = false, updatable = false)
	private UUID id;

	@Column(nullable = false, unique = true)
	private String email;

	@Column(nullable = false)
	private String fullName;

	@Column(nullable = false)
	private String passwordHash;

	@Column(nullable = false)
	private String codeHash;

	@Column(nullable = false)
	private OffsetDateTime expiresAt;

	@Column(nullable = false)
	private boolean used;

	@Column(nullable = false, updatable = false)
	private OffsetDateTime createdAt;

	protected SignupOtpChallenge() {
	}

	public SignupOtpChallenge(String email, String fullName, String passwordHash, String codeHash, OffsetDateTime expiresAt) {
		this.email = email;
		this.fullName = fullName;
		this.passwordHash = passwordHash;
		this.codeHash = codeHash;
		this.expiresAt = expiresAt;
		this.used = false;
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

	public String getEmail() {
		return email;
	}

	public String getFullName() {
		return fullName;
	}

	public String getPasswordHash() {
		return passwordHash;
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

	public OffsetDateTime getCreatedAt() {
		return createdAt;
	}
}
