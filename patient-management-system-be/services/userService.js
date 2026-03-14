import { supabase } from "../supabaseClient.js";
import { AppError } from "../utils/app-error.js";

export const getAllUsers = async () => {
  const { data, error } = await supabase.from("Users").select("*");
  if (error) throw new AppError(error.message, 500);
  return data;
};

export const getUserById = async (userId) => {
  console.log("Looking for user_id =", userId);

  const { data, error } = await supabase
    .from("Users")
    .select("*")
    .eq("user_id", userId)
    .single();

  console.log("Supabase error:", error);

  if (error) throw new AppError(error.message, 404);
  return data;
};

export const createUser = async (userData) => {
  const { data, error } = await supabase
    .from("Users")
    .insert(userData)
    .select()
    .single();

  if (error) throw new AppError(error.message, 400);
  return data;
};

export const deleteUser = async (userId) => {
  const { data, error } = await supabase
    .from("Users")
    .delete()
    .eq("user_id", userId)
    .select()
    .single();
    
  if (error) throw new AppError(error.message, 400);
  return data;
};
