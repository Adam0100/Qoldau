package kz.qoldau.stars;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import kz.qoldau.auth.*;
import org.springframework.data.domain.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stars")
public class StarController {
  private final Stars stars;
  private final Users users;
  private final CurrentUser current;

  public StarController(Stars s, Users u, CurrentUser c) {
    stars = s;
    users = u;
    current = c;
  }

  public record Input(@NotBlank @Size(max = 2000) String story) {}

  @GetMapping
  public Object list(@RequestParam(defaultValue = "0") int page) {
    var result =
        stars.findAll(PageRequest.of(Math.max(page, 0), 20, Sort.by("createdAt").descending()));
    return Map.of(
        "items",
        result.getContent().stream()
            .map(
                s -> {
                  var u = users.findById(s.userId).orElseThrow();
                  return Map.of(
                      "id", s.id, "userId", u.id, "name", u.name, "city", u.city, "story", s.story);
                })
            .toList(),
        "total",
        result.getTotalElements());
  }

  @PutMapping("/me")
  @Transactional
  public Star join(@Valid @RequestBody Input in) {
    var u = current.get();
    var s = stars.findByUserId(u.id).orElseGet(Star::new);
    s.userId = u.id;
    s.story = in.story().trim();
    return stars.saveAndFlush(s);
  }

  @DeleteMapping("/me")
  @Transactional
  public void leave() {
    stars.findByUserId(current.get().id).ifPresent(stars::delete);
  }
}
