package kz.qoldau.common;

import org.springframework.http.HttpStatus;

public class ApiException extends RuntimeException {
  public final HttpStatus status;

  public ApiException(HttpStatus status, String message) {
    super(message);
    this.status = status;
  }

  public static ApiException missing() {
    return new ApiException(HttpStatus.NOT_FOUND, "Запись не найдена");
  }

  public static ApiException forbidden() {
    return new ApiException(HttpStatus.FORBIDDEN, "Недостаточно прав");
  }

  public static ApiException conflict(String message) {
    return new ApiException(HttpStatus.CONFLICT, message);
  }
}
