-- Phase 3 infrastructure only. No production business write tool is enabled.
CREATE TABLE mcp_installation (id INTEGER PRIMARY KEY CHECK(id=1), installation_id TEXT NOT NULL, business_revision INTEGER NOT NULL DEFAULT 0);
INSERT INTO mcp_installation(id,installation_id) VALUES(1,lower(hex(randomblob(16))));
CREATE TABLE mcp_proposal_heads (proposal_id TEXT PRIMARY KEY NOT NULL, owner_id TEXT NOT NULL, revision INTEGER NOT NULL);
CREATE TABLE mcp_proposals (proposal_id TEXT NOT NULL,revision INTEGER NOT NULL,owner_id TEXT NOT NULL,state TEXT NOT NULL CHECK(state IN ('VALIDATED','PENDING_APPROVAL','APPROVED','COMMITTED','CANCELLED','EXPIRED','INVALIDATED')),digest TEXT NOT NULL,payload TEXT NOT NULL,base_revision INTEGER NOT NULL,expires_at INTEGER NOT NULL,created_at INTEGER NOT NULL,PRIMARY KEY(proposal_id,revision));
CREATE INDEX mcp_proposals_owner_state ON mcp_proposals(owner_id,state,expires_at);
CREATE TABLE mcp_approval_challenges (challenge TEXT PRIMARY KEY NOT NULL,proposal_id TEXT NOT NULL,revision INTEGER NOT NULL,owner_id TEXT NOT NULL,digest TEXT NOT NULL,expires_at INTEGER NOT NULL,used INTEGER NOT NULL DEFAULT 0 CHECK(used IN (0,1)));
CREATE TABLE mcp_approvals (proposal_id TEXT NOT NULL,revision INTEGER NOT NULL,owner_id TEXT NOT NULL,digest TEXT NOT NULL,challenge TEXT NOT NULL,credential_id TEXT NOT NULL,expires_at INTEGER NOT NULL,approved_at INTEGER NOT NULL,PRIMARY KEY(proposal_id,revision));
CREATE TABLE mcp_executions (execution_id TEXT PRIMARY KEY NOT NULL,proposal_id TEXT NOT NULL,revision INTEGER NOT NULL,owner_id TEXT NOT NULL,idempotency_hash TEXT NOT NULL,result TEXT NOT NULL,created_at INTEGER NOT NULL,UNIQUE(proposal_id,revision),UNIQUE(owner_id,idempotency_hash));
CREATE TABLE mcp_execution_guards (execution_id TEXT PRIMARY KEY NOT NULL,valid INTEGER NOT NULL CHECK(valid=1));
CREATE TABLE mcp_plan_audit (id TEXT PRIMARY KEY NOT NULL,owner_id TEXT NOT NULL,proposal_id TEXT NOT NULL,revision INTEGER NOT NULL,event TEXT NOT NULL,created_at INTEGER NOT NULL);
CREATE INDEX mcp_plan_audit_owner_date ON mcp_plan_audit(owner_id,created_at);

CREATE TABLE mcp_stage_audit_log (proposal_id TEXT NOT NULL,"id" TEXT NOT NULL,"owner_id" TEXT NOT NULL,"entity_type" TEXT NOT NULL,"entity_id" TEXT NOT NULL,"action" TEXT NOT NULL,"metadata" TEXT NOT NULL DEFAULT '{}',"occurred_at" TEXT NOT NULL,PRIMARY KEY(proposal_id,"id"));
CREATE INDEX mcp_stage_audit_log_partition ON mcp_stage_audit_log(proposal_id);
CREATE TRIGGER mcp_revision_audit_log_insert AFTER INSERT ON audit_log BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;
CREATE TRIGGER mcp_revision_audit_log_update AFTER UPDATE ON audit_log BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;
CREATE TRIGGER mcp_revision_audit_log_delete AFTER DELETE ON audit_log BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;

