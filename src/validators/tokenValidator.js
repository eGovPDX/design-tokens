const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const fs = require('fs');
const path = require('path');

class TokenValidator {
  constructor() {
    this.ajv = new Ajv({ allErrors: true });
    addFormats(this.ajv);
    this.schema = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../schemas/design-tokens.schema.json'), 'utf8')
    );
  }

  validate(tokens) {
    const validate = this.ajv.compile(this.schema);
    const valid = validate(tokens);
    
    if (!valid) {
      const errors = validate.errors.map(error => ({
        path: error.instancePath,
        message: error.message,
        params: error.params
      }));
      throw new Error(`Token validation failed: ${JSON.stringify(errors, null, 2)}`);
    }

    return true;
  }

  validateFile(filePath) {
    try {
      const tokens = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return this.validate(tokens);
    } catch (error) {
      throw new Error(`Failed to validate file: ${error.message}`);
    }
  }
}

module.exports = TokenValidator; 