package kz.qoldau.requests;

import jakarta.persistence.LockModeType;
import java.util.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;

public interface Requests extends JpaRepository<HelpRequest, Long> {
  Page<HelpRequest>
      findByCityContainingIgnoreCaseAndCategoryContainingIgnoreCaseOrderByCreatedAtDesc(
          String city, String category, Pageable pageable);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select r from HelpRequest r where r.id=:id")
  Optional<HelpRequest> locked(Long id);
}
