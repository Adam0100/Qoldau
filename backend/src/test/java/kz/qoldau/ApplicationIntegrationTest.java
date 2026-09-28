package kz.qoldau;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import kz.qoldau.auctions.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.*;

@SpringBootTest
@AutoConfigureMockMvc
@org.springframework.test.context.TestPropertySource(
    properties = {
      "spring.datasource.url=${TEST_DB_URL:jdbc:postgresql://localhost:5433/qoldau_test}",
      "spring.datasource.username=${DB_USER:qoldau}",
      "spring.datasource.password=${DB_PASSWORD}"
    })
class ApplicationIntegrationTest {
  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;
  @Autowired AuctionService auctions;
  @Autowired Lots lots;
  @Autowired Bids bids;

  record Account(long id, MockHttpSession session) {}

  Account account() throws Exception {
    String email = UUID.randomUUID() + "@example.test";
    String password = UUID.randomUUID().toString();
    mvc.perform(
            post("/api/auth/register")
                .with(csrf())
                .contentType("application/json")
                .content(
                    json.writeValueAsString(
                        Map.of(
                            "email",
                            email,
                            "password",
                            password,
                            "name",
                            "Test member",
                            "city",
                            "Almaty"))))
        .andExpect(status().isOk());
    var result =
        mvc.perform(
                post("/api/auth/login")
                    .with(csrf())
                    .contentType("application/json")
                    .content(json.writeValueAsString(Map.of("email", email, "password", password))))
            .andExpect(status().isOk())
            .andReturn();
    return new Account(
        json.readTree(result.getResponse().getContentAsString()).get("id").asLong(),
        (MockHttpSession) result.getRequest().getSession(false));
  }

  JsonNode postJson(String url, Object body, Account user, int expected) throws Exception {
    var request = post(url).with(csrf()).contentType("application/json");
    if (user != null) request.session(user.session());
    if (body != null) request.content(json.writeValueAsString(body));
    var result = mvc.perform(request).andExpect(status().is(expected)).andReturn();
    return result.getResponse().getContentAsString().isEmpty()
        ? null
        : json.readTree(result.getResponse().getContentAsString());
  }

