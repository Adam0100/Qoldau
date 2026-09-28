package kz.qoldau.requests;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import kz.qoldau.auth.*;
import kz.qoldau.common.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/requests")
public class RequestController {
  private final Requests requests;
  private final Responses responses;
  private final CurrentUser current;
  private final Users users;

  public RequestController(Requests r, Responses responses, CurrentUser c, Users users) {
    this.requests = r;
    this.responses = responses;
    this.current = c;
    this.users = users;
  }

  public record Input(
      @NotBlank @Size(max = 120) String title,
      @NotBlank @Size(max = 5000) String description,
      @NotBlank @Size(max = 100) String city,
      @Pattern(regexp = "EVERYDAY|TRANSPORT|EDUCATION|OTHER") @NotNull String category,
      @Pattern(regexp = "OPEN|CLOSED") @NotNull String status) {}

  public record Reply(@NotBlank @Size(max = 1000) String message) {}

  @GetMapping
  public Object list(
      @RequestParam(defaultValue = "") String city,
      @RequestParam(defaultValue = "") String category,
      @RequestParam(defaultValue = "0") int page) {
    var result =
        requests.findByCityContainingIgnoreCaseAndCategoryContainingIgnoreCaseOrderByCreatedAtDesc(
            city, category, PageRequest.of(Math.max(0, page), 20));
    return Map.of("items", result.getContent(), "total", result.getTotalElements());
  }

  @GetMapping("/{id}")
  public HelpRequest detail(@PathVariable Long id) {
    return requests.findById(id).orElseThrow(ApiException::missing);
  }

  @PostMapping
  @Transactional
  public HelpRequest create(@Valid @RequestBody Input in) {
    var r = new HelpRequest();
    r.authorId = current.get().id;
    copy(r, in);
    return requests.save(r);
  }

  @PutMapping("/{id}")
  @Transactional
  public HelpRequest edit(@PathVariable Long id, @Valid @RequestBody Input in) {
    var r = requests.locked(id).orElseThrow(ApiException::missing);
    if (!r.authorId.equals(current.get().id)) throw ApiException.forbidden();
    copy(r, in);
    return requests.save(r);
  }

  @PostMapping("/{id}/responses")
  @Transactional
  public HelpResponse respond(@PathVariable Long id, @Valid @RequestBody Reply in) {
    var r = requests.locked(id).orElseThrow(ApiException::missing);
    var u = current.get();
    if (r.authorId.equals(u.id)) throw ApiException.conflict("Нельзя откликнуться на свою просьбу");
    if (!r.status.equals("OPEN")) throw ApiException.conflict("Просьба уже закрыта");
    var response = new HelpResponse();
    response.requestId = id;
    response.helperId = u.id;
    response.message = in.message().trim();
    return responses.saveAndFlush(response);
  }

  @GetMapping("/{id}/responses")
  public Object replies(@PathVariable Long id) {
    var r = detail(id);
    if (!r.authorId.equals(current.get().id)) throw ApiException.forbidden();
    return responses.findByRequestIdOrderByCreatedAtDesc(id).stream()
        .map(
            x ->
                Map.of(
                    "id",
                    x.id,
                    "name",
                    users.findById(x.helperId).orElseThrow().name,
                    "message",
                    x.message,
                    "createdAt",
                    x.createdAt))
        .toList();
  }

  private void copy(HelpRequest r, Input in) {
    r.title = in.title().trim();
    r.description = in.description().trim();
    r.city = in.city().trim();
    r.category = in.category();
    r.status = in.status();
  }
}
