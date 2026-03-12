import { supabase } from "../supabaseClient.js";
import { AppError } from "../utils/app-error.js";

/**
 * Middleware để kiểm tra xem User hiện tại có quyền truy cập/quản lý bệnh án của target_user_id (người phụ thuộc) hay không.
 */
export const checkDependentAccess = async (req, res, next) => {
    try {
        const parentUserId = req.user?.id;
        if (!parentUserId) {
            return next(new AppError("User is not authenticated", 401));
        }

        // Target có thể nằm trong body hoặc query (cho phép dùng target_user_id hoặc patient_id)
        const targetUserId = req.body.target_user_id || req.body.patient_id || req.query.target_user_id || req.query.patient_id;

        // Nếu không truyền target_user_id, tức là họ đang thao tác cho chính họ
        if (!targetUserId) {
            req.patientId = parentUserId;
            return next();
        }

        // Nếu target_user_id chính là id của họ
        if (targetUserId === parentUserId) {
            req.patientId = parentUserId;
            return next();
        }

        // Nếu truyền target_user_id khác với mình, check DB xem có quyền truy cập không
        const { data: relation, error } = await supabase
            .from("FamilyRelationships")
            .select("relationship_id, can_manage")
            .eq("parent_user_id", parentUserId)
            .eq("child_user_id", targetUserId)
            .single();

        if (error || !relation) {
            return next(new AppError("You do not have permission to access this patient's records", 403));
        }

        if (!relation.can_manage) {
            return next(new AppError("You only have read-only access to this patient", 403));
        }

        // Ghi đè patientId cho các middleware/controller tiếp theo sử dụng
        req.patientId = targetUserId;
        next();
    } catch (err) {
        next(err);
    }
};
