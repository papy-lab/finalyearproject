package com.example.appointmentsystembackend.feedback;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public class FeedbackRequest {
	@Min(1)
	@Max(5)
	private int rating;

	@NotBlank
	private String comment;

	protected FeedbackRequest() {
	}

	public FeedbackRequest(int rating, String comment) {
		this.rating = rating;
		this.comment = comment;
	}

	public int getRating() {
		return rating;
	}

	public String getComment() {
		return comment;
	}

	public void setRating(int rating) {
		this.rating = rating;
	}

	public void setComment(String comment) {
		this.comment = comment;
	}
}
