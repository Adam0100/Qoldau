package kz.qoldau.requests;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "help_responses")
public class HelpResponse {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  public Long requestId;
  public Long helperId;
  public String message;
  public String phone = "";
  public String email = "";
  public Instant createdAt = Instant.now();
}
