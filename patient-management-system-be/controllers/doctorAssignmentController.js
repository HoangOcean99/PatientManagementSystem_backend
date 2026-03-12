import asyncHandler from "../utils/async-handler.js";
import * as doctorAssignmentService from "../services/doctorAssignmentService.js";
import { AppError } from "../utils/app-error.js";

export const getPatientsUnderCare = asyncHandler(async (req, res) => {
    const { doctorId } = req.params;
    const { status, careType, keyword, page, pageSize } = req.query;

    if (!doctorId) throw new AppError("Doctor ID is required", 400);

    const result = await doctorAssignmentService.getPatientsUnderCare(doctorId, {
        status: status || "",
        careType: careType || "",
        keyword: keyword || "",
        page: Number(page) || 1,
        pageSize: Number(pageSize) || 10,
    });

    res.status(200).json({
        status: "success",
        data: result.data,
        pagination: result.pagination,
    });
});

export const assignPatient = asyncHandler(async (req, res) => {
    const { doctorId } = req.params;
    const { patient_id, care_type, notes } = req.body;

    if (!doctorId) throw new AppError("Doctor ID is required", 400);
    if (!patient_id) throw new AppError("Patient ID is required", 400);

    const assignedBy = req.user?.id || null;

    const assignment = await doctorAssignmentService.assignPatient(
        doctorId,
        patient_id,
        assignedBy,
        care_type,
        notes
    );

    res.status(201).json({
        status: "success",
        message: "Patient assigned successfully",
        data: assignment,
    });
});

export const updateAssignment = asyncHandler(async (req, res) => {
    const { assignmentId } = req.params;

    if (!assignmentId) throw new AppError("Assignment ID is required", 400);

    const updated = await doctorAssignmentService.updateAssignment(assignmentId, req.body);

    res.status(200).json({
        status: "success",
        message: "Assignment updated successfully",
        data: updated,
    });
});

export const dischargePatient = asyncHandler(async (req, res) => {
    const { assignmentId } = req.params;

    if (!assignmentId) throw new AppError("Assignment ID is required", 400);

    const result = await doctorAssignmentService.dischargePatient(assignmentId);

    res.status(200).json({
        status: "success",
        message: "Patient discharged successfully",
        data: result,
    });
});
