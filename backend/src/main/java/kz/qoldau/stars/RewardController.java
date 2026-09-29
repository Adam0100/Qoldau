package kz.qoldau.stars;

import java.util.Map;
import kz.qoldau.auth.CurrentUser;
import kz.qoldau.requests.Requests;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
public class RewardController {
  private final StarAwards awards;
  private final Requests requests;
  private final CurrentUser current;

  public RewardController(StarAwards awards, Requests requests, CurrentUser current) {
    this.awards = awards; this.requests = requests; this.current = current;
  }

  @GetMapping("/api/me/stars")
  @Transactional(readOnly = true, isolation = org.springframework.transaction.annotation.Isolation.REPEATABLE_READ)
  public Object summary(@RequestParam(defaultValue = "0") int page) {
    Long userId = current.get().id;
    var history = awards.findByHelperIdOrderByCreatedAtDesc(userId, PageRequest.of(Math.max(0, page), 20));
    return Map.of("balance", awards.balance(userId), "helpedCount", awards.countByHelperId(userId),
        "total", history.getTotalElements(), "items", history.getContent().stream().map(a -> Map.of(
            "requestId", a.requestId, "title", requests.findById(a.requestId).orElseThrow().title,
            "stars", a.amount, "completedAt", a.createdAt)).toList());
  }
}
