package kz.qoldau.auctions;

import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.*;
import org.springframework.data.jpa.repository.*;

public interface Lots extends JpaRepository<Lot, Long> {
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select l from Lot l where l.id=:id")
  Optional<Lot> locked(Long id);

  @Query("select l.id from Lot l where l.closed=false and l.endsAt<=:now")
  List<Long> expired(Instant now);
}
