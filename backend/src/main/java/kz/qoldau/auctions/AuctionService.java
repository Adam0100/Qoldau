package kz.qoldau.auctions;

import java.math.BigDecimal;
import java.time.Instant;
import kz.qoldau.common.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuctionService {
  private final Lots lots;
  private final Bids bids;

  public AuctionService(Lots l, Bids b) {
    lots = l;
    bids = b;
  }

  @Transactional
  public Bid bid(Long lotId, Long userId, BigDecimal amount) {
    var lot = lots.locked(lotId).orElseThrow(ApiException::missing);
    // Check the clock AFTER acquiring the lock: queued requests cannot bid after the deadline.
    var now = Instant.now();
    if (lot.closed || !now.isBefore(lot.endsAt)) throw ApiException.conflict("Auction has ended");
    if (now.isBefore(lot.startsAt)) throw ApiException.conflict("Auction has not started");
    if (lot.sellerId.equals(userId))
      throw ApiException.conflict("You cannot bid on your own lot");
    if (amount.compareTo(lot.currentPrice) <= 0)
      throw ApiException.conflict("Your bid must exceed the current price");
    var b = new Bid();
    b.lotId = lotId;
    b.bidderId = userId;
    b.amount = amount;
    b.createdAt = now;
    lot.currentPrice = amount;
    return bids.saveAndFlush(b);
  }

  @Transactional
  public Lot settle(Long id) {
    var l = lots.locked(id).orElseThrow(ApiException::missing);
    if (!l.closed && !Instant.now().isBefore(l.endsAt)) {
      l.closed = true;
      l.winnerId = bids.findFirstByLotIdOrderByAmountDesc(id).map(b -> b.bidderId).orElse(null);
    }
    return l;
  }
}
