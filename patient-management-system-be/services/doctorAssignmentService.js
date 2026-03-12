import { supabase } from "../supabaseClient.js";
import { AppError } from "../utils/app-error.js";

export const getPatientsUnderCare = async (doctorId, { status, careType, keyword, page = 1, pageSize = 10 } = {}) => {
    let query = supabase
        .from("DoctorPatientAssignments")
        .select(`
      assignment_id,
      doctor_id,
      patient_id,
      assigned_at,
      assigned_by,
      status,
      care_type,
      notes,
      discharged_at,
      Patients (
        patient_id,
        dob,
        gender,
        address,
        allergies,
        medical_history_summary,
        Users (
          full_name,
          phone_number,
          avatar_url,
          status
        )
      )
    `, { count: "exact" })
        .eq("doctor_id", doctorId)
        .order("assigned_at", { ascending: false });

    if (status) query = query.eq("status", status);
    if (careType) query = query.eq("care_type", careType);

    if (keyword) {
        query = query.or(
            `full_name.ilike.%${keyword}%,phone_number.ilike.%${keyword}%`,
            { foreignTable: "Patients.Users" }
        );
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw new AppError(error.message, 500);

    return {
        data,
        pagination: {
            page,
            pageSize,
            totalItems: count,
            totalPages: Math.ceil(count / pageSize),
        },
    };
};

export const assignPatient = async (doctorId, patientId, assignedBy, careType = "primary", notes = "") => {
    const [doctorCheck, patientCheck] = await Promise.all([
        supabase.from("Doctors").select("doctor_id").eq("doctor_id", doctorId).single(),
        supabase.from("Patients").select("patient_id").eq("patient_id", patientId).single(),
    ]);

    if (doctorCheck.error) throw new AppError("Doctor not found", 404);
    if (patientCheck.error) throw new AppError("Patient not found", 404);

    const { data: existing } = await supabase
        .from("DoctorPatientAssignments")
        .select("assignment_id")
        .eq("doctor_id", doctorId)
        .eq("patient_id", patientId)
        .eq("status", "active")
        .maybeSingle();

    if (existing) throw new AppError("Patient is already assigned to this doctor", 409);

    const { data, error } = await supabase
        .from("DoctorPatientAssignments")
        .insert([{
            doctor_id: doctorId,
            patient_id: patientId,
            assigned_by: assignedBy,
            care_type: careType,
            notes,
        }])
        .select(`
      *,
      Patients (
        patient_id,
        dob,
        gender,
        Users (
          full_name,
          phone_number,
          avatar_url
        )
      )
    `)
        .single();

    if (error) throw new AppError(error.message, 500);

    return data;
};

export const updateAssignment = async (assignmentId, updates) => {
    const { data: existing, error: findError } = await supabase
        .from("DoctorPatientAssignments")
        .select("assignment_id")
        .eq("assignment_id", assignmentId)
        .single();

    if (findError || !existing) throw new AppError("Assignment not found", 404);

    const allowedFields = ["care_type", "notes", "status"];
    const payload = {};
    allowedFields.forEach((key) => {
        if (updates[key] !== undefined) payload[key] = updates[key];
    });

    if (Object.keys(payload).length === 0) {
        throw new AppError("No valid fields to update", 400);
    }

    const { data, error } = await supabase
        .from("DoctorPatientAssignments")
        .update(payload)
        .eq("assignment_id", assignmentId)
        .select()
        .single();

    if (error) throw new AppError(error.message, 500);

    return data;
};

export const dischargePatient = async (assignmentId) => {
    const { data: existing, error: findError } = await supabase
        .from("DoctorPatientAssignments")
        .select("assignment_id, status")
        .eq("assignment_id", assignmentId)
        .single();

    if (findError || !existing) throw new AppError("Assignment not found", 404);
    if (existing.status === "discharged") throw new AppError("Patient already discharged", 400);

    const { data, error } = await supabase
        .from("DoctorPatientAssignments")
        .update({
            status: "discharged",
            discharged_at: new Date().toISOString(),
        })
        .eq("assignment_id", assignmentId)
        .select()
        .single();

    if (error) throw new AppError(error.message, 500);

    return data;
};

export const getAssignmentDetail = async (assignmentId) => {
    const { data, error } = await supabase
        .from("DoctorPatientAssignments")
        .select(`
      *,
      Patients (
        patient_id,
        dob,
        gender,
        address,
        allergies,
        medical_history_summary,
        Users (
          full_name,
          phone_number,
          avatar_url,
          status
        )
      ),
      Doctors (
        doctor_id,
        specialization,
        Users (
          full_name
        )
      )
    `)
        .eq("assignment_id", assignmentId)
        .single();

    if (error) throw new AppError(error.message, 500);

    return data;
};
