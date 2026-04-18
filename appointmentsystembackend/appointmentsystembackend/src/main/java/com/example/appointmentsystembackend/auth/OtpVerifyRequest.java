package com.example.appointmentsystembackend.auth;

import jakarta.validation.constraints.NotBlank;

public record OtpVerifyRequest(
		@NotBlank String challengeId,
		@NotBlank String code) {
}