CREATE TABLE mcp_stage_calendar_events (proposal_id TEXT NOT NULL,"id" TEXT NOT NULL,"owner_id" TEXT NOT NULL,"title" TEXT NOT NULL,"description" TEXT NOT NULL DEFAULT '',"location" TEXT NOT NULL DEFAULT '',"start_date" TEXT NOT NULL,"end_date" TEXT NOT NULL,"start_time" TEXT NOT NULL DEFAULT '',"end_time" TEXT NOT NULL DEFAULT '',"all_day" INTEGER NOT NULL DEFAULT 1,"timezone" TEXT NOT NULL DEFAULT 'America/Santo_Domingo',"status" TEXT NOT NULL DEFAULT 'scheduled',"recurrence" TEXT NOT NULL DEFAULT 'none',"recurrence_until" TEXT NOT NULL DEFAULT '',"area_id" TEXT,"project_id" TEXT,"linked_task_id" TEXT,"notes" TEXT NOT NULL DEFAULT '',"created_at" TEXT NOT NULL,"updated_at" TEXT NOT NULL,PRIMARY KEY(proposal_id,"id"));
CREATE INDEX mcp_stage_calendar_events_partition ON mcp_stage_calendar_events(proposal_id);
CREATE TRIGGER mcp_revision_calendar_events_insert AFTER INSERT ON calendar_events BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;
CREATE TRIGGER mcp_revision_calendar_events_update AFTER UPDATE ON calendar_events BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;
CREATE TRIGGER mcp_revision_calendar_events_delete AFTER DELETE ON calendar_events BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;

CREATE TABLE mcp_stage_finance_accounts (proposal_id TEXT NOT NULL,"id" TEXT NOT NULL,"owner_id" TEXT NOT NULL,"name" TEXT NOT NULL,"type" TEXT NOT NULL,"currency" TEXT NOT NULL DEFAULT 'DOP',"opening_balance_minor" INTEGER NOT NULL DEFAULT 0,"opening_balance_date" TEXT NOT NULL,"archived" INTEGER NOT NULL DEFAULT 0,"created_at" TEXT NOT NULL,"updated_at" TEXT NOT NULL,"bank_name" TEXT NOT NULL DEFAULT '',PRIMARY KEY(proposal_id,"id"));
CREATE INDEX mcp_stage_finance_accounts_partition ON mcp_stage_finance_accounts(proposal_id);
CREATE TRIGGER mcp_revision_finance_accounts_insert AFTER INSERT ON finance_accounts BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;
CREATE TRIGGER mcp_revision_finance_accounts_update AFTER UPDATE ON finance_accounts BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;
CREATE TRIGGER mcp_revision_finance_accounts_delete AFTER DELETE ON finance_accounts BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;

CREATE TABLE mcp_stage_finance_budgets (proposal_id TEXT NOT NULL,"id" TEXT NOT NULL,"owner_id" TEXT NOT NULL,"month" TEXT NOT NULL,"category_id" TEXT NOT NULL,"assigned_minor" INTEGER NOT NULL DEFAULT 0,"created_at" TEXT NOT NULL,"updated_at" TEXT NOT NULL,"concept" TEXT NOT NULL DEFAULT 'Asignación base',"allocation_type" TEXT NOT NULL DEFAULT 'base',PRIMARY KEY(proposal_id,"id"));
CREATE INDEX mcp_stage_finance_budgets_partition ON mcp_stage_finance_budgets(proposal_id);
CREATE TRIGGER mcp_revision_finance_budgets_insert AFTER INSERT ON finance_budgets BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;
CREATE TRIGGER mcp_revision_finance_budgets_update AFTER UPDATE ON finance_budgets BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;
CREATE TRIGGER mcp_revision_finance_budgets_delete AFTER DELETE ON finance_budgets BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;

