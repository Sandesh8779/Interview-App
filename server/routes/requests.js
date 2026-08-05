import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

const requestSelect = `*, candidate:profiles!requests_candidate_id_fkey(id,full_name,email), interviewer:profiles!requests_interviewer_id_fkey(id,full_name,email)`;

// Candidate: create a request
router.post('/', requireAuth, requireRole('candidate'), async (req, res, next) => {
  try {
    const { job_title, message, interviewer_id } = req.body;
    if (!job_title) return res.status(400).json({ message: 'Job title is required.' });

    const { data, error } = await supabaseAdmin
      .from('requests')
      .insert({ candidate_id: req.profile.id, job_title, message, interviewer_id: interviewer_id || null, status: 'pending' })
      .select(requestSelect)
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (e) { next(e); }
});

// Candidate: get own requests
router.get('/mine', requireAuth, requireRole('candidate'), async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('requests')
      .select(requestSelect)
      .eq('candidate_id', req.profile.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

// Admin: get all requests
router.get('/', requireAuth, requireRole('admin'), async (_req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('requests')
      .select(requestSelect)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

// Admin: approve or reject a request (and optionally assign interviewer)
router.patch('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { status, interviewer_id } = req.body;
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ message: 'Status must be approved or rejected.' });

    const update = { status };
    if (interviewer_id) update.interviewer_id = interviewer_id;

    const { data, error } = await supabaseAdmin
      .from('requests')
      .update(update)
      .eq('id', req.params.id)
      .select(requestSelect)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

// Interviewer: get requests assigned to them (approved)
router.get('/assigned', requireAuth, requireRole('interviewer'), async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('requests')
      .select(requestSelect)
      .eq('interviewer_id', req.profile.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

// Interviewer: get full candidate profile + interview scores for an assigned candidate
router.get('/candidate/:candidateId', requireAuth, requireRole('interviewer'), async (req, res, next) => {
  try {
    // Verify this interviewer has an approved request for this candidate
    const { data: req_, error: reqErr } = await supabaseAdmin
      .from('requests')
      .select('id')
      .eq('interviewer_id', req.profile.id)
      .eq('candidate_id', req.params.candidateId)
      .eq('status', 'approved')
      .maybeSingle();

    // Also allow if they have an interview assigned with this candidate
    const { data: iv } = await supabaseAdmin
      .from('interviews')
      .select('id')
      .eq('interviewer_id', req.profile.id)
      .eq('candidate_id', req.params.candidateId)
      .maybeSingle();

    if (reqErr || (!req_ && !iv)) {
      return res.status(403).json({ message: 'You do not have access to this candidate.' });
    }

    const { data: profile, error: profErr } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, role, created_at')
      .eq('id', req.params.candidateId)
      .single();
    if (profErr) throw profErr;

    // Get their interview data (scores, status)
    const { data: interviews } = await supabaseAdmin
      .from('interviews')
      .select('id, title, status, rating, feedback, mcq_score, mcq_total, coding_submitted, mcq_submitted_at, coding_submitted_at, scheduled_at')
      .eq('candidate_id', req.params.candidateId);

    res.json({ profile, interviews: interviews || [] });
  } catch (e) { next(e); }
});

export default router;
