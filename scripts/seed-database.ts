import { db } from "../server/db";
import {
  employees,
  servicePosts,
  allocations,
  occurrences,
  documents,
  alerts,
} from "../shared/schema";
import { sql } from "drizzle-orm";

function generateCPF(): string {
  const random = (max: number) => Math.floor(Math.random() * max);
  const n = Array(9).fill(0).map(() => random(9));
  
  let d1 = n.reduce((acc, val, i) => acc + val * (10 - i), 0) % 11;
  d1 = d1 < 2 ? 0 : 11 - d1;
  
  let d2 = n.reduce((acc, val, i) => acc + val * (11 - i), 0) + d1 * 2;
  d2 = d2 % 11;
  d2 = d2 < 2 ? 0 : 11 - d2;
  
  return `${n.slice(0, 3).join('')}.${n.slice(3, 6).join('')}.${n.slice(6, 9).join('')}-${d1}${d2}`;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

async function seed() {
  console.log("Starting database seed...\n");

  // Clear existing data (in reverse order of dependencies)
  console.log("Clearing existing data...");
  await db.delete(alerts);
  await db.delete(documents);
  await db.delete(occurrences);
  await db.delete(allocations);
  await db.delete(employees);
  await db.delete(servicePosts);
  console.log("Existing data cleared.\n");

  // 1. Create Service Posts (8 posts)
  console.log("Creating service posts...");
  const servicePostsData = [
    {
      postCode: "SP001",
      postName: "Recepção Principal",
      description: "Posto de atendimento e controle de acesso na entrada principal do edifício",
      unit: "Sede Administrativa",
      modality: "onsite" as const,
      tipoPosto: "Administrativo",
      horarioTrabalho: "08:00 - 18:00",
      escalaRegime: "5x2",
      quantidadePrevista: 4,
    },
    {
      postCode: "SP002",
      postName: "Central de Monitoramento",
      description: "Monitoramento 24h de câmeras e sistemas de segurança",
      unit: "Centro de Operações",
      modality: "onsite" as const,
      tipoPosto: "Operacional",
      horarioTrabalho: "24 horas",
      escalaRegime: "12x36",
      quantidadePrevista: 6,
    },
    {
      postCode: "SP003",
      postName: "Suporte Técnico TI",
      description: "Atendimento e suporte técnico aos usuários internos",
      unit: "Departamento de TI",
      modality: "hybrid" as const,
      tipoPosto: "Técnico",
      horarioTrabalho: "08:00 - 17:00",
      escalaRegime: "5x2",
      quantidadePrevista: 3,
    },
    {
      postCode: "SP004",
      postName: "Manutenção Predial",
      description: "Serviços de manutenção preventiva e corretiva das instalações",
      unit: "Facilities",
      modality: "onsite" as const,
      tipoPosto: "Operacional",
      horarioTrabalho: "07:00 - 16:00",
      escalaRegime: "5x2",
      quantidadePrevista: 4,
    },
    {
      postCode: "SP005",
      postName: "Apoio Administrativo",
      description: "Suporte às atividades administrativas e documentação",
      unit: "Sede Administrativa",
      modality: "hybrid" as const,
      tipoPosto: "Administrativo",
      horarioTrabalho: "08:00 - 17:00",
      escalaRegime: "5x2",
      quantidadePrevista: 3,
    },
    {
      postCode: "SP006",
      postName: "Limpeza e Conservação",
      description: "Serviços de limpeza e conservação das áreas comuns",
      unit: "Facilities",
      modality: "onsite" as const,
      tipoPosto: "Operacional",
      horarioTrabalho: "06:00 - 15:00",
      escalaRegime: "5x2",
      quantidadePrevista: 5,
    },
    {
      postCode: "SP007",
      postName: "Coordenação de Contratos",
      description: "Gestão e acompanhamento de contratos de serviços",
      unit: "Departamento Jurídico",
      modality: "remote" as const,
      tipoPosto: "Supervisão",
      horarioTrabalho: "09:00 - 18:00",
      escalaRegime: "5x2",
      quantidadePrevista: 2,
    },
    {
      postCode: "SP008",
      postName: "Plantão Noturno",
      description: "Cobertura de operações essenciais no período noturno",
      unit: "Centro de Operações",
      modality: "onsite" as const,
      tipoPosto: "Operacional",
      horarioTrabalho: "18:00 - 06:00",
      escalaRegime: "12x36",
      quantidadePrevista: 4,
    },
  ];

  const insertedPosts = await db.insert(servicePosts).values(servicePostsData).returning();
  console.log(`Created ${insertedPosts.length} service posts.\n`);

  // 2. Create Employees (25 employees)
  console.log("Creating employees...");
  const employeeNames = [
    { name: "Carlos Alberto Silva", function: "Supervisor de Segurança", unit: "Centro de Operações" },
    { name: "Maria Fernanda Costa", function: "Recepcionista", unit: "Sede Administrativa" },
    { name: "João Pedro Santos", function: "Técnico de TI", unit: "Departamento de TI" },
    { name: "Ana Paula Oliveira", function: "Auxiliar Administrativo", unit: "Sede Administrativa" },
    { name: "Roberto Carlos Lima", function: "Operador de Monitoramento", unit: "Centro de Operações" },
    { name: "Fernanda Souza Martins", function: "Coordenadora de Contratos", unit: "Departamento Jurídico" },
    { name: "Paulo Ricardo Ferreira", function: "Técnico de Manutenção", unit: "Facilities" },
    { name: "Juliana Almeida Rocha", function: "Recepcionista", unit: "Sede Administrativa" },
    { name: "Marcos Antônio Ribeiro", function: "Operador de Monitoramento", unit: "Centro de Operações" },
    { name: "Patrícia Helena Dias", function: "Assistente Administrativa", unit: "Sede Administrativa" },
    { name: "Fernando José Carvalho", function: "Técnico de TI", unit: "Departamento de TI" },
    { name: "Luciana Maria Pereira", function: "Auxiliar de Limpeza", unit: "Facilities" },
    { name: "Ricardo Augusto Mendes", function: "Plantonista", unit: "Centro de Operações" },
    { name: "Camila Beatriz Torres", function: "Auxiliar Administrativo", unit: "Sede Administrativa" },
    { name: "André Luis Campos", function: "Técnico de Manutenção", unit: "Facilities" },
    { name: "Beatriz Helena Nunes", function: "Supervisora Administrativa", unit: "Sede Administrativa" },
    { name: "Gustavo Henrique Araújo", function: "Operador de Monitoramento", unit: "Centro de Operações" },
    { name: "Renata Cristina Barbosa", function: "Auxiliar de Limpeza", unit: "Facilities" },
    { name: "Diego Fernando Moreira", function: "Plantonista", unit: "Centro de Operações" },
    { name: "Amanda Caroline Pinto", function: "Recepcionista", unit: "Sede Administrativa" },
    { name: "Thiago Rafael Correia", function: "Técnico de TI", unit: "Departamento de TI" },
    { name: "Vanessa Cristina Gomes", function: "Auxiliar de Limpeza", unit: "Facilities" },
    { name: "Eduardo Santos Vieira", function: "Técnico de Manutenção", unit: "Facilities" },
    { name: "Isabela Maria Freitas", function: "Assistente de Contratos", unit: "Departamento Jurídico" },
    { name: "Leonardo Costa Machado", function: "Plantonista", unit: "Centro de Operações" },
  ];

  const employeesData = employeeNames.map((emp, index) => ({
    name: emp.name,
    cpf: generateCPF(),
    functionPost: emp.function,
    unit: emp.unit,
    status: index < 23 ? "active" as const : "inactive" as const,
  }));

  const insertedEmployees = await db.insert(employees).values(employeesData).returning();
  console.log(`Created ${insertedEmployees.length} employees.\n`);

  // Create employee-to-post assignments (for allocation generation)
  const employeePostAssignments: { employeeId: number; postId: number }[] = [];
  
  // Assign employees to posts based on their functions
  insertedEmployees.forEach((emp, idx) => {
    const empData = employeeNames[idx];
    let postId: number;
    
    if (empData.function.includes("Recepcionista")) {
      postId = insertedPosts[0].id; // SP001 - Recepção
    } else if (empData.function.includes("Monitoramento") || empData.function.includes("Supervisor de Segurança")) {
      postId = insertedPosts[1].id; // SP002 - Monitoramento
    } else if (empData.function.includes("TI")) {
      postId = insertedPosts[2].id; // SP003 - Suporte TI
    } else if (empData.function.includes("Manutenção")) {
      postId = insertedPosts[3].id; // SP004 - Manutenção
    } else if (empData.function.includes("Administrativo") || empData.function.includes("Assistente")) {
      postId = insertedPosts[4].id; // SP005 - Apoio Administrativo
    } else if (empData.function.includes("Limpeza")) {
      postId = insertedPosts[5].id; // SP006 - Limpeza
    } else if (empData.function.includes("Contrato") || empData.function.includes("Coordenador")) {
      postId = insertedPosts[6].id; // SP007 - Coordenação
    } else if (empData.function.includes("Plantonista")) {
      postId = insertedPosts[7].id; // SP008 - Plantão Noturno
    } else {
      postId = insertedPosts[4].id; // Default to Apoio Administrativo
    }
    
    if (emp.status === "active") {
      employeePostAssignments.push({ employeeId: emp.id, postId });
    }
  });

  // 3. Create Daily Allocations (90 days)
  console.log("Creating daily allocations (90 days)...");
  const today = new Date();
  const allocationsData: {
    employeeId: number;
    postId: number;
    date: string;
    status: "present" | "absent" | "justified" | "vacation" | "medical_leave";
    notes: string | null;
  }[] = [];

  // Status distribution: 85% Present, 8% Absent, 4% Justified, 2% Vacation, 1% Medical Leave
  const statusWeights = [
    { status: "present" as const, weight: 85 },
    { status: "absent" as const, weight: 8 },
    { status: "justified" as const, weight: 4 },
    { status: "vacation" as const, weight: 2 },
    { status: "medical_leave" as const, weight: 1 },
  ];

  function getRandomStatus(): "present" | "absent" | "justified" | "vacation" | "medical_leave" {
    const rand = Math.random() * 100;
    let cumulative = 0;
    for (const sw of statusWeights) {
      cumulative += sw.weight;
      if (rand < cumulative) return sw.status;
    }
    return "present";
  }

  const statusNotes: Record<string, string[]> = {
    present: ["", "", "", "Chegou no horário", ""],
    absent: ["Falta não justificada", "Não compareceu", "Ausência sem aviso"],
    justified: ["Atestado médico apresentado", "Consulta médica agendada", "Compromisso pessoal autorizado"],
    vacation: ["Período de férias regulares", "Férias programadas"],
    medical_leave: ["Licença médica - CID informado", "Afastamento por recomendação médica"],
  };

  for (let day = 0; day < 90; day++) {
    const date = new Date(today);
    date.setDate(date.getDate() - day);
    const dateStr = formatDate(date);
    
    // Skip some days randomly to simulate missing allocations (about 5% of records)
    for (const assignment of employeePostAssignments) {
      if (Math.random() > 0.05) { // 95% chance of creating allocation
        const status = getRandomStatus();
        const notesArray = statusNotes[status];
        const note = notesArray[Math.floor(Math.random() * notesArray.length)] || null;
        
        allocationsData.push({
          employeeId: assignment.employeeId,
          postId: assignment.postId,
          date: dateStr,
          status,
          notes: note,
        });
      }
    }
  }

  // Insert allocations in batches
  const batchSize = 500;
  let insertedAllocationsCount = 0;
  for (let i = 0; i < allocationsData.length; i += batchSize) {
    const batch = allocationsData.slice(i, i + batchSize);
    await db.insert(allocations).values(batch);
    insertedAllocationsCount += batch.length;
  }
  console.log(`Created ${insertedAllocationsCount} allocation records.\n`);

  // 4. Create Occurrences (40 occurrences)
  console.log("Creating occurrences...");
  const occurrenceDescriptions = {
    absence: [
      "Funcionário não compareceu ao posto sem aviso prévio",
      "Falta não justificada registrada",
      "Ausência durante o turno sem comunicação",
      "Abandono de posto por período superior a 2 horas",
      "Não comparecimento ao trabalho",
    ],
    substitution: [
      "Substituição temporária realizada por outro colaborador",
      "Remanejamento de funcionário para cobrir posto",
      "Troca de turno autorizada entre funcionários",
      "Cobertura emergencial de posto",
      "Substituição durante período de férias",
    ],
    issue: [
      "Problema técnico com equipamento de monitoramento",
      "Falha no sistema de controle de acesso",
      "Ocorrência de manutenção não programada",
      "Incidente de segurança registrado",
      "Problema com ar condicionado na área",
      "Vazamento identificado no andar",
      "Elevador apresentou defeito",
    ],
    note: [
      "Visita de fiscalização realizada sem pendências",
      "Treinamento de reciclagem agendado",
      "Reunião de alinhamento com equipe",
      "Atualização de procedimentos operacionais",
      "Feedback positivo recebido do cliente",
      "Observação sobre melhoria de processo",
    ],
  };

  const occurrencesData: {
    date: string;
    employeeId: number | null;
    description: string;
    category: "absence" | "substitution" | "issue" | "note";
    treated: boolean;
  }[] = [];

  const categories: ("absence" | "substitution" | "issue" | "note")[] = ["absence", "substitution", "issue", "note"];
  const categoryWeights = [35, 25, 25, 15]; // Distribution percentages

  for (let i = 0; i < 40; i++) {
    const rand = Math.random() * 100;
    let cumulative = 0;
    let category: "absence" | "substitution" | "issue" | "note" = "note";
    for (let j = 0; j < categories.length; j++) {
      cumulative += categoryWeights[j];
      if (rand < cumulative) {
        category = categories[j];
        break;
      }
    }

    const descriptions = occurrenceDescriptions[category];
    const description = descriptions[Math.floor(Math.random() * descriptions.length)];
    
    const daysAgo = Math.floor(Math.random() * 60);
    const occurrenceDate = new Date(today);
    occurrenceDate.setDate(occurrenceDate.getDate() - daysAgo);

    // Some occurrences linked to employees, some not
    const linkToEmployee = Math.random() > 0.3;
    const activeEmployees = insertedEmployees.filter(e => e.status === "active");
    const employeeId = linkToEmployee 
      ? activeEmployees[Math.floor(Math.random() * activeEmployees.length)].id 
      : null;

    // About 60% treated, 40% untreated
    const treated = Math.random() > 0.4;

    occurrencesData.push({
      date: formatDate(occurrenceDate),
      employeeId,
      description,
      category,
      treated,
    });
  }

  const insertedOccurrences = await db.insert(occurrences).values(occurrencesData).returning();
  console.log(`Created ${insertedOccurrences.length} occurrences.\n`);

  // 5. Create Documents (50 documents)
  console.log("Creating documents...");
  const documentCategories: ("atestados" | "comprovantes" | "relatorios_mensais" | "evidencias_posto" | "treinamentos" | "certidoes" | "outros")[] = [
    "atestados", "comprovantes", "relatorios_mensais", "evidencias_posto", "treinamentos", "certidoes", "outros"
  ];

  const documentNames: Record<string, string[]> = {
    atestados: [
      "Atestado Médico", "Atestado de Comparecimento", "Atestado Odontológico",
      "Declaração Médica", "Laudo Médico"
    ],
    comprovantes: [
      "Comprovante de Residência", "Comprovante de Escolaridade", "Comprovante Bancário",
      "Comprovante de Curso", "Comprovante de Vacinação"
    ],
    relatorios_mensais: [
      "Relatório Mensal de Operações", "Relatório de Frequência", "Relatório de Incidentes",
      "Resumo Mensal de Atividades", "Relatório de Performance"
    ],
    evidencias_posto: [
      "Foto do Posto", "Registro de Equipamentos", "Checklist de Verificação",
      "Evidência de Limpeza", "Registro Fotográfico"
    ],
    treinamentos: [
      "Certificado NR-35", "Certificado NR-10", "Treinamento de Segurança",
      "Capacitação Brigada", "Certificado Primeiros Socorros"
    ],
    certidoes: [
      "Certidão Negativa de Débitos", "Certidão de Regularidade FGTS",
      "Certidão Trabalhista", "Certidão de Antecedentes"
    ],
    outros: [
      "Documento Diverso", "Anexo Contratual", "Comunicado Interno",
      "Termo de Responsabilidade", "Autorização"
    ],
  };

  const documentsData: {
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    path: string;
    documentType: "aso" | "certification" | "evidence" | "contract" | "other";
    category: "atestados" | "comprovantes" | "relatorios_mensais" | "evidencias_posto" | "treinamentos" | "certidoes" | "outros";
    employeeId: number | null;
    postId: number | null;
    monthYear: string;
    expirationDate: string | null;
    observations: string | null;
  }[] = [];

  const docTypeMapping: Record<string, "aso" | "certification" | "evidence" | "contract" | "other"> = {
    atestados: "aso",
    comprovantes: "other",
    relatorios_mensais: "other",
    evidencias_posto: "evidence",
    treinamentos: "certification",
    certidoes: "certification",
    outros: "other",
  };

  for (let i = 0; i < 50; i++) {
    const category = documentCategories[Math.floor(Math.random() * documentCategories.length)];
    const names = documentNames[category];
    const docName = names[Math.floor(Math.random() * names.length)];
    
    const uploadDate = randomDate(new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000), today);
    const monthYear = `${uploadDate.getFullYear()}-${String(uploadDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Generate expiration date - some expired, some expiring soon, some far future
    let expirationDate: string | null = null;
    if (["treinamentos", "certidoes", "atestados"].includes(category)) {
      const expirationRandom = Math.random();
      const expDate = new Date(today);
      if (expirationRandom < 0.15) {
        // 15% expired
        expDate.setDate(expDate.getDate() - Math.floor(Math.random() * 30 + 1));
      } else if (expirationRandom < 0.35) {
        // 20% expiring in 30 days
        expDate.setDate(expDate.getDate() + Math.floor(Math.random() * 30 + 1));
      } else {
        // 65% valid for longer
        expDate.setDate(expDate.getDate() + Math.floor(Math.random() * 365 + 31));
      }
      expirationDate = formatDate(expDate);
    }

    // Link to employee or post
    const linkType = Math.random();
    let employeeId: number | null = null;
    let postId: number | null = null;
    
    if (linkType < 0.6) {
      // 60% linked to employee
      employeeId = insertedEmployees[Math.floor(Math.random() * insertedEmployees.length)].id;
    } else if (linkType < 0.85) {
      // 25% linked to post
      postId = insertedPosts[Math.floor(Math.random() * insertedPosts.length)].id;
    }
    // 15% not linked to either

    const uuid = crypto.randomUUID();
    const extension = Math.random() > 0.3 ? "pdf" : "jpg";
    
    documentsData.push({
      filename: `${uuid}.${extension}`,
      originalName: `${docName.replace(/\s+/g, '_')}_${i + 1}.${extension}`,
      mimeType: extension === "pdf" ? "application/pdf" : "image/jpeg",
      size: Math.floor(Math.random() * 5000000 + 100000), // 100KB to 5MB
      path: `uploads/${uuid}.${extension}`,
      documentType: docTypeMapping[category],
      category,
      employeeId,
      postId,
      monthYear,
      expirationDate,
      observations: Math.random() > 0.7 ? `Documento referente a ${docName.toLowerCase()}` : null,
    });
  }

  const insertedDocuments = await db.insert(documents).values(documentsData).returning();
  console.log(`Created ${insertedDocuments.length} documents.\n`);

  // 6. Create Alerts (auto-generated pending items)
  console.log("Creating alerts...");
  const alertsData: {
    type: "unallocated_employee" | "expired_document" | "untreated_occurrence";
    status: "pending" | "resolved";
    message: string;
    entityType: string;
    entityId: number;
  }[] = [];

  // Alerts for expired documents
  const expiredDocs = insertedDocuments.filter(doc => {
    if (!doc.expirationDate) return false;
    return new Date(doc.expirationDate) < today;
  });
  
  for (const doc of expiredDocs) {
    alertsData.push({
      type: "expired_document",
      status: "pending",
      message: `Documento "${doc.originalName}" expirou em ${doc.expirationDate}`,
      entityType: "document",
      entityId: doc.id,
    });
  }

  // Alerts for documents expiring in 30 days
  const expiringDocs = insertedDocuments.filter(doc => {
    if (!doc.expirationDate) return false;
    const expDate = new Date(doc.expirationDate);
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expDate >= today && expDate <= thirtyDaysFromNow;
  });

  for (const doc of expiringDocs) {
    alertsData.push({
      type: "expired_document",
      status: "pending",
      message: `Documento "${doc.originalName}" expira em ${doc.expirationDate}`,
      entityType: "document",
      entityId: doc.id,
    });
  }

  // Alerts for untreated occurrences
  const untreatedOccurrences = insertedOccurrences.filter(occ => !occ.treated);
  for (const occ of untreatedOccurrences) {
    alertsData.push({
      type: "untreated_occurrence",
      status: "pending",
      message: `Ocorrência não tratada: ${occ.description.substring(0, 50)}...`,
      entityType: "occurrence",
      entityId: occ.id,
    });
  }

  // Find employees without recent allocations (unallocated)
  const recentDate = new Date(today);
  recentDate.setDate(recentDate.getDate() - 7);
  const recentDateStr = formatDate(recentDate);
  
  const activeEmployeeIds = insertedEmployees
    .filter(e => e.status === "active")
    .map(e => e.id);
  
  const employeesWithRecentAllocations = new Set(
    allocationsData
      .filter(a => a.date >= recentDateStr)
      .map(a => a.employeeId)
  );

  const unallocatedEmployees = activeEmployeeIds.filter(id => !employeesWithRecentAllocations.has(id));
  
  for (const empId of unallocatedEmployees.slice(0, 3)) { // Limit to 3 alerts
    const emp = insertedEmployees.find(e => e.id === empId);
    if (emp) {
      alertsData.push({
        type: "unallocated_employee",
        status: "pending",
        message: `Funcionário "${emp.name}" sem alocação nos últimos 7 dias`,
        entityType: "employee",
        entityId: emp.id,
      });
    }
  }

  let insertedAlertsCount = 0;
  if (alertsData.length > 0) {
    const insertedAlerts = await db.insert(alerts).values(alertsData).returning();
    insertedAlertsCount = insertedAlerts.length;
  }
  console.log(`Created ${insertedAlertsCount} alerts.\n`);

  // Summary
  console.log("=" .repeat(50));
  console.log("DATABASE SEED COMPLETED SUCCESSFULLY!");
  console.log("=" .repeat(50));
  console.log("\nSummary of inserted records:");
  console.log(`  - Service Posts:  ${insertedPosts.length}`);
  console.log(`  - Employees:      ${insertedEmployees.length}`);
  console.log(`  - Allocations:    ${insertedAllocationsCount}`);
  console.log(`  - Occurrences:    ${insertedOccurrences.length}`);
  console.log(`  - Documents:      ${insertedDocuments.length}`);
  console.log(`  - Alerts:         ${insertedAlertsCount}`);
  console.log("\nTo re-run this seed, execute: npx tsx scripts/seed-database.ts");
  console.log("\nDashboards should now display populated data!");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