CREATE TABLE mcp_stage_finance_categories (proposal_id TEXT NOT NULL,"id" TEXT NOT NULL,"owner_id" TEXT NOT NULL,"name" TEXT NOT NULL,"kind" TEXT NOT NULL DEFAULT 'expense',"color" TEXT NOT NULL DEFAULT '#2463eb',"created_at" TEXT NOT NULL,"updated_at" TEXT NOT NULL,PRIMARY KEY(proposal_id,"id"));
CREATE INDEX mcp_stage_finance_categories_partition ON mcp_stage_finance_categories(proposal_id);
CREATE TRIGGER mcp_revision_finance_categories_insert AFTER INSERT ON finance_categories BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;
CREATE TRIGGER mcp_revision_finance_categories_update AFTER UPDATE ON finance_categories BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;
CREATE TRIGGER mcp_revision_finance_categories_delete AFTER DELETE ON finance_categories BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;

CREATE TABLE mcp_stage_finance_concepts (proposal_id TEXT NOT NULL,"id" TEXT NOT NULL,"owner_id" TEXT NOT NULL,"concept" TEXT NOT NULL,"normalized" TEXT NOT NULL,"created_at" TEXT NOT NULL,"updated_at" TEXT NOT NULL,PRIMARY KEY(proposal_id,"id"));
CREATE INDEX mcp_stage_finance_concepts_partition ON mcp_stage_finance_concepts(proposal_id);
CREATE UNIQUE INDEX mcp_stage_concepts_unique ON mcp_stage_finance_concepts(proposal_id,owner_id,normalized);
CREATE TRIGGER mcp_revision_finance_concepts_insert AFTER INSERT ON finance_concepts BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;
CREATE TRIGGER mcp_revision_finance_concepts_update AFTER UPDATE ON finance_concepts BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;
CREATE TRIGGER mcp_revision_finance_concepts_delete AFTER DELETE ON finance_concepts BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;

CREATE TABLE mcp_stage_finance_goal_entries (proposal_id TEXT NOT NULL,"id" TEXT NOT NULL,"owner_id" TEXT NOT NULL,"goal_id" TEXT NOT NULL,"amount_minor" INTEGER NOT NULL,"occurred_on" TEXT NOT NULL,"note" TEXT NOT NULL DEFAULT '',"created_at" TEXT NOT NULL,"concept" TEXT NOT NULL DEFAULT '',"voided_at" TEXT,"updated_at" TEXT NOT NULL DEFAULT '',PRIMARY KEY(proposal_id,"id"));
CREATE INDEX mcp_stage_finance_goal_entries_partition ON mcp_stage_finance_goal_entries(proposal_id);
CREATE TRIGGER mcp_revision_finance_goal_entries_insert AFTER INSERT ON finance_goal_entries BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;
CREATE TRIGGER mcp_revision_finance_goal_entries_update AFTER UPDATE ON finance_goal_entries BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;
CREATE TRIGGER mcp_revision_finance_goal_entries_delete AFTER DELETE ON finance_goal_entries BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;

CREATE TABLE mcp_stage_finance_goals (proposal_id TEXT NOT NULL,"id" TEXT NOT NULL,"owner_id" TEXT NOT NULL,"title" TEXT NOT NULL,"target_minor" INTEGER NOT NULL,"reserved_minor" INTEGER NOT NULL DEFAULT 0,"target_date" TEXT NOT NULL DEFAULT '',"priority" TEXT NOT NULL DEFAULT 'media',"account_id" TEXT,"linked_task_id" TEXT,"linked_project_id" TEXT,"status" TEXT NOT NULL DEFAULT 'active',"created_at" TEXT NOT NULL,"updated_at" TEXT NOT NULL,"category_id" TEXT,"covered_by_budget" INTEGER NOT NULL DEFAULT 1,"used_minor" INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(proposal_id,"id"));
CREATE INDEX mcp_stage_finance_goals_partition ON mcp_stage_finance_goals(proposal_id);
CREATE TRIGGER mcp_revision_finance_goals_insert AFTER INSERT ON finance_goals BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;
CREATE TRIGGER mcp_revision_finance_goals_update AFTER UPDATE ON finance_goals BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;
CREATE TRIGGER mcp_revision_finance_goals_delete AFTER DELETE ON finance_goals BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;

