import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import mysql from "mysql2/promise";
import fs from "fs/promises";
import axios from "axios";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Basic health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", environment: process.env.NODE_ENV || "development", port: PORT });
});

const MYSQL_CONFIG_FILE = path.join(process.cwd(), "mysql_config.json");

async function getSavedMysqlConfig() {
  try {
    const data = await fs.readFile(MYSQL_CONFIG_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (parsed.isConfigured) return parsed;
  } catch (error) {}

  // Fallback to environment variables
  if (process.env.MYSQL_HOST) {
    return {
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT) || 3306,
      database: process.env.MYSQL_DATABASE,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      isConfigured: true
    };
  }
  
  return {
    host: "",
    port: 3306,
    database: "",
    user: "",
    password: "",
    isConfigured: false
  };
}

async function saveSavedMysqlConfig(config: any) {
  await fs.writeFile(MYSQL_CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
}

// Initialize Gemini client lazily to avoid crashes if API key is not present when booting
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY no configurada. Configure no painel de Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Ensure remote MySQL has proper tables
const USERS_FILE = path.join(process.cwd(), "users_db.json");

async function loadLocalUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

async function saveLocalUsers(users: any[]) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

async function ensureTables(connection: mysql.Connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS bp_readings (
      id VARCHAR(100) PRIMARY KEY,
      user_id VARCHAR(100) NOT NULL,
      systolic INT NOT NULL,
      diastolic INT NOT NULL,
      pulse INT NOT NULL,
      notes TEXT,
      tags VARCHAR(500),
      measured_at VARCHAR(100) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS glucose_readings (
      id VARCHAR(100) PRIMARY KEY,
      user_id VARCHAR(100) NOT NULL,
      glucose_value REAL NOT NULL,
      meal_state VARCHAR(50) NOT NULL,
      notes TEXT,
      tags VARCHAR(500),
      measured_at VARCHAR(100) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS app_users (
      id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      surname VARCHAR(100) NOT NULL,
      birth_date VARCHAR(50) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password VARCHAR(150) NOT NULL,
      height INT,
      weight REAL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Ensure to add user_id column if tables previously existed without it (for migration)
  try { await connection.query('ALTER TABLE bp_readings ADD COLUMN user_id VARCHAR(100) NOT NULL DEFAULT "legacy"'); } catch (e) {}
  try { await connection.query('ALTER TABLE glucose_readings ADD COLUMN user_id VARCHAR(100) NOT NULL DEFAULT "legacy"'); } catch (e) {}
}

// API Routes

// User Register API Endpoint (supports dual modes: VPS database or elegant local JSON database caching)
app.post("/api/auth/register", async (req, res) => {
  const { id, name, surname, birthDate, email, password, height, weight } = req.body;
  
  if (!email || !password || !name) {
    return res.status(400).json({ success: false, message: "E-mail, senha e nome são obrigatórios para realizar o cadastro." });
  }

  try {
    const config = await getSavedMysqlConfig();
    let registeredUser = {
      id: id || `u-${Date.now()}`,
      name,
      surname: surname || "",
      birthDate: birthDate || "",
      email: email.toLowerCase().trim(),
      password,
      height: height ? Number(height) : null,
      weight: weight ? Number(weight) : null
    };

    // Save to local json buffer first as a strong local fallback
    const localUsers = await loadLocalUsers();
    const existsLocally = localUsers.find((u: any) => u.email === registeredUser.email);
    if (existsLocally) {
      return res.status(400).json({ success: false, message: "Este endereço de e-mail já está cadastrado no sistema." });
    }
    localUsers.push(registeredUser);
    await saveLocalUsers(localUsers);

    // If Remote VPS MySQL is active, sync registering configuration directly into it
    if (config && config.isConfigured) {
      try {
        const connection = await mysql.createConnection({
          host: config.host,
          port: Number(config.port) || 3306,
          user: config.user,
          password: config.password || "",
          database: config.database,
          connectTimeout: 5000
        });

        await ensureTables(connection);
        
        await connection.query(`
          INSERT INTO app_users (id, name, surname, birth_date, email, password, height, weight)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            surname = VALUES(surname),
            birth_date = VALUES(birth_date),
            password = VALUES(password),
            height = VALUES(height),
            weight = VALUES(weight)
        `, [registeredUser.id, registeredUser.name, registeredUser.surname, registeredUser.birthDate, registeredUser.email, registeredUser.password, registeredUser.height, registeredUser.weight]);
        
        await connection.end();
      } catch (dbErr: any) {
        console.error("User remote sync failed (ignoring since saved locally):", dbErr);
      }
    }

    return res.json({ success: true, user: registeredUser });
  } catch (error: any) {
    console.error("Register endpoint error:", error);
    return res.status(500).json({ success: false, message: "Falha interna ao criar conta no servidor." });
  }
});

// User Login API Endpoint (loads from local JSON db file or queries remote MySQL database dynamically)
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "E-mail e senha são necessários para realizar o acesso." });
  }

  try {
    const targetEmail = email.toLowerCase().trim();
    const config = await getSavedMysqlConfig();

    // 1. Check VPS if active to get the latest clinical values
    if (config && config.isConfigured) {
      try {
        const connection = await mysql.createConnection({
          host: config.host,
          port: Number(config.port) || 3306,
          user: config.user,
          password: config.password || "",
          database: config.database,
          connectTimeout: 5000
        });

        await ensureTables(connection);
        
        const [rows] = await connection.query("SELECT * FROM app_users WHERE email = ? LIMIT 1", [targetEmail]);
        const dbUsers = rows as any[];
        await connection.end();

        if (dbUsers.length > 0) {
          const u = dbUsers[0];
          if (u.password === password) {
            const mappedUser = {
              id: u.id,
              name: u.name,
              surname: u.surname,
              birthDate: u.birth_date,
              email: u.email,
              password: u.password,
              height: u.height,
              weight: u.weight
            };

            // Sync back to local json storage as backup cache
            const localUsers = await loadLocalUsers();
            const index = localUsers.findIndex((lu: any) => lu.email === targetEmail);
            if (index >= 0) {
              localUsers[index] = mappedUser;
            } else {
              localUsers.push(mappedUser);
            }
            await saveLocalUsers(localUsers);

            return res.json({ success: true, user: mappedUser });
          } else {
            return res.status(401).json({ success: false, message: "Senha incorreta informada." });
          }
        }
      } catch (dbErr: any) {
        console.error("User remote validation failed, falling back to local file context:", dbErr);
      }
    }

    // 2. Check local database file backup
    const localUsers = await loadLocalUsers();
    const localMatch = localUsers.find((u: any) => u.email === targetEmail);
    if (localMatch) {
      if (localMatch.password === password) {
        return res.json({ success: true, user: localMatch });
      } else {
        return res.status(401).json({ success: false, message: "Senha incorreta informada." });
      }
    }

    return res.status(404).json({ success: false, message: "Nenhum usuário correspondente encontrado." });
  } catch (error: any) {
    console.error("Login endpoint error:", error);
    return res.status(500).json({ success: false, message: "Erro no processamento interno de login." });
  }
});

