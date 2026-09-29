package kz.qoldau.requests;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import java.time.Instant;
import kz.qoldau.stars.*;
import org.springframework.beans.factory.annotation.Value;
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
  private final StarAwards awards;
  private final int rewardStars;

  public RequestController(Requests r, Responses responses, CurrentUser c, Users users,
      StarAwards awards, @Value("${app.request-reward-stars}") int rewardStars) {
    this.requests = r;
    this.responses = responses;
    this.current = c;
    this.users = users;
    this.awards = awards;
    if (rewardStars < 1) throw new IllegalArgumentException("REQUEST_REWARD_STARS must be positive");
    this.rewardStars = rewardStars;
  }

  public record Input(
      @NotBlank @Size(max = 120) String title,
      @NotBlank @Size(max = 5000) String description,
      @NotBlank @Size(max = 100) String city,
      @Pattern(regexp = "EVERYDAY|TRANSPORT|EDUCATION|OTHER") @NotNull String category,
      @Pattern(regexp = "OPEN|CLOSED|CANCELLED") @NotNull String status) {}

  public record Reply(@NotBlank @Size(max = 1000) String message,
      @Size(max = 40) @Pattern(regexp = "^$|^[+0-9() .-]{6,40}$", message = "Enter a valid phone number") String phone,
      @Email(message = "Enter a valid email address") @Size(max = 254) String email) {
    public Reply {
      phone = phone == null ? "" : phone.trim();
      email = email == null ? "" : email.trim();
    }
    @AssertTrue(message = "Provide a phone number or email address")
    public boolean isContactProvided() { return !phone.isBlank() || !email.isBlank(); }
    @AssertTrue(message = "Phone number must contain at least 6 digits")
    public boolean isPhoneValid() { return phone.isEmpty() || phone.replaceAll("[^0-9]", "").length() >= 6; }
  }

  public record ReplyView(Long id, Long helperId, String name, String message, String phone,
      String email, String status, Instant createdAt) {}

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
    if (!"OPEN".equals(in.status())) throw ApiException.conflict("New requests must be open");
    var r = new HelpRequest();
    r.authorId = current.get().id;
    copy(r, in);
    r.rewardStars = rewardStars;
    return requests.save(r);
  }

  @PutMapping("/{id}")
  @Transactional
  public HelpRequest edit(@PathVariable Long id, @Valid @RequestBody Input in) {
    var r = requests.locked(id).orElseThrow(ApiException::missing);
    if (!r.authorId.equals(current.get().id)) throw ApiException.forbidden();
    if (!r.status.equals("OPEN")) throw ApiException.conflict("Only open requests can be edited");
    copy(r, in);
    return requests.save(r);
  }

  @PostMapping("/{id}/responses")
  @Transactional
  public ReplyView respond(@PathVariable Long id, @Valid @RequestBody Reply in) {
    var r = requests.locked(id).orElseThrow(ApiException::missing);
    var u = current.get();
    if (r.authorId.equals(u.id)) throw ApiException.conflict("You cannot help with your own request");
    if (!r.status.equals("OPEN")) throw ApiException.conflict("This request is no longer accepting offers");
    var response = new HelpResponse();
    response.requestId = id;
    response.helperId = u.id;
    response.message = in.message().trim();
    response.phone = in.phone();
    response.email = in.email();
    return view(responses.saveAndFlush(response), r);
  }

  @GetMapping("/{id}/responses")
  public Object replies(@PathVariable Long id) {
    var r = detail(id);
    var userId = current.get().id;
    var all = responses.findByRequestIdOrderByCreatedAtDesc(id);
    if (!r.authorId.equals(userId) && all.stream().noneMatch(x -> x.helperId.equals(userId)))
      throw ApiException.forbidden();
    return all.stream().filter(x -> r.authorId.equals(userId) || x.helperId.equals(userId))
        .map(x -> view(x, r)).toList();
  }

  @GetMapping("/{id}/responses/{responseId}")
  public ReplyView reply(@PathVariable Long id, @PathVariable Long responseId) {
    var r = detail(id);
    var response = responseFor(id, responseId);
    var userId = current.get().id;
    if (!r.authorId.equals(userId) && !response.helperId.equals(userId)) throw ApiException.forbidden();
    return view(response, r);
  }

  @GetMapping("/{id}/responses/mine")
  public Object ownReply(@PathVariable Long id) {
    var r = detail(id);
    var userId = current.get().id;
    return responses.findByRequestIdOrderByCreatedAtDesc(id).stream()
        .filter(x -> x.helperId.equals(userId)).map(x -> view(x, r)).toList();
  }

  @PostMapping("/{id}/responses/{responseId}/select")
  @Transactional
  public HelpRequest select(@PathVariable Long id, @PathVariable Long responseId) {
    var r = ownedLocked(id);
    if (!r.status.equals("OPEN")) throw ApiException.conflict("A helper can only be selected for an open request");
    var response = responseFor(id, responseId);
    if (response.helperId.equals(r.authorId)) throw ApiException.conflict("You cannot select yourself");
    r.selectedResponseId = response.id;
    r.status = "IN_PROGRESS";
    return requests.save(r);
  }

  @PostMapping("/{id}/complete")
  @Transactional
  public HelpRequest complete(@PathVariable Long id) {
    var r = ownedLocked(id);
    if (r.status.equals("COMPLETED")) return r; // Idempotent retry; no second award.
    if (!r.status.equals("IN_PROGRESS")) throw ApiException.conflict("Select a helper before confirming help");
    var response = responseFor(id, r.selectedResponseId);
    if (response.helperId.equals(r.authorId)) throw ApiException.conflict("You cannot reward yourself");
    r.status = "COMPLETED";
    r.completedAt = Instant.now();
    var award = new StarAward();
    award.requestId = id;
    award.helperId = response.helperId;
    award.amount = r.rewardStars;
    award.createdAt = r.completedAt;
    awards.saveAndFlush(award);
    return requests.save(r);
  }

  @PostMapping("/{id}/cancel")
  @Transactional
  public HelpRequest cancel(@PathVariable Long id) {
    var r = ownedLocked(id);
    if (r.status.equals("COMPLETED")) throw ApiException.conflict("Completed requests cannot be cancelled");
    r.status = "CANCELLED";
    return requests.save(r);
  }

  private HelpRequest ownedLocked(Long id) {
    var r = requests.locked(id).orElseThrow(ApiException::missing);
    if (!r.authorId.equals(current.get().id)) throw ApiException.forbidden();
    return r;
  }

  private HelpResponse responseFor(Long id, Long responseId) {
    var response = responses.findById(responseId).orElseThrow(ApiException::missing);
    if (!response.requestId.equals(id)) throw ApiException.missing();
    return response;
  }

  private ReplyView view(HelpResponse x, HelpRequest r) {
    String status = "PENDING";
    if (r.status.equals("CANCELLED") || r.status.equals("CLOSED")) status = "CANCELLED";
    else if (r.selectedResponseId != null) status = r.selectedResponseId.equals(x.id)
        ? (r.status.equals("COMPLETED") ? "COMPLETED" : "SELECTED") : "NOT_SELECTED";
    return new ReplyView(x.id, x.helperId, users.findById(x.helperId).orElseThrow().name,
        x.message, x.phone, x.email, status, x.createdAt);
  }



  private void copy(HelpRequest r, Input in) {
    r.title = in.title().trim();
    r.description = in.description().trim();
    r.city = in.city().trim();
    r.category = in.category();
    r.status = in.status();
  }
}
