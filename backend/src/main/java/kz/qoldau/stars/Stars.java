package kz.qoldau.stars;

import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface Stars extends JpaRepository<Star, Long> {
  Optional<Star> findByUserId(Long id);
}
