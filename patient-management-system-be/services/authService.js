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