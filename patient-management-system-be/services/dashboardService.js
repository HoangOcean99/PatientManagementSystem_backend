import { supabase } from '../supabaseClient.js';

export const getAdminStats = async () => {
    try {
        // 1. Total Patients
        const { count: totalPatients } = await supabase
            .from('Users')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'patient');

        // 2. Active Users (Just all users for now)
        const { count: totalUsers } = await supabase
            .from('Users')
            .select('*', { count: 'exact', head: true });

        // 3. Pending Appointments
        const { count: pendingAppointments } = await supabase
            .from('Appointments')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

        // 4. Services Created (Active)
        const { count: totalServices } = await supabase
            .from('ClinicServices')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');

        // 5. Monthly Revenue
        // Get start and end of current month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

        const { data: invoices } = await supabase
            .from('Invoices')
            .select('total_amount, created_at')
            .eq('payment_status', 'paid')
            .gte('created_at', startOfMonth)
            .lte('created_at', endOfMonth);

        const monthlyRevenue = (invoices || []).reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0);

        // 6. Most Popular Service (Mocked initially or fetched realistically if data is large)
        // A simple query fetching appointments' service_id distributions would be complex in Supabase standard REST.
        // Let's just return a placeholder or fetch active services and pick a popular one simply.
        const popularService = "Khám tổng quát"; 

        return {
            totalPatients: totalPatients || 0,
            totalUsers: totalUsers || 0,
            pendingAppointments: pendingAppointments || 0,
            totalServices: totalServices || 0,
            monthlyRevenue: monthlyRevenue,
            popularService: popularService
        };
    } catch (error) {
        throw error;
    }
};
