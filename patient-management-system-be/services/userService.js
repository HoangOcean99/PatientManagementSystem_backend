import { supabase } from '../supabaseClient.js';
import { AppError } from '../utils/app-error.js';

export const createUser = async (user) => {
  const { data, error } = await supabase.from('Users').insert(user).select().single();
  if (error) throw new AppError(error.message, 500);
  return data;
}

export const updateUser = async (userId, user) => {
  const { data, error } = await supabase.from('Users').update(user).eq('user_id', userId).select().single();
  if (error) throw new AppError(error.message, 500);
  return data;      
}     

export const getListUsers = async () => {
  const { data, error } = await supabase.from('Users').select('*');
  if (error) throw new AppError(error.message, 500);
  return data;
}

export const getUserById = async (userId) => {
  const { data, error } = await supabase.from('Users').select('*').eq('user_id', userId).single();
  if (error) throw new AppError(error.message, 500);
  return data;
}

export const deleteUser = async (userId) => {
  const { error } = await supabase.from('Users').delete().eq('user_id', userId);
  if (error) throw new AppError(error.message, 500);
  return data;
}
    