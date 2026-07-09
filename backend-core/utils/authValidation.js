/**
 * Utility ruleset to enforce strict enterprise input validation parameters
 */

// Strict regex patterns
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/; // 3-20 chars, alphanumeric and underscore

export const validateRegistrationInput = (email, password, username) => {
  if (!email || !password || !username) {
    return { isValid: false, message: "All registration input fields are required parameters." };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { isValid: false, message: "Provided email address format is structurally invalid." };
  }

  if (!USERNAME_REGEX.test(username)) {
    return { isValid: false, message: "Username must be 3-20 characters long and contain only alphanumeric characters or underscores." };
  }

  // Enterprise Password rules: Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character
  if (password.length < 8) {
    return { isValid: false, message: "Password length must be at least 8 characters long." };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one uppercase letter." };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one lowercase letter." };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one numerical digit." };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one special character symbol." };
  }

  return { isValid: true };
};

export const validateLoginInput = (email, password) => {
  if (!email || !password) {
    return { isValid: false, message: "Email and password parameters are required." };
  }
  if (!EMAIL_REGEX.test(email)) {
    return { isValid: false, message: "Provided email address structure is invalid." };
  }
  return { isValid: true };
};
// Compatibility wrappers to match older test file execution properties with password matching rules
export const validateSignUpData = (username, email, password, confirmPassword) => {
  // If confirmPassword parameter is explicitly passed and does not match the baseline password, fail early
  if (confirmPassword !== undefined && password !== confirmPassword) {
    return { isValid: false, message: "Passwords do not match." };
  }
  return validateRegistrationInput(email, password, username);
};