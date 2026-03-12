import "dotenv/config";
import { supabase } from "./supabaseClient.js";

async function run() {
    const { data } = await supabase.from('Users').select('user_id').limit(1);
    console.log("FOUND_USER", data[0].user_id);
}
run();