CREATE TABLE mcp_stage_finance_obligation_occurrences (proposal_id TEXT NOT NULL,"id" TEXT NOT NULL,"owner_id" TEXT NOT NULL,"obligation_id" TEXT NOT NULL,"due_date" TEXT NOT NULL,"expected_minor" INTEGER NOT NULL,"paid_minor" INTEGER NOT NULL DEFAULT 0,"status" TEXT NOT NULL DEFAULT 'pending',"transaction_id" TEXT,"created_at" TEXT NOT NULL,"updated_at" TEXT NOT NULL,PRIMARY KEY(proposal_id,"id"));
CREATE INDEX mcp_stage_finance_obligation_occurrences_partition ON mcp_stage_finance_obligation_occurrences(proposal_id);
CREATE TRIGGER mcp_revision_finance_obligation_occurrences_insert AFTER INSERT ON finance_obligation_occurrences BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;
CREATE TRIGGER mcp_revision_finance_obligation_occurrences_update AFTER UPDATE ON finance_obligation_occurrences BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;
CREATE TRIGGER mcp_revision_finance_obligation_occurrences_delete AFTER DELETE ON finance_obligation_occurrences BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;

CREATE TABLE mcp_stage_finance_obligations (proposal_id TEXT NOT NULL,"id" TEXT NOT NULL,"owner_id" TEXT NOT NULL,"title" TEXT NOT NULL,"kind" TEXT NOT NULL,"expected_amount_minor" INTEGER NOT NULL,"reserved_minor" INTEGER NOT NULL DEFAULT 0,"account_id" TEXT,"category_id" TEXT,"frequency" TEXT NOT NULL DEFAULT 'monthly',"next_due_date" TEXT NOT NULL,"active" INTEGER NOT NULL DEFAULT 1,"created_at" TEXT NOT NULL,"updated_at" TEXT NOT NULL,"covered_by_budget" INTEGER NOT NULL DEFAULT 1,"reserve_month" TEXT NOT NULL DEFAULT '',"concept" TEXT NOT NULL DEFAULT '',PRIMARY KEY(proposal_id,"id"));
CREATE INDEX mcp_stage_finance_obligations_partition ON mcp_stage_finance_obligations(proposal_id);
CREATE TRIGGER mcp_revision_finance_obligations_insert AFTER INSERT ON finance_obligations BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;
CREATE TRIGGER mcp_revision_finance_obligations_update AFTER UPDATE ON finance_obligations BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;
CREATE TRIGGER mcp_revision_finance_obligations_delete AFTER DELETE ON finance_obligations BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;

CREATE TABLE mcp_stage_finance_settings (proposal_id TEXT NOT NULL,"owner_id" TEXT NOT NULL,"currency" TEXT NOT NULL DEFAULT 'DOP',"timezone" TEXT NOT NULL DEFAULT 'America/Santo_Domingo',"safety_buffer_minor" INTEGER NOT NULL DEFAULT 0,"updated_at" TEXT NOT NULL,"transfer_same_bank_fee_minor" INTEGER NOT NULL DEFAULT 0,"transfer_ach_fee_minor" INTEGER NOT NULL DEFAULT 0,"transfer_lbtr_fee_minor" INTEGER NOT NULL DEFAULT 0,"transfer_bank_fees_json" TEXT NOT NULL DEFAULT '{}',"transfer_same_bank_rate_bps" INTEGER NOT NULL DEFAULT 0,"transfer_ach_rate_bps" INTEGER NOT NULL DEFAULT 0,"transfer_lbtr_surcharge_minor" INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(proposal_id,"owner_id"));
CREATE INDEX mcp_stage_finance_settings_partition ON mcp_stage_finance_settings(proposal_id);
CREATE TRIGGER mcp_revision_finance_settings_insert AFTER INSERT ON finance_settings BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;
CREATE TRIGGER mcp_revision_finance_settings_update AFTER UPDATE ON finance_settings BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;
CREATE TRIGGER mcp_revision_finance_settings_delete AFTER DELETE ON finance_settings BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;

CREATE TABLE mcp_stage_finance_transactions (proposal_id TEXT NOT NULL,"id" TEXT NOT NULL,"owner_id" TEXT NOT NULL,"type" TEXT NOT NULL,"account_id" TEXT NOT NULL,"destination_account_id" TEXT,"amount_minor" INTEGER NOT NULL,"occurred_on" TEXT NOT NULL,"status" TEXT NOT NULL DEFAULT 'confirmed',"category_id" TEXT,"task_id" TEXT,"project_id" TEXT,"description" TEXT NOT NULL DEFAULT '',"voided_at" TEXT,"created_at" TEXT NOT NULL,"updated_at" TEXT NOT NULL,"obligation_occurrence_id" TEXT,"reservation_consumed_minor" INTEGER NOT NULL DEFAULT 0,"reservation_month" TEXT NOT NULL DEFAULT '',"transfer_mode" TEXT,"fee_minor" INTEGER NOT NULL DEFAULT 0,"payment_method" TEXT NOT NULL DEFAULT 'standard',"counterparty_bank" TEXT NOT NULL DEFAULT '',"fee_category_id" TEXT,"goal_id" TEXT,"goal_reservation_consumed_minor" INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(proposal_id,"id"));
CREATE INDEX mcp_stage_finance_transactions_partition ON mcp_stage_finance_transactions(proposal_id);
CREATE TRIGGER mcp_revision_finance_transactions_insert AFTER INSERT ON finance_transactions BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;
CREATE TRIGGER mcp_revision_finance_transactions_update AFTER UPDATE ON finance_transactions BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;
CREATE TRIGGER mcp_revision_finance_transactions_delete AFTER DELETE ON finance_transactions BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;

CREATE TABLE mcp_stage_home_areas (proposal_id TEXT NOT NULL,"id" TEXT NOT NULL,"scope_id" TEXT NOT NULL,"name" TEXT NOT NULL,"color" TEXT NOT NULL DEFAULT '#2463eb',"order_index" INTEGER NOT NULL DEFAULT 0,"created_at" TEXT NOT NULL,"updated_at" TEXT NOT NULL,PRIMARY KEY(proposal_id,"id"));
CREATE INDEX mcp_stage_home_areas_partition ON mcp_stage_home_areas(proposal_id);
CREATE TRIGGER mcp_revision_home_areas_insert AFTER INSERT ON home_areas BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;
CREATE TRIGGER mcp_revision_home_areas_update AFTER UPDATE ON home_areas BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;
CREATE TRIGGER mcp_revision_home_areas_delete AFTER DELETE ON home_areas BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;

CREATE TABLE mcp_stage_home_movements (proposal_id TEXT NOT NULL,"id" TEXT NOT NULL,"user_id" TEXT NOT NULL,"task_id" TEXT NOT NULL,"amount" TEXT NOT NULL,"description" TEXT NOT NULL DEFAULT '',"date" TEXT NOT NULL,"created_at" TEXT NOT NULL,PRIMARY KEY(proposal_id,"id"));
CREATE INDEX mcp_stage_home_movements_partition ON mcp_stage_home_movements(proposal_id);
CREATE TRIGGER mcp_revision_home_movements_insert AFTER INSERT ON home_movements BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;
CREATE TRIGGER mcp_revision_home_movements_update AFTER UPDATE ON home_movements BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;
CREATE TRIGGER mcp_revision_home_movements_delete AFTER DELETE ON home_movements BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;

CREATE TABLE mcp_stage_home_notes (proposal_id TEXT NOT NULL,"id" TEXT NOT NULL,"user_id" TEXT NOT NULL,"task_id" TEXT NOT NULL,"text" TEXT NOT NULL,"author" TEXT NOT NULL DEFAULT '',"created_at" TEXT NOT NULL,"updated_at" TEXT NOT NULL,PRIMARY KEY(proposal_id,"id"));
CREATE INDEX mcp_stage_home_notes_partition ON mcp_stage_home_notes(proposal_id);
CREATE TRIGGER mcp_revision_home_notes_insert AFTER INSERT ON home_notes BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;
CREATE TRIGGER mcp_revision_home_notes_update AFTER UPDATE ON home_notes BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;
CREATE TRIGGER mcp_revision_home_notes_delete AFTER DELETE ON home_notes BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;

CREATE TABLE mcp_stage_home_projects (proposal_id TEXT NOT NULL,"id" TEXT NOT NULL,"scope_id" TEXT NOT NULL,"area_id" TEXT,"name" TEXT NOT NULL,"description" TEXT NOT NULL DEFAULT '',"status" TEXT NOT NULL DEFAULT 'active',"start_date" TEXT NOT NULL DEFAULT '',"target_date" TEXT NOT NULL DEFAULT '',"budget_minor" INTEGER,"created_at" TEXT NOT NULL,"updated_at" TEXT NOT NULL,PRIMARY KEY(proposal_id,"id"));
CREATE INDEX mcp_stage_home_projects_partition ON mcp_stage_home_projects(proposal_id);
CREATE TRIGGER mcp_revision_home_projects_insert AFTER INSERT ON home_projects BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;
CREATE TRIGGER mcp_revision_home_projects_update AFTER UPDATE ON home_projects BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;
CREATE TRIGGER mcp_revision_home_projects_delete AFTER DELETE ON home_projects BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;

CREATE TABLE mcp_stage_home_tasks (proposal_id TEXT NOT NULL,"id" TEXT NOT NULL,"user_id" TEXT NOT NULL,"parent_id" TEXT,"title" TEXT NOT NULL,"description" TEXT NOT NULL DEFAULT '',"priority" TEXT NOT NULL DEFAULT 'P',"effort" TEXT NOT NULL DEFAULT 'media',"owner" TEXT NOT NULL DEFAULT '',"due_date" TEXT NOT NULL DEFAULT '',"created_at" TEXT,"updated_at" TEXT NOT NULL,"completed_at" TEXT,"done" INTEGER NOT NULL DEFAULT 0,"archived" INTEGER NOT NULL DEFAULT 0,"estimate" TEXT,"actual" TEXT,"tags" TEXT NOT NULL DEFAULT '[]',"dependencies" TEXT NOT NULL DEFAULT '[]',"risk" TEXT NOT NULL DEFAULT '',"order_index" INTEGER NOT NULL DEFAULT 0,"start_date" TEXT NOT NULL DEFAULT '',"scheduled_date" TEXT NOT NULL DEFAULT '',"area_id" TEXT,"project_id" TEXT,"scheduled_start_time" TEXT NOT NULL DEFAULT '',"scheduled_end_time" TEXT NOT NULL DEFAULT '',PRIMARY KEY(proposal_id,"id"));
CREATE INDEX mcp_stage_home_tasks_partition ON mcp_stage_home_tasks(proposal_id);
CREATE TRIGGER mcp_revision_home_tasks_insert AFTER INSERT ON home_tasks BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;
CREATE TRIGGER mcp_revision_home_tasks_update AFTER UPDATE ON home_tasks BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;
CREATE TRIGGER mcp_revision_home_tasks_delete AFTER DELETE ON home_tasks BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;

CREATE TABLE mcp_stage_home_workspaces (proposal_id TEXT NOT NULL,"user_id" TEXT NOT NULL,"budget_limit" TEXT,"sort_mode" TEXT NOT NULL DEFAULT 'manual',"created_at" TEXT NOT NULL,"updated_at" TEXT NOT NULL,PRIMARY KEY(proposal_id,"user_id"));
CREATE INDEX mcp_stage_home_workspaces_partition ON mcp_stage_home_workspaces(proposal_id);
CREATE TRIGGER mcp_revision_home_workspaces_insert AFTER INSERT ON home_workspaces BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;
CREATE TRIGGER mcp_revision_home_workspaces_update AFTER UPDATE ON home_workspaces BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;
CREATE TRIGGER mcp_revision_home_workspaces_delete AFTER DELETE ON home_workspaces BEGIN UPDATE mcp_installation SET business_revision=business_revision+1 WHERE id=1; END;
