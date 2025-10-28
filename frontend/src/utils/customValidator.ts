import { customizeValidator } from '@rjsf/validator-ajv8';

// Custom validator that suppresses warnings about unknown formats like "textarea"
// The "textarea" format is used as a UI hint for rendering, not for validation
export const customValidator = customizeValidator({
  customFormats: {
    // Accept any string for textarea format (always returns true)
    textarea: () => true,
  },
});

export default customValidator;
