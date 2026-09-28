package kz.qoldau.auctions;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "auction_lots")
public class Lot {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  public Long sellerId;
  public String title;
  public String description;
  public String celebrity;
  public String charity;

  @Column(precision = 14, scale = 2)
  public BigDecimal startPrice;

  @Column(precision = 14, scale = 2)
  public BigDecimal currentPrice;

  public Instant startsAt;
  public Instant endsAt;
  public boolean closed = false;
  public Long winnerId;
  public Instant createdAt = Instant.now();
}
