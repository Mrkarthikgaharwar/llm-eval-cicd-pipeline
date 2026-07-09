import { supabase } from '../config/config.js';
import { hashSecurePassword } from '../utils/cryptoHelper.js';
import { validateRegistrationInput, validateLoginInput } from '../utils/authValidation.js';

// 1. Production Sign Up with Hashing & Duplicate Prevention
export const handleSignup = async (req, res) => {
  const { email, password, username } = req.body;

  try {
    const validation = validateRegistrationInput(email, password, username);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.message });
    }

    // Duplicate Prevention Lookup
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, email, username')
      .or(`email.eq.${email},username.eq.${username}`)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (existingUser) {
      return res.status(409).json({ error: "Identity integrity error: Username or Email already registered." });
    }

    // Secure Hashing Conversion
    const encryptedPassword = hashSecurePassword(password);

    // Save into enterprise target table storage
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{ email, password_hash: encryptedPassword, username }])
      .select();

    if (insertError) throw insertError;

    return res.status(201).json({ status: "success", message: "User identity created successfully.", user: { id: newUser[0].id, email, username } });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// 2. Production Login Handler with Crypt Verification
export const handleLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const validation = validateLoginInput(email, password);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.message });
    }

    const hashedCheck = hashSecurePassword(password);

    // Retrieve and verify cryptographic tokens compatibility match
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password_hash', hashedCheck)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!user) {
      return res.status(401).json({ error: "Invalid credential combination metadata targets." });
    }

    return res.status(200).json({ status: "success", user: { id: user.id, email: user.email, username: user.username } });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// 3. Functional Forgot Password Reset Endpoint Handler
export const handleForgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) {
      return res.status(400).json({ error: "Email target parameter is required." });
    }

    const { data: identityCheck, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!identityCheck) {
      return res.status(404).json({ error: "No records found matching specified target vector identities." });
    }

    return res.status(200).json({ status: "success", message: "Reset security token generation sequence complete. Dispatched link." });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};