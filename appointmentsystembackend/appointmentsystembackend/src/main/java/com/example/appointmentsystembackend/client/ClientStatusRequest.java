package com.example.appointmentsystembackend.client;

import jakarta.validation.constraints.NotNull;

public record ClientStatusRequest(@NotNull Boolean active) {
}
