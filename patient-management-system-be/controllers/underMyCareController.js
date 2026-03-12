import asyncHandler from "../utils/async-handler.js";
import * as underMyCareService from "../services/underMyCareService.js";
import { AppError } from "../utils/app-error.js";

// POST /under-my-care — Tạo dependent mới
export const addDependent = asyncHandler(async (req, res) => {
    const parentUserId = req.user.id;

    const { full_name, dob, address } = req.body;
    if (!full_name || !dob || !address) {
        throw new AppError("full_name, dob, and address are required", 400);
    }

    const data = await underMyCareService.addDependent(parentUserId, req.body);

    res.status(201).json({
        status: "success",
        message: "Dependent added successfully",
        data,
    });
});

// GET /under-my-care — Danh sách dependents
export const getDependents = asyncHandler(async (req, res) => {
    const parentUserId = req.user.id;

    const data = await underMyCareService.getDependents(parentUserId);

    res.status(200).json({
        status: "success",
        data,
    });
});

// GET /under-my-care/:relationshipId — Chi tiết 1 dependent
export const getDependentDetail = asyncHandler(async (req, res) => {
    const parentUserId = req.user.id;
    const { relationshipId } = req.params;

    if (!relationshipId) throw new AppError("Relationship ID is required", 400);

    const data = await underMyCareService.getDependentDetail(parentUserId, relationshipId);

    res.status(200).json({
        status: "success",
        data,
    });
});

// PATCH /under-my-care/:relationshipId — Cập nhật thông tin dependent
export const updateDependent = asyncHandler(async (req, res) => {
    const parentUserId = req.user.id;
    const { relationshipId } = req.params;

    if (!relationshipId) throw new AppError("Relationship ID is required", 400);

    const data = await underMyCareService.updateDependent(parentUserId, relationshipId, req.body);

    res.status(200).json({
        status: "success",
        message: "Dependent updated successfully",
        data,
    });
});

// DELETE /under-my-care/:relationshipId — Xóa liên kết
export const removeDependent = asyncHandler(async (req, res) => {
    const parentUserId = req.user.id;
    const { relationshipId } = req.params;

    if (!relationshipId) throw new AppError("Relationship ID is required", 400);

    await underMyCareService.removeDependent(parentUserId, relationshipId);

    res.status(200).json({
        status: "success",
        message: "Dependent removed successfully (medical records remain intact)",
    });
});

// POST /under-my-care/share-code — Tạo share code
export const generateShareCode = asyncHandler(async (req, res) => {
    const parentUserId = req.user.id;
    const { child_user_id } = req.body;

    if (!child_user_id) throw new AppError("child_user_id is required", 400);

    const data = await underMyCareService.generateShareCode(parentUserId, child_user_id);

    res.status(201).json({
        status: "success",
        message: "Share code generated",
        data,
    });
});

// POST /under-my-care/link — Liên kết bằng share code
export const linkDependent = asyncHandler(async (req, res) => {
    const parentUserId = req.user.id;
    const { share_code, relationship } = req.body;

    if (!share_code) throw new AppError("share_code is required", 400);

    const data = await underMyCareService.linkByShareCode(parentUserId, share_code, relationship);

    res.status(201).json({
        status: "success",
        message: "Dependent linked successfully",
        data,
    });
});

// POST /under-my-care/invite — Mời qua email
export const inviteByEmail = asyncHandler(async (req, res) => {
    const parentUserId = req.user.id;
    const { email, relationship } = req.body;

    if (!email) throw new AppError("email is required", 400);

    const data = await underMyCareService.inviteByEmail(parentUserId, email, relationship);

    res.status(200).json({
        status: "success",
        message: data.message,
        data: {
            expires_at: data.expires_at
        }
    });
});

// POST /under-my-care/accept-invite — Chấp nhận mã mời email
export const acceptEmailInvitation = asyncHandler(async (req, res) => {
    const childUserId = req.user.id;
    const { invitation_code } = req.body;

    if (!invitation_code) throw new AppError("invitation_code is required", 400);

    const data = await underMyCareService.acceptEmailInvitation(childUserId, invitation_code);

    res.status(200).json({
        status: "success",
        message: "Email invitation accepted successfully",
        data,
    });
});
