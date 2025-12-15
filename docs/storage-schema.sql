-- ============================================
-- Supabase Storage - Documents Table Schema
-- ============================================
-- Este script documenta a estrutura da tabela documents
-- e fornece queries úteis para verificação e manutenção.

-- ============================================
-- 1. VERIFICAR ESTRUTURA EXISTENTE
-- ============================================
-- Execute esta query para verificar se a tabela já existe
-- e quais colunas estão definidas:

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'documents'
ORDER BY ordinal_position;

-- ============================================
-- 2. ESTRUTURA DA TABELA DOCUMENTS
-- ============================================
-- A tabela documents já foi criada via Drizzle migrations.
-- Estrutura atual (conforme shared/schema.ts):

/*
CREATE TABLE documents (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  filename VARCHAR NOT NULL,
  original_name VARCHAR NOT NULL,
  mime_type VARCHAR NOT NULL,
  size INTEGER NOT NULL,
  path VARCHAR NOT NULL,  -- Este campo armazena o path completo no Supabase Storage
  document_type document_type NOT NULL,  -- ENUM: aso, certification, evidence, contract, other
  category document_category,  -- ENUM: atestados, comprovantes, relatorios_mensais, evidencias_posto, treinamentos, certidoes, outros
  employee_id INTEGER REFERENCES employees(id),
  post_id INTEGER REFERENCES service_posts(id),
  month_year VARCHAR,
  expiration_date DATE,
  observations TEXT,
  uploaded_by VARCHAR REFERENCES users(id),
  version INTEGER DEFAULT 1 NOT NULL,
  previous_version_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
*/

-- ============================================
-- 3. MAPEAMENTO DE CAMPOS
-- ============================================
-- Documentação do mapeamento entre campos da tabela e uso no Storage:

-- path (VARCHAR):
--   - Armazena o caminho completo do arquivo no bucket Supabase Storage
--   - Formato: contracts/{contract_id}/employees/{employee_id}/{yyyy-mm-dd}_{slug}.{ext}
--   - Exemplo: contracts/123/employees/456/2025-12-15_contrato-assinado.pdf
--   - Este é o valor usado para gerar signed URLs e fazer downloads

-- filename (VARCHAR):
--   - Nome do arquivo como armazenado no servidor/storage
--   - Geralmente igual ao último segmento do path
--   - Exemplo: 2025-12-15_contrato-assinado.pdf

-- original_name (VARCHAR):
--   - Nome original do arquivo enviado pelo usuário
--   - Preservado para exibição na UI
--   - Exemplo: Contrato Assinado João Silva.pdf

-- mime_type (VARCHAR):
--   - Tipo MIME do arquivo
--   - Exemplos: application/pdf, image/jpeg, image/png

-- size (INTEGER):
--   - Tamanho do arquivo em bytes

-- document_type (ENUM):
--   - Tipo do documento: aso, certification, evidence, contract, other

-- category (ENUM):
--   - Categoria: atestados, comprovantes, relatorios_mensais, evidencias_posto, treinamentos, certidoes, outros

-- employee_id (INTEGER FK):
--   - ID do funcionário associado ao documento
--   - Pode ser NULL para documentos gerais

-- post_id (INTEGER FK):
--   - ID do posto de serviço associado ao documento
--   - Pode ser NULL para documentos gerais

-- uploaded_by (VARCHAR FK):
--   - ID do usuário que fez o upload
--   - Referencia users(id)

-- ============================================
-- 4. QUERIES ÚTEIS PARA MANUTENÇÃO
-- ============================================

-- 4.1. Listar todos os documentos de um funcionário
/*
SELECT
  d.id,
  d.original_name,
  d.document_type,
  d.category,
  d.size,
  d.created_at,
  e.name as employee_name
FROM documents d
LEFT JOIN employees e ON d.employee_id = e.id
WHERE d.employee_id = :employee_id
ORDER BY d.created_at DESC;
*/

-- 4.2. Listar todos os documentos de um posto de serviço
/*
SELECT
  d.id,
  d.original_name,
  d.document_type,
  d.category,
  d.size,
  d.created_at,
  sp.post_name
FROM documents d
LEFT JOIN service_posts sp ON d.post_id = sp.id
WHERE d.post_id = :post_id
ORDER BY d.created_at DESC;
*/

-- 4.3. Verificar tamanho total de documentos por funcionário
/*
SELECT
  e.id,
  e.name,
  COUNT(d.id) as total_documents,
  SUM(d.size) as total_bytes,
  pg_size_pretty(SUM(d.size)::bigint) as total_size
FROM employees e
LEFT JOIN documents d ON e.id = d.employee_id
GROUP BY e.id, e.name
ORDER BY SUM(d.size) DESC NULLS LAST;
*/

-- 4.4. Listar documentos expirados ou próximos do vencimento
/*
SELECT
  d.id,
  d.original_name,
  d.document_type,
  d.expiration_date,
  e.name as employee_name,
  CURRENT_DATE - d.expiration_date as days_expired
FROM documents d
LEFT JOIN employees e ON d.employee_id = e.id
WHERE d.expiration_date IS NOT NULL
  AND d.expiration_date < CURRENT_DATE + INTERVAL '30 days'
ORDER BY d.expiration_date ASC;
*/

-- 4.5. Verificar integridade: documentos na tabela sem arquivo no Storage
-- (Execute esta query periodicamente e depois verifique os paths no Supabase Storage)
/*
SELECT
  d.id,
  d.path,
  d.original_name,
  d.created_at
FROM documents d
ORDER BY d.created_at DESC;
*/

