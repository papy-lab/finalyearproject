package com.example.appointmentsystembackend.auth;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@SuppressWarnings("unchecked")
@Service
public class GoogleTokenVerifierService {
	private final String googleClientId;
	private final RestClient restClient;

	public GoogleTokenVerifierService(@Value("${app.google.client-id}") String googleClientId) {
		this.googleClientId = googleClientId;
		this.restClient = RestClient.builder().baseUrl("https://oauth2.googleapis.com").build();
	}

	public GoogleUserInfo verify(String idToken) {
		if (googleClientId == null || googleClientId.isBlank()) {
			throw new IllegalArgumentException("Google login is not configured on the server");
		}

		try {
			Map<String, Object> payload = restClient
					.get()
					.uri(uriBuilder -> uriBuilder.path("/tokeninfo").queryParam("id_token", idToken).build())
					.accept(MediaType.APPLICATION_JSON)
					.retrieve()
					.body(Map.class);

			if (payload == null || payload.isEmpty()) {
				throw new IllegalArgumentException("Invalid Google token");
			}

			String audience = asString(payload.get("aud"));
			if (!googleClientId.equals(audience)) {
				throw new IllegalArgumentException("Google token audience mismatch");
			}

			String emailVerifiedValue = asString(payload.get("email_verified"));
			boolean isEmailVerified = "true".equalsIgnoreCase(emailVerifiedValue);
			if (!isEmailVerified) {
				throw new IllegalArgumentException("Google account email is not verified");
			}

			String email = asString(payload.get("email"));
			String fullName = (String) payload.get("name");
			if (email == null || email.isBlank()) {
				throw new IllegalArgumentException("Google token does not contain an email");
			}
			if (fullName == null || fullName.isBlank()) {
				fullName = email;
			}
			return new GoogleUserInfo(email.trim().toLowerCase(), fullName);
		} catch (RestClientException ex) {
			throw new IllegalArgumentException("Failed to verify Google token");
		}
	}

	private String asString(Object value) {
		return value == null ? null : String.valueOf(value);
	}

	public record GoogleUserInfo(String email, String fullName) {
	}
}
