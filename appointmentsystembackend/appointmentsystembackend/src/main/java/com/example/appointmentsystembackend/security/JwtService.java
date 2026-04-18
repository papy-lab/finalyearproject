package com.example.appointmentsystembackend.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
	private static final Base64.Encoder BASE64_URL_ENCODER = Base64.getUrlEncoder().withoutPadding();
	private static final Base64.Decoder BASE64_URL_DECODER = Base64.getUrlDecoder();
	private static final Pattern SUBJECT_PATTERN = Pattern.compile("\"sub\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"");
	private static final Pattern EXP_PATTERN = Pattern.compile("\"exp\"\\s*:\\s*(\\d+)");

	private final byte[] secretBytes;
	private final long expirationMillis;

	public JwtService(@Value("${app.jwt.secret}") String secret,
			@Value("${app.jwt.expiration}") long expirationMillis) {
		this.secretBytes = secret.getBytes(StandardCharsets.UTF_8);
		this.expirationMillis = expirationMillis;
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
		String json = toJson(data);
		return json.getBytes(StandardCharsets.UTF_8);
	}

	private Map<String, Object> deserialize(byte[] data) {
		String json = new String(data, StandardCharsets.UTF_8);
		Map<String, Object> payload = new HashMap<>();

		Matcher subjectMatcher = SUBJECT_PATTERN.matcher(json);
		if (subjectMatcher.find()) {
			payload.put("sub", unescapeJson(subjectMatcher.group(1)));
		}

		Matcher expMatcher = EXP_PATTERN.matcher(json);
		if (expMatcher.find()) {
			payload.put("exp", Long.parseLong(expMatcher.group(1)));
		}

		if (!payload.containsKey("sub") || !payload.containsKey("exp")) {
			throw new IllegalArgumentException("Invalid token payload");
		}

		return payload;
	}

	private String toJson(Map<String, Object> data) {
		StringBuilder json = new StringBuilder("{");
		boolean first = true;
		for (Map.Entry<String, Object> entry : data.entrySet()) {
			if (!first) {
				json.append(",");
			}
			first = false;
			json.append("\"").append(escapeJson(entry.getKey())).append("\":");
			Object value = entry.getValue();
			if (value instanceof Number || value instanceof Boolean) {
				json.append(value);
			} else {
				json.append("\"").append(escapeJson(String.valueOf(value))).append("\"");
			}
		}
		json.append("}");
		return json.toString();
	}

	private String escapeJson(String value) {
		return value.replace("\\", "\\\\").replace("\"", "\\\"");
	}

	private String unescapeJson(String value) {
		return value.replace("\\\"", "\"").replace("\\\\", "\\");
	}
}
