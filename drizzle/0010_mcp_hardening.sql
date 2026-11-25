CREATE TABLE mcp_prepare_requests (
 owner_id TEXT NOT NULL,
 key_hash TEXT NOT NULL,
 input_hash TEXT NOT NULL,
 proposal_id TEXT NOT NULL,
 PRIMARY KEY(owner_id,key_hash)
);
CREATE TABLE mcp_stage_leases (
 stage_id TEXT PRIMARY KEY NOT NULL,
 owner_id TEXT NOT NULL,
 expires_at INTEGER NOT NULL
);
CREATE INDEX mcp_stage_owner_expiry ON mcp_stage_leases(owner_id,expires_at);
CREATE TABLE mcp_approval_evidence (
 proposal_id TEXT NOT NULL,
 revision INTEGER NOT NULL,
 owner_id TEXT NOT NULL,
 digest TEXT NOT NULL,
 challenge TEXT NOT NULL,
 credential_id TEXT NOT NULL,
 evidence TEXT NOT NULL,
 created_at INTEGER NOT NULL,
 PRIMARY KEY(proposal_id,revision)
);
ALTER TABLE mcp_plan_audit ADD COLUMN metrics TEXT NOT NULL DEFAULT '{}';
-- Older pending approvals lack durable evidence and must be prepared/reviewed again.
UPDATE mcp_proposals SET state='INVALIDATED' WHERE state IN ('VALIDATED','PENDING_APPROVAL','APPROVED');
DELETE FROM mcp_approvals;

-- Apply with proposals disabled and requests drained: remove obsolete staging copies only.
DELETE FROM mcp_stage_audit_log;
DELETE FROM mcp_stage_calendar_events;
DELETE FROM mcp_stage_finance_accounts;
DELETE FROM mcp_stage_finance_budgets;
DELETE FROM mcp_stage_finance_categories;
DELETE FROM mcp_stage_finance_concepts;
DELETE FROM mcp_stage_finance_goal_entries;
DELETE FROM mcp_stage_finance_goals;
DELETE FROM mcp_stage_finance_obligation_occurrences;
DELETE FROM mcp_stage_finance_obligations;
DELETE FROM mcp_stage_finance_settings;
DELETE FROM mcp_stage_finance_transactions;
DELETE FROM mcp_stage_home_areas;
DELETE FROM mcp_stage_home_movements;
DELETE FROM mcp_stage_home_notes;
DELETE FROM mcp_stage_home_projects;
DELETE FROM mcp_stage_home_tasks;
DELETE FROM mcp_stage_home_workspaces;
