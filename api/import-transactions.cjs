const fs = require("fs");
const admin = require("firebase-admin");

// 🔐 Lê o arquivo da chave de serviço
const serviceAccount = JSON.parse(fs.readFileSync("./serviceAccountKey.json", "utf8"));

// 🔥 Inicializa o Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ⚙️ Configurações fixas
const userId = "CsU7z36Pu6PfNMjC1xPHFPJwfVl1"; // UID do usuário dono das transações

// 📂 Lê o arquivo JSON com as transações
// Certifique-se de que transactions.json já está no formato adaptado que discutimos
// ou que o JSON original do usuário que você postou.
// Se você está usando o JSON adaptado, ele já tem o amount negativo para despesas.
// Se você está usando o JSON original, o amount será importado como positivo.
const transactions = JSON.parse(fs.readFileSync("./transactions.json", "utf8"));

async function importTransactions() {
  console.log(`🚀 Importando ${transactions.length} transações...\n`);

  for (const [index, tx] of transactions.entries()) {
    try {
      if (!tx.description || tx.amount === undefined || tx.amount === null) { // Verificação mais robusta para amount
        console.warn(`⚠️ Transação ${index + 1} ignorada (dados incompletos: descrição ou valor ausente)`);
        continue;
      }

      const amount = Number(tx.amount);
      if (isNaN(amount)) {
        console.warn(`⚠️ Valor inválido (não numérico) em "${tx.description}". Transação ${index + 1} ignorada.`);
        continue;
      }

      // --- PRINCIPAL MUDANÇA AQUI ---
      // IMPORTADOR NÃO FORÇA O SINAL. SALVA O AMOUNT EXATAMENTE COMO ESTÁ NO JSON.
      // A lógica de sinal (positivo/negativo) será tratada EXCLUSIVAMENTE pelo frontend.
      const rawAmount = amount; // Pega o valor exatamente como ele vem do JSON

      // Converte a data do JSON (ex: "2025-11-07") para um objeto Date
      // e depois para o formato ISO 8601 completo para consistência.
      // Se tx.date já for ISO completo, essa conversão não fará mal.
      const transactionDate = new Date(tx.date);
      if (isNaN(transactionDate.getTime())) {
          console.warn(`⚠️ Data inválida em "${tx.description}". Transação ${index + 1} ignorada.`);
          continue;
      }
      const dateISOString = transactionDate.toISOString();

      // Calcula month e year a partir da data da transação, não da data atual da importação
      const month = transactionDate.getMonth() + 1; // getMonth() é 0-indexed
      const year = transactionDate.getFullYear();

      const now = new Date(); // Para o createdAt, que é quando a transação é processada/importada

      const transactionDoc = {
        // id: O Firestore irá gerar um ID automaticamente com .add(), então não precisamos definir aqui.
        userId,
        memberId: tx.memberId,
        memberName: tx.memberName,
        description: tx.description, // Mantendo a descrição original do JSON
        category: tx.category || "Outros", // Usa a categoria do JSON ou 'Outros'
        type: tx.type || "expense", // Usa o tipo do JSON ou 'expense'
        amount: rawAmount, // <<< SALVANDO O AMOUNT EXATAMENTE COMO ESTÁ NO JSON (positivo ou negativo)
        paymentMethod: tx.paymentMethod || "Pix",
        date: dateISOString, // Usando a data da transação em formato ISO completo
        month: month, // Mês derivado da data da transação
        year: year,   // Ano derivado da data da transação
        createdAt: now.toISOString(), // Data/hora da importação
        source: "import",
        location: tx.location || tx.description || undefined, // Mapeia para location, ou usa description, ou undefined
        incomeSource: tx.incomeSource || undefined // Se for income, pega do JSON, senão undefined
      };

      // Remover campos 'undefined' antes de enviar ao Firestore (opcional, mas boa prática)
      // O Firestore por padrão já ignora undefined, mas o admin SDK pode ter comportamento diferente
      // dependendo da versão ou configurações. É mais seguro filtrar.
      const cleanedTransactionDoc = Object.fromEntries(
        Object.entries(transactionDoc).filter(([, value]) => value !== undefined)
      );

      await db.collection(`users/${userId}/transactions`).add(cleanedTransactionDoc); // .add() gera o ID do documento automaticamente
      console.log(`✅ [${index + 1}] Transação '${tx.description}' (valor: ${rawAmount}) adicionada com sucesso`);
    } catch (err) {
      console.error(`🔥 Erro na transação ${index + 1} (${tx.description || 'sem descrição'}):`, err.message);
    }
  }

  console.log("\n🏁 Importação concluída!");
}

importTransactions().catch((err) => {
  console.error("❌ Erro fatal:", err);
  process.exit(1);
});
