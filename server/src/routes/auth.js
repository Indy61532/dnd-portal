const express = require('express');
const router = express.Router();
const supabaseAdmin = require('../supabaseAdmin');

// Poznámka: Login a Registrace by měly primárně probíhat na klientovi.
// Tento soubor ukazuje, jak by to šlo přes backend, ale není to doporučený postup pro SPA.

// POST /auth/login (volitelné)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Chybí email nebo heslo' });
  }

  try {
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    res.json({
      session: data.session,
      user: data.user
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;

