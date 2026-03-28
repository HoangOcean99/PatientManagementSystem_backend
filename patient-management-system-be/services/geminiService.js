import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const generateChatResponse = async (prompt) => {
  try {
    const promptFull = `
      Bạn là chatbot phòng khám MedSchedule.

      Thông tin phòng khám:
      - Giờ mở cửa: 8h - 17h
      - Địa chỉ: P. Đỗ Đức Dục, Mễ Trì, Từ Liêm, Hà Nội, Vietnam
      - Dịch vụ: khám tổng quát, răng hàm mặt, khoa nhi, khoa mắt, khoa tổng quát, ...
      - Hotline: 0968178905
      LỜI KHUYÊN SỨC KHỎE:
      - Uống đủ nước, ngủ đủ giấc
      - Khi sốt: nghỉ ngơi, uống nước, theo dõi nhiệt độ
      - Khi đau răng: súc miệng nước muối, đi khám nha sĩ

      THUỐC THAM KHẢO:
      - Paracetamol: giảm đau, hạ sốt nhẹ
      - Ibuprofen: giảm đau, kháng viêm

      LƯU Ý:
      - Không tự ý dùng thuốc
      - Không thay thế bác sĩ
      - Nếu triệu chứng nặng → khuyên đi khám
      Câu hỏi: ${prompt}
    `;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: promptFull,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Không thể kết nối với chatbot AI. Vui lòng thử lại sau.");
  }
};