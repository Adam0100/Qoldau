package kz.qoldau.common;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/** Keep this allowlist aligned with App.tsx. Never forward API or missing assets. */
@Controller
public class SpaController {
  @GetMapping({"/", "/welcome", "/login", "/profile", "/profile/settings",
      "/my-requests", "/new", "/requests", "/requests/{id}", "/requests/{id}/edit",
      "/stars", "/wishes", "/auctions", "/auctions/{id}", "/map", "/messages"})
  public String index() {
    return "forward:/index.html";
  }
}
