import { supabaseAdmin, supabaseAuth } from '../supabase.js';

async function ensureProfile(user) {
  const roleFromMetadata = user.user_metadata?.role;
  const allowedRoles = ['admin', 'interviewer', 'candidate'];
  const role = allowedRoles.includes(roleFromMetadata) ? roleFromMetadata : 'candidate';
  const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';

  const { data: existingProfile, error: profileLookupError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (profileLookupError && profileLookupError.code !== 'PGRST116') {
    throw profileLookupError;
  }

  if (existingProfile) {
    return existingProfile;
  }

  const { data: createdProfile, error: insertError } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: user.id,
      full_name: fullName,
      email: user.email,
      role
    })
    .select('*')
    .single();

  if (insertError) {
    if (insertError.code === '23505' || insertError.code === '23503') {
      const { data: retryProfile, error: retryError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (retryError) throw retryError;
      return retryProfile;
    }

    throw insertError;
  }

  return createdProfile;
}

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Missing authorization token.' });
    }

    const { data, error } = await supabaseAuth.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({ message: 'Invalid or expired session.' });
    }

    const profile = await ensureProfile(data.user);

    req.user = data.user;
    req.profile = profile;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.profile?.role)) {
      return res.status(403).json({ message: 'You do not have permission for this action.' });
    }

    next();
  };
}
