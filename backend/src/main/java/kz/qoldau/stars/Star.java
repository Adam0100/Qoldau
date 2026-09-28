package kz.qoldau.stars;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "stars")
public class Star {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  public Long userId;
  public String story;
  public Instant createdAt = Instant.now();
}
