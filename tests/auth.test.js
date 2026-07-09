import { validateSignUpData } from '../backend-core/utils/authValidation.js';

describe('Authentication Engine Validation Tests', () => {
    
    // Test 1: Kya hamara system weak password ko reject karta hai?
    test('Should reject invalid or weak passwords', () => {
        const res = validateSignUpData("kartik", "kartik@test.com", "12345", "12345");
        expect(res.isValid).toBe(false);
    });

    // Test 2: Password aur Confirm Password mismatch hone par error aana chahiye
    test('Should reject password and confirm password mismatch', () => {
        const res = validateSignUpData("kartik", "kartik@test.com", "SecurePass123!", "DifferentPass123!");
        expect(res.isValid).toBe(false);
    });

    // Test 3: Sahi credentials daalne par validation true hona chahiye
    test('Should accept complex credentials matching criteria', () => {
        const res = validateSignUpData("kartik_singh", "kartik@test.com", "StrongPassword123!", "StrongPassword123!");
        expect(res.isValid).toBe(true);
    });
});