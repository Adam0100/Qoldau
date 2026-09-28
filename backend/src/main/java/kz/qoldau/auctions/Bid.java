package kz.qoldau.auctions;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "auction_bids")
public class Bid {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  public Long lotId;
  public Long bidderId;

  @Column(precision = 14, scale = 2)
  public BigDecimal amount;

  public Instant createdAt = Instant.now();
}
