import { supabase } from "../supabaseClient.js";
import { AppError } from "../utils/app-error.js";

export const getAllUsers = async () => {
  const { data, error } = await supabase.from("Users").select("*");
  if (error) throw new AppError(error.message, 500);
  return data;
};

export const getUserById = async (userId) => {
  const { data, error } = await supabase
    .from("Users")
    .select("*")
    .eq("user_id", userId)
    .single();

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

export const updateUserProfile = async (userData, avatarFile = null) => {
  try {
    let avatarUrl = userData.avatar_url;

    if (avatarFile) {
      const fileExt = avatarFile.originalname.split(".").pop();
      const fileName = `${userData.user_id}_${Date.now()}.${fileExt}`;
      const filePath = `avatar/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatar")
        .upload(filePath, avatarFile.buffer, {
          contentType: avatarFile.mimetype,
          cacheControl: "3600",
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("avatar")
        .getPublicUrl(filePath);

      avatarUrl = data.publicUrl;
    }

    const { error } = await supabase
      .from("Users")
      .update({
        full_name: userData.full_name,
        phone_number: userData.phone_number,
        gender: userData.gender,
        dob: userData.dob,
        address: userData.address,
        avatar_url: avatarUrl
      })
      .eq("user_id", userData.user_id);

    if (error) throw error;

    return avatarUrl;

  } catch (err) {
    console.error("Update user error:", err);
    throw err;
  }
};


export const updateAvatar = async (userData, avatarFile = null) => {
  try {
    console.log('userData', userData)
    let avatarUrl = userData.avatar_url;

    if (avatarFile) {
      const fileExt = avatarFile.originalname.split(".").pop();
      const fileName = `${userData.user_id}_${Date.now()}.${fileExt}`;
      const filePath = `avatar/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatar")
        .upload(filePath, avatarFile.buffer, {
          contentType: avatarFile.mimetype,
          cacheControl: "3600",
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("avatar")
        .getPublicUrl(filePath);

      avatarUrl = data.publicUrl;

      const { error } = await supabase
        .from("Users")
        .update({
          avatar_url: avatarUrl
        })
        .eq("user_id", userData.user_id);

      if (error) throw error;

      return avatarUrl;
    }
  } catch (err) {
    console.error("Update user error:", err);
    throw err;
  }
}
