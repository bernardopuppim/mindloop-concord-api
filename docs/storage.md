# Supabase Storage - Documentos de Contratos

## Configuração do Bucket

### Bucket: `contract-documents`

**Tipo:** Private (acesso restrito)

**Objetivo:** Armazenar documentos relacionados a contratos, funcionários e postos de serviço.

## Regras de Segurança

### 1. Privacidade do Bucket
- O bucket `contract-documents` deve ser configurado como **private**.
- Nenhum arquivo pode ser acessado diretamente via URL pública.

### 2. Acesso via Backend
- **TODOS** os acessos a arquivos devem ser feitos pelo backend usando Signed URLs.
- O backend utiliza a `SUPABASE_SERVICE_ROLE_KEY` para gerar URLs assinadas temporárias.
- URLs assinadas expiram após um período configurável (recomendado: 60 segundos para downloads, 300 segundos para uploads).

### 3. Segurança de Credenciais
- **NUNCA** expor `SUPABASE_SERVICE_ROLE_KEY` no cliente.
- **NUNCA** enviar a service role key em respostas HTTP.
- Todas as operações de storage devem ser realizadas server-side.

## Estrutura de Paths

A estrutura de paths dentro do bucket segue o padrão:

```
contracts/{contract_id}/employees/{employee_id}/{yyyy-mm-dd}_{slug}.{ext}
```

### Exemplo de Paths
```
contracts/123/employees/456/2025-12-15_contrato-assinado.pdf
contracts/123/employees/456/2025-12-15_rg-frente.jpg
contracts/123/employees/789/2025-11-30_carteira-trabalho.pdf
```

### Componentes do Path

- **`contract_id`**: ID do contrato/posto de serviço no sistema
- **`employee_id`**: ID do funcionário no sistema
- **`yyyy-mm-dd`**: Data do upload no formato ISO (ano-mês-dia)
- **`slug`**: Nome descritivo do documento (kebab-case)
- **`ext`**: Extensão do arquivo (pdf, jpg, png, etc.)

## Implementação no Backend

### Geração de Signed URL para Download

```typescript
import { storage } from './storage.js';

// Gerar URL assinada para download
const { data, error } = await storage.supabase.storage
  .from('contract-documents')
  .createSignedUrl(filePath, 60); // expira em 60 segundos

if (error) throw error;
return data.signedUrl;
```

### Upload de Arquivo

```typescript
// Upload via backend
const filePath = `contracts/${contractId}/employees/${employeeId}/${timestamp}_${slug}.${ext}`;

const { data, error } = await storage.supabase.storage
  .from('contract-documents')
  .upload(filePath, fileBuffer, {
    contentType: mimeType,
    upsert: false
  });

if (error) throw error;
```

### Remoção de Arquivo

```typescript
const { error } = await storage.supabase.storage
  .from('contract-documents')
  .remove([filePath]);

if (error) throw error;
```

## Tabela de Documentos (SQL)

A tabela `documents` no banco de dados registra metadados dos arquivos armazenados:

```sql
-- Verificar estrutura existente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'documents'
ORDER BY ordinal_position;
```

### Campos Principais

- **`id`**: SERIAL PRIMARY KEY
- **`file_name`**: VARCHAR - Nome original do arquivo
- **`file_path`**: VARCHAR - Path completo no bucket
- **`file_size`**: INTEGER - Tamanho em bytes
- **`mime_type`**: VARCHAR - Tipo MIME do arquivo
- **`document_type`**: VARCHAR - Tipo de documento (contrato, rg, cpf, etc.)
- **`category`**: VARCHAR - Categoria do documento
- **`employee_id`**: INTEGER - FK para employees
- **`post_id`**: INTEGER - FK para service_posts
- **`uploaded_by`**: VARCHAR - ID do usuário que fez upload
- **`uploaded_at`**: TIMESTAMP - Data/hora do upload
- **`updated_at`**: TIMESTAMP - Última atualização

### Relacionamentos

- **`employee_id`** → `employees(id)` ON DELETE SET NULL
- **`post_id`** → `service_posts(id)` ON DELETE SET NULL
- **`uploaded_by`** → `users(id)` ON DELETE SET NULL

## Como Criar o Bucket no Supabase

Como não é possível criar buckets via código (requer permissões de admin), siga os passos abaixo:

