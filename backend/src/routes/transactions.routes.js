const express = require('express');
const { createUserClient } = require('../config/supabase');
const requireAuth = require('../middlewares/requireAuth');
const validate = require('../middlewares/validate');
const {
  CATEGORIES,
  transactionSchema,
  listQuerySchema,
  summaryQuerySchema,
  idParamSchema,
} = require('../schemas/transactions.schemas');

const router = express.Router();

router.use(requireAuth);

const COLUMNS = 'id, description, amount, type, category, transaction_date, created_at';

const SORTS = {
  date_desc: ['transaction_date', false],
  date_asc: ['transaction_date', true],
  amount_desc: ['amount', false],
  amount_asc: ['amount', true],
};

function toApi(row) {
  return {
    id: row.id,
    description: row.description,
    amount: Number(row.amount),
    type: row.type,
    category: row.category,
    transactionDate: row.transaction_date,
    createdAt: row.created_at,
  };
}

function escapeLike(text) {
  return text.replace(/[\\%_]/g, '\\$&');
}

function applyFilters(query, userId, filters) {
  query = query.eq('user_id', userId);
  if (filters.type) query = query.eq('type', filters.type);
  if (filters.category) query = query.eq('category', filters.category);
  if (filters.search) query = query.ilike('description', `%${escapeLike(filters.search)}%`);
  if (filters.from) query = query.gte('transaction_date', filters.from);
  if (filters.to) query = query.lte('transaction_date', filters.to);
  return query;
}

router.get('/categories', (req, res) => {
  res.json({ categories: CATEGORIES });
});

router.get('/summary', validate(summaryQuerySchema, 'query'), async (req, res) => {
  const { from, to } = req.valid.query;
  const db = createUserClient(req.accessToken);

  const { data, error } = await db.rpc('transaction_summary', {
    p_from: from || null,
    p_to: to || null,
  });

  if (error) {
    console.error('Erro no resumo:', error.message);
    return res.status(500).json({ error: 'Não foi possível calcular o resumo.' });
  }

  const row = (data && data[0]) || { total_income: 0, total_expense: 0 };
  const income = Number(row.total_income);
  const expense = Number(row.total_expense);

  res.json({
    income,
    expense,
    balance: Math.round((income - expense) * 100) / 100,
  });
});

router.get('/', validate(listQuerySchema, 'query'), async (req, res) => {
  const filters = req.valid.query;
  const { page, limit, sort } = filters;
  const db = createUserClient(req.accessToken);

  const start = (page - 1) * limit;
  const [column, ascending] = SORTS[sort];

  const { data, count, error } = await applyFilters(
    db.from('transactions').select(COLUMNS, { count: 'exact' }),
    req.user.id,
    filters
  )
    .order(column, { ascending })
    .order('created_at', { ascending: false })
    .range(start, start + limit - 1);

  let rows = data;
  let total = count;

  if (error) {
    // PGRST103 = página além do fim da lista: devolvemos vazio, com o total correto
    if (error.code === 'PGRST103') {
      const head = await applyFilters(
        db.from('transactions').select('id', { count: 'exact', head: true }),
        req.user.id,
        filters
      );
      if (head.error) {
        console.error('Erro ao contar:', head.error.message);
        return res.status(500).json({ error: 'Não foi possível listar as transações.' });
      }
      rows = [];
      total = head.count;
    } else {
      console.error('Erro ao listar:', error.message);
      return res.status(500).json({ error: 'Não foi possível listar as transações.' });
    }
  }

  res.json({
    data: rows.map(toApi),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

router.post('/', validate(transactionSchema), async (req, res) => {
  const body = req.body;
  const db = createUserClient(req.accessToken);

  const { data, error } = await db
    .from('transactions')
    .insert({
      user_id: req.user.id,
      description: body.description,
      amount: body.amount,
      type: body.type,
      category: body.category,
      transaction_date: body.transactionDate,
    })
    .select(COLUMNS)
    .single();

  if (error) {
    console.error('Erro ao criar:', error.message);
    return res.status(500).json({ error: 'Não foi possível salvar a transação.' });
  }

  res.status(201).json({ transaction: toApi(data) });
});

router.put('/:id', validate(idParamSchema, 'params'), validate(transactionSchema), async (req, res) => {
  const { id } = req.valid.params;
  const body = req.body;
  const db = createUserClient(req.accessToken);

  const { data, error } = await db
    .from('transactions')
    .update({
      description: body.description,
      amount: body.amount,
      type: body.type,
      category: body.category,
      transaction_date: body.transactionDate,
    })
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select(COLUMNS)
    .maybeSingle();

  if (error) {
    console.error('Erro ao editar:', error.message);
    return res.status(500).json({ error: 'Não foi possível editar a transação.' });
  }
  if (!data) {
    return res.status(404).json({ error: 'Transação não encontrada' });
  }

  res.json({ transaction: toApi(data) });
});

router.delete('/:id', validate(idParamSchema, 'params'), async (req, res) => {
  const { id } = req.valid.params;
  const db = createUserClient(req.accessToken);

  const { data, error } = await db
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select('id');

  if (error) {
    console.error('Erro ao excluir:', error.message);
    return res.status(500).json({ error: 'Não foi possível excluir a transação.' });
  }
  if (!data || data.length === 0) {
    return res.status(404).json({ error: 'Transação não encontrada' });
  }

  res.json({ message: 'Transação excluída' });
});

module.exports = router;