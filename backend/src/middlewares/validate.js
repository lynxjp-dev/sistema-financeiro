function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: result.error.issues.map((issue) => ({
          campo: issue.path.join('.'),
          mensagem: issue.message,
        })),
      });
    }

    req.valid = req.valid || {};
    req.valid[source] = result.data;
    if (source === 'body') req.body = result.data;

    next();
  };
}

module.exports = validate;