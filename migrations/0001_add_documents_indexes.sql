-- Migration: Add indexes to documents table for performance and integrity
-- Created: 2025-12-15
-- Purpose: Optimize document queries and ensure unique storage paths

-- Create unique index on storage path to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS "idx_documents_path_unique" ON "documents" USING btree ("path");

-- Create index on post_id (contract_id) for filtering by contract
CREATE INDEX IF NOT EXISTS "idx_documents_post_id" ON "documents" USING btree ("post_id");

-- Create index on employee_id for filtering by employee
CREATE INDEX IF NOT EXISTS "idx_documents_employee_id" ON "documents" USING btree ("employee_id");

-- Create index on uploaded_by for audit queries
CREATE INDEX IF NOT EXISTS "idx_documents_uploaded_by" ON "documents" USING btree ("uploaded_by");

-- Create index on created_at for chronological queries
CREATE INDEX IF NOT EXISTS "idx_documents_created_at" ON "documents" USING btree ("created_at" DESC);

-- Create index on document_type for filtering
CREATE INDEX IF NOT EXISTS "idx_documents_document_type" ON "documents" USING btree ("document_type");

-- Create index on category for filtering
CREATE INDEX IF NOT EXISTS "idx_documents_category" ON "documents" USING btree ("category") WHERE "category" IS NOT NULL;

-- Create composite index for common query pattern (post_id + employee_id)
CREATE INDEX IF NOT EXISTS "idx_documents_post_employee" ON "documents" USING btree ("post_id", "employee_id") WHERE "post_id" IS NOT NULL AND "employee_id" IS NOT NULL;