// GET remote VPS configuration so that all machines share and use the same MySQL connection
app.get("/api/mysql/config", async (req, res) => {
  try {
    const config = await getSavedMysqlConfig();
    return res.json({ success: true, config });
  } catch (error: any) {
    console.error("Error reading MySQL config:", error);
    return res.status(500).json({ success: false, message: "Erro ao ler as configurações do MySQL no servidor." });
  }
});

// POST to update/persists the remote VPS configuration so all connected machines share it
app.post("/api/mysql/config", async (req, res) => {
  const { host, port, user, password, database, isConfigured } = req.body;
  try {
    const newConfig = {
      host: host || "",
      port: port ? Number(port) : 3306,
      user: user || "",
      password: password || "",
      database: database || "",
      isConfigured: !!isConfigured
    };
    await saveSavedMysqlConfig(newConfig);
    return res.json({
      success: true,
      message: "Configuração do banco de dados MySQL salva na nuvem. Todos os usuários agora compartilharão este mesmo caminho de forma segura.",
      config: newConfig
    });
  } catch (error: any) {
    console.error("Error saving MySQL config:", error);
    return res.status(500).json({ success: false, message: "Erro ao salvar a configuração do MySQL no servidor." });
  }
});

// Test MySQL connection & auto-configure tables on the user's aaPanel VPS
app.post("/api/mysql/test", async (req, res) => {
  const { host, port, user, password, database } = req.body;
  
  if (!host || !user || !database) {
    return res.status(400).json({ 
      success: false, 
      message: "Por favor, preencha Host, Usuário e Banco de Dados para testar." 
    });
  }

  try {
    const connection = await mysql.createConnection({
      host,
      port: Number(port) || 3306,
      user,
      password: password || "",
      database,
      connectTimeout: 6000
    });

    await ensureTables(connection);
    await connection.end();

    return res.json({
      success: true,
      message: "Sucesso! Conexão estabelecida com a sua VPS aaPanel e tabelas do diário clínico (bp_readings e glucose_readings) criadas e prontas para uso."
    });
  } catch (error: any) {
    console.error("MySQL Connection error:", error);
    return res.status(500).json({
      success: false,
      message: `Falha na conexão com a VPS: ${error.message || error}`
    });
  }
});

