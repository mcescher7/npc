// Zentrale Supabase-Instanz – wird von allen anderen JS-Dateien genutzt
const SUPABASE_URL = "https://hcjinenoxuulhcoadmgh.supabase.co";
const SUPABASE_KEY = "sb_publishable_BGv-lH87VHMk9fO33rZ-fw_yPBh5OSX";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
