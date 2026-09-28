package kz.qoldau.wishes;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "wishes")
public class Wish {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  public Long authorId;
  public String title;
  public String description;
  public Long supporterId;
  public String status = "OPEN";
  public Instant createdAt = Instant.now();
}