// Sync data (bi-directional sync/save)
app.post("/api/mysql/sync", async (req, res) => {
  const { config, bpReadings, glucoseReadings, userId } = req.body;

  if (!config || !config.host || !config.user || !config.database) {
    return res.status(400).json({
      success: false,
      message: "Configuração do MySQL inválida ou incompleta."
    });
  }

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Acesso negado: Usuário não autenticado."
    });
  }

  try {
    const connection = await mysql.createConnection({
      host: config.host,
      port: Number(config.port) || 3306,
      user: config.user,
      password: config.password || "",
      database: config.database,
      connectTimeout: 8000
    });

    await ensureTables(connection);

    // 1. Sync Blood Pressure readings
    if (bpReadings && Array.isArray(bpReadings)) {
      for (const bp of bpReadings) {
        const tagsStr = Array.isArray(bp.tags) ? bp.tags.join(",") : "";
        await connection.query(`
          INSERT INTO bp_readings (id, user_id, systolic, diastolic, pulse, notes, tags, measured_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            systolic = VALUES(systolic),
            diastolic = VALUES(diastolic),
            pulse = VALUES(pulse),
            notes = VALUES(notes),
            tags = VALUES(tags),
            measured_at = VALUES(measured_at)
        `, [bp.id, userId, bp.systolic, bp.diastolic, bp.pulse, bp.notes, tagsStr, bp.measuredAt]);
      }
    }

    // 2. Sync Glucose readings
    if (glucoseReadings && Array.isArray(glucoseReadings)) {
      for (const gl of glucoseReadings) {
        const tagsStr = Array.isArray(gl.tags) ? gl.tags.join(",") : "";
        await connection.query(`
          INSERT INTO glucose_readings (id, user_id, glucose_value, meal_state, notes, tags, measured_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            glucose_value = VALUES(glucose_value),
            meal_state = VALUES(meal_state),
            notes = VALUES(notes),
            tags = VALUES(tags),
            measured_at = VALUES(measured_at)
        `, [gl.id, userId, gl.value, gl.mealState, gl.notes, tagsStr, gl.measuredAt]);
      }
    }

    // 3. Retrieve all readings from database isolated by user_id
    const [dbBp] = await connection.query("SELECT * FROM bp_readings WHERE user_id = ? ORDER BY measured_at DESC", [userId]);
    const [dbGl] = await connection.query("SELECT * FROM glucose_readings WHERE user_id = ? ORDER BY measured_at DESC", [userId]);

    await connection.end();

    // Map DB readings back to frontend types
    const syncedBp = (dbBp as any[]).map(row => ({
      id: row.id,
      systolic: row.systolic,
      diastolic: row.diastolic,
      pulse: row.pulse,
      notes: row.notes || "",
      tags: row.tags ? row.tags.split(",").filter((t: string) => t.length > 0) : [],
      measuredAt: row.measured_at
    }));

    const syncedGl = (dbGl as any[]).map(row => ({
      id: row.id,
      value: Number(row.glucose_value),
      mealState: row.meal_state,
      notes: row.notes || "",
      tags: row.tags ? row.tags.split(",").filter((t: string) => t.length > 0) : [],
      measuredAt: row.measured_at
    }));

    return res.json({
      success: true,
      message: "Sincronização realizada com sucesso nas duas direções!",
      bpReadings: syncedBp,
      glucoseReadings: syncedGl
    });
  } catch (error: any) {
    console.error("MySQL Sync error:", error);
    return res.status(500).json({
      success: false,
      message: `Erro na sincronização: ${error.message || error}`
    });
  }
});

