package kz.qoldau.wishes;

import jakarta.persistence.LockModeType;
import java.util.*;
import org.springframework.data.jpa.repository.*;

public interface Wishes extends JpaRepository<Wish, Long> {
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select w from Wish w where w.id=:id")
  Optional<Wish> locked(Long id);
}
