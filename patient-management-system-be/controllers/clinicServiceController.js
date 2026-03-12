import * as ClinicService from '../services/clinicServicesService.js';


export const getAllServices = async (req, res) => {
    try {

        const data = await ClinicService.getAll();
        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách dịch vụ',
            error: error.message
        });
    }
};


export const getAllServicesByDepartment = async (req, res) => {
    try {
        const { department, is_active } = req.params;
        const filters = {
            department,
            is_active: is_active !== undefined ? is_active === 'true' : undefined
        };

        const data = await ClinicService.getAll(filters);
        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách dịch vụ',
            error: error.message
        });
    }
};

export const getServiceById = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await ClinicService.getById(id);

        if (!data) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy dịch vụ'
            });
        }

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy chi tiết dịch vụ',
            error: error.message
        });
    }
};

export const createService = async (req, res) => {
    try {
        const payload = req.body;

        const data = await ClinicService.create(payload);
        return res.status(201).json({
            success: true,
            message: 'Tạo dịch vụ thành công',
            data
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: 'Không thể tạo dịch vụ',
            error: error.message
        });
    }
};

export const updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const data = await ClinicService.update(id, updates);
        return res.status(200).json({
            success: true,
            message: 'Cập nhật dịch vụ thành công',
            data
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: 'Cập nhật dịch vụ thất bại',
            error: error.message
        });
    }
};

export const deleteService = async (req, res) => {
    try {
        const { id } = req.params;
        await ClinicService.remove(id);

        return res.status(200).json({
            success: true,
            message: 'Đã xóa dịch vụ thành công'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Xóa dịch vụ thất bại',
            error: error.message
        });
    }
};