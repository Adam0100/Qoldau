package kz.qoldau.auctions;

import java.util.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface Bids extends JpaRepository<Bid, Long> {
  Optional<Bid> findFirstByLotIdOrderByAmountDesc(Long id);

  Page<Bid> findByLotIdOrderByAmountDesc(Long id, Pageable pageable);
}
