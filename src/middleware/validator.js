const Joi = require('joi');
const ApiError = require('../utils/ApiError');

/**
 * Create a validation middleware from a Joi schema
 * @param {Object} schema - Joi schema with body, params, query keys
 */
const validate = (schema) => (req, _res, next) => {
  const validSchema = {};
  const validKeys = ['body', 'params', 'query'];

  validKeys.forEach((key) => {
    if (schema[key]) {
      validSchema[key] = schema[key];
    }
  });

  const object = {};
  Object.keys(validSchema).forEach((key) => {
    object[key] = req[key];
  });

  const joiSchema = Joi.object(validSchema);
  const { error, value } = joiSchema.validate(object, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: { objects: true },
  });

  if (error) {
    const details = error.details.map((d) => d.message);
    return next(ApiError.badRequest('Validation error', details));
  }

  // Assign validated values back to request
  Object.keys(value).forEach((key) => {
    req[key] = value[key];
  });

  return next();
};

// ─── Validation Schemas ──────────────────────────────────

const prdUploadSchema = {
  body: Joi.object({
    title: Joi.string().min(3).max(200).optional(),
    content: Joi.string().min(50).max(500000).optional(),
  }),
};

const prdIdSchema = {
  params: Joi.object({
    id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
      'string.pattern.base': 'Invalid document ID format',
    }),
  }),
};

const storyUpdateSchema = {
  body: Joi.object({
    title: Joi.string().min(3).max(500).optional(),
    description: Joi.string().max(5000).optional(),
    acceptanceCriteria: Joi.array().items(Joi.string()).optional(),
    storyPoints: Joi.number().valid(1, 2, 3, 5, 8, 13, 21).optional(),
    priority: Joi.string().valid('critical', 'high', 'medium', 'low').optional(),
  }),
};

const exportSchema = {
  body: Joi.object({
    format: Joi.string().valid('csv', 'markdown', 'jira').required(),
    storyIds: Joi.array().items(Joi.string()).optional(),
  }),
};

module.exports = {
  validate,
  prdUploadSchema,
  prdIdSchema,
  storyUpdateSchema,
  exportSchema,
};
