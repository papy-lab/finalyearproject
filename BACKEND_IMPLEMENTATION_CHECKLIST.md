# Backend Implementation Checklist - Messages Feature

## 📋 Step-by-Step Implementation Guide

### Phase 1: Database Setup ✅ STEP 1-2

#### Step 1: Create Database Table

Execute this SQL migration:

```sql
-- File: src/main/resources/db/migration/V<timestamp>__create_messages_table.sql

CREATE TABLE messages (
    id UUID PRIMARY KEY NOT NULL,
    appointment_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message VARCHAR(2000) NOT NULL,
    read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_messages_appointment_id ON messages(appointment_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_read ON messages(read);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
```

#### Step 2: Update Appointment Entity (Optional)

Add this relationship to `Appointment.java`:

```java
@OneToMany(mappedBy = "appointment", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
private List<Message> messages = new ArrayList<>();

public List<Message> getMessages() {
    return messages;
}

public void setMessages(List<Message> messages) {
    this.messages = messages;
}
```

---

### Phase 2: Create Message Entity ✅ STEP 3

#### Step 3: Create Message.java Entity Class

**File**: `src/main/java/com/example/appointmentsystembackend/message/Message.java`

```java
package com.example.appointmentsystembackend.message;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.example.appointmentsystembackend.appointment.Appointment;
import com.example.appointmentsystembackend.user.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

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

    // Constructor
    protected Message() {
    }

    public Message(Appointment appointment, User sender, String subject, String message) {
        this.id = UUID.randomUUID();
        this.appointment = appointment;
        this.sender = sender;
        this.subject = subject;
        this.message = message;
        this.read = false;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = OffsetDateTime.now();
        }
    }

    // Getters
    public UUID getId() {
        return id;
    }

    public Appointment getAppointment() {
        return appointment;
    }

    public User getSender() {
        return sender;
    }

    public String getSubject() {
        return subject;
    }

    public String getMessage() {
        return message;
    }

    public boolean isRead() {
        return read;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    // Setters
    public void setRead(boolean read) {
        this.read = read;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }
}
```

---

### Phase 3: Create Repository ✅ STEP 4

#### Step 4: Create MessageRepository.java

**File**: `src/main/java/com/example/appointmentsystembackend/message/MessageRepository.java`

```java
package com.example.appointmentsystembackend.message;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {

    // Find messages for a specific appointment
    List<Message> findByAppointmentId(UUID appointmentId);

    // Find messages sent by a specific user
    List<Message> findBySenderId(UUID senderId);

    // Find all messages for a client (for their appointments)
    List<Message> findByAppointmentClientId(UUID clientId);

    // Find all messages for a staff member (for their appointments)
    List<Message> findByAppointmentStaffIdAndReadFalse(UUID staffId);

    List<Message> findByAppointmentStaffId(UUID staffId);

    // Find unread messages
    List<Message> findByReadFalse();

    // Count unread messages for a user
    long countByAppointmentClientIdAndReadFalse(UUID clientId);
}
```

---

### Phase 4: Create DTOs ✅ STEP 5-6

#### Step 5: Create MessageRequest.java (Input DTO)

**File**: `src/main/java/com/example/appointmentsystembackend/message/MessageRequest.java`

```java
package com.example.appointmentsystembackend.message;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class MessageRequest {

    @NotBlank(message = "Subject is required")
    @Size(min = 3, max = 255, message = "Subject must be between 3 and 255 characters")
    private String subject;

    @NotBlank(message = "Message is required")
    @Size(min = 5, max = 2000, message = "Message must be between 5 and 2000 characters")
    private String message;

    // Constructor
    public MessageRequest() {
    }

    public MessageRequest(String subject, String message) {
        this.subject = subject;
        this.message = message;
    }

    // Getters and Setters
    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
```

#### Step 6: Create MessageResponse.java (Output DTO)

**File**: `src/main/java/com/example/appointmentsystembackend/message/MessageResponse.java`

```java
package com.example.appointmentsystembackend.message;

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

    // Constructor from Message entity
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

    // Getters (all fields are read-only for response)
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

---

### Phase 5: Create Service Layer ✅ STEP 7

#### Step 7: Create MessageService.java

**File**: `src/main/java/com/example/appointmentsystembackend/message/MessageService.java`

```java
package com.example.appointmentsystembackend.message;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.appointmentsystembackend.appointment.Appointment;
import com.example.appointmentsystembackend.appointment.AppointmentRepository;
import com.example.appointmentsystembackend.user.User;
import com.example.appointmentsystembackend.user.UserRepository;

