ALTER TABLE help_responses ADD COLUMN phone VARCHAR(40) NOT NULL DEFAULT '';
ALTER TABLE help_responses ADD COLUMN email VARCHAR(254) NOT NULL DEFAULT '';
-- Legacy responses remain valid without invented or disclosed profile contacts.
ALTER TABLE help_responses ADD CONSTRAINT response_id_request_unique UNIQUE(id, request_id);
ALTER TABLE help_requests DROP CONSTRAINT help_requests_status_check;
ALTER TABLE help_requests ADD CONSTRAINT help_requests_status_check
  CHECK(status IN ('OPEN','CLOSED','CANCELLED','IN_PROGRESS','COMPLETED'));
ALTER TABLE help_requests ADD COLUMN selected_response_id BIGINT;
ALTER TABLE help_requests ADD COLUMN reward_stars INTEGER NOT NULL DEFAULT 5 CHECK(reward_stars > 0);
ALTER TABLE help_requests ADD COLUMN completed_at TIMESTAMPTZ;
ALTER TABLE help_requests ADD CONSTRAINT selected_response_for_request
  FOREIGN KEY(selected_response_id, id) REFERENCES help_responses(id, request_id);
ALTER TABLE help_requests ADD CONSTRAINT request_completion_state CHECK (
  (status NOT IN ('IN_PROGRESS','COMPLETED') OR selected_response_id IS NOT NULL)
  AND ((status = 'COMPLETED') = (completed_at IS NOT NULL))
);
CREATE TABLE star_awards (
  id BIGSERIAL PRIMARY KEY,
  request_id BIGINT NOT NULL UNIQUE REFERENCES help_requests(id),
  helper_id BIGINT NOT NULL REFERENCES app_users(id),
  amount INTEGER NOT NULL CHECK(amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX star_awards_helper_idx ON star_awards(helper_id, created_at DESC);