// Delete reading
app.post("/api/mysql/delete", async (req, res) => {
  const { config, id, type, userId } = req.body;

  if (!config || !config.host || !config.user || !config.database) {
    return res.status(400).json({
      success: false,
      message: "Configuração do MySQL inválida ou incompleta."
    });
  }

  if (!userId || !id || !type) {
    return res.status(400).json({
      success: false,
      message: "Dados incompletos para exclusão."
    });
  }

  try {
    const connection = await mysql.createConnection({
      host: config.host,
      port: Number(config.port) || 3306,
      user: config.user,
      password: config.password || "",
      database: config.database,
      connectTimeout: 8000
    });

    if (type === 'pressure') {
      await connection.query("DELETE FROM bp_readings WHERE id = ? AND user_id = ?", [id, userId]);
    } else if (type === 'glucose') {
      await connection.query("DELETE FROM glucose_readings WHERE id = ? AND user_id = ?", [id, userId]);
    }

    await connection.end();

    return res.json({ success: true });
  } catch (error: any) {
    console.error("MySQL Delete error:", error);
    return res.status(500).json({
      success: false,
      message: `Erro ao deletar do MySQL: ${error.message || error}`
    });
  }
});

// Static fallback analytics engine used to evaluate patient readings locally when AI models are overloaded (e.g. 503 Busy)
function getLocalInsights(bpReadings: any[] = [], glucoseReadings: any[] = []): string {
  let markdown = `> ⚠️ **Nota Prontuária Preventiva:** O servidor de Inteligência Artificial está sob alta demanda temporária no momento (Erro de Limitação 503). Para garantir sua segurança e conveniência móvel imediata, nosso diário gerou automaticamente este **Relatório Estático Local** para que você não fique sem seus insights!\n\n`;
  markdown += `### 🩺 Análise Prontuária Local dos Dados Clínicos\n\n`;
  markdown += `Avaliamos as suas últimas aferições informadas no diário clínico para fornecer conselhos preventivos preliminares de saúde:\n\n`;

  // Pressão Arterial
  markdown += `#### 🩺 Métricas da Pressão Arterial\n`;
  if (!bpReadings || bpReadings.length === 0) {
    markdown += `- *Nenhuma leitura de Pressão Arterial (PA) recente foi localizada na memória local.*\n`;
  } else {
    const latest = bpReadings[0];
    const sys = Number(latest.systolic);
    const dia = Number(latest.diastolic);
    const pulse = Number(latest.pulse);
    
    // Avoid malformed date parse issues
    let dateStr = "";
    try {
      dateStr = new Date(latest.measuredAt).toLocaleDateString('pt-BR');
    } catch {
      dateStr = "Aferição recente";
    }

    markdown += `- **Último Registro:** ${sys}/${dia} mmHg com pulso de ${pulse} bpm (${dateStr}).\n`;
    
    let classification = "Normal";
    let advice = "Excelente! Mantenha a prática regular de exercícios moderados, boa hidratação contínua e repouso de sono de qualidade.";
    
    if (sys >= 140 || dia >= 90) {
      classification = "Hipertensão Clínicamente Elevada (Estágio 1 ou Superior)";
      advice = "Sua pressão está acima da meta ideal. Reduza moderadamente o consumo de alimentos com sódio (sal de mesa), evite estresse agudo, beba água e consulte sua equipe de saúde para controle regular.";
    } else if (sys >= 130 || dia >= 80) {
      classification = "Limítrofe / Pré-Hipertensão";
      advice = "Sua pressão arterial está em uma zona limítrofe. Monitore suas aferições em repouso absoluto de 5 minutos antes da medição.";
    } else if (sys < 90 || dia < 60) {
      classification = "Hipotensão Clínica (Pressão Baixa)";
      advice = "Os níveis estão abaixo da média saudável. Lembre-se de ingerir pequenos copos de água regularmente e levantar-se devagar para evitar vertigem ortostática.";
    }
    
    markdown += `- *Classificação Técnica Estática:* **${classification}**\n`;
    markdown += `- *Aconselhamento Preventivo:* ${advice}\n`;
  }
  markdown += `\n`;

  // Glicemia
  markdown += `#### 🩸 Controle Metabólico de Glicemia\n`;
  if (!glucoseReadings || glucoseReadings.length === 0) {
    markdown += `- *Nenhuma medição de glicose recente foi localizada na memória local.*\n`;
  } else {
    const latest = glucoseReadings[0];
    const val = Number(latest.value);
    const state = latest.mealState || "N/A";
    
    let stateLabel = state;
    if (state === "jejum") stateLabel = "Antes do café da manhã (Em Jejum)";
    else if (state === "pos-prandial") stateLabel = "Pós-Prandial (Após a Refeição)";
    else if (state === "pre-prandial") stateLabel = "Pré-Prandial (Antes da Refeição)";

    // Avoid malformed date parse issues
    let dateStr = "";
    try {
      dateStr = new Date(latest.measuredAt).toLocaleDateString('pt-BR');
    } catch {
      dateStr = "Aferição recente";
    }

    markdown += `- **Último Registro:** ${val} mg/dL registrado sob estado *${stateLabel}* (${dateStr}).\n`;
    
    let classification = "Normal";
    let advice = "A glicemia está se mantendo dentro dos patamares saudáveis recomendados.";
    
    if (val < 70) {
      classification = "Hipoglicemia Aguda (Nível Baixo)";
      advice = "Alerta de segurança: Seu nível de açúcar está abaixo do recomendado. Consuma imediatamente uma fonte de açúcar simples (como 150ml de suco de fruta ou mel) e reteste em 15 minutos.";
    } else if (state === "jejum") {
      if (val >= 126) {
        classification = "Hiperglicemia Crítica (Sugerido Alerta de Diabetes)";
        advice = "A glicemia de jejum elevada requer vigilância clínica formal. Evite estritamente massas e doces pelas manhãs.";
      } else if (val >= 100) {
        classification = "Glicemia de Jejum Alterada (Pré-disposição metabólica)";
        advice = "Você está em uma faixa de tolerância à glicose limítrofe. Caminhadas pós-alimentação auxiliam o pâncreas a regular o metabolismo de carboidratos.";
      }
    } else { // Pós-prandial ou geral
      if (val >= 200) {
        classification = "Hiperglicemia Pós-Prandial Acentuada";
        advice = "Sinal de pico de absorção de carbohidratos simples. Considere equilibrar suas próximas três refeições com folhas verdes e proteínas magras.";
      } else if (val >= 140) {
        classification = "Glicose Pós-Prandial Limítrofe";
        advice = "A leitura está ligeiramente acima da resposta insulínica ideal. Prefira grãos integrais aos refinados.";
      }
    }
    
    markdown += `- *Classificação Técnica Estática:* **${classification}**\n`;
    markdown += `- *Aconselhamento Preventivo:* ${advice}\n`;
  }
  markdown += `\n`;

  // Hábitos Saudáveis Recomendados
  markdown += `#### 📋 Guia de Hábitos Recomendados\n`;
  markdown += `- **Aporte Hídrico Inteligente:** Mantenha a meta de ingestão hídrica de 35ml de água filtrada por cada kg de peso corpóreo a cada 24 horas.\n`;
  markdown += `- **Intervenção Cardiovascular:** Busque acumular 150 minutos semanais de atividade aeróbia confortável (como caminhada vigorosa) para aumentar a elasticidade dos vasos sanguíneos.\n`;
  markdown += `- **Higiene do Sono:** Mantenha um horário regular para deitar-se. Dormir pouco eleva os níveis matinais de adrenalina e norepinefrina, elevando a pressão.\n\n`;

  markdown += `*Aviso Médico Preventivo: Esta análise foi gerada por um algoritmo local preventivo com diretrizes genéricas da OMS. Nunca substitui, altera ou sobressai as prescrições, exames laboratoriais ou as orientações médicas fornecidas formalmente pelo seu doutor ou equipe de saúde.*`;
  
  return markdown;
}

