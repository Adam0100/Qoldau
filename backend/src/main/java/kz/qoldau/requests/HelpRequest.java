package kz.qoldau.requests;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "help_requests")
public class HelpRequest {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  public Long authorId;
  public String title;
  public String description;
  public String city;
  public String category;
  public String status = "OPEN";
  public Long selectedResponseId;
  public int rewardStars = 5;
  public Instant completedAt;
  public Instant createdAt = Instant.now();
}
