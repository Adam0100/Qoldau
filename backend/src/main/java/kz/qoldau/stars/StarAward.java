package kz.qoldau.stars;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "star_awards")
public class StarAward {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;
  public Long requestId;
  public Long helperId;
  public int amount;
  public Instant createdAt = Instant.now();
}
