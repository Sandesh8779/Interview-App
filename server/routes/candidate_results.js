import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { candidate_id } = req.query;

    let query = supabaseAdmin.from('candidate_results').select('*').order('created_at', { ascending: false });

    if (req.profile.role === 'candidate') {
      query = query.eq('candidate_id', req.profile.id);
    } else if (candidate_id) {
      query = query.eq('candidate_id', candidate_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, requireRole('admin', 'interviewer'), async (req, res, next) => {
  try {
    const { candidate_id, interview_id, content } = req.body;
    if (!candidate_id || !content) return res.status(400).json({ message: 'candidate_id and content are required.' });

    const { data, error } = await supabaseAdmin
      .from('candidate_results')
      .insert({ candidate_id, interview_id: interview_id || null, content })
      .select('*')
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.from('candidate_results').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    if (req.profile.role === 'candidate' && data.candidate_id !== req.profile.id) {
      return res.status(403).json({ message: 'Not your result.' });
    }
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.from('candidate_results').delete().eq('id', req.params.id).select('*').single();
    if (error) throw error;
    res.json({ ok: true, deleted: data });
  } catch (error) {
    next(error);
  }
});

export default router;
