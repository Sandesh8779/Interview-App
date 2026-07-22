import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/me', requireAuth, async (req, res) => {
  res.json(req.profile);
});

router.get('/', requireAuth, requireRole('admin'), async (_req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, role, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/role', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['admin', 'interviewer', 'candidate'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ role })
      .eq('id', req.params.id)
      .select('id, full_name, email, role')
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;
