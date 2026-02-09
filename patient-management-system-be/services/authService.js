import { supabase } from "../supabaseClient.js"

// functions handle logic
function fakeEmail(username) {
    return `${username}@app.com`;
}

// Function link to database
export const registerLocal = async (username, password) => {
    const email = fakeEmail(username);
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });
    if (error) throw error;
    await supabase.from('Users').insert({
        user_id: data.user.id,
        username,
        role: 'patient',
        is_minor: true
    });
    return data;
}

export const loginLocal = async (username, password) => {
    const email = fakeEmail(username);
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) throw error;
    return data;
}

export const syncUserGoogle = async (user) => {
  await supabase.from('Users').upsert({
    user_id: user.id,
    email: user.email,
    role: 'patient',
    is_minor: false
  });

  return {
    id: user.id,
    username
  };
};
