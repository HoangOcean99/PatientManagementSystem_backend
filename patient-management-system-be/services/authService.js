import { supabase } from "../supabaseClient.js"
import { AppError } from "../utils/app-error.js";
import { sendOtp, verifyOtp } from "./gmailService.js";

// functions handle logic
function fakeEmail(username) {
    return `${username}@app.com`;
}

// Function link to database
export const requestRegister = async (username, emailParent) => {
    const { data: dataUsername } = await supabase
        .from('Users')
        .select('user_id')
        .eq('username', username)
        .maybeSingle();

    if (dataUsername) {
        throw new AppError("Username existed", 409);
    }
    const { data: parent } = await supabase
        .from('Users')
        .select('user_id')
        .eq('email', emailParent)
        .maybeSingle();

    if (!parent) {
        throw new AppError("Parent email does not exist", 404);
    }

    await sendOtp(emailParent);

    return {
        message: "OTP sent",
        idParent: parent.user_id
    };
};


export const verifyAndCreateUser = async (
    username,
    password,
    emailParent,
    relationship,
    idParent,
    otp
) => {
    await verifyOtp(emailParent, otp);

    const email = fakeEmail(username);

    const { data: dataSignUp, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) throw error;

    const { data: dataRpc, error: errorRpc } = await supabase.rpc('create_minor_user', {
        p_user_id: dataSignUp.user.id,
        p_username: username,
        p_parent_id: idParent,
        p_relationship: relationship
    });

    if (errorRpc) {
        await supabase.auth.admin.deleteUser(dataSignUp.user.id);
        throw new AppError(errorRpc.message, 500);
    }
    const { data: role, error: errorRole } = await supabase
        .from('Users')
        .select('role')
        .eq('user_id', dataSignUp.user.id)
        .single();

    if (errorRole) {
        throw errorRole;
    }

    return {
        success: true,
        id: dataSignUp.user.id,
        role: role.role
    };
};


export const loginLocal = async (username, password) => {
    const email = fakeEmail(username);
    const { data: dataLogin, error: errorLogin } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (errorLogin) throw errorLogin;

    const { data, error } = await supabase
        .from('Users')
        .select('user_id, role')
        .eq('user_id', dataLogin.user.id)
        .single();

    if (error) {
        throw error;
    }
    return data;
}

export const syncUserGoogle = async (user) => {
    const { error: upsertError } = await supabase
        .from('Users')
        .upsert({
            user_id: user.id,
            email: user.email,
            is_minor: false
        });

    if (upsertError) {
        throw upsertError;
    }
    const { data, error } = await supabase
        .from('Users')
        .select('role')
        .eq('user_id', user.id)
        .single();

    if (error) {
        throw error;
    }

    return {
        id: user.id,
        role: data.role
    };
};