### Passos no Dashboard do Supabase

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. No menu lateral, clique em **Storage**
4. Clique em **New bucket**
5. Configure o bucket:
   - **Name:** `contract-documents`
   - **Public bucket:** **DESMARQUE** esta opção (deve ser private)
   - **File size limit:** Configure conforme necessário (ex: 10MB)
   - **Allowed MIME types:** (opcional) Restrinja aos tipos permitidos
6. Clique em **Create bucket**

### Verificar Configuração

Após criar o bucket, verifique:

```sql
-- No SQL Editor do Supabase
SELECT *
FROM storage.buckets
WHERE name = 'contract-documents';
```

Confirme que a coluna `public` está definida como `false`.

## Políticas RLS (Row Level Security)

Como o bucket é private, o acesso é controlado via service role key no backend. As políticas RLS do Storage não se aplicam diretamente, mas você pode definir políticas adicionais se necessário:

```sql
-- Política para permitir leitura via service role
CREATE POLICY "Service role can read all files"
ON storage.objects
FOR SELECT
TO service_role
USING (bucket_id = 'contract-documents');

-- Política para permitir inserção via service role
CREATE POLICY "Service role can upload files"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'contract-documents');

-- Política para permitir deleção via service role
CREATE POLICY "Service role can delete files"
ON storage.objects
FOR DELETE
TO service_role
USING (bucket_id = 'contract-documents');
```

## Fluxo Completo de Upload

### 1. Cliente envia arquivo para API
```typescript
// Frontend - client/src/components/upload-document.tsx
const formData = new FormData();
formData.append('file', file);
formData.append('documentType', 'contrato');
formData.append('employeeId', '456');

const response = await fetch('/api/documents/upload', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

### 2. Backend processa e faz upload para Supabase
```typescript
// server/routes.ts
app.post('/api/documents/upload', authenticateJWT, async (req, res) => {
  const { file } = req.files;
  const { documentType, employeeId } = req.body;

  // Gerar path
  const timestamp = new Date().toISOString().split('T')[0];
  const slug = slugify(file.name);
  const filePath = `contracts/${contractId}/employees/${employeeId}/${timestamp}_${slug}`;

  // Upload para Supabase Storage
  const { data, error } = await storage.supabase.storage
    .from('contract-documents')
    .upload(filePath, file.buffer);

  if (error) throw error;

  // Salvar metadados no banco
  await storage.createDocument({
    file_name: file.name,
    file_path: filePath,
    file_size: file.size,
    mime_type: file.mimetype,
    document_type: documentType,
    employee_id: employeeId,
    uploaded_by: req.user.id
  });

  res.json({ success: true, filePath });
});
```

### 3. Cliente solicita acesso ao arquivo
```typescript
// Backend gera signed URL
app.get('/api/documents/:id/download', authenticateJWT, async (req, res) => {
  const document = await storage.getDocument(req.params.id);

  const { data } = await storage.supabase.storage
    .from('contract-documents')
    .createSignedUrl(document.file_path, 60);

  res.json({ url: data.signedUrl });
});
```

## Monitoramento e Manutenção

### Verificar Tamanho Total do Bucket
```sql
SELECT
  bucket_id,
  COUNT(*) as total_files,
  SUM(metadata->>'size')::bigint as total_bytes,
  pg_size_pretty(SUM(metadata->>'size')::bigint) as total_size
FROM storage.objects
WHERE bucket_id = 'contract-documents'
GROUP BY bucket_id;
```

### Listar Arquivos Órfãos (sem registro na tabela documents)
```sql
SELECT o.name, o.created_at
FROM storage.objects o
WHERE o.bucket_id = 'contract-documents'
AND NOT EXISTS (
  SELECT 1 FROM documents d
  WHERE d.file_path = o.name
);
```

## Considerações de Performance

1. **Cache de Signed URLs**: Considere fazer cache de URLs assinadas no cliente pelo período de validade
2. **Batch Downloads**: Para múltiplos arquivos, gere signed URLs em batch
3. **Cleanup**: Implemente rotina de limpeza para arquivos órfãos
4. **Compressão**: Considere comprimir PDFs e imagens antes do upload

## Backup e Recuperação

- Os arquivos no Supabase Storage são automaticamente replicados
- Configure backups regulares do banco de dados `documents` para manter a consistência
- Em caso de perda de dados, use a tabela `documents` como fonte de verdade para recriar a estrutura
