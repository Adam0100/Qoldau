package kz.qoldau.auth;

import jakarta.persistence.*;

@Entity
@Table(name = "app_users")
public class User {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  public String email;

  @Column(name = "password_hash")
  public String passwordHash;

  public String name;
  public String city;
  public String bio = "";

  public User() {}

  public record View(Long id, String name, String email, String city, String bio) {}

  public View view() {
    return new View(id, name, email, city, bio);
  }
}
