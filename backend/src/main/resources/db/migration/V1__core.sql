CREATE TABLE app_users (
 id BIGSERIAL PRIMARY KEY, email VARCHAR(254) NOT NULL UNIQUE,
 password_hash VARCHAR(100) NOT NULL, name VARCHAR(80) NOT NULL,
 city VARCHAR(100) NOT NULL, bio VARCHAR(1000) NOT NULL DEFAULT ''
);
CREATE TABLE help_requests (
 id BIGSERIAL PRIMARY KEY, author_id BIGINT NOT NULL REFERENCES app_users(id),
 title VARCHAR(120) NOT NULL, description VARCHAR(5000) NOT NULL,
 city VARCHAR(100) NOT NULL, category VARCHAR(40) NOT NULL,
 status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','CLOSED')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE help_responses (
 id BIGSERIAL PRIMARY KEY, request_id BIGINT NOT NULL REFERENCES help_requests(id),
 helper_id BIGINT NOT NULL REFERENCES app_users(id), message VARCHAR(1000) NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(request_id,helper_id)
);
CREATE INDEX requests_created_idx ON help_requests(created_at DESC);

