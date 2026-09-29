package kz.qoldau.auth;

import kz.qoldau.common.ApiException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class CurrentUser {
  private final Users users;

  public CurrentUser(Users users) {
    this.users = users;
  }

  public User get() {
    var a = SecurityContextHolder.getContext().getAuthentication();
    if (a == null || !(a.getPrincipal() instanceof Long))
      throw new ApiException(org.springframework.http.HttpStatus.UNAUTHORIZED, "Please sign in");
    return users.findById((Long) a.getPrincipal()).orElseThrow(ApiException::missing);
  }
}
