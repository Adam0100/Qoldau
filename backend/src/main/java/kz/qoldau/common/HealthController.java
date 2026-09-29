package kz.qoldau.common;

import java.util.Map;
import javax.sql.DataSource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {
  private final DataSource dataSource;

  public HealthController(DataSource dataSource) { this.dataSource = dataSource; }

  @GetMapping("/health")
  public ResponseEntity<?> health() {
    try (var connection = dataSource.getConnection()) {
      if (connection.isValid(2)) return ResponseEntity.ok(Map.of("status", "UP"));
    } catch (java.sql.SQLException ignored) {
      // Do not expose database connection details in a public endpoint.
    }
    return ResponseEntity.status(503).body(Map.of("status", "DOWN"));
  }
}
