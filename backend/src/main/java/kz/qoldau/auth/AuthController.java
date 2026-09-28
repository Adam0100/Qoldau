package kz.qoldau.auth;

import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import kz.qoldau.common.ApiException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class AuthController {
  private final Users users;
  private final PasswordEncoder encoder;
  private final CurrentUser current;

  public AuthController(Users users, PasswordEncoder encoder, CurrentUser current) {
    this.users = users;
    this.encoder = encoder;
    this.current = current;
  }

  public record Register(
      @NotBlank @Email @Size(max = 254) String email,
      @NotBlank @Size(min = 10, max = 64) String password,
      @NotBlank @Size(max = 80) String name,
      @NotBlank @Size(max = 100) String city) {
    @Override
    public String toString() {
      return "Register[credentials redacted]";
    }
  }

  public record Login(@NotBlank @Email String email, @NotBlank @Size(max = 64) String password) {
    @Override
    public String toString() {
      return "Login[credentials redacted]";
    }
  }

  public record Profile(
      @NotBlank @Size(max = 80) String name,
      @NotBlank @Size(max = 100) String city,
      @NotNull @Size(max = 1000) String bio) {}

  @GetMapping("/auth/csrf")
  public Map<String, String> csrf(CsrfToken token) {
    return Map.of("token", token.getToken());
  }

  @PostMapping("/auth/register")
  @Transactional
  public User.View register(@Valid @RequestBody Register in) {
    if (in.password().getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72)
      throw new ApiException(
          org.springframework.http.HttpStatus.BAD_REQUEST,
          "Пароль должен занимать не более 72 байт UTF-8");
    var u = new User();
    u.email = in.email().trim().toLowerCase(Locale.ROOT);
    u.passwordHash = encoder.encode(in.password());
    u.name = in.name().trim();
    u.city = in.city().trim();
    return users.saveAndFlush(u).view();
  }

  @PostMapping("/auth/login")
  public User.View login(
      @Valid @RequestBody Login in, HttpServletRequest req, HttpServletResponse res) {
    if (in.password().getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72)
      throw new ApiException(
          org.springframework.http.HttpStatus.UNAUTHORIZED, "Неверный email или пароль");
    var u =
        users
            .findByEmail(in.email().trim().toLowerCase(Locale.ROOT))
            .filter(x -> encoder.matches(in.password(), x.passwordHash))
            .orElseThrow(
                () ->
                    new ApiException(
                        org.springframework.http.HttpStatus.UNAUTHORIZED,
                        "Неверный email или пароль"));
    if (req.getSession(false) != null) req.changeSessionId();
    var context = SecurityContextHolder.createEmptyContext();
    context.setAuthentication(new UsernamePasswordAuthenticationToken(u.id, null, List.of()));
    SecurityContextHolder.setContext(context);
    new HttpSessionSecurityContextRepository().saveContext(context, req, res);
    return u.view();
  }

  @GetMapping("/me")
  public User.View me() {
    return current.get().view();
  }

  @PutMapping("/me")
  @Transactional
  public User.View update(@Valid @RequestBody Profile in) {
    var u = current.get();
    u.name = in.name().trim();
    u.city = in.city().trim();
    u.bio = in.bio().trim();
    return users.save(u).view();
  }
}
