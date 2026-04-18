package com.example.appointmentsystembackend.auth;

import jakarta.validation.constraints.NotBlank;

public record SignupOtpVerifyRequest(
		@NotBlank String challengeId,
		@NotBlank String code) {
}
