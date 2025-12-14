CREATE TYPE "public"."activity_frequency" AS ENUM('daily', 'weekly', 'monthly', 'on_demand');--> statement-breakpoint
CREATE TYPE "public"."alert_status" AS ENUM('pending', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."alert_type" AS ENUM('unallocated_employee', 'expired_document', 'untreated_occurrence');--> statement-breakpoint
CREATE TYPE "public"."allocation_status" AS ENUM('present', 'absent', 'justified', 'vacation', 'medical_leave');--> statement-breakpoint
CREATE TYPE "public"."document_category" AS ENUM('atestados', 'comprovantes', 'relatorios_mensais', 'evidencias_posto', 'treinamentos', 'certidoes', 'outros');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('aso', 'certification', 'evidence', 'contract', 'other');--> statement-breakpoint
CREATE TYPE "public"."employee_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."ferias_licencas_status" AS ENUM('pendente', 'aprovado', 'rejeitado', 'em_andamento', 'concluido');--> statement-breakpoint
CREATE TYPE "public"."ferias_licencas_type" AS ENUM('ferias', 'licenca_medica', 'licenca_maternidade', 'licenca_paternidade', 'licenca_nojo', 'licenca_casamento', 'outros');--> statement-breakpoint
CREATE TYPE "public"."lgpd_access_type" AS ENUM('view', 'export', 'search');--> statement-breakpoint
CREATE TYPE "public"."lgpd_data_category" AS ENUM('personal_data', 'sensitive_data', 'financial_data');--> statement-breakpoint
CREATE TYPE "public"."modality" AS ENUM('onsite', 'hybrid', 'remote');--> statement-breakpoint
CREATE TYPE "public"."occurrence_category" AS ENUM('absence', 'substitution', 'issue', 'note');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'admin_dica', 'operator_dica', 'fiscal_petrobras', 'viewer');--> statement-breakpoint
CREATE TABLE "activity_execution_attachments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "activity_execution_attachments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"activity_execution_id" integer NOT NULL,
	"file_name" varchar NOT NULL,
	"file_path" varchar NOT NULL,
	"mime_type" varchar NOT NULL,
	"uploaded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "activity_executions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "activity_executions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"service_activity_id" integer NOT NULL,
	"service_post_id" integer NOT NULL,
	"employee_id" integer,
	"date" date NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "alerts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"type" "alert_type" NOT NULL,
	"status" "alert_status" DEFAULT 'pending' NOT NULL,
	"message" text NOT NULL,
	"entity_type" varchar,
	"entity_id" integer,
	"resolved_by" varchar,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "allocations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "allocations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"employee_id" integer NOT NULL,
	"post_id" integer NOT NULL,
	"date" date NOT NULL,
	"status" "allocation_status" DEFAULT 'present' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audit_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" varchar,
	"action" varchar NOT NULL,
	"entity_type" varchar NOT NULL,
	"entity_id" varchar,
	"details" jsonb,
	"diff_before" jsonb,
	"diff_after" jsonb,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "document_checklists" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "document_checklists_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"post_id" integer NOT NULL,
	"document_type" "document_type" NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"is_required" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "documents_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"filename" varchar NOT NULL,
	"original_name" varchar NOT NULL,
	"mime_type" varchar NOT NULL,
	"size" integer NOT NULL,
	"path" varchar NOT NULL,
	"document_type" "document_type" NOT NULL,
	"category" "document_category",
	"employee_id" integer,
	"post_id" integer,
	"month_year" varchar,
	"expiration_date" date,
	"observations" text,
	"uploaded_by" varchar,
	"version" integer DEFAULT 1 NOT NULL,
	"previous_version_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "employees_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"cpf" varchar(14) NOT NULL,
	"function_post" varchar(255) NOT NULL,
	"unit" varchar(255) NOT NULL,
	"status" "employee_status" DEFAULT 'active' NOT NULL,
	"admission_date" date,
	"linked_post_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "employees_cpf_unique" UNIQUE("cpf")
);
--> statement-breakpoint
CREATE TABLE "ferias_licencas" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ferias_licencas_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"employee_id" integer NOT NULL,
	"type" "ferias_licencas_type" NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" "ferias_licencas_status" DEFAULT 'pendente' NOT NULL,
	"observations" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lgpd_logs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "lgpd_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" varchar,
	"access_type" "lgpd_access_type" NOT NULL,
	"data_category" "lgpd_data_category" NOT NULL,
	"entity_type" varchar NOT NULL,
	"entity_id" varchar,
	"ip_address" varchar,
	"user_agent" text,
	"details" jsonb,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "occurrences" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "occurrences_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"date" date NOT NULL,
	"employee_id" integer,
	"post_id" integer,
	"description" text NOT NULL,
	"category" "occurrence_category" NOT NULL,
	"treated" boolean DEFAULT false NOT NULL,
	"treated_by" varchar,
	"treated_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "service_activities" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "service_activities_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"service_post_id" integer NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"ppu_unit" varchar NOT NULL,
	"frequency" "activity_frequency" NOT NULL,
	"required" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "service_posts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "service_posts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"post_code" varchar(50) NOT NULL,
	"post_name" varchar(255) NOT NULL,
	"description" text,
	"unit" varchar(255) NOT NULL,
	"modality" "modality" DEFAULT 'onsite' NOT NULL,
	"tipo_posto" varchar(100),
	"horario_trabalho" varchar(100),
	"escala_regime" varchar(100),
	"quantidade_prevista" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "service_posts_post_code_unique" UNIQUE("post_code")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"role" "user_role" DEFAULT 'viewer' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "activity_execution_attachments" ADD CONSTRAINT "activity_execution_attachments_activity_execution_id_activity_executions_id_fk" FOREIGN KEY ("activity_execution_id") REFERENCES "public"."activity_executions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_executions" ADD CONSTRAINT "activity_executions_service_activity_id_service_activities_id_fk" FOREIGN KEY ("service_activity_id") REFERENCES "public"."service_activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_executions" ADD CONSTRAINT "activity_executions_service_post_id_service_posts_id_fk" FOREIGN KEY ("service_post_id") REFERENCES "public"."service_posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_executions" ADD CONSTRAINT "activity_executions_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_post_id_service_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."service_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_checklists" ADD CONSTRAINT "document_checklists_post_id_service_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."service_posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_post_id_service_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."service_posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ferias_licencas" ADD CONSTRAINT "ferias_licencas_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ferias_licencas" ADD CONSTRAINT "ferias_licencas_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lgpd_logs" ADD CONSTRAINT "lgpd_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "occurrences" ADD CONSTRAINT "occurrences_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "occurrences" ADD CONSTRAINT "occurrences_post_id_service_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."service_posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "occurrences" ADD CONSTRAINT "occurrences_treated_by_users_id_fk" FOREIGN KEY ("treated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_activities" ADD CONSTRAINT "service_activities_service_post_id_service_posts_id_fk" FOREIGN KEY ("service_post_id") REFERENCES "public"."service_posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");