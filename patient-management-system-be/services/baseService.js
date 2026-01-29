import { supabase } from "../supabaseClient.js"
import { AppError } from "../utils/app-error.js";

export const testBase = async () => {
    const {data, error} = await supabase.from('Users').select('*');
    if(error) throw new AppError(error.message, 500);
    return data;
}