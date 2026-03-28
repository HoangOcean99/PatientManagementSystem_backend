import * as geminiService from "../services/geminiService.js";
import asyncHandler from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";

export const chat = asyncHandler(async (req, res, next) => {
  const { message } = req.body;

  if (!message || message.trim() === "") {
    return next(new AppError("Nội dung tin nhắn không được để trống", 400));
  }

  try {
    const response = await geminiService.generateChatResponse(message);

    res.status(200).json({
      status: "success",
      data: {
        response: response
      }
    });

  } catch (error) {
    console.error("Chat Controller Error:", error);
    return next(new AppError(error.message || "Lỗi khi xử lý chatbot", 500));
  }
});
