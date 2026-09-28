package kz.qoldau.auctions;

import java.time.Instant;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class AuctionScheduler {
  private final Lots lots;
  private final AuctionService service;

  public AuctionScheduler(Lots l, AuctionService s) {
    lots = l;
    service = s;
  }

  @Scheduled(fixedDelay = 5000)
  public void closeExpired() {
    for (Long id : lots.expired(Instant.now())) service.settle(id);
  }
}
