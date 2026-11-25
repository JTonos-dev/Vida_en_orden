CREATE TABLE mcp_registration_challenges (
 challenge TEXT PRIMARY KEY NOT NULL,
 owner_id TEXT NOT NULL,
 expires_at INTEGER NOT NULL,
 used INTEGER NOT NULL DEFAULT 0 CHECK(used IN (0,1))
);
CREATE INDEX mcp_registration_owner_expiry ON mcp_registration_challenges(owner_id,expires_at);