// Gemini Health Insights Interpretation
app.post("/api/gemini/insights", async (req, res) => {
  const { bpReadings, glucoseReadings } = req.body;

  try {
    const ai = getGeminiClient();

    const formattedBp = (bpReadings || []).slice(0, 8).map((b: any) => 
      `- ${new Date(b.measuredAt).toLocaleString('pt-BR')}: PA ${b.systolic}/${b.diastolic} mmHg, Pulso ${b.pulse} bpm (${b.tags.join(", ") || "Sem tags"}). ${b.notes || ""}`
    ).join("\n");

    const formattedGl = (glucoseReadings || []).slice(0, 8).map((g: any) => 
      `- ${new Date(g.measuredAt).toLocaleString('pt-BR')}: Glicose ${g.value} mg/dL, Estado: ${g.mealState} (${g.tags.join(", ") || "Sem tags"}). ${g.notes || ""}`
    ).join("\n");

    const prompt = `Você é um analista clínico assistente e especialista de saúde virtual integrado ao aplicativo de diário clínico VittaBPlus.
Seu objetivo é analisar os logs mais recentes de pressão arterial e glicose do usuário e fornecer um resumo inteligível, destacando padrões preocupantes (como picos de pressão ou glicose), sugestões de hábitos preventivos e encorajamento pessoal de forma acolhedora em português.

**IMPORTANTE**: 
1. Sempre inicie com uma breve saudação acolhedora e positiva.
2. Seja objetivo e não faça diagnósticos decisivos ou prescrições médicas (inclua um aviso profissional de que suas informações são apenas insights preventivos de estilo de vida que apoiam, mas não substituem a consulta com seu médico ou cardiologista/endocrinologista).
3. Agrupe as recomendações em tópicos práticos como "Pressão Arterial", "Glicemia" e "Hábitos para Criar Saúde".

Histórico recente do Usuário:
-- PRESSÃO ARTERIAL (Mais recentes se houverem):
${formattedBp.length > 0 ? formattedBp : "Nenhuma medição cadastrada ainda."}

-- GLICOSE (Mais recentes se houverem):
${formattedGl.length > 0 ? formattedGl : "Nenhuma medição cadastrada ainda."}

Formate a resposta em Markdown limpo, sem falar sobre termos internos de TI.`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt
    });

    return res.json({
      success: true,
      insights: response.text
    });
  } catch (error: any) {
    console.error("Gemini Insights error:", error);
    try {
      const fallbackInsights = getLocalInsights(bpReadings, glucoseReadings);
      return res.json({
        success: true,
        insights: fallbackInsights,
        isFallback: true
      });
    } catch (fallbackError: any) {
      console.error("Fallback generator error:", fallbackError);
      return res.status(500).json({
        success: false,
        message: `Erro ao obter insights com IA: ${error.message || "Por favor, configure sua chave GEMINI_API_KEY no painel de Segredos (Secrets)."}`
      });
    }
  }
});

