import { supabase } from "../supabaseClient.js";
import { AppError } from "../utils/app-error.js";

export const getInvoicesByPatient = async (patientId) => {
    const { data, error } = await supabase
        .from('Invoices')
        .select(`*, InvoiceItems (*), Appointments ( appointment_id, Doctors ( doctor_id, Users ( full_name ) ), ClinicServices ( name ) )`)
        .eq('patient_id', patientId)
        .order('issued_at', { ascending: false });

    if (error) throw new AppError(error.message, 500);
    return data;
};

export const getInvoiceById = async (invoiceId) => {
    const { data, error } = await supabase
        .from('Invoices')
        .select(`*, InvoiceItems (*), Appointments ( appointment_id, Doctors ( doctor_id, Users ( full_name ) ), ClinicServices ( name ) )`)
        .eq('invoice_id', invoiceId)
        .single();

    if (error) throw new AppError(error.message, 500);
    return data;
};

export const createInvoice = async (invoiceData) => {
    const { items, ...invoiceFields } = invoiceData;

    const { data: invoice, error: invoiceError } = await supabase
        .from('Invoices')
        .insert([invoiceFields])
        .select()
        .single();

    if (invoiceError) throw new AppError(invoiceError.message, 500);

    if (items && items.length > 0) {
        const itemsWithInvoiceId = items.map(item => ({
            ...item,
            invoice_id: invoice.invoice_id
        }));

        const { error: itemsError } = await supabase
            .from('InvoiceItems')
            .insert(itemsWithInvoiceId);

        if (itemsError) throw new AppError(itemsError.message, 500);
    }

    return await getInvoiceById(invoice.invoice_id);
};

export const updateInvoiceStatus = async (invoiceId, status, paymentMethod) => {
    const updateData = {};
    if (status) updateData.payment_status = status;
    if (paymentMethod) updateData.payment_method = paymentMethod;

    const { data, error } = await supabase
        .from('Invoices')
        .update(updateData)
        .eq('invoice_id', invoiceId)
        .select()
        .single();
};

export const markInvoiceAsPaid = async (invoiceId) => {
    const { data, error } = await supabase
        .from('Invoices')
        .update({ payment_status: 'paid', payment_method: 'transfer' })
        .eq('invoice_id', invoiceId)
        .select()
        .single();

    if (error) throw new AppError(error.message, 500);
    return data;
};
