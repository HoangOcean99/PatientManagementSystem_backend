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

  // Lấy thông tin user từ database để có role và user_id
  const { data: userData, error: userError } = await supabase
    .from('Users')
    .select('user_id, role')
    .eq('user_id', data.user.id)
    .single();

  if (userError || !userData) {
    return res.status(401).json({ message: 'User not found in database' });
  }

  // Enrich req.user với thông tin từ database
  req.user = {
    ...data.user,
    user_id: userData.user_id,
    role: userData.role
  };
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
