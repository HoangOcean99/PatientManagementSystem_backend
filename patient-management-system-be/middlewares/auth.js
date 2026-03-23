import { supabase } from "../supabaseClient.js";

// checking token function và security of api 
export const requireAuth = async (req, res, next) => {
  // Tránh việc check token 2 lần nếu route con lỡ gọi đè thêm requireAuth
  if (req.user) return next();

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
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Unauthorized: Missing user context' });
      }

      const { data, error } = await supabase
        .from('Users')
        .select('role')
        .eq('user_id', req.user.id)
        .single();

      if (error || !data) {
        return res.status(401).json({ message: 'User not found or database error' });
      }

      if (!roles.includes(data.role)) {
        return res.status(403).json({ message: 'No permission' });
      }

      next();
    } catch (err) {
      console.error("requireRole middleware error:", err);
      return res.status(500).json({ message: 'Internal server error in role verification' });
    }
  };
};


export const checkDependentAccess = async (parentId, childId) => {
  if (parentId === childId) return true;

  const { data, error } = await supabase
    .from('FamilyRelationships')
    .select('relationship_id')
    .eq('parent_user_id', parentId)
    .eq('child_user_id', childId)
    .single();

  if (error || !data) return false;
  return true;
};