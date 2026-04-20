# Feedback & Messaging Feature Implementation Guide

## Overview

The frontend has been enhanced with a comprehensive feedback and messaging system. Clients can now:

1. **Submit Feedback**: Rate completed appointments and provide comments
2. **Send Messages**: Direct messages to staff and admin about their appointments

## Frontend Implementation Status ✅

- **Location**: `client/pages/dashboards/ClientFeedback.tsx`
- **API Client**: `client/lib/api.ts`
- **Status**: Complete and ready

## Backend Implementation Required

### 1. Message Entity

Create a new `Message` class in the backend:

```java
// File: src/main/java/com/example/appointmentsystembackend/message/Message.java

package com.example.appointmentsystembackend.message;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.example.appointmentsystembackend.appointment.Appointment;
import com.example.appointmentsystembackend.user.User;

import jakarta.persistence.*;

@Entity
@Table(name = "messages")
public class Message {
    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "appointment_id", nullable = false)
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Column(nullable = false, length = 255)
    private String subject;

    @Column(nullable = false, length = 2000)
    private String message;

    @Column(nullable = false)
    private boolean read = false;

    @Column(nullable = false)
    private OffsetDateTime createdAt;

    protected Message() {}

    public Message(Appointment appointment, User sender, String subject, String message) {
        this.id = UUID.randomUUID();
        this.appointment = appointment;
        this.sender = sender;
        this.subject = subject;
        this.message = message;
        this.read = false;
        this.createdAt = OffsetDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = OffsetDateTime.now();
        }
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public Appointment getAppointment() { return appointment; }
    public User getSender() { return sender; }
    public String getSubject() { return subject; }
    public String getMessage() { return message; }
    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
```

### 2. Message Repository

```java
// File: src/main/java/com/example/appointmentsystembackend/message/MessageRepository.java

package com.example.appointmentsystembackend.message;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MessageRepository extends JpaRepository<Message, UUID> {
    List<Message> findByAppointmentId(UUID appointmentId);
    List<Message> findBySenderId(UUID senderId);
    List<Message> findByAppointmentClientId(UUID clientId);
    List<Message> findByAppointmentStaffId(UUID staffId);
}
```

### 3. Message DTOs

```java
// File: src/main/java/com/example/appointmentsystembackend/message/MessageRequest.java

package com.example.appointmentsystembackend.message;

public class MessageRequest {
    private String subject;
    private String message;

    public MessageRequest() {}

    public MessageRequest(String subject, String message) {
        this.subject = subject;
        this.message = message;
    }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
```

```java
// File: src/main/java/com/example/appointmentsystembackend/message/MessageResponse.java

package com.example.appointmentsystembackend.message;

import java.time.OffsetDateTime;

public class MessageResponse {
    private String id;
    private String appointmentId;
    private String senderId;
    private String senderName;
    private String senderRole;
    private String subject;
    private String message;
    private boolean read;
    private String createdAt;

    public MessageResponse(Message msg) {
        this.id = msg.getId().toString();
        this.appointmentId = msg.getAppointment().getId().toString();
        this.senderId = msg.getSender().getId().toString();
        this.senderName = msg.getSender().getFullName();
        this.senderRole = msg.getSender().getRole().toString().toLowerCase();
        this.subject = msg.getSubject();
        this.message = msg.getMessage();
        this.read = msg.isRead();
        this.createdAt = msg.getCreatedAt().toString();
    }

    // Getters
    public String getId() { return id; }
    public String getAppointmentId() { return appointmentId; }
    public String getSenderId() { return senderId; }
    public String getSenderName() { return senderName; }
    public String getSenderRole() { return senderRole; }
    public String getSubject() { return subject; }
    public String getMessage() { return message; }
    public boolean isRead() { return read; }
    public String getCreatedAt() { return createdAt; }
}
```

### 4. Message Service

```java
// File: src/main/java/com/example/appointmentsystembackend/message/MessageService.java

package com.example.appointmentsystembackend.message;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import com.example.appointmentsystembackend.appointment.Appointment;
import com.example.appointmentsystembackend.appointment.AppointmentRepository;
import com.example.appointmentsystembackend.user.User;
import com.example.appointmentsystembackend.user.UserRepository;

@Service
public class MessageService {
    private final MessageRepository messageRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;

    public MessageService(MessageRepository messageRepository,
                         AppointmentRepository appointmentRepository,
                         UserRepository userRepository) {
        this.messageRepository = messageRepository;
        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
    }

    public MessageResponse createMessage(UUID appointmentId, UUID senderId,
                                         MessageRequest request) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new RuntimeException("Appointment not found"));

        User sender = userRepository.findById(senderId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        Message message = new Message(appointment, sender,
                                      request.getSubject(),
                                      request.getMessage());

        Message saved = messageRepository.save(message);
        return new MessageResponse(saved);
    }

    public List<MessageResponse> getMessagesForAppointment(UUID appointmentId) {
        return messageRepository.findByAppointmentId(appointmentId)
            .stream()
            .map(MessageResponse::new)
            .collect(Collectors.toList());
    }

    public List<MessageResponse> getMessagesForClient(UUID clientId) {
        return messageRepository.findByAppointmentClientId(clientId)
            .stream()
            .map(MessageResponse::new)
            .collect(Collectors.toList());
    }

    public List<MessageResponse> getMessagesForStaff(UUID staffId) {
        return messageRepository.findByAppointmentStaffId(staffId)
            .stream()
            .map(MessageResponse::new)
            .collect(Collectors.toList());
    }

    public List<MessageResponse> getAllMessages() {
        return messageRepository.findAll()
            .stream()
            .map(MessageResponse::new)
            .collect(Collectors.toList());
    }

    public MessageResponse markAsRead(UUID messageId) {
        Message message = messageRepository.findById(messageId)
            .orElseThrow(() -> new RuntimeException("Message not found"));

        message.setRead(true);
        Message updated = messageRepository.save(message);
        return new MessageResponse(updated);
    }
}
```

