package kz.qoldau.auth;

import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.*;

@Configuration
public class SecurityConfig {
  @Bean
  PasswordEncoder encoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  SecurityFilterChain security(HttpSecurity http) throws Exception {
    return http.cors(c -> {})
        .authorizeHttpRequests(
            a ->
                a.requestMatchers("/api/auth/csrf", "/api/auth/login", "/api/auth/register")
                    .permitAll()
                    .requestMatchers(
                        org.springframework.http.HttpMethod.GET,
                        "/api/requests",
                        "/api/requests/*",
                        "/api/stars",
                        "/api/wishes",
                        "/api/auctions",
                        "/api/auctions/*",
                        "/api/auctions/*/bids")
                    .permitAll()
                    .anyRequest()
                    .authenticated())
        .exceptionHandling(
            e ->
                e.authenticationEntryPoint(
                        (req, res, ex) -> {
                          res.setStatus(401);
                          res.setContentType("application/json;charset=UTF-8");
                          res.getWriter().write("{\"message\":\"Войдите в аккаунт\"}");
                        })
                    .accessDeniedHandler(
                        (req, res, ex) -> {
                          res.setStatus(403);
                          res.setContentType("application/json;charset=UTF-8");
                          res.getWriter()
                              .write(
                                  "{\"message\":\"Доступ запрещён или CSRF-токен устарел. Обновите"
                                      + " страницу\"}");
                        }))
        .logout(
            l ->
                l.logoutUrl("/api/auth/logout")
                    .logoutSuccessHandler((req, res, a) -> res.setStatus(204)))
        .build();
  }

  @Bean
  CorsConfigurationSource cors(@Value("${app.frontend-origin}") String origin) {
    var c = new CorsConfiguration();
    c.setAllowedOrigins(List.of(origin));
    c.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    c.setAllowedHeaders(List.of("Content-Type", "X-CSRF-TOKEN"));
    c.setAllowCredentials(true);
    var source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", c);
    return source;
  }
}
