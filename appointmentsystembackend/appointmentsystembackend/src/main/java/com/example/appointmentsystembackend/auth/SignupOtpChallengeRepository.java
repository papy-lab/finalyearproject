package com.example.appointmentsystembackend.auth;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SignupOtpChallengeRepository extends JpaRepository<SignupOtpChallenge, UUID> {
	Optional<SignupOtpChallenge> findByIdAndUsedFalse(UUID id);

	Optional<SignupOtpChallenge> findByEmailAndUsedFalse(String email);

	void deleteByEmail(String email);

	void deleteByExpiresAtBefore(OffsetDateTime timestamp);
}
