package com.example.appointmentsystembackend.auth;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.appointmentsystembackend.security.JwtService;
import com.example.appointmentsystembackend.user.Role;
import com.example.appointmentsystembackend.user.User;
import com.example.appointmentsystembackend.user.UserRepository;

@Service
public class AuthService {
	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final AuthenticationManager authenticationManager;
	private final JwtService jwtService;

	public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
			AuthenticationManager authenticationManager, JwtService jwtService) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.authenticationManager = authenticationManager;
		this.jwtService = jwtService;
	}

	public AuthResponse register(RegisterRequest request) {
		if (userRepository.existsByEmail(request.email())) {
			throw new IllegalArgumentException("Email already registered");
		}

		Role role = request.role() == null ? Role.CLIENT : request.role();
		User user = new User(request.email(), request.fullName(), passwordEncoder.encode(request.password()), role);
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
					new UsernamePasswordAuthenticationToken(request.email(), request.password()));
		} catch (AuthenticationException ex) {
			throw new IllegalArgumentException("Invalid email or password");
		}
		User user = (User) auth.getPrincipal();
		String token = jwtService.generateToken(user.getEmail());
		return AuthResponse.from(user, token);
	}
}