@Service
@Transactional
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

    /**
     * Create a new message for an appointment
     */
    public MessageResponse createMessage(UUID appointmentId, UUID senderId,
                                         MessageRequest request) {
        // Validate appointment exists
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new RuntimeException("Appointment not found with id: " + appointmentId));

        // Validate sender exists
        User sender = userRepository.findById(senderId)
            .orElseThrow(() -> new RuntimeException("User not found with id: " + senderId));

        // Create and save message
        Message message = new Message(appointment, sender,
                                      request.getSubject(),
                                      request.getMessage());

        Message savedMessage = messageRepository.save(message);

        // TODO: Send email notification to staff and admin
        // notificationService.notifyNewMessage(savedMessage);

        return new MessageResponse(savedMessage);
    }

    /**
     * Get all messages for a specific appointment
     */
    @Transactional(readOnly = true)
    public List<MessageResponse> getMessagesForAppointment(UUID appointmentId) {
        return messageRepository.findByAppointmentId(appointmentId)
            .stream()
            .map(MessageResponse::new)
            .collect(Collectors.toList());
    }

    /**
     * Get all messages for a client (across all their appointments)
     */
    @Transactional(readOnly = true)
    public List<MessageResponse> getMessagesForClient(UUID clientId) {
        return messageRepository.findByAppointmentClientId(clientId)
            .stream()
            .map(MessageResponse::new)
            .collect(Collectors.toList());
    }

    /**
     * Get all messages for a staff member (for their appointments)
     */
    @Transactional(readOnly = true)
    public List<MessageResponse> getMessagesForStaff(UUID staffId) {
        return messageRepository.findByAppointmentStaffId(staffId)
            .stream()
            .map(MessageResponse::new)
            .collect(Collectors.toList());
    }

    /**
     * Get all messages in the system (admin only)
     */
    @Transactional(readOnly = true)
    public List<MessageResponse> getAllMessages() {
        return messageRepository.findAll()
            .stream()
            .map(MessageResponse::new)
            .collect(Collectors.toList());
    }

    /**
     * Mark a message as read
     */
    public MessageResponse markAsRead(UUID messageId) {
        Message message = messageRepository.findById(messageId)
            .orElseThrow(() -> new RuntimeException("Message not found with id: " + messageId));

        message.setRead(true);
        Message updatedMessage = messageRepository.save(message);

        return new MessageResponse(updatedMessage);
    }

    /**
     * Delete a message (soft delete could be better)
     */
    public void deleteMessage(UUID messageId) {
        messageRepository.deleteById(messageId);
    }

    /**
     * Get count of unread messages for a client
     */
    @Transactional(readOnly = true)
    public long getUnreadCount(UUID clientId) {
        return messageRepository.countByAppointmentClientIdAndReadFalse(clientId);
    }
}
```

---

### Phase 6: Create Controller ✅ STEP 8

#### Step 8: Create MessageController.java

**File**: `src/main/java/com/example/appointmentsystembackend/message/MessageController.java`

```java
package com.example.appointmentsystembackend.message;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.appointmentsystembackend.user.User;
import com.example.appointmentsystembackend.user.UserRepository;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = "*")
public class MessageController {

    private final MessageService messageService;
    private final UserRepository userRepository;

    public MessageController(MessageService messageService,
                            UserRepository userRepository) {
        this.messageService = messageService;
        this.userRepository = userRepository;
    }

