package kz.qoldau.common;

import java.util.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice
public class Errors {
  private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(Errors.class);

  @ExceptionHandler(Exception.class)
  ResponseEntity<?> unexpected(Exception e) {
    log.error("Unexpected API failure", e);
    return ResponseEntity.internalServerError()
        .body(Map.of("message", "Внутренняя ошибка сервера. Попробуйте позже"));
  }

  @ExceptionHandler(ApiException.class)
  ResponseEntity<?> api(ApiException e) {
    return ResponseEntity.status(e.status).body(Map.of("message", e.getMessage()));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<?> validation(MethodArgumentNotValidException e) {
    Map<String, String> fields = new LinkedHashMap<>();
    e.getBindingResult()
        .getFieldErrors()
        .forEach(x -> fields.put(x.getField(), x.getDefaultMessage()));
    return ResponseEntity.badRequest()
        .body(Map.of("message", "Проверьте введённые данные", "fields", fields));
  }

  @ExceptionHandler({
    HttpMessageNotReadableException.class,
    org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class
  })
  ResponseEntity<?> bad(Exception e) {
    return ResponseEntity.badRequest().body(Map.of("message", "Неверный формат данных"));
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  ResponseEntity<?> duplicate() {
    return ResponseEntity.status(409)
        .body(Map.of("message", "Такая запись уже существует или нарушает ограничения"));
  }
}
