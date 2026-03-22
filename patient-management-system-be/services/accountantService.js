import { supabase } from "../supabaseClient.js";
import { AppError } from "../utils/app-error.js";

// Lấy danh sách cần thu cọc
export const getPendingDeposits = async () => {
    const { data, error } = await supabase
        .from('Appointments')
        .select(`
            *,
            Patients (
                Users ( full_name, phone_number, email )
            ),
            Doctors (
                Users ( full_name )
            ),
            ClinicServices ( name )
        `)
        .gt('deposit_required', 0)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false });

    if (error) throw new AppError(error.message, 500);

    const pendingDeposits = data.filter(appt => (appt.deposit_paid || 0) < appt.deposit_required);
    return pendingDeposits;
};

// Lấy danh sách hóa đơn chưa thanh toán
export const getPendingInvoices = async () => {
    const { data, error } = await supabase
        .from('Invoices')
        .select(`
            *,
            Patients (
                Users ( full_name, phone_number, email )
            ),
            Appointments (
                deposit_paid,
                Doctors ( Users ( full_name ) ),
                ClinicServices ( name )
            ),
            InvoiceItems (*)
        `)
        .eq('payment_status', 'unpaid')
        .order('issued_at', { ascending: false });

    if (error) throw new AppError(error.message, 500);
    return data;
};

// Xác nhận thu cọc
export const confirmDeposit = async (appointmentId, amount) => {
    const { data: appt, error: apptError } = await supabase
        .from('Appointments')
        .select('deposit_paid, deposit_required, status')
        .eq('appointment_id', appointmentId)
        .single();

    if (apptError) throw new AppError(apptError.message, 404);

    const amountToPay = amount ? Number(amount) : (Number(appt.deposit_required) - Number(appt.deposit_paid || 0));
    const newPaid = Number(appt.deposit_paid || 0) + amountToPay;

    const updatePayload = { deposit_paid: newPaid };
    if (newPaid >= appt.deposit_required && appt.status === 'pending') {
        updatePayload.status = 'confirmed';
    }

    const { data, error } = await supabase
        .from('Appointments')
        .update(updatePayload)
        .eq('appointment_id', appointmentId)
        .select()
        .single();

    if (error) throw new AppError(error.message, 500);
    return data;
};

// Xác nhận thanh toán tổng bill
export const payInvoice = async (invoiceId, paymentMethod) => {
    const method = paymentMethod || 'cash';
    const { data, error } = await supabase
        .from('Invoices')
        .update({
            payment_status: 'paid',
            paid_at: new Date().toISOString(),
            payment_method: method
        })
        .eq('invoice_id', invoiceId)
        .select(`
            *,
            Patients ( Users ( full_name ) )
        `)
        .single();

    if (error) throw new AppError(error.message, 500);
    return data;
};

// Lấy dữ liệu Dashboard kế toán
export const getDashboardData = async () => {
    const today = new Date().toISOString().split('T')[0];

    const { data: invoicesToday } = await supabase
        .from('Invoices')
        .select('total_amount, deposit_paid:Appointments(deposit_paid)')
        .eq('payment_status', 'paid')
        .gte('paid_at', today + 'T00:00:00.000Z');

    const { count: unpaidCount } = await supabase
        .from('Invoices')
        .select('*', { count: 'exact', head: true })
        .eq('payment_status', 'unpaid');

    const { data: depositsToday } = await supabase
        .from('Appointments')
        .select('deposit_paid')
        .gt('deposit_paid', 0)
        .gte('created_at', today + 'T00:00:00.000Z');

    let totalRevenue = 0;
    if (invoicesToday) {
        invoicesToday.forEach(inv => {
            const deposit = inv.deposit_paid?.deposit_paid || 0;
            totalRevenue += (Number(inv.total_amount) - Number(deposit));
        });
    }

    let totalDeposits = 0;
    if (depositsToday) {
        depositsToday.forEach(appt => {
            totalDeposits += Number(appt.deposit_paid);
        });
    }

    const { data: recentInvoices } = await supabase
        .from('Invoices')
        .select(`
            invoice_id,
            total_amount,
            payment_status,
            issued_at,
            Patients ( Users ( full_name ) )
        `)
        .order('issued_at', { ascending: false })
        .limit(5);

    const { data: recentAppointments } = await supabase
        .from('Appointments')
        .select(`
            appointment_id,
            deposit_paid,
            status,
            created_at,
            Patients ( Users ( full_name ) )
        `)
        .gt('deposit_paid', 0)
        .order('created_at', { ascending: false })
        .limit(5);

    let transactions = [];
    if (recentInvoices) {
        transactions = transactions.concat(recentInvoices.map(inv => ({
            id: inv.invoice_id,
            patient: inv.Patients?.Users?.full_name || 'N/A',
            type: 'invoice',
            amount: inv.total_amount,
            date: new Date(inv.issued_at).toLocaleDateString('vi-VN'),
            status: inv.payment_status === 'paid' ? 'paid' : 'unpaid',
            rawDate: new Date(inv.issued_at).getTime()
        })));
    }
    if (recentAppointments) {
        transactions = transactions.concat(recentAppointments.map(appt => ({
            id: appt.appointment_id,
            patient: appt.Patients?.Users?.full_name || 'N/A',
            type: 'deposit',
            amount: appt.deposit_paid,
            date: new Date(appt.created_at).toLocaleDateString('vi-VN'),
            status: 'confirmed',
            rawDate: new Date(appt.created_at).getTime()
        })));
    }

    transactions.sort((a, b) => b.rawDate - a.rawDate);
    const recentTransactions = transactions.slice(0, 6);

    return {
        stats: {
            totalRevenue: totalRevenue + totalDeposits,
            totalDeposits,
            unpaidInvoices: unpaidCount || 0,
            pendingTransfers: 0,
        },
        recentTransactions
    };
};

export const searchAppointmentsForDeposit = async (query) => {
    let queryBuilder = supabase
        .from('Appointments')
        .select(`
            appointment_id,
            deposit_required,
            deposit_paid,
            created_at,
            Patients (
                patient_id,
                Users ( full_name, phone_number )
            ),
            ClinicServices ( name )
        `)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false });

    if (query) {
        queryBuilder = queryBuilder.or(`patient_id.ilike.%${query}%,appointment_id.ilike.%${query}%`);
    } else {
        queryBuilder = queryBuilder.limit(20);
    }

    const { data, error } = await queryBuilder;

    if (error) throw new AppError(error.message, 500);

    const pending = data.filter(a => Number(a.deposit_paid || 0) < Number(a.deposit_required));

    return pending.map(a => ({
        id: a.appointment_id,
        patient_name: a.Patients?.Users?.full_name || 'N/A',
        patient_code: a.Patients?.patient_id?.substring(0, 8).toUpperCase(),
        phone: a.Patients?.Users?.phone_number || '',
        service_name: a.ClinicServices?.name || 'Khám bệnh',
        amount: Number(a.deposit_required) - Number(a.deposit_paid || 0),
        date: new Date(a.created_at).toLocaleDateString('vi-VN')
    }));
};