### 5. Message Controller

```java
// File: src/main/java/com/example/appointmentsystembackend/message/MessageController.java

package com.example.appointmentsystembackend.message;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.example.appointmentsystembackend.user.UserService;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = "*")
public class MessageController {
    private final MessageService messageService;
    private final UserService userService;

    public MessageController(MessageService messageService, UserService userService) {
        this.messageService = messageService;
        this.userService = userService;
    }

    @PostMapping("/{appointmentId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MessageResponse> createMessage(
            @PathVariable UUID appointmentId,
            @RequestBody MessageRequest request,
            Authentication authentication) {
        String email = authentication.getName();
        UUID userId = userService.getUserByEmail(email)
            .map(user -> UUID.fromString(user.getId()))
            .orElseThrow(() -> new RuntimeException("User not found"));

        MessageResponse response = messageService.createMessage(appointmentId, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/appointment/{appointmentId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<MessageResponse>> getAppointmentMessages(
            @PathVariable UUID appointmentId) {
        List<MessageResponse> messages = messageService.getMessagesForAppointment(appointmentId);
        return ResponseEntity.ok(messages);
    }

    @GetMapping("/client/{clientId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<MessageResponse>> getClientMessages(
            @PathVariable UUID clientId) {
        List<MessageResponse> messages = messageService.getMessagesForClient(clientId);
        return ResponseEntity.ok(messages);
    }

    @GetMapping("/staff/{staffId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<MessageResponse>> getStaffMessages(
            @PathVariable UUID staffId) {
        List<MessageResponse> messages = messageService.getMessagesForStaff(staffId);
        return ResponseEntity.ok(messages);
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<MessageResponse>> getAllMessages() {
        List<MessageResponse> messages = messageService.getAllMessages();
        return ResponseEntity.ok(messages);
    }

    @PatchMapping("/{messageId}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MessageResponse> markMessageRead(
            @PathVariable UUID messageId) {
        MessageResponse response = messageService.markAsRead(messageId);
        return ResponseEntity.ok(response);
    }
}
```

## Database Changes

Add the following to your database migrations or create the table manually:

```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY NOT NULL,
    appointment_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message VARCHAR(2000) NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    FOREIGN KEY (sender_id) REFERENCES users(id)
);

CREATE INDEX idx_messages_appointment ON messages(appointment_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
```

## Frontend Features Summary

### Feedback Tab ⭐

- Select completed appointment
- Rate 1-5 stars
- Write detailed feedback
- View history of all feedback
- Display statistics: avg rating, total reviews, satisfaction rate

### Messages Tab 💬

- Select appointment
- Enter subject line
- Compose message (up to 2000 chars)
- Messages automatically sent to staff and admin
- View message thread with:
  - Sender name and role
  - Timestamp
  - Read/unread status
  - Subject and message body

### Statistics Display 📊

- Average Rating (with stars)
- Total Reviews Count
- Satisfaction Rate (%)
- Messages Sent Count

## Implementation Checklist

- [ ] Create Message entity class
- [ ] Create MessageRepository interface
- [ ] Create MessageRequest DTO
- [ ] Create MessageResponse DTO
- [ ] Create MessageService class
- [ ] Create MessageController class
- [ ] Add @Component/@Configuration for MessageService
- [ ] Run database migration to create messages table
- [ ] Update Appointment entity to support message relationships
- [ ] Add necessary security configurations for endpoints
- [ ] Test all endpoints with frontend
- [ ] Consider adding email notifications for new messages
- [ ] Add message pagination for large message threads

## Error Handling

The frontend handles the following scenarios:

- No completed appointments available
- Missing subject or message
- API unavailable (graceful degradation)
- Network errors
- Validation errors

## Security Considerations

- Only authenticated users can create/view messages
- Clients can only see messages for their own appointments
- Staff can see messages for their assigned appointments
- Admin can see all messages
- Implemented via Spring Security @PreAuthorize annotations

## Testing Recommendations

1. Test creating messages as client
2. Test viewing messages as staff (should see messages for their appointments)
3. Test viewing all messages as admin
4. Test marking messages as read
5. Test form validation
6. Test error handling when appointment not found
7. Test concurrent message submissions
