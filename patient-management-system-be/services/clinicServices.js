import { supabase } from "../supabaseClient.js";
import { AppError } from "../utils/app-error.js";  


export const getListClinicServices = async () => {
  const { data: clinicServices, error } = await supabase
    .from('ClinicServices')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw new AppError(`Lỗi khi lấy danh sách dịch vụ: ${error.message}`, 500);
  return clinicServices;
}

export const getClinicServiceById = async (service_id) => {
  const { data: clinicService, error } = await supabase
    .from('ClinicServices')
    .select('*')
    .eq('service_id', service_id)
    .single();
  if (error) throw new AppError(`Lỗi khi lấy dịch vụ: ${error.message}`, 500);
  if (!clinicService) throw new AppError('Dịch vụ không tồn tại', 404);
  return clinicService;
}

export const getPriceByServiceId = async (service_id) => {
  const { data: serviceInfo, error: serviceError } = await supabase
    .from('ClinicServices')
    .select('price')
    .eq('service_id', service_id)
    .single();
  if (serviceError || !serviceInfo) {
    throw new AppError("Không tìm thấy thông tin dịch vụ để lấy giá tiền", 404);
  }
  return serviceInfo.price;
}