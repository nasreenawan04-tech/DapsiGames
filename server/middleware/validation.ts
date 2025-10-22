import { body, param, query, validationResult } from "express-validator";
import type { Request, Response, NextFunction } from "express";

export function handleValidationErrors(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

export const validateRegistration = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  body("fullName")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters"),
  handleValidationErrors,
];

export const validateLogin = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
];

export const validateUserId = [
  param("userId").isUUID().withMessage("Valid user ID is required"),
  handleValidationErrors,
];

export const validateUpdateProfile = [
  body("fullName").optional().trim().isLength({ min: 2, max: 100 }).withMessage("Full name must be between 2 and 100 characters"),
  body("avatarUrl").optional().isURL().withMessage("Valid URL is required for avatar"),
  handleValidationErrors,
];

export const validatePoints = [
  body("points").isInt({ min: 0 }).withMessage("Points must be a positive integer"),
  handleValidationErrors,
];

export const validateGameId = [
  param("gameId").isUUID().withMessage("Valid game ID is required"),
  handleValidationErrors,
];

export const validateStudyMaterialId = [
  param("materialId").isUUID().withMessage("Valid study material ID is required"),
  handleValidationErrors,
];
