package kz.qoldau.stars;

import org.springframework.data.jpa.repository.*;
import org.springframework.data.domain.*;

public interface StarAwards extends JpaRepository<StarAward, Long> {
  @Query("select coalesce(sum(a.amount), 0) from StarAward a where a.helperId=:helperId")
  long balance(Long helperId);
  long countByHelperId(Long helperId);
  long countByRequestId(Long requestId);
  Page<StarAward> findByHelperIdOrderByCreatedAtDesc(Long helperId, Pageable pageable);
}
