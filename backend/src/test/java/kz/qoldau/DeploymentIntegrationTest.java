package kz.qoldau;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = {
    "spring.datasource.url=${TEST_DB_URL:jdbc:postgresql://localhost:5433/qoldau_test}",
    "spring.datasource.username=${DB_USER:qoldau}",
    "app.frontend-origin=https://qoldau.example.com"
})
@ActiveProfiles("prod")
@AutoConfigureMockMvc
class DeploymentIntegrationTest {
  @Autowired MockMvc mvc;

  @Test void publicPagesAndHealth() throws Exception {
    for (String path : new String[]{"/", "/login", "/profile/settings", "/requests/123/edit", "/auctions/new"}) {
      mvc.perform(get(path)).andExpect(status().isOk()).andExpect(forwardedUrl("/index.html"));
    }
    mvc.perform(get("/health")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("UP"));
  }

  @Test void apiAndAssetsNeverBecomeSpa() throws Exception {
    mvc.perform(get("/api/unknown")).andExpect(status().isUnauthorized())
        .andExpect(content().contentTypeCompatibleWith("application/json"));
    mvc.perform(get("/api/unknown").with(user("test"))).andExpect(status().isNotFound())
        .andExpect(jsonPath("$.message").value("Not found"));
    mvc.perform(get("/assets/missing.js")).andExpect(status().isNotFound());
    mvc.perform(post("/api/auth/register").contentType("application/json").content("{}"))
        .andExpect(status().isForbidden());
  }

  @Test void forwardedHttpsAndCors() throws Exception {
    mvc.perform(get("/api/auth/csrf").header("X-Forwarded-Proto", "https")
        .header("X-Forwarded-Host", "qoldau.example.com").header("Origin", "https://qoldau.example.com"))
        .andExpect(status().isOk()).andExpect(header().exists("Strict-Transport-Security"))
        .andExpect(jsonPath("$.token").isString());
    mvc.perform(get("/api/auth/csrf").header("Origin", "https://untrusted.example.com"))
        .andExpect(status().isForbidden());
  }
}
