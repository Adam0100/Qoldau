package kz.qoldau.requests;

import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface Responses extends JpaRepository<HelpResponse, Long> {
  List<HelpResponse> findByRequestIdOrderByCreatedAtDesc(Long requestId);
}
