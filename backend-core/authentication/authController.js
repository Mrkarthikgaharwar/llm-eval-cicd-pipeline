import { supabase } from '../config/config.js';

// Signup Controller
export async function signup(req, res) {
  try {
    const { username, email, password } = req.body;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } }
    });

    if (error) throw error;
    return res.status(200).json({ success: true, message: 'Signup successful!', user: data.user });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

// Login Controller
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) throw error;
    return res.status(200).json({ success: true, message: 'Login successful!', session: data.session, user: data.user });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

// Forgot Password Controller
export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required.' });
    }

    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;

    return res.status(200).json({ success: true, message: 'Password reset link sent to your email.' });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
}