CREATE TABLE stars (
 id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL UNIQUE REFERENCES app_users(id),
 story VARCHAR(2000) NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE wishes (
 id BIGSERIAL PRIMARY KEY, author_id BIGINT NOT NULL REFERENCES app_users(id),
 title VARCHAR(120) NOT NULL, description VARCHAR(3000) NOT NULL,
 supporter_id BIGINT REFERENCES app_users(id), status VARCHAR(20) NOT NULL DEFAULT 'OPEN'
 CHECK(status IN ('OPEN','PLEDGED','FULFILLED')), created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE auction_lots (
 id BIGSERIAL PRIMARY KEY, seller_id BIGINT NOT NULL REFERENCES app_users(id),
 title VARCHAR(120) NOT NULL, description VARCHAR(5000) NOT NULL,
 celebrity VARCHAR(120) NOT NULL, charity VARCHAR(200) NOT NULL,
 start_price NUMERIC(14,2) NOT NULL CHECK(start_price > 0),
 current_price NUMERIC(14,2) NOT NULL CHECK(current_price > 0),
 starts_at TIMESTAMPTZ NOT NULL, ends_at TIMESTAMPTZ NOT NULL CHECK(ends_at > starts_at),
 closed BOOLEAN NOT NULL DEFAULT false, winner_id BIGINT REFERENCES app_users(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE auction_bids (
 id BIGSERIAL PRIMARY KEY, lot_id BIGINT NOT NULL REFERENCES auction_lots(id),
 bidder_id BIGINT NOT NULL REFERENCES app_users(id), amount NUMERIC(14,2) NOT NULL CHECK(amount > 0),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX auction_due_idx ON auction_lots(ends_at) WHERE closed=false;
CREATE INDEX auction_bids_lot_idx ON auction_bids(lot_id,amount DESC);