// Reverse Geocoding via Positionstack API (Server-side proxy)
app.get("/api/geocoding/reverse", async (req, res) => {
  const { lat, lng } = req.query;
  const apiKey = process.env.POSITIONSTACK_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ 
      success: false, 
      message: "POSITIONSTACK_API_KEY não configurada no servidor." 
    });
  }

  if (!lat || !lng) {
    return res.status(400).json({ 
      success: false, 
      message: "Latitude e Longitude são obrigatórios." 
    });
  }

  try {
    const response = await axios.get("http://api.positionstack.com/v1/reverse", {
      params: {
        access_key: apiKey,
        query: `${lat},${lng}`,
        limit: 1
      }
    });

    const results = response.data.data;
    if (results && results.length > 0) {
      const bestMatch = results[0];
      const addressName = bestMatch.label || `${bestMatch.name}, ${bestMatch.region}`;
      return res.json({ 
        success: true, 
        address: addressName,
        data: bestMatch
      });
    }

    return res.json({ 
      success: false, 
      message: "Nenhum endereço encontrado para estas coordenadas." 
    });
  } catch (error: any) {
    console.error("Geocoding Error:", error.response?.data || error.message);
    return res.status(500).json({ 
      success: false, 
      message: "Erro ao consultar o serviço de geocodificação." 
    });
  }
});

// Vite Integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`VittaBPlus Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