    /**
     * POST /api/messages/{appointmentId} - Create a new message
     */
    @PostMapping("/{appointmentId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MessageResponse> createMessage(
            @PathVariable UUID appointmentId,
            @Valid @RequestBody MessageRequest request,
            Authentication authentication) {

        try {
            // Get sender ID from authentication
            String email = authentication.getName();
            User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

            UUID senderId = UUID.fromString(user.getId());

            // Create message
            MessageResponse response = messageService.createMessage(appointmentId, senderId, request);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * GET /api/messages/appointment/{appointmentId} - Get messages for appointment
     */
    @GetMapping("/appointment/{appointmentId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<MessageResponse>> getAppointmentMessages(
            @PathVariable UUID appointmentId) {

        List<MessageResponse> messages = messageService.getMessagesForAppointment(appointmentId);
        return ResponseEntity.ok(messages);
    }

    /**
     * GET /api/messages/client/{clientId} - Get messages for a client
     */
    @GetMapping("/client/{clientId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<MessageResponse>> getClientMessages(
            @PathVariable UUID clientId) {

        List<MessageResponse> messages = messageService.getMessagesForClient(clientId);
        return ResponseEntity.ok(messages);
    }

    /**
     * GET /api/messages/staff/{staffId} - Get messages for staff
     */
    @GetMapping("/staff/{staffId}")
    @PreAuthorize("hasRole('STAFF') or hasRole('ADMIN')")
    public ResponseEntity<List<MessageResponse>> getStaffMessages(
            @PathVariable UUID staffId) {

        List<MessageResponse> messages = messageService.getMessagesForStaff(staffId);
        return ResponseEntity.ok(messages);
    }

    /**
     * GET /api/messages/all - Get all messages (admin only)
     */
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<MessageResponse>> getAllMessages() {

        List<MessageResponse> messages = messageService.getAllMessages();
        return ResponseEntity.ok(messages);
    }

    /**
     * PATCH /api/messages/{messageId}/read - Mark message as read
     */
    @PatchMapping("/{messageId}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MessageResponse> markMessageRead(
            @PathVariable UUID messageId) {

        try {
            MessageResponse response = messageService.markAsRead(messageId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
}
```

---

### Phase 7: Testing ✅ STEP 9

#### Step 9: Test All Endpoints

Create `MessageControllerTest.java` to test:

```java
@WebMvcTest(MessageController.class)
public class MessageControllerTest {

    @MockBean
    private MessageService messageService;

    @MockBean
    private UserRepository userRepository;

    @Autowired
    private MockMvc mockMvc;

    // Test create message
    // Test get appointment messages
    // Test get client messages
    // Test get staff messages
    // Test mark as read
    // Test security/authorization
}
```

---

## ✅ Verification Checklist

After completing all steps:

- [ ] Database table created successfully
- [ ] Message entity compiles without errors
- [ ] MessageRepository extends JpaRepository
- [ ] MessageRequest has validation annotations
- [ ] MessageResponse converts Message entity correctly
- [ ] MessageService has all required methods
- [ ] MessageController has all endpoints
- [ ] Spring Security configured for endpoints
- [ ] @PreAuthorize annotations in place
- [ ] Can create message via POST endpoint
- [ ] Can retrieve messages via GET endpoints
- [ ] Can mark message as read
- [ ] Frontend can successfully connect and create messages
- [ ] Messages appear in database
- [ ] Timestamps are correct
- [ ] Role-based access control working

---

## 🧪 Manual Testing Steps

### 1. Create Message (as Client)

```bash
curl -X POST http://localhost:8080/api/messages/{appointmentId} \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Follow-up on my appointment",
    "message": "I wanted to discuss the results..."
  }'
```

### 2. Get Client Messages

```bash
curl -X GET http://localhost:8080/api/messages/client/{clientId} \
  -H "Authorization: Bearer {TOKEN}"
```

### 3. Get Staff Messages

```bash
curl -X GET http://localhost:8080/api/messages/staff/{staffId} \
  -H "Authorization: Bearer {TOKEN}"
```

### 4. Mark as Read

```bash
curl -X PATCH http://localhost:8080/api/messages/{messageId}/read \
  -H "Authorization: Bearer {TOKEN}"
```

---

## 📞 Support & Troubleshooting

### Common Issues:

1. **"Appointment not found"**
   - Ensure appointmentId is a valid UUID
   - Check that appointment exists in database

2. **"User not found"**
   - Verify authentication token is valid
   - Check UserRepository.findByEmail() is working

3. **Foreign key constraint violation**
   - Ensure appointment_id exists
   - Ensure sender_id exists

4. **"Unauthorized" (403)**
   - Check @PreAuthorize annotations
   - Verify user has correct role

---

## 📚 Additional Enhancements (Optional)

After core implementation, consider:

1. **Email Notifications**
   - Send email when new message arrives
   - Include message preview in email

2. **Message Search**
   - Search messages by subject or content
   - Filter by sender or date range

3. **Attachments**
   - Allow file attachments to messages
   - Store in cloud storage (S3/Azure)

4. **Message Read Receipts**
   - Track when messages are read
   - Show "Read at" timestamp

5. **Message Pagination**
   - Limit result sets
   - Add sorting options

6. **Real-time Notifications**
   - WebSocket integration
   - Push notifications

---

**Total Implementation Time**: 2-3 hours (for experienced developer)
**Difficulty Level**: Intermediate
**Dependencies**: Spring Data JPA, Spring Security, Jakarta Validation

Good luck! 🚀
