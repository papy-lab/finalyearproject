package com.example.appointmentsystembackend.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class JwtService {
	private static final Base64.Encoder BASE64_URL_ENCODER = Base64.getUrlEncoder().withoutPadding();
	private static final Base64.Decoder BASE64_URL_DECODER = Base64.getUrlDecoder();
	private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};

	private final ObjectMapper objectMapper;
	private final byte[] secretBytes;
	private final long expirationMillis;

	public JwtService(@Value("${app.jwt.secret}") String secret,
			@Value("${app.jwt.expiration}") long expirationMillis,
			ObjectMapper objectMapper) {
		this.secretBytes = secret.getBytes(StandardCharsets.UTF_8);
		this.expirationMillis = expirationMillis;
		this.objectMapper = objectMapper;
	}

	public String generateToken(String subject) {
		long nowSeconds = Instant.now().getEpochSecond();
		long expSeconds = nowSeconds + (expirationMillis / 1000);

		Map<String, Object> header = Map.of("alg", "HS256", "typ", "JWT");
		Map<String, Object> payload = Map.of("sub", subject, "iat", nowSeconds, "exp", expSeconds);

		String encodedHeader = base64Url(serialize(header));
		String encodedPayload = base64Url(serialize(payload));
		String signingInput = encodedHeader + "." + encodedPayload;
		String signature = base64Url(sign(signingInput));

		return signingInput + "." + signature;
	}

	public String extractSubject(String token) {
		return (String) parsePayload(token).get("sub");
	}

	public boolean isTokenValid(String token, String expectedSubject) {
		Map<String, Object> payload = parsePayload(token);
		String subject = (String) payload.get("sub");
		long exp = ((Number) payload.get("exp")).longValue();
		return expectedSubject.equals(subject) && Instant.now().getEpochSecond() < exp;
	}

	private Map<String, Object> parsePayload(String token) {
		String[] parts = token.split("\\.");
		if (parts.length != 3) {
			throw new IllegalArgumentException("Invalid token");
		}

		String signingInput = parts[0] + "." + parts[1];
		String expectedSignature = base64Url(sign(signingInput));
		if (!MessageDigest.isEqual(expectedSignature.getBytes(StandardCharsets.UTF_8),
				parts[2].getBytes(StandardCharsets.UTF_8))) {
			throw new IllegalArgumentException("Invalid token signature");
		}

		byte[] payloadBytes = BASE64_URL_DECODER.decode(parts[1]);
		return deserialize(payloadBytes);
	}

	private byte[] sign(String input) {
		try {
			Mac mac = Mac.getInstance("HmacSHA256");
			mac.init(new SecretKeySpec(secretBytes, "HmacSHA256"));
			return mac.doFinal(input.getBytes(StandardCharsets.UTF_8));
		} catch (Exception ex) {
			throw new IllegalStateException("Could not sign token", ex);
		}
	}

	private String base64Url(byte[] data) {
		return BASE64_URL_ENCODER.encodeToString(data);
	}

	private byte[] serialize(Map<String, Object> data) {
		try {
			return objectMapper.writeValueAsBytes(data);
		} catch (Exception ex) {
			throw new IllegalStateException("Could not serialize token payload", ex);
		}
	}

	private Map<String, Object> deserialize(byte[] data) {
		try {
			return objectMapper.readValue(data, MAP_TYPE);
		} catch (Exception ex) {
			throw new IllegalArgumentException("Invalid token payload", ex);
		}
	}
}
