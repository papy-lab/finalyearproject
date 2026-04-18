package com.example.appointmentsystembackend.auth;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.appointmentsystembackend.user.User;

public interface LoginOtpChallengeRepository extends JpaRepository<LoginOtpChallenge, UUID> {
	Optional<LoginOtpChallenge> findByIdAndUsedFalse(UUID id);

	void deleteByUser(User user);

	void deleteByExpiresAtBefore(OffsetDateTime timestamp);
}