-- 4.6. Listar documentos por tipo e categoria
/*
SELECT
  document_type,
  category,
  COUNT(*) as total,
  SUM(size) as total_bytes,
  pg_size_pretty(SUM(size)::bigint) as total_size
FROM documents
GROUP BY document_type, category
ORDER BY COUNT(*) DESC;
*/

-- 4.7. Histórico de versões de um documento
/*
SELECT
  d.id,
  d.version,
  d.previous_version_id,
  d.original_name,
  d.created_at,
  u.email as uploaded_by_email
FROM documents d
LEFT JOIN users u ON d.uploaded_by = u.id
WHERE d.id = :document_id
   OR d.previous_version_id = :document_id
ORDER BY d.version DESC;
*/

-- ============================================
-- 5. ÍNDICES RECOMENDADOS (se ainda não existirem)
-- ============================================
-- Execute estas queries para criar índices que otimizam consultas comuns:

-- Índice para busca por funcionário
CREATE INDEX IF NOT EXISTS idx_documents_employee_id
ON documents(employee_id);

-- Índice para busca por posto de serviço
CREATE INDEX IF NOT EXISTS idx_documents_post_id
ON documents(post_id);

-- Índice para busca por tipo de documento
CREATE INDEX IF NOT EXISTS idx_documents_document_type
ON documents(document_type);

-- Índice para busca por categoria
CREATE INDEX IF NOT EXISTS idx_documents_category
ON documents(category);

-- Índice para busca por data de criação
CREATE INDEX IF NOT EXISTS idx_documents_created_at
ON documents(created_at DESC);

-- Índice para busca por data de expiração
CREATE INDEX IF NOT EXISTS idx_documents_expiration_date
ON documents(expiration_date)
WHERE expiration_date IS NOT NULL;

-- Índice para busca por path (usado para verificar duplicatas)
CREATE INDEX IF NOT EXISTS idx_documents_path
ON documents(path);

-- ============================================
-- 6. VERIFICAR BUCKET NO SUPABASE STORAGE
-- ============================================
-- Execute esta query para verificar se o bucket contract-documents existe:

SELECT *
FROM storage.buckets
WHERE name = 'contract-documents';

-- Verificar se o bucket é privado (coluna public deve ser FALSE):
SELECT name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE name = 'contract-documents';

-- ============================================
-- 7. POLÍTICAS RLS PARA STORAGE.OBJECTS
-- ============================================
-- Como o bucket é private, o acesso é controlado via service role key.
-- As políticas abaixo são opcionais, mas recomendadas para segurança adicional:

-- Habilitar RLS na tabela storage.objects (se ainda não estiver habilitado)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Política para permitir service role ler todos os arquivos
CREATE POLICY IF NOT EXISTS "Service role can read all files"
ON storage.objects
FOR SELECT
TO service_role
USING (bucket_id = 'contract-documents');

-- Política para permitir service role fazer upload
CREATE POLICY IF NOT EXISTS "Service role can upload files"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'contract-documents');

-- Política para permitir service role deletar arquivos
CREATE POLICY IF NOT EXISTS "Service role can delete files"
ON storage.objects
FOR DELETE
TO service_role
USING (bucket_id = 'contract-documents');

-- Política para permitir service role atualizar arquivos
CREATE POLICY IF NOT EXISTS "Service role can update files"
ON storage.objects
FOR UPDATE
TO service_role
USING (bucket_id = 'contract-documents');

-- ============================================
-- 8. LIMPEZA E MANUTENÇÃO
-- ============================================

-- 8.1. Listar arquivos órfãos (no banco mas sem metadados completos)
/*
SELECT id, path, original_name, created_at
FROM documents
WHERE employee_id IS NULL
  AND post_id IS NULL
  AND category IS NULL
ORDER BY created_at DESC;
*/

-- 8.2. Encontrar documentos duplicados (mesmo path)
/*
SELECT
  path,
  COUNT(*) as duplicates
FROM documents
GROUP BY path
HAVING COUNT(*) > 1;
*/

-- 8.3. Verificar espaço total usado
/*
SELECT
  COUNT(*) as total_documents,
  SUM(size) as total_bytes,
  pg_size_pretty(SUM(size)::bigint) as total_size,
  pg_size_pretty(AVG(size)::bigint) as avg_size
FROM documents;
*/

-- ============================================
-- 9. EXEMPLO DE INSERÇÃO
-- ============================================
-- Exemplo de como inserir um novo documento:
/*
INSERT INTO documents (
  filename,
  original_name,
  mime_type,
  size,
  path,
  document_type,
  category,
  employee_id,
  post_id,
  uploaded_by
) VALUES (
  '2025-12-15_contrato-assinado.pdf',
  'Contrato Assinado João Silva.pdf',
  'application/pdf',
  524288,  -- 512 KB
  'contracts/123/employees/456/2025-12-15_contrato-assinado.pdf',
  'contract',
  'outros',
  456,
  123,
  'user_id_from_supabase_auth'
) RETURNING id;
*/

-- ============================================
-- 10. MIGRATION STATUS
-- ============================================
-- A tabela documents já foi criada via Drizzle ORM migrations.
-- Não é necessário executar CREATE TABLE.
-- Este arquivo serve apenas como documentação e queries utilitárias.

-- Para verificar o histórico de migrations:
/*
SELECT * FROM drizzle.__drizzle_migrations
ORDER BY created_at DESC;
*/
