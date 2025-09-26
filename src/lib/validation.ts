import DOMPurify from 'isomorphic-dompurify';
import logger from './logger';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
  sanitize?: boolean;
}

interface ValidationSchema {
  [key: string]: ValidationRule;
}

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  sanitizedData: Record<string, any>;
}

class ValidationService {
  private sanitizeHtml(input: string): string {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [], // No HTML tags allowed by default
      ALLOWED_ATTR: [],
    });
  }

  private sanitizeText(input: string): string {
    return input
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .replace(/[<>\"'&]/g, ''); // Remove potentially dangerous characters
  }

  private sanitizeEmail(input: string): string {
    return input.toLowerCase().trim();
  }

  private sanitizeUrl(input: string): string {
    try {
      const url = new URL(input);
      // Only allow http/https protocols
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Invalid URL protocol');
      }
      return url.toString();
    } catch {
      throw new Error('Invalid URL format');
    }
  }

  private validateRequired(value: any, fieldName: string): string | null {
    if (value === undefined || value === null || value === '') {
      return `${fieldName} is required`;
    }
    return null;
  }

  private validateMinLength(value: string, minLength: number, fieldName: string): string | null {
    if (value.length < minLength) {
      return `${fieldName} must be at least ${minLength} characters long`;
    }
    return null;
  }

  private validateMaxLength(value: string, maxLength: number, fieldName: string): string | null {
    if (value.length > maxLength) {
      return `${fieldName} must be no more than ${maxLength} characters long`;
    }
    return null;
  }

  private validatePattern(value: string, pattern: RegExp, fieldName: string): string | null {
    if (!pattern.test(value)) {
      return `${fieldName} format is invalid`;
    }
    return null;
  }

  private validateCustom(value: any, customValidator: (value: any) => boolean | string, fieldName: string): string | null {
    const result = customValidator(value);
    if (result === false) {
      return `${fieldName} is invalid`;
    }
    if (typeof result === 'string') {
      return result;
    }
    return null;
  }

  validate(data: Record<string, any>, schema: ValidationSchema): ValidationResult {
    const errors: Record<string, string> = {};
    const sanitizedData: Record<string, any> = {};

    for (const [fieldName, rules] of Object.entries(schema)) {
      const value = data[fieldName];
      let sanitizedValue = value;

      // Sanitize if requested
      if (rules.sanitize !== false) {
        if (typeof value === 'string') {
          // Apply appropriate sanitization based on field name or type
          if (fieldName.toLowerCase().includes('email')) {
            sanitizedValue = this.sanitizeEmail(value);
          } else if (fieldName.toLowerCase().includes('url') || fieldName.toLowerCase().includes('link')) {
            try {
              sanitizedValue = this.sanitizeUrl(value);
            } catch (error) {
              errors[fieldName] = error instanceof Error ? error.message : 'Invalid URL';
              continue;
            }
          } else if (fieldName.toLowerCase().includes('html') || fieldName.toLowerCase().includes('content')) {
            sanitizedValue = this.sanitizeHtml(value);
          } else {
            sanitizedValue = this.sanitizeText(value);
          }
        }
      }

      sanitizedData[fieldName] = sanitizedValue;

      // Validate required
      if (rules.required) {
        const requiredError = this.validateRequired(sanitizedValue, fieldName);
        if (requiredError) {
          errors[fieldName] = requiredError;
          continue;
        }
      }

      // Skip other validations if value is empty and not required
      if ((sanitizedValue === undefined || sanitizedValue === null || sanitizedValue === '') && !rules.required) {
        continue;
      }

      // Validate string length
      if (typeof sanitizedValue === 'string') {
        if (rules.minLength) {
          const minLengthError = this.validateMinLength(sanitizedValue, rules.minLength, fieldName);
          if (minLengthError) {
            errors[fieldName] = minLengthError;
            continue;
          }
        }

        if (rules.maxLength) {
          const maxLengthError = this.validateMaxLength(sanitizedValue, rules.maxLength, fieldName);
          if (maxLengthError) {
            errors[fieldName] = maxLengthError;
            continue;
          }
        }

        if (rules.pattern) {
          const patternError = this.validatePattern(sanitizedValue, rules.pattern, fieldName);
          if (patternError) {
            errors[fieldName] = patternError;
            continue;
          }
        }
      }

      // Custom validation
      if (rules.custom) {
        const customError = this.validateCustom(sanitizedValue, rules.custom, fieldName);
        if (customError) {
          errors[fieldName] = customError;
          continue;
        }
      }
    }

    const isValid = Object.keys(errors).length === 0;

    // Log validation failures for security monitoring
    if (!isValid) {
      logger.logSecurity('Input validation failed', {
        errors,
        originalData: data,
        sanitizedData,
      });
    }

    return {
      isValid,
      errors,
      sanitizedData,
    };
  }

  // Pre-defined validation schemas
  static getUserRegistrationSchema() {
    return {
      email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        sanitize: true,
        maxLength: 255,
      },
      password: {
        required: true,
        minLength: 8,
        maxLength: 128,
        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        sanitize: false, // Don't sanitize passwords
      },
      name: {
        required: true,
        minLength: 2,
        maxLength: 50,
        pattern: /^[a-zA-Z\s'-]+$/,
        sanitize: true,
      },
      username: {
        required: true,
        minLength: 3,
        maxLength: 30,
        pattern: /^[a-zA-Z0-9_-]+$/,
        sanitize: true,
      },
    };
  }

  static getUserLoginSchema() {
    return {
      email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        sanitize: true,
        maxLength: 255,
      },
      password: {
        required: true,
        minLength: 1, // Allow any password length for login
        sanitize: false,
      },
    };
  }

  static getMovieSearchSchema() {
    return {
      query: {
        required: true,
        minLength: 1,
        maxLength: 100,
        sanitize: true,
      },
      year: {
        required: false,
        pattern: /^\d{4}$/,
        sanitize: true,
      },
      page: {
        required: false,
        pattern: /^\d+$/,
        sanitize: true,
        custom: (value: string) => {
          const num = parseInt(value, 10);
          return num >= 1 && num <= 1000;
        },
      },
    };
  }

  static getWatchlistUpdateSchema() {
    return {
      movieId: {
        required: true,
        pattern: /^\d+$/,
        sanitize: true,
        custom: (value: string) => {
          const num = parseInt(value, 10);
          return num > 0;
        },
      },
      priority: {
        required: false,
        pattern: /^[1-5]$/,
        sanitize: true,
      },
      notes: {
        required: false,
        maxLength: 500,
        sanitize: true,
      },
    };
  }

  static getCommentSchema() {
    return {
      content: {
        required: true,
        minLength: 1,
        maxLength: 1000,
        sanitize: true,
      },
      rating: {
        required: false,
        pattern: /^[1-5]$/,
        sanitize: true,
      },
    };
  }

  static getApiKeySchema() {
    return {
      apiKey: {
        required: true,
        minLength: 20,
        maxLength: 100,
        pattern: /^[A-Za-z0-9_-]+$/,
        sanitize: true,
      },
    };
  }

  // Utility methods for common validations
  isValidEmail(email: string): boolean {
    const result = this.validate({ email }, {
      email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        sanitize: true,
      },
    });
    return result.isValid;
  }

  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return ['http:', 'https:'].includes(new URL(url).protocol);
    } catch {
      return false;
    }
  }

  sanitizeInput(input: string, type: 'text' | 'html' | 'email' | 'url' = 'text'): string {
    switch (type) {
      case 'email':
        return this.sanitizeEmail(input);
      case 'url':
        return this.sanitizeUrl(input);
      case 'html':
        return this.sanitizeHtml(input);
      default:
        return this.sanitizeText(input);
    }
  }
}

// Create singleton instance
const validationService = new ValidationService();

// Export singleton and class for testing
export { ValidationService };
export default validationService;