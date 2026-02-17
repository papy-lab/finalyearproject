package com.example.appointmentsystembackend.auth;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.appointmentsystembackend.notification.EmailService;
import com.example.appointmentsystembackend.security.JwtService;
import com.example.appointmentsystembackend.user.Role;
import com.example.appointmentsystembackend.user.User;
import com.example.appointmentsystembackend.user.UserRepository;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;

@Service
public class AuthService {
	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final AuthenticationManager authenticationManager;
	private final JwtService jwtService;
	private final GoogleTokenVerifierService googleTokenVerifierService;
	private final PasswordResetTokenRepository passwordResetTokenRepository;
	private final EmailService emailService;
	private final SecureRandom secureRandom = new SecureRandom();

	public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
			AuthenticationManager authenticationManager, JwtService jwtService,
			GoogleTokenVerifierService googleTokenVerifierService,
			PasswordResetTokenRepository passwordResetTokenRepository,
			EmailService emailService) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.authenticationManager = authenticationManager;
		this.jwtService = jwtService;
		this.googleTokenVerifierService = googleTokenVerifierService;
		this.passwordResetTokenRepository = passwordResetTokenRepository;
		this.emailService = emailService;
	}

	public AuthResponse register(RegisterRequest request) {
		String normalizedEmail = normalizeEmail(request.email());
		if (userRepository.existsByEmail(normalizedEmail)) {
			throw new IllegalArgumentException("Email already registered");
		}

		if (request.role() != Role.CLIENT) {
			throw new IllegalArgumentException("Only client accounts can be created through sign up");
		}

		Role role = Role.CLIENT;
		User user = new User(normalizedEmail, request.fullName(), passwordEncoder.encode(request.password()), role);
		user.setDepartment(request.department());
		user.setPhone(request.phone());
		userRepository.save(user);
		String token = jwtService.generateToken(user.getEmail());
		return AuthResponse.from(user, token);
	}

	public AuthResponse login(LoginRequest request) {
		Authentication auth;
		try {
			auth = authenticationManager.authenticate(
					new UsernamePasswordAuthenticationToken(normalizeEmail(request.email()), request.password()));
		} catch (DisabledException ex) {
			throw new IllegalArgumentException("Your account is inactive. Contact admin to reactivate it.");
		} catch (AuthenticationException ex) {
			throw new IllegalArgumentException("Invalid email or password");
		}
		User user = (User) auth.getPrincipal();
		String token = jwtService.generateToken(user.getEmail());
		return AuthResponse.from(user, token);
	}

	public AuthResponse loginWithGoogle(GoogleLoginRequest request) {
		GoogleTokenVerifierService.GoogleUserInfo googleUser = googleTokenVerifierService.verify(request.idToken());

		User user = userRepository.findByEmail(googleUser.email()).orElseGet(() -> {
			User newUser = new User(
					googleUser.email(),
					googleUser.fullName(),
					passwordEncoder.encode(UUID.randomUUID().toString()),
					Role.CLIENT);
			return userRepository.save(newUser);
		});

		if (user.getRole() != Role.CLIENT) {
			throw new IllegalArgumentException("This Google account belongs to a staff/admin user. Use email login.");
		}
		if (!user.isActive()) {
			throw new IllegalArgumentException("Your account is inactive. Contact admin to reactivate it.");
		}

		if (user.getFullName() == null || user.getFullName().isBlank()) {
			user.setFullName(googleUser.fullName());
			userRepository.save(user);
		}

		String token = jwtService.generateToken(user.getEmail());
		return AuthResponse.from(user, token);
	}

	@Transactional
	public Map<String, String> forgotPassword(ForgotPasswordRequest request) {
		String email = normalizeEmail(request.email());
		Map<String, String> response = Map.of("message", "If that email exists, a verification code has been sent.");
		if (email.isBlank()) {
			return response;
		}

		passwordResetTokenRepository.deleteByExpiresAtBefore(OffsetDateTime.now());

		User user = userRepository.findByEmail(email).orElse(null);
		if (user == null) {
			return response;
		}

		passwordResetTokenRepository.deleteByUser(user);

		String verificationCode = String.format("%06d", secureRandom.nextInt(1_000_000));
		String tokenHash = sha256(verificationCode);
		PasswordResetToken resetToken = new PasswordResetToken(user, tokenHash, OffsetDateTime.now().plusMinutes(10));
		passwordResetTokenRepository.save(resetToken);

		emailService.sendPasswordResetCodeEmail(user.getEmail(), user.getFullName(), verificationCode);
		return response;
	}

	@Transactional
	public Map<String, String> resetPassword(ResetPasswordRequest request) {
		String email = normalizeEmail(request.email());
		String code = request.code() == null ? "" : request.code().trim();
		if (email.isBlank() || code.isBlank()) {
			throw new IllegalArgumentException("Invalid verification code");
		}

		User user = userRepository.findByEmail(email)
				.orElseThrow(() -> new IllegalArgumentException("Invalid verification code"));

		String tokenHash = sha256(code);
		PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHashAndUsedFalse(tokenHash)
				.orElseThrow(() -> new IllegalArgumentException("Invalid or expired verification code"));

		if (!resetToken.getUser().getId().equals(user.getId()) || resetToken.getExpiresAt().isBefore(OffsetDateTime.now())) {
			throw new IllegalArgumentException("Invalid or expired verification code");
		}

		user.setPassword(passwordEncoder.encode(request.newPassword()));
		userRepository.save(user);

		resetToken.setUsed(true);
		passwordResetTokenRepository.save(resetToken);
		passwordResetTokenRepository.deleteByUser(user);

		return Map.of("message", "Password reset successful. You can now sign in.");
	}

	private String sha256(String value) {
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
			return HexFormat.of().formatHex(hash);
		} catch (Exception ex) {
			throw new IllegalStateException("Failed to hash token", ex);
		}
	}

	private String normalizeEmail(String email) {
		return email == null ? "" : email.trim().toLowerCase();
	}
}
