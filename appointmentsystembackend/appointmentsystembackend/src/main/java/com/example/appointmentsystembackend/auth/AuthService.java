package com.example.appointmentsystembackend.auth;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

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
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class AuthService {
	private static final int OTP_EXPIRY_MINUTES = 10;
	private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final AuthenticationManager authenticationManager;
	private final JwtService jwtService;
	private final GoogleTokenVerifierService googleTokenVerifierService;
	private final PasswordResetTokenRepository passwordResetTokenRepository;
	private final LoginOtpChallengeRepository loginOtpChallengeRepository;
	private final SignupOtpChallengeRepository signupOtpChallengeRepository;
	private final EmailService emailService;
	private final SecureRandom secureRandom = new SecureRandom();

	public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
			AuthenticationManager authenticationManager, JwtService jwtService,
			GoogleTokenVerifierService googleTokenVerifierService,
			PasswordResetTokenRepository passwordResetTokenRepository,
			LoginOtpChallengeRepository loginOtpChallengeRepository,
			SignupOtpChallengeRepository signupOtpChallengeRepository,
			EmailService emailService) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.authenticationManager = authenticationManager;
		this.jwtService = jwtService;
		this.googleTokenVerifierService = googleTokenVerifierService;
		this.passwordResetTokenRepository = passwordResetTokenRepository;
		this.loginOtpChallengeRepository = loginOtpChallengeRepository;
		this.signupOtpChallengeRepository = signupOtpChallengeRepository;
		this.emailService = emailService;
	}

	@Transactional
	public AuthResponse register(RegisterRequest request) {
		String normalizedEmail = normalizeEmail(request.email());
		if (userRepository.existsByEmail(normalizedEmail)) {
			throw new IllegalArgumentException("Email already registered");
		}

		if (request.role() != Role.CLIENT) {
			throw new IllegalArgumentException("Only client accounts can be created through sign up");
		}

		try {
			return createSignupOtpChallenge(normalizedEmail, request.fullName(), request.password());
		} catch (RuntimeException ex) {
			logger.error("OTP signup flow failed for {}. Falling back to direct registration.", normalizedEmail, ex);
			// Fallback: Create user directly if OTP delivery fails
			Role role = Role.CLIENT;
			User user = new User(normalizedEmail, request.fullName(), passwordEncoder.encode(request.password()), role);
			user.setDepartment(request.department());
			user.setPhone(request.phone());
			userRepository.save(user);
			String token = jwtService.generateToken(user.getEmail());
			return AuthResponse.from(user, token);
		}
	}

	@Transactional
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
		return createLoginOtpChallenge(user);
	}

	@Transactional
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

		return createLoginOtpChallenge(user);
	}

	@Transactional
	public AuthResponse verifyOtp(OtpVerifyRequest request) {
		loginOtpChallengeRepository.deleteByExpiresAtBefore(OffsetDateTime.now());
		UUID challengeId = parseChallengeId(request.challengeId());
		String code = request.code() == null ? "" : request.code().trim();
		if (code.isBlank()) {
			throw new IllegalArgumentException("Verification code is required");
		}

		LoginOtpChallenge challenge = loginOtpChallengeRepository.findByIdAndUsedFalse(challengeId)
				.orElseThrow(() -> new IllegalArgumentException("Invalid or expired login verification request"));

		if (challenge.getExpiresAt().isBefore(OffsetDateTime.now())) {
			loginOtpChallengeRepository.delete(challenge);
			throw new IllegalArgumentException("Invalid or expired verification code");
		}

		if (!challenge.getCodeHash().equals(sha256(code))) {
			throw new IllegalArgumentException("Invalid or expired verification code");
		}

		User user = challenge.getUser();
		if (!user.isActive()) {
			throw new IllegalArgumentException("Your account is inactive. Contact admin to reactivate it.");
		}

		challenge.setUsed(true);
		loginOtpChallengeRepository.save(challenge);
		loginOtpChallengeRepository.deleteByUser(user);

		String token = jwtService.generateToken(user.getEmail());
		return AuthResponse.from(user, token);
	}

	@Transactional
	public Map<String, String> resendOtp(OtpResendRequest request) {
		loginOtpChallengeRepository.deleteByExpiresAtBefore(OffsetDateTime.now());
		UUID challengeId = parseChallengeId(request.challengeId());
		LoginOtpChallenge challenge = loginOtpChallengeRepository.findByIdAndUsedFalse(challengeId)
				.orElseThrow(() -> new IllegalArgumentException("Login verification has expired. Please sign in again."));

		if (challenge.getExpiresAt().isBefore(OffsetDateTime.now())) {
			loginOtpChallengeRepository.delete(challenge);
			throw new IllegalArgumentException("Login verification has expired. Please sign in again.");
		}

		User user = challenge.getUser();
		String verificationCode = generateOtpCode();
		challenge.setCodeHash(sha256(verificationCode));
		challenge.setExpiresAt(OffsetDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES));
		loginOtpChallengeRepository.save(challenge);
		
		try {
			emailService.sendLoginOtpEmail(user.getEmail(), user.getFullName(), verificationCode);
		} catch (Exception ex) {
			logger.warn("Email service error during resend for {}: {}. Challenge updated but email failed.", 
				user.getEmail(), ex.getMessage());
		}
		
		return Map.of("message", "A new verification code has been sent to your email.");
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

		String verificationCode = generateOtpCode();
		String tokenHash = sha256(verificationCode);
		PasswordResetToken resetToken = new PasswordResetToken(user, tokenHash,
				OffsetDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES));
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

	@Transactional
	public AuthResponse verifySignupOtp(SignupOtpVerifyRequest request) {
		signupOtpChallengeRepository.deleteByExpiresAtBefore(OffsetDateTime.now());
		UUID challengeId = parseChallengeId(request.challengeId());
		String code = request.code() == null ? "" : request.code().trim();
		if (code.isBlank()) {
			throw new IllegalArgumentException("Verification code is required");
		}

		SignupOtpChallenge challenge = signupOtpChallengeRepository.findByIdAndUsedFalse(challengeId)
				.orElseThrow(() -> new IllegalArgumentException("Invalid or expired signup verification request"));

		if (challenge.getExpiresAt().isBefore(OffsetDateTime.now())) {
			signupOtpChallengeRepository.delete(challenge);
			throw new IllegalArgumentException("Invalid or expired verification code");
		}

		if (!challenge.getCodeHash().equals(sha256(code))) {
			throw new IllegalArgumentException("Invalid or expired verification code");
		}

		// Check if email was already registered during verification (race condition)
		if (userRepository.existsByEmail(challenge.getEmail())) {
			throw new IllegalArgumentException("Email already registered");
		}

		// Create user after successful verification
		User user = new User(challenge.getEmail(), challenge.getFullName(), challenge.getPasswordHash(), Role.CLIENT);
		userRepository.save(user);

		challenge.setUsed(true);
		signupOtpChallengeRepository.save(challenge);
		signupOtpChallengeRepository.deleteByEmail(challenge.getEmail());

		String token = jwtService.generateToken(user.getEmail());
		return AuthResponse.from(user, token);
	}

	@Transactional
	public Map<String, String> resendSignupOtp(SignupOtpResendRequest request) {
		signupOtpChallengeRepository.deleteByExpiresAtBefore(OffsetDateTime.now());
		UUID challengeId = parseChallengeId(request.challengeId());
		SignupOtpChallenge challenge = signupOtpChallengeRepository.findByIdAndUsedFalse(challengeId)
				.orElseThrow(() -> new IllegalArgumentException("Signup verification has expired. Please sign up again."));

		if (challenge.getExpiresAt().isBefore(OffsetDateTime.now())) {
			signupOtpChallengeRepository.delete(challenge);
			throw new IllegalArgumentException("Signup verification has expired. Please sign up again.");
		}

		String verificationCode = generateOtpCode();
		challenge.setCodeHash(sha256(verificationCode));
		challenge.setExpiresAt(OffsetDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES));
		signupOtpChallengeRepository.save(challenge);
		
		try {
			emailService.sendSignupVerificationEmail(challenge.getEmail(), challenge.getFullName(), verificationCode);
		} catch (Exception ex) {
			logger.warn("Email service error during signup resend for {}: {}. Challenge updated but email failed.", 
				challenge.getEmail(), ex.getMessage());
		}
		
		return Map.of("message", "A new verification code has been sent to your email.");
	}

	public Map<String, Object> debugUserInfo(String email) {
		Map<String, Object> debugInfo = new HashMap<>();
		long userCount = userRepository.count();
		debugInfo.put("userCount", userCount);
		if (email != null && !email.isBlank()) {
			userRepository.findByEmail(normalizeEmail(email)).ifPresent(user -> {
				debugInfo.put("email", user.getEmail());
				debugInfo.put("fullName", user.getFullName());
				debugInfo.put("role", user.getRole().name());
				debugInfo.put("active", user.isActive());
			});
		}
		return debugInfo;
	}

	@Transactional
	private AuthResponse createSignupOtpChallenge(String email, String fullName, String password) {
		signupOtpChallengeRepository.deleteByExpiresAtBefore(OffsetDateTime.now());
		signupOtpChallengeRepository.deleteByEmail(email);

		String verificationCode = generateOtpCode();
		String passwordHash = passwordEncoder.encode(password);
		SignupOtpChallenge challenge = new SignupOtpChallenge(email, fullName, passwordHash, sha256(verificationCode),
				OffsetDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES));
		signupOtpChallengeRepository.save(challenge);

		// Try to send email but don't fail the signup if email service has issues
		try {
			emailService.sendSignupVerificationEmail(email, fullName, verificationCode);
		} catch (Exception ex) {
			logger.warn("Email service error for signup OTP to {}: {}. User can still verify via resend.", 
				email, ex.getMessage());
		}

		return AuthResponse.signupOtpRequired(email, fullName, challenge.getId().toString(),
				"A verification code has been sent to your email. Please verify to complete registration.");
	}

	@Transactional
	private AuthResponse createLoginOtpChallenge(User user) {
		loginOtpChallengeRepository.deleteByExpiresAtBefore(OffsetDateTime.now());
		loginOtpChallengeRepository.deleteByUser(user);

		String verificationCode = generateOtpCode();
		LoginOtpChallenge challenge = new LoginOtpChallenge(user, sha256(verificationCode),
				OffsetDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES));
		loginOtpChallengeRepository.save(challenge);

		// Try to send email but don't fail the login if email service has issues
		try {
			emailService.sendLoginOtpEmail(user.getEmail(), user.getFullName(), verificationCode);
		} catch (Exception ex) {
			logger.warn("Email service error for login OTP to {}: {}. User can still verify via resend.", 
				user.getEmail(), ex.getMessage());
		}

		return AuthResponse.otpRequired(user, challenge.getId().toString(),
				"A verification code has been sent to your email.");
	}

	private String generateOtpCode() {
		return String.format("%06d", secureRandom.nextInt(1_000_000));
	}

	private UUID parseChallengeId(String challengeId) {
		try {
			return UUID.fromString(challengeId == null ? "" : challengeId.trim());
		} catch (IllegalArgumentException ex) {
			throw new IllegalArgumentException("Invalid login verification request");
		}
	}

	private String normalizeEmail(String email) {
		return email == null ? "" : email.trim().toLowerCase();
	}
}
