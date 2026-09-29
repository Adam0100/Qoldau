FROM node:24-bookworm-slim AS frontend
WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM maven:3.9.9-eclipse-temurin-21 AS backend
WORKDIR /build/backend
COPY backend/pom.xml ./
RUN mvn -B -ntp dependency:go-offline
COPY backend/src/ ./src/
COPY --from=frontend /build/frontend/dist/ ./src/main/resources/static/
RUN mvn -B -ntp clean package -DskipTests

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
RUN groupadd --system qoldau && useradd --system --gid qoldau qoldau
COPY --from=backend --chown=qoldau:qoldau /build/backend/target/qoldau-0.0.1-SNAPSHOT.jar /app/app.jar
ENV SPRING_PROFILES_ACTIVE=prod
USER qoldau
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
