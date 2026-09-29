package kz.qoldau;

import static org.junit.jupiter.api.Assertions.*;

import java.sql.DriverManager;
import java.util.UUID;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;

class MigrationIntegrationTest {
  @Test
  void upgradePreservesLegacyAccountsRequestsAndResponses() throws Exception {
    String url = System.getenv().getOrDefault("TEST_DB_URL", "jdbc:postgresql://localhost:5433/qoldau_test");
    String user = System.getenv().getOrDefault("DB_USER", "qoldau");
    String password = System.getenv("DB_PASSWORD");
    // Only this newly generated schema is created/dropped; existing schemas are untouched.
    String schema = "migration_test_" + UUID.randomUUID().toString().replace("-", "");
    try (var connection = DriverManager.getConnection(url, user, password);
        var sql = connection.createStatement()) {
      try {
        Flyway.configure().dataSource(url, user, password).schemas(schema).defaultSchema(schema)
            .target("2").load().migrate();
        sql.execute("SET search_path TO " + schema);
        sql.execute("INSERT INTO app_users(id,email,password_hash,name,city) VALUES "
            + "(1,'owner@example.test','unchanged-hash','Owner','City'),"
            + "(2,'helper@example.test','other-hash','Helper','City')");
        sql.execute("INSERT INTO help_requests(id,author_id,title,description,city,category,status) "
            + "VALUES (1,1,'Original title','Original description','City','EVERYDAY','CLOSED')");
        sql.execute("INSERT INTO help_responses(id,request_id,helper_id,message) VALUES (1,1,2,'Original offer')");
        Flyway.configure().dataSource(url, user, password).schemas(schema).defaultSchema(schema).load().migrate();
        try (var rows = sql.executeQuery("SELECT password_hash FROM app_users WHERE id=1")) {
          assertTrue(rows.next()); assertEquals("unchanged-hash", rows.getString(1));
        }
        try (var rows = sql.executeQuery("SELECT status,title,reward_stars FROM help_requests WHERE id=1")) {
          assertTrue(rows.next()); assertEquals("CLOSED", rows.getString(1));
          assertEquals("Original title", rows.getString(2)); assertEquals(5, rows.getInt(3));
        }
        try (var rows = sql.executeQuery("SELECT message,phone,email FROM help_responses WHERE id=1")) {
          assertTrue(rows.next()); assertEquals("Original offer", rows.getString(1));
          assertEquals("", rows.getString(2)); assertEquals("", rows.getString(3));
        }
        try (var rows = sql.executeQuery("SELECT count(*) FROM star_awards")) {
          assertTrue(rows.next()); assertEquals(0, rows.getLong(1));
        }
      } finally {
        sql.execute("SET search_path TO public");
        sql.execute("DROP SCHEMA IF EXISTS " + schema + " CASCADE");
      }
    }
  }
}
