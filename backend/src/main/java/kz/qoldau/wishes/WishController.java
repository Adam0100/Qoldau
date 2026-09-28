package kz.qoldau.wishes;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import kz.qoldau.auth.*;
import kz.qoldau.common.*;
import org.springframework.data.domain.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wishes")
public class WishController {
  private final Wishes wishes;
  private final CurrentUser current;

  public WishController(Wishes w, CurrentUser c) {
    wishes = w;
    current = c;
  }

  public record Input(
      @NotBlank @Size(max = 120) String title, @NotBlank @Size(max = 3000) String description) {}

  @GetMapping
  public Object list(@RequestParam(defaultValue = "0") int page) {
    var r =
        wishes.findAll(PageRequest.of(Math.max(page, 0), 20, Sort.by("createdAt").descending()));
    return Map.of("items", r.getContent(), "total", r.getTotalElements());
  }

  @PostMapping
  @Transactional
  public Wish create(@Valid @RequestBody Input in) {
    var w = new Wish();
    w.authorId = current.get().id;
    w.title = in.title().trim();
    w.description = in.description().trim();
    return wishes.save(w);
  }

  @PostMapping("/{id}/pledge")
  @Transactional
  public Wish pledge(@PathVariable Long id) {
    var w = wishes.locked(id).orElseThrow(ApiException::missing);
    var u = current.get();
    if (w.authorId.equals(u.id)) throw ApiException.conflict("Нельзя поддержать своё желание");
    if (!w.status.equals("OPEN")) throw ApiException.conflict("Желание уже поддержано");
    w.supporterId = u.id;
    w.status = "PLEDGED";
    return w;
  }

  @PostMapping("/{id}/fulfill")
  @Transactional
  public Wish fulfill(@PathVariable Long id) {
    var w = wishes.locked(id).orElseThrow(ApiException::missing);
    if (!w.authorId.equals(current.get().id)) throw ApiException.forbidden();
    if (!w.status.equals("PLEDGED"))
      throw ApiException.conflict("Сначала нужна поддержка участника");
    w.status = "FULFILLED";
    return w;
  }
}
