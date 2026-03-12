import { supabase } from "../supabaseClient.js";

// checking token function và security of api 
export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing token' });
  }

  const token = authHeader.split(' ')[1];

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(401).json({ message: 'Invalid token' });
  }
  req.user = data.user;
  next();
};

export const requireRole = (roles = []) => {
  return async (req, res, next) => {
    const { data } = await supabase
      .from('Users')
      .select('role')
      .eq('user_id', req.user.id)
      .single();

    if (!roles.includes(data.role)) {
      return res.status(403).json({ message: 'No permission' });
    }

    next();
  };
};