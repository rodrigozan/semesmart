import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { GoogleGenAI, Type } from '@google/genai';

const app = express();
app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/semesmart';
const PORT = process.env.PORT || 3001;

await mongoose.connect(MONGODB_URI);
console.log('MongoDB conectado!');

const memberSchema = new mongoose.Schema({
  id: String,
  name: String,
  avatar: String,
  role: { type: String, enum: ['Administrador', 'Cônjuge', 'Membro'] },
  title: String,
  email: String,
  incomeSource: String,
}, { _id: false });

const familyProfileSchema = new mongoose.Schema({
  name: String,
  avatar: String,
  createdAt: Date,
}, { _id: false });

const goalSchema = new mongoose.Schema({
  id: String,
  name: String,
  targetAmount: Number,
  currentAmount: Number,
  illustration: String,
  deadline: String,
}, { _id: false });

const challengeSchema = new mongoose.Schema({
  id: String,
  title: String,
  description: String,
  icon: String,
  status: { type: String, enum: ['available', 'active', 'completed'] },
}, { _id: false });

const cardSchema = new mongoose.Schema({
  id: String,
  name: String,
  last4: String,
  issuer: { type: String, enum: ['visa', 'mastercard', 'elo', 'amex', 'other'] },
}, { _id: false });

const userDataSchema = new mongoose.Schema({
  familyProfile: familyProfileSchema,
  members: [memberSchema],
  goals: [goalSchema],
  challenges: [challengeSchema],
  cards: [cardSchema],
  hasSeenOnboarding: Boolean,
});

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true },
  userData: userDataSchema,
}, { timestamps: true });

const transactionSchema = new mongoose.Schema({
  id: String,
  userId: { type: String, index: true },
  description: String,
  amount: Number,
  date: String,
  createdAt: String,
  month: Number,
  year: Number,
  category: String,
  paymentMethod: String,
  location: String,
  incomeSource: String,
  source: String,
  type: { type: String, enum: ['income', 'expense'] },
  memberId: String,
  memberName: String,
});

transactionSchema.index({ userId: 1, date: -1 });

const User = mongoose.model('User', userSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

const defaultUserData = {
  familyProfile: { name: 'Minha Família', avatar: '👨‍👩‍👧‍👦', createdAt: new Date() },
  members: [{ id: 'm1', name: 'Eu', avatar: '😊', role: 'Administrador', title: 'Admin' }],
  goals: [],
  challenges: [],
  cards: [],
  hasSeenOnboarding: false,
};

app.post('/api/register', async (req, res) => {
  try {
    const { name, title, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'E-mail já cadastrado.' });

    const uid = `uid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const firstMember = {
      id: `m${Date.now()}`,
      name,
      avatar: '😊',
      role: 'Administrador',
      title,
    };

    const user = new User({
      uid,
      email,
      userData: { ...defaultUserData, members: [firstMember] },
    });

    await user.save();
    res.json({ uid: user.uid, email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
    res.json({ uid: user.uid, email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/user/:uid', async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.params.uid });
    if (!user) {
      const newUser = new User({
        uid: req.params.uid,
        email: 'user@example.com',
        userData: defaultUserData,
      });
      await newUser.save();
      return res.json(newUser.userData);
    }
    res.json(user.userData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/user/:uid', async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { uid: req.params.uid },
      { userData: req.body },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
    res.json(user.userData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/transactions/:uid', async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.params.uid }).sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/transactions/:uid', async (req, res) => {
  try {
    const id = `t${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const transaction = new Transaction({ id, userId: req.params.uid, ...req.body });
    await transaction.save();
    res.json({ id, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/transactions/:uid/:id', async (req, res) => {
  try {
    const t = await Transaction.findOneAndUpdate(
      { id: req.params.id, userId: req.params.uid },
      req.body,
      { new: true }
    );
    if (!t) return res.status(404).json({ error: 'Transação não encontrada.' });
    res.json(t);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/transactions/:uid/:id', async (req, res) => {
  try {
    const t = await Transaction.findOneAndDelete({ id: req.params.id, userId: req.params.uid });
    if (!t) return res.status(404).json({ error: 'Transação não encontrada.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai-insights', async (req, res) => {
  try {
    const { transactions } = req.body;
    if (!process.env.API_KEY) {
      return res.status(500).json({ error: 'API_KEY não configurada.' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const simplified = transactions.map(({ description, amount, category }) => ({ description, amount, category }));

    const prompt = `Você é um consultor financeiro otimista e didático. Analise os seguintes gastos e gere exatamente 3 dicas curtas e práticas para ajudar a família a economizar ou gerenciar melhor o orçamento.
    
    Gastos recentes:
    ${JSON.stringify(simplified, null, 2)}
    `;

    const insightSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'Um título curto e chamativo para a dica financeira.' },
        description: { type: Type.STRING, description: 'Uma descrição de uma frase, explicando a dica de forma simples e direta.' },
      },
      required: ['title', 'description'],
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: { type: Type.ARRAY, items: insightSchema },
      },
    });

    res.json(JSON.parse(response.text.trim()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`));