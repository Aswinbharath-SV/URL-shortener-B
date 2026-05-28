import { body, validationResult } from 'express-validator';

// Standard validator runner
const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const firstErrorMessage = errors.array()[0].msg;
    return res.status(400).json({
      success: false,
      message: firstErrorMessage,
      errors: errors.array(),
    });
  };
};

export const registerValidator = validate([
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#._-])[A-Za-z\d@$!%*?&#._-]{6,}$/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#._-)'),
]);

export const loginValidator = validate([
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
]);

export const urlValidator = validate([
  body('originalUrl')
    .trim()
    .notEmpty()
    .withMessage('Original URL is required')
    .isURL({ require_tld: true, require_protocol: true })
    .withMessage('Please provide a valid URL starting with http:// or https://'),
  body('customAlias')
    .optional({ checkFalsy: true })
    .trim()
    .isAlphanumeric('en-US', { ignore: '-_' })
    .withMessage('Custom alias can only contain alphanumeric characters, hyphens, and underscores')
    .isLength({ min: 3, max: 30 })
    .withMessage('Custom alias must be between 3 and 30 characters long'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 250 })
    .withMessage('Description cannot exceed 250 characters'),
]);
