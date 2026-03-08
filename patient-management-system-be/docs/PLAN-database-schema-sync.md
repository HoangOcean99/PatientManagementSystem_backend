# Đồng bộ Backend Code với Database Schema đã cập nhật

## Mô tả vấn đề

File `dataBase.txt` đã được cập nhật với nhiều thay đổi schema quan trọng. Code hiện tại (services, controllers, middleware, tests) đang tham chiếu đến các cột/bảng cũ không còn tồn tại. Cần sửa đổi tất cả để phù hợp với schema mới.

---

## Phân tích thay đổi Schema (Cũ → Mới)

### 1. Bảng `Appointments` — **THAY ĐỔI LỚN NHẤT**

| Cột cũ (trong code) | Cột mới (schema) | Ghi chú |
|---|---|---|
| `appointment_date` | ❌ Đã xoá | Ngày/giờ nằm trong `DoctorSlots` qua `slot_id` |
| `start_time` | ❌ Đã xoá | → `DoctorSlots.start_time` |
| `end_time` | ❌ Đã xoá | → `DoctorSlots.end_time` |
| `queue_number` | ❌ Đã xoá | Không còn trong schema |
| — | ✅ `slot_id` (mới) | FK tới `DoctorSlots`, UNIQUE |
| — | ✅ `total_price` (mới) | DECIMAL(12,2) |
| — | ✅ `deposit_required` (mới) | DECIMAL(12,2) |
| — | ✅ `deposit_paid` (mới) | DECIMAL(12,2) |
| `status: 'ready'` | ❌ Không có | Enum chỉ có: `pending, confirmed, checked_in, in_progress, completed, cancelled, missed` |

### 2. Bảng `Doctors` — **room_number → room_id**

| Cột cũ | Cột mới | Ghi chú |
|---|---|---|
| `room_number` (TEXT) | `room_id` (UUID FK) | FK tới `Rooms.room_id` |

### 3. Bảng `DoctorSlots` — **BẢNG MỚI**

```
slot_id, doctor_id, slot_date, start_time, end_time, is_booked
```
Thay thế vai trò lưu lịch hẹn trực tiếp trong `Appointments`.

### 4. Các bảng mới khác (chưa có code)

- `Departments`, `Rooms`, `ClinicServices` — đã có trong schema, chưa có service/controller
- `Invoices`, `InvoiceItems` — chưa có service
- `FamilyRelationships`, `SystemConfig`, `AuditLogs`, `password_reset_tokens` — chưa có service

---

## Proposed Changes

### Component 1: Doctor Service & Related Files

> **Vấn đề:** Code dùng `room_number` (TEXT), schema mới dùng `room_id` (UUID FK → Rooms)

#### [MODIFY] [doctorService.js](file:///d:/GitHub/PatientManagementSystem_backend/patient-management-system-be/services/doctorService.js)

1. **`getAllDoctors()`** (L8-21): Thay `room_number` → `room_id` trong select, thêm join `Rooms(room_number)` và `Departments(name)` để lấy thông tin phòng + khoa
2. **`getDoctorById()`** (L31-46): Tương tự, thay `room_number` → join `Rooms` + `Departments`
3. **`searchDoctors()`** (L56-69): Thay `room_number` → join `Rooms` + `Departments`
4. **`updateDoctor()`** (L93-146): Thay destructure/update `room_number` → `room_id` (UUID)
5. **`getDoctorAppointmentsByDoctorId()`** (L149-198): 
   - Xoá `appointment_date, start_time, end_time, queue_number` khỏi select
   - Thêm join `DoctorSlots(slot_date, start_time, end_time)` qua FK `slot_id`

#### [MODIFY] [doctorValidator.js](file:///d:/GitHub/PatientManagementSystem_backend/patient-management-system-be/middlewares/doctorValidator.js)

- Thay validation `room_number` (TEXT) → `room_id` (UUID format)

#### [MODIFY] [doctorUpdate.test.js](file:///d:/GitHub/PatientManagementSystem_backend/patient-management-system-be/tests/doctors/doctorUpdate.test.js)

- Cập nhật `mockUpdatedDoctor` và test cases: đổi `room_number: '102'` → `room_id: '<uuid>'` + nested `Rooms` object

---

### Component 2: Medical Record Service & Related Files

> **Vấn đề:** Tham chiếu `Appointments(appointment_date, start_time, status)` — các cột `appointment_date`, `start_time` không còn tồn tại

#### [MODIFY] [medicalRecordService.js](file:///d:/GitHub/PatientManagementSystem_backend/patient-management-system-be/services/medicalRecordService.js)

1. **`startExamination()`** (L149): Thay check `status !== 'ready'` → `status !== 'checked_in'` (status hợp lệ gần nhất trong enum mới)
2. **`getMedicalRecordById()`** (L191): Thay `Appointments(appointment_date, start_time, status)` → `Appointments(status, DoctorSlots(slot_date, start_time))`
3. **`getMedicalRecordsByPatient()`** (L225): Thay `Appointments(appointment_date, status)` → `Appointments(status, DoctorSlots(slot_date, start_time))`
4. **`updateMedicalRecord()`** và **`completeExamination()`**: Giữ nguyên (chỉ check `Appointments(status, doctor_id)`, OK)

---

### Component 3: Lab Order Service & Related Files

> **Vấn đề:** `getTodayLabOrders()` select `appointment_date, start_time, end_time` trực tiếp từ Appointments

#### [MODIFY] [labOrderService.js](file:///d:/GitHub/PatientManagementSystem_backend/patient-management-system-be/services/labOrderService.js)

1. **`getAllLabOrders()`** (L28): Thay `Appointments(appointment_id, appointment_date)` → `Appointments(appointment_id, DoctorSlots(slot_date))`
2. **`getTodayLabOrders()`** (L112-182): 
   - Xoá `appointment_date, start_time, end_time` khỏi select
   - Thêm join `DoctorSlots(slot_date, start_time, end_time)` 
   - Thay filter `.eq('appointment_date', today)` → filter qua `DoctorSlots.slot_date`
   - Cập nhật response mapping: lấy date/time từ `DoctorSlots` thay vì trực tiếp
3. **`getLabOrderById()`** (L207): Thay `Appointments(appointment_id, appointment_date, start_time, status)` → `Appointments(appointment_id, status, DoctorSlots(slot_date, start_time))`

---

### Component 4: Tests cần cập nhật

#### [MODIFY] [doctorUpdate.test.js](file:///d:/GitHub/PatientManagementSystem_backend/patient-management-system-be/tests/doctors/doctorUpdate.test.js)

- Mock data: `room_number` → `room_id` + `Rooms` object

#### [MODIFY] [medicalRecordUpdate.test.js](file:///d:/GitHub/PatientManagementSystem_backend/patient-management-system-be/tests/medical-records/medicalRecordUpdate.test.js)

- Không cần thay đổi lớn (test mock ở tầng controller, không chạm schema trực tiếp)

#### [MODIFY] [labOrderUpdate.test.js](file:///d:/GitHub/PatientManagementSystem_backend/patient-management-system-be/tests/lab-orders/labOrderUpdate.test.js)

- Không cần thay đổi lớn (test mock ở tầng controller)

---

## Tổng hợp các file cần sửa

| # | File | Mức độ thay đổi | Lý do |
|---|---|---|---|
| 1 | `services/doctorService.js` | 🔴 Lớn | `room_number`→`room_id`, join Rooms/Departments, xoá cột cũ Appointments |
| 2 | `services/medicalRecordService.js` | 🟡 Trung bình | Sửa select Appointments, đổi `ready`→`checked_in` |
| 3 | `services/labOrderService.js` | 🔴 Lớn | `getTodayLabOrders` rewrite filter + join DoctorSlots |
| 4 | `middlewares/doctorValidator.js` | 🟢 Nhỏ | `room_number`→`room_id` validation |
| 5 | `tests/doctors/doctorUpdate.test.js` | 🟢 Nhỏ | Mock data `room_number`→`room_id` |
| 6 | `controllers/*` | ⚪ Không đổi | Logic controller không chạm schema trực tiếp |
| 7 | `routes/*` | ⚪ Không đổi | Routing không thay đổi |

---

## User Review Required

> [!IMPORTANT]
> **Trạng thái `ready` trong `startExamination()`:** Schema mới có enum `appt_status` gồm: `pending, confirmed, checked_in, in_progress, completed, cancelled, missed`. Code cũ check `status !== 'ready'`. Plan này đề xuất đổi thành `checked_in` (patient đã check-in, bác sĩ mới bắt đầu khám). Bạn có đồng ý không?

> [!WARNING]
> **`getTodayLabOrders()` query phức tạp:** Hiện tại filter by `appointment_date` trực tiếp trên Appointments. Schema mới không có cột này — cần filter qua nested `DoctorSlots.slot_date`. Supabase PostgREST có thể không hỗ trợ filter nested relation trực tiếp. Nếu gặp hạn chế, sẽ cần dùng RPC hoặc fetch rồi filter phía JS.

---

## Verification Plan

### Automated Tests

```bash
# Chạy toàn bộ test suite
npx vitest run

# Chạy test riêng từng module
npx vitest run tests/doctors/doctorUpdate.test.js
npx vitest run tests/lab-orders/labOrderUpdate.test.js
npx vitest run tests/medical-records/medicalRecordUpdate.test.js
```

### Manual Verification

> Sau khi sửa code, cần test thủ công các API endpoint với dữ liệu thực trên Supabase:
> 1. `GET /doctor/list` — verify response có `room_id` + `Rooms` info thay vì `room_number`
> 2. `GET /doctor/appointments/:doctorId` — verify date/time lấy từ `DoctorSlots`
> 3. `POST /medical-record/start/:appointmentId` — verify status check `checked_in`
> 4. `GET /lab-orders/today` — verify filter by slot_date hoạt động đúng

> **Nếu bạn có thể chạy server local (`npm run dev`) và test bằng Postman/curl, hãy xác nhận.**
