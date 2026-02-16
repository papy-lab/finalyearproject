package com.example.appointmentsystembackend.auth;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.appointmentsystembackend.user.User;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {
	Optional<PasswordResetToken> findByTokenHashAndUsedFalse(String tokenHash);

	void deleteByUser(User user);

	void deleteByExpiresAtBefore(OffsetDateTime cutoff);
}
