import * as DepartmentService from '../services/departmentService.js';


export const getAllDepartments = async (req, res) => {
    try {
        const onlyActive = req.query.onlyActive === 'true';
        const data = await DepartmentService.getAll(onlyActive);
        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách phòng ban',
            error: error.message
        });
    }
};


export const getDepartmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await DepartmentService.getById(id);

        if (!data) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phòng ban'
            });
        }

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy chi tiết phòng ban',
            error: error.message
        });
    }
};


export const createDepartment = async (req, res) => {
    try {
        const payload = req.body;

        const data = await DepartmentService.create(payload);

        return res.status(201).json({
            success: true,
            message: 'Tạo phòng ban thành công',
            data
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: 'Không thể tạo phòng ban',
            error: error.message
        });
    }
};


export const updateDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const data = await DepartmentService.update(id, updates);

        return res.status(200).json({
            success: true,
            message: 'Cập nhật phòng ban thành công',
            data
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: 'Cập nhật phòng ban thất bại',
            error: error.message
        });
    }
};


export const deleteDepartment = async (req, res) => {
    try {
        const { id } = req.params;

        await DepartmentService.remove(id);

        return res.status(200).json({
            success: true,
            message: 'Đã xóa phòng ban thành công'
        });
    } catch (error) {
        const isForeignKeyError = error.message?.includes('violates foreign key constraint');

        return res.status(isForeignKeyError ? 409 : 500).json({
            success: false,
            message: isForeignKeyError
                ? 'Không thể xóa phòng ban đang chứa dịch vụ hoạt động'
                : 'Xóa phòng ban thất bại',
            error: error.message
        });
    }
};