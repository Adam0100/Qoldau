package kz.qoldau.auctions;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import kz.qoldau.auth.*;
import kz.qoldau.common.*;
import org.springframework.data.domain.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auctions")
public class AuctionController {
  private final Lots lots;
  private final Bids bids;
  private final AuctionService service;
  private final CurrentUser current;

  public AuctionController(Lots l, Bids b, AuctionService s, CurrentUser c) {
    lots = l;
    bids = b;
    service = s;
    current = c;
  }

  public record Input(
      @NotBlank @Size(max = 120) String title,
      @NotBlank @Size(max = 5000) String description,
      @NotBlank @Size(max = 120) String celebrity,
      @NotBlank @Size(max = 200) String charity,
      @NotNull @DecimalMin("0.01") @Digits(integer = 12, fraction = 2) BigDecimal startPrice,
      @NotNull Instant startsAt,
      @NotNull @Future Instant endsAt) {}

  public record Offer(
      @NotNull @DecimalMin("0.01") @Digits(integer = 12, fraction = 2) BigDecimal amount) {}

  @GetMapping
  public Object list(@RequestParam(defaultValue = "0") int page) {
    var r = lots.findAll(PageRequest.of(Math.max(0, page), 20, Sort.by("createdAt").descending()));
    return Map.of("items", r.getContent(), "total", r.getTotalElements());
  }

  @GetMapping("/{id}")
  public Lot detail(@PathVariable Long id) {
    return service.settle(id);
  }

  @GetMapping("/{id}/bids")
  public Object history(@PathVariable Long id, @RequestParam(defaultValue = "0") int page) {
    if (!lots.existsById(id)) throw ApiException.missing();
    var r = bids.findByLotIdOrderByAmountDesc(id, PageRequest.of(Math.max(page, 0), 20));
    return Map.of("items", r.getContent(), "total", r.getTotalElements());
  }

  @PostMapping
  public Lot create(@Valid @RequestBody Input in) {
    if (!in.endsAt().isAfter(in.startsAt()))
      throw ApiException.conflict("Окончание должно быть позже начала");
    var l = new Lot();
    l.sellerId = current.get().id;
    l.title = in.title().trim();
    l.description = in.description().trim();
    l.celebrity = in.celebrity().trim();
    l.charity = in.charity().trim();
    l.startPrice = in.startPrice();
    l.currentPrice = in.startPrice();
    l.startsAt = in.startsAt();
    l.endsAt = in.endsAt();
    return lots.save(l);
  }

  @PostMapping("/{id}/bids")
  public Bid bid(@PathVariable Long id, @Valid @RequestBody Offer in) {
    return service.bid(id, current.get().id, in.amount());
  }
}