  @Test
  void authValidationCsrfAndProfile() throws Exception {
    mvc.perform(get("/api/me")).andExpect(status().isUnauthorized());
    mvc.perform(post("/api/auth/register").contentType("application/json").content("{}"))
        .andExpect(status().isForbidden());
    postJson(
        "/api/auth/register",
        Map.of("email", "bad", "password", "short", "name", "", "city", ""),
        null,
        400);
    var user = account();
    mvc.perform(get("/api/me").session(user.session()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(user.id()))
        .andExpect(jsonPath("$.passwordHash").doesNotExist());
    mvc.perform(
            put("/api/me")
                .session(user.session())
                .with(csrf())
                .contentType("application/json")
                .content("{\"name\":\"Updated\",\"city\":\"Astana\",\"bio\":\"Hello\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("Updated"));
    postJson(
        "/api/auth/login",
        Map.of("email", "missing@example.test", "password", "incorrect-password"),
        null,
        401);
    mvc.perform(post("/api/auth/logout").session(user.session()).with(csrf()))
        .andExpect(status().isNoContent());
  }

  @Test
  void requestOwnershipResponsesAndClosing() throws Exception {
    var author = account();
    var helper = account();
    var body =
        Map.of(
            "title",
            "Help with books",
            "description",
            "Carry books",
            "city",
            "Almaty",
            "category",
            "EVERYDAY",
            "status",
            "OPEN");
    postJson("/api/requests", body, null, 401);
    var r = postJson("/api/requests", body, author, 200);
    long id = r.get("id").asLong();
    mvc.perform(
            put("/api/requests/" + id)
                .session(helper.session())
                .with(csrf())
                .contentType("application/json")
                .content(json.writeValueAsString(body)))
        .andExpect(status().isForbidden());
    postJson("/api/requests/" + id + "/responses", Map.of("message", "I can help"), author, 409);
    postJson("/api/requests/" + id + "/responses", Map.of("message", "I can help"), helper, 200);
    postJson("/api/requests/" + id + "/responses", Map.of("message", "Again"), helper, 409);
    mvc.perform(get("/api/requests/" + id + "/responses").session(helper.session()))
        .andExpect(status().isForbidden());
    mvc.perform(get("/api/requests/" + id + "/responses").session(author.session()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].message").value("I can help"));
    var closed = new HashMap<>(body);
    closed.put("status", "CLOSED");
    mvc.perform(
            put("/api/requests/" + id)
                .session(author.session())
                .with(csrf())
                .contentType("application/json")
                .content(json.writeValueAsString(closed)))
        .andExpect(status().isOk());
    postJson("/api/requests/" + id + "/responses", Map.of("message", "Late"), account(), 409);
  }

  @Test
  void starsAndWishLifecycle() throws Exception {
    var author = account();
    var helper = account();
    mvc.perform(
            put("/api/stars/me")
                .session(author.session())
                .with(csrf())
                .contentType("application/json")
                .content("{\"story\":\"Helping my community\"}"))
        .andExpect(status().isOk());
    mvc.perform(
            put("/api/stars/me")
                .session(author.session())
                .with(csrf())
                .contentType("application/json")
                .content("{\"story\":\"Updated story\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.story").value("Updated story"));
    var w =
        postJson(
            "/api/wishes",
            Map.of("title", "Learn guitar", "description", "Looking for a teacher"),
            author,
            200);
    String url = "/api/wishes/" + w.get("id").asLong();
    postJson(url + "/pledge", null, author, 409);
    postJson(url + "/pledge", null, helper, 200);
    postJson(url + "/pledge", null, account(), 409);
    postJson(url + "/fulfill", null, helper, 403);
    assertEquals("FULFILLED", postJson(url + "/fulfill", null, author, 200).get("status").asText());
  }

  Lot lot(long seller) {
    var l = new Lot();
    l.sellerId = seller;
    l.title = "Test charity lot";
    l.description = "Unverified teaching fixture";
    l.celebrity = "Test";
    l.charity = "Test";
    l.startPrice = new BigDecimal("100.00");
    l.currentPrice = l.startPrice;
    l.startsAt = Instant.now().minusSeconds(60);
    l.endsAt = Instant.now().plusSeconds(3600);
    return lots.save(l);
  }

  @Test
  void simultaneousBidsAreSerializedAndWinnerIsStable() throws Exception {
    var seller = account();
    var a = account();
    var b = account();
    var l = lot(seller.id());
    postJson("/api/auctions/" + l.id + "/bids", Map.of("amount", 200), seller, 409);
    postJson("/api/auctions/" + l.id + "/bids", Map.of("amount", 100.001), a, 400);
    var gate = new CountDownLatch(1);
    try (var pool = Executors.newFixedThreadPool(2)) {
      var f1 =
          pool.submit(
              () -> {
                gate.await();
                try {
                  auctions.bid(l.id, a.id(), new BigDecimal("200.00"));
                  return true;
                } catch (kz.qoldau.common.ApiException e) {
                  return false;
                }
              });
      var f2 =
          pool.submit(
              () -> {
                gate.await();
                try {
                  auctions.bid(l.id, b.id(), new BigDecimal("200.00"));
                  return true;
                } catch (kz.qoldau.common.ApiException e) {
                  return false;
                }
              });
      gate.countDown();
      assertNotEquals(
          f1.get(10, TimeUnit.SECONDS),
          f2.get(10, TimeUnit.SECONDS),
          "Exactly one equal bid must win the race");
    }
    var persisted = lots.findById(l.id).orElseThrow();
    assertEquals(0, persisted.currentPrice.compareTo(new BigDecimal("200.00")));
    assertEquals(
        1,
        bids.findByLotIdOrderByAmountDesc(
                l.id, org.springframework.data.domain.PageRequest.of(0, 20))
            .getTotalElements());
    persisted.endsAt = Instant.now().minusSeconds(1);
    lots.save(persisted);
    assertThrows(
        kz.qoldau.common.ApiException.class,
        () -> auctions.bid(l.id, a.id(), new BigDecimal("300.00")));
    var settled = auctions.settle(l.id);
    assertTrue(settled.closed);
    assertNotNull(settled.winnerId);
    assertEquals(settled.winnerId, auctions.settle(l.id).winnerId);
  }

  @Test
  void scheduledAndEmptyAuctionsRejectBids() throws Exception {
    var seller = account();
    var helper = account();
    var l = lot(seller.id());
    l.startsAt = Instant.now().plusSeconds(60);
    lots.save(l);
    postJson("/api/auctions/" + l.id + "/bids", Map.of("amount", 200), helper, 409);
    l.startsAt = Instant.now().minusSeconds(100);
    l.endsAt = Instant.now().minusSeconds(10);
    lots.save(l);
    assertNull(auctions.settle(l.id).winnerId);
    assertTrue(lots.findById(l.id).orElseThrow().closed);
  }
}
