// utils/validators/userValidator.js
const Joi = require('joi'); // Import Joi for schema validation

// Joi schema for user registration validation
const registerSchema = Joi.object({
    name: Joi.string().trim().min(3).max(50).required().messages({
        'string.empty': 'Name cannot be empty.',
        'string.min': 'Name must be at least {#limit} characters long.',
        'string.max': 'Name cannot be more than {#limit} characters long.',
        'any.required': 'Name is required.'
    }),
    // username field is removed entirely as it's no longer part of the user model or input
    email: Joi.string().trim().email().required().messages({
        'string.empty': 'Email cannot be empty.',
        'string.email': 'Please enter a valid email address.',
        'any.required': 'Email is required.'
    }),
    password: Joi.string().min(8).required().messages({
        'string.empty': 'Password cannot be empty.',
        'string.min': 'Password must be at least {#limit} characters long.',
        'any.required': 'Password is required.'
    }),
    phone: Joi.string().trim().min(7).max(20).required().messages({
        'string.empty': 'Phone number cannot be empty.',
        'string.min': 'Phone number must be at least {#limit} characters long.',
        'string.max': 'Phone number cannot be more than {#limit} characters long.',
        'any.required': 'Phone number is required.'
    }),
    isAdmin: Joi.boolean().default(false),
    street: Joi.string().trim().allow('').default(''),
    apartment: Joi.string().trim().allow('').default(''),
    zip: Joi.string().trim().allow('').default(''),
    city: Joi.string().trim().allow('').default(''),
    country: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).allow(null, '').messages({
        'string.pattern.base': 'Country ID must be a valid MongoDB ObjectId.'
    }),
    role: Joi.string().valid('user', 'admin').default('user'),
    gender: Joi.string().valid('Male', 'Female', 'Other').default('Other'),
    profileImage: Joi.string().allow('').optional(), // Allow profileImage to be sent, but schema default handles it
});

// Joi schema for user login validation (remains unchanged as it uses email)
const loginSchema = Joi.object({
    email: Joi.string().trim().email().lowercase().required().messages({
        'string.empty': 'Email cannot be empty for login.',
        'string.email': 'Please enter a valid email address for login.',
        'any.required': 'Email is required for login.'
    }),
    password: Joi.string().required().trim().messages({
        'string.empty': 'Password cannot be empty for login.',
        'any.required': 'Password is required for login.'
    })
}).strict();

// Joi schema for user update validation (all fields are optional, as it's a partial update)
const updateUserSchema = Joi.object({
    name: Joi.string().trim().min(3).max(50).optional(),
    // username field is removed entirely
    email: Joi.string().trim().email().optional(),
    password: Joi.string().min(8).optional(),
    phone: Joi.string().trim().min(7).max(20).optional(),
    isAdmin: Joi.boolean().optional(),
    street: Joi.string().trim().allow('').optional(),
    apartment: Joi.string().trim().allow('').optional(),
    zip: Joi.string().trim().allow('').optional(),
    city: Joi.string().trim().allow('').optional(),
    country: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).allow(null, '').optional().messages({
        'string.pattern.base': 'Country ID must be a valid MongoDB ObjectId.'
    }),
    role: Joi.string().valid('user', 'admin').optional(),
    gender: Joi.string().valid('Male', 'Female', 'Other').optional(),
    profileImage: Joi.string().allow('').optional(),
}).min(1).messages({
    'object.min': 'At least one field must be provided for update.'
});

module.exports = {
    registerSchema,
    loginSchema,
    updateUserSchema
};
