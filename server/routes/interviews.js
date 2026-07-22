import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

const interviewSelect = `
  *,
  candidate:profiles!interviews_candidate_id_fkey(id, full_name, email),
  interviewer:profiles!interviews_interviewer_id_fkey(id, full_name, email),
  questions(*),
  submissions(*)
`;

router.get('/', requireAuth, async (req, res, next) => {
  try {
    let query = supabaseAdmin.from('interviews').select(interviewSelect).order('scheduled_at', { ascending: true });

    if (req.profile.role === 'candidate') {
      query = query.eq('candidate_id', req.profile.id);
    }

    if (req.profile.role === 'interviewer') {
      query = query.eq('interviewer_id', req.profile.id);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { title, description, candidate_id, interviewer_id, scheduled_at, duration_minutes } = req.body;

    if (!title || !candidate_id || !interviewer_id || !scheduled_at) {
      return res.status(400).json({ message: 'Title, candidate, interviewer, and schedule are required.' });
    }

    const { data, error } = await supabaseAdmin
      .from('interviews')
      .insert({
        title,
        description,
        candidate_id,
        interviewer_id,
        scheduled_at,
        duration_minutes: duration_minutes || 45,
        status: 'scheduled'
      })
      .select(interviewSelect)
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', requireAuth, requireRole('admin', 'interviewer'), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['scheduled', 'in_progress', 'submitted', 'reviewed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid interview status.' });
    }

    const { data: interview, error: fetchError } = await supabaseAdmin
      .from('interviews')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError) throw fetchError;
    if (req.profile.role === 'interviewer' && interview.interviewer_id !== req.profile.id) {
      return res.status(403).json({ message: 'This interview is not assigned to you.' });
    }

    const { data, error } = await supabaseAdmin
      .from('interviews')
      .update({ status })
      .eq('id', req.params.id)
      .select(interviewSelect)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/questions', requireAuth, requireRole('admin', 'interviewer'), async (req, res, next) => {
  try {
    const { prompt, type, position } = req.body;
    if (!prompt) {
      return res.status(400).json({ message: 'Question prompt is required.' });
    }

    const { data: interview, error: fetchError } = await supabaseAdmin
      .from('interviews')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError) throw fetchError;
    if (req.profile.role === 'interviewer' && interview.interviewer_id !== req.profile.id) {
      return res.status(403).json({ message: 'This interview is not assigned to you.' });
    }

    const { data, error } = await supabaseAdmin
      .from('questions')
      .insert({
        interview_id: req.params.id,
        prompt,
        type: type || 'text',
        position: position || 1
      })
      .select('*')
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/submissions', requireAuth, requireRole('candidate'), async (req, res, next) => {
  try {
    const { answers } = req.body;
    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ message: 'At least one answer is required.' });
    }

    const { data: interview, error: fetchError } = await supabaseAdmin
      .from('interviews')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError) throw fetchError;
    if (interview.candidate_id !== req.profile.id) {
      return res.status(403).json({ message: 'This interview is not assigned to you.' });
    }

    const rows = answers.map((answer) => ({
      interview_id: req.params.id,
      question_id: answer.question_id,
      candidate_id: req.profile.id,
      answer: answer.answer
    }));

    const { data, error } = await supabaseAdmin.from('submissions').insert(rows).select('*');
    if (error) throw error;

    await supabaseAdmin.from('interviews').update({ status: 'submitted' }).eq('id', req.params.id);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/review', requireAuth, requireRole('interviewer'), async (req, res, next) => {
  try {
    const { rating, feedback } = req.body;
    const score = Number(rating);

    if (!score || score < 1 || score > 10) {
      return res.status(400).json({ message: 'Rating must be between 1 and 10.' });
    }

    const { data: interview, error: fetchError } = await supabaseAdmin
      .from('interviews')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError) throw fetchError;
    if (interview.interviewer_id !== req.profile.id) {
      return res.status(403).json({ message: 'This interview is not assigned to you.' });
    }

    const { data, error } = await supabaseAdmin
      .from('interviews')
      .update({ rating: score, feedback, status: 'reviewed' })
      .eq('id', req.params.id)
      .select(interviewSelect)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;
