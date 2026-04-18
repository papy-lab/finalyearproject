package com.example.appointmentsystembackend.security;

import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.http.HttpMethod;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
	private static final Logger logger = LoggerFactory.getLogger(SecurityConfig.class);
	private final JwtAuthenticationFilter jwtAuthenticationFilter;
	private final CustomUserDetailsService userDetailsService;

	public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
			CustomUserDetailsService userDetailsService) {
		this.jwtAuthenticationFilter = jwtAuthenticationFilter;
		this.userDetailsService = userDetailsService;
	}

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		AntPathRequestMatcher[] publicAuthRoutes = new AntPathRequestMatcher[] {
				new AntPathRequestMatcher("/api/auth/register"),
				new AntPathRequestMatcher("/api/auth/login"),
				new AntPathRequestMatcher("/api/auth/google"),
				new AntPathRequestMatcher("/api/auth/verify-otp"),
				new AntPathRequestMatcher("/api/auth/resend-otp"),
				new AntPathRequestMatcher("/api/auth/forgot-password"),
				new AntPathRequestMatcher("/api/auth/reset-password"),
				new AntPathRequestMatcher("/api/auth/debug/users"),
				new AntPathRequestMatcher("/error")
		};

		http
				.csrf(csrf -> csrf.disable())
				.cors(cors -> cors.configurationSource(corsConfigurationSource()))
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.exceptionHandling(ex -> ex
						.authenticationEntryPoint((request, response, authException) -> writeJsonError(response,
								HttpServletResponse.SC_UNAUTHORIZED,
								"Unauthorized: " + safeMessage(authException.getMessage())))
						.accessDeniedHandler((request, response, accessDeniedException) -> writeJsonError(response,
								HttpServletResponse.SC_FORBIDDEN,
								"Forbidden: " + safeMessage(accessDeniedException.getMessage()))))
				.authorizeHttpRequests(auth -> auth
						.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
						.requestMatchers(HttpMethod.GET, "/api/departments", "/api/services", "/api/clients").permitAll()
						.requestMatchers(publicAuthRoutes).permitAll()
						.anyRequest().authenticated())
				.authenticationProvider(authenticationProvider())
				.addFilterBefore(loginDebugFilter(), UsernamePasswordAuthenticationFilter.class)
				.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
		return http.build();
	}

	@Bean
	public AuthenticationProvider authenticationProvider() {
		DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
		provider.setUserDetailsService(userDetailsService);
		provider.setPasswordEncoder(passwordEncoder());
		return provider;
	}

	@Bean
	public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
		return config.getAuthenticationManager();
	}

	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	public CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration config = new CorsConfiguration();
		config.addAllowedOriginPattern("*");
		config.addAllowedMethod("*");
		config.addAllowedHeader("*");
		config.setAllowCredentials(false);
		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", config);
		return source;
	}

	@Bean
	public OncePerRequestFilter loginDebugFilter() {
		return new OncePerRequestFilter() {
			@Override
			protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
					throws ServletException, IOException {
				if ("/api/auth/login".equals(request.getRequestURI())) {
					logger.info("Login request received: method=" + request.getMethod()
							+ ", origin=" + request.getHeader("Origin")
							+ ", contentType=" + request.getContentType()
							+ ", authHeaderPresent=" + (request.getHeader("Authorization") != null));
				}
				filterChain.doFilter(request, response);
			}
		};
	}

	private void writeJsonError(HttpServletResponse response, int status, String message) throws IOException {
		response.setStatus(status);
		response.setContentType(MediaType.APPLICATION_JSON_VALUE);
		response.getWriter().write("{\"error\":\"" + escapeJson(message) + "\"}");
	}

	private String safeMessage(String message) {
		return message == null || message.isBlank() ? "Access denied" : message;
	}

	private String escapeJson(String value) {
		return value.replace("\\", "\\\\").replace("\"", "\\\"");
	}
}
