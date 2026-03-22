import { supabase } from "../supabaseClient.js";
import { AppError } from "../utils/app-error.js";
import { updateAvatar } from "./userService.js";

export const getAllDoctors = async () => {
  const { data, error } = await supabase
    .from('Users')
    .select(`
        user_id,
        full_name,
        email,
        phone_number,
        avatar_url,
        status,
        Doctors (
            doctor_id,
            department_id,
            room_id,
            specialization,
            bio,
            Rooms (
                room_id,
                room_number
            ),
            Departments (
                department_id,
                name,
                description
            )
        )
    `)
    .eq('role', 'doctor');

  if (error) throw new AppError(error.message, 500);

  const formattedData = data.map(user => {
    const docInfo = user.Doctors && user.Doctors.length > 0 ? user.Doctors[0] : {};
    return {
      doctor_id: user.user_id,
      department_id: docInfo.department_id || null,
      room_id: docInfo.room_id || null,
      specialization: docInfo.specialization || null,
      bio: docInfo.bio || null,
      Users: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        phone_number: user.phone_number,
        avatar_url: user.avatar_url,
        status: user.status
      },
      Rooms: docInfo.Rooms || null,
      Departments: docInfo.Departments || null
    };
  });

  return formattedData;
}

// export const getAllDoctors = async () => {
//   const { data, error } = await supabase.from("Doctors").select(DOCTOR_SELECT);

//   if (error) throw new AppError(error.message, 500);

//   return data;
// };

export const getDoctorById = async (doctorId) => {
  console.log('id1', doctorId)

  const { data, error } = await supabase
    .from('Users')
    .select(`
        user_id,
        full_name,
        email,
        phone_number,
        avatar_url,
        status,
        address,
        dob,
        gender,
        Doctors (
            doctor_id,
            department_id,
            room_id,
            specialization,
            bio,
            Rooms (
                room_id,
                room_number,
                room_status
            ),
            Departments (
                department_id,
                name,
                description
            )
        )
    `)
    .eq('user_id', doctorId)
    .single();

  if (error) throw new AppError(error.message, 500);
  const docInfo = data.Doctors;

  return {
    doctor_id: data.user_id,
    department_id: docInfo.department_id || null,
    room_id: docInfo.room_id || null,
    specialization: docInfo.specialization || null,
    bio: docInfo.bio || null,
    Users: {
      user_id: data.user_id,
      full_name: data.full_name,
      email: data.email,
      phone_number: data.phone_number,
      avatar_url: data.avatar_url,
      status: data.status,
      address: data.address,
      dob: data.dob,
      gender: data.gender
    },
    Rooms: docInfo.Rooms || null,
    Departments: docInfo.Departments || null
  };
};

export const searchDoctors = async ({ name, specialization, status }) => {
  let query = supabase.from("Doctors").select(`
            doctor_id,
            department_id,
            room_id,
            specialization,
            bio,
            Users!inner (
                user_id,
                full_name,
                email,
                phone_number,
                avatar_url,
                status,
                address,
                gender,
                dob
            ),
            Rooms (
                room_id,
                room_number
            ),
            Departments (
                department_id,
                name,
                description
            )
        `);

  if (name) {
    query = query.ilike("Users.full_name", `%${name}%`);
  }

  if (specialization) {
    query = query.ilike("specialization", `%${specialization}%`);
  }

  if (status) {
    query = query.eq("Users.status", status);
  }

  query = query.order("full_name", { foreignTable: "Users", ascending: true });

  const { data, error } = await query;

  if (error) throw new AppError(error.message, 500);

  return data;
};

export const updateDoctor = async (updateData, avatarFile) => {
  const { doctor_id } = updateData;
  const existingDoctor = await getDoctorById(doctor_id);
  if (!existingDoctor) {
    throw new AppError("No doctor found with that ID", 404);
  }

  const {
    specialization,
    bio,
    room_id,
    department_id,
    full_name,
    phone_number,
    status,
    address,
    dob,
    gender
  } = updateData;

  const doctorUpdates = {};
  if (specialization !== undefined)
    doctorUpdates.specialization = specialization;
  if (bio !== undefined) doctorUpdates.bio = bio;
  if (room_id !== undefined) doctorUpdates.room_id = room_id;
  if (department_id !== undefined) doctorUpdates.department_id = department_id;

  const userUpdates = {};
  if (full_name !== undefined) userUpdates.full_name = full_name;
  if (phone_number !== undefined) userUpdates.phone_number = phone_number;
  if (status !== undefined) userUpdates.status = status;
  if (address !== undefined) userUpdates.address = address;
  if (dob !== undefined) userUpdates.dob = dob;
  if (gender !== undefined) userUpdates.gender = gender;

  const updatePromises = [];

  if (Object.keys(doctorUpdates).length > 0) {
    updatePromises.push(
      supabase.from("Doctors").update(doctorUpdates).eq("doctor_id", doctor_id),
    );
  }

  if (Object.keys(userUpdates).length > 0) {
    updatePromises.push(
      supabase.from("Users").update(userUpdates).eq("user_id", doctor_id),
    );
  }
  let results = null;
  if (updatePromises.length > 0) {
    results = await Promise.all(updatePromises);
    for (const res of results) {
      if (res.error) throw new AppError(res.error.message, 500);
    }
  }

  await updateAvatar(updateData, avatarFile);

  return results;
};

export const updateDoctorInfo = async (updateData) => {
  const { doctor_id } = updateData;
  const existingDoctor = await getDoctorById(doctor_id);
  if (!existingDoctor) {
    throw new AppError("No doctor found with that ID", 404);
  }

  const {
    specialization,
    bio,
    room_id,
    department_id,
    full_name,
    phone_number,
    status,
    address,
    dob,
    gender,
    avatar_url
  } = updateData;

  const doctorUpdates = {};
  if (specialization !== undefined) doctorUpdates.specialization = specialization;
  if (bio !== undefined) doctorUpdates.bio = bio;
  if (room_id !== undefined) doctorUpdates.room_id = room_id;
  if (department_id !== undefined) doctorUpdates.department_id = department_id;

  const userUpdates = {};
  if (full_name !== undefined) userUpdates.full_name = full_name;
  if (phone_number !== undefined) userUpdates.phone_number = phone_number;
  if (status !== undefined) userUpdates.status = status;
  if (address !== undefined) userUpdates.address = address;
  if (dob !== undefined) userUpdates.dob = dob;
  if (gender !== undefined) userUpdates.gender = gender;
  if (avatar_url !== undefined) userUpdates.avatar_url = avatar_url;

  const updatePromises = [];

  if (Object.keys(doctorUpdates).length > 0) {
    doctorUpdates.doctor_id = doctor_id;
    console.log(doctorUpdates);
    updatePromises.push(
      supabase.from("Doctors").upsert(doctorUpdates, { onConflict: 'doctor_id' }),
    );
  }

  if (Object.keys(userUpdates).length > 0) {
    updatePromises.push(
      supabase.from("Users").update(userUpdates).eq("user_id", doctor_id),
    );
  }

  let results = null;
  if (updatePromises.length > 0) {
    results = await Promise.all(updatePromises);
    for (const res of results) {
      if (res.error) throw new AppError(res.error.message, 500);
    }
  }

  return await getDoctorById(doctor_id);
};

export const createDoctorProfile = async (userId, profileData) => {
  // 1. Kiểm tra user tồn tại và có role 'doctor'
  const { data: user, error: userError } = await supabase
    .from("Users")
    .select("user_id, role")
    .eq("user_id", userId)
    .single();

  if (userError || !user) throw new AppError("User not found", 404);
  if (user.role !== "doctor")
    throw new AppError("User is not assigned the doctor role", 403);

  // 2. Kiểm tra profile đã tồn tại chưa (tránh tạo duplicate)
  const { data: existing } = await supabase
    .from("Doctors")
    .select("doctor_id")
    .eq("doctor_id", userId)
    .single();

  if (existing)
    throw new AppError(
      "Doctor profile already exists. Use update instead.",
      409,
    );

  // 3. Validate required fields: specialization và department_id là bắt buộc; room_id là optional (do admin assign sau)
  const { specialization, department_id, bio, room_id } = profileData;

  if (!specialization) throw new AppError('Specialization is required', 400);
  if (!department_id) throw new AppError('Department ID is required', 400);

  // 4. Insert vào bảng Doctors (doctor_id = user_id, quan hệ 1-1)
  const insertData = {
    doctor_id: userId,
    specialization,
    department_id,
    bio: bio ?? null,
  };
  if (room_id) insertData.room_id = room_id;

  const { error: insertError } = await supabase
    .from('Doctors')
    .insert([insertData]);

  if (insertError) throw new AppError(insertError.message, 500);

  return await getDoctorById(userId);
};

export const getDoctorAppointmentsByDoctorId = async (
  doctorId,
  { date, status } = {},
) => {
  let query = supabase
    .from("Appointments")
    .select(
      `
            appointment_id,
            status,
            total_price,
            deposit_required,
            deposit_paid,
            created_at,
            DoctorSlots (
                slot_id,
                slot_date,
                start_time,
                end_time
            ),
            Patients (
                patient_id,
                Users (
                    full_name,
                    phone_number,
                    avatar_url,
                    dob,
                    gender,
                    address
                )
            ),
            ClinicServices (
                service_id,
                name,
                duration_minutes,
                price
            )
        `,
    )
    .eq("doctor_id", doctorId);

  if (status) {
    query = query.eq("status", status);
  }

  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;

  if (error) throw new AppError(error.message, 500);

  if (date && data) {
    return data.filter((appt) => appt.DoctorSlots?.slot_date === date);
  }

  return data;
};

export const getDoctorByDepartmentId = async (departmentId) => {
  const { data, error } = await supabase
    .from('Doctors')
    .select(`
        doctor_id,
        Departments!inner ( department_id, name ),
        Users!inner ( user_id, full_name, email, phone_number, avatar_url, status)
        `)
    .eq('department_id', departmentId);

  if (error) throw new AppError(error.message, 500);

  return data;
};

export const createDoctor = async (doctor) => {
  const { data, error } = await supabase.from('Doctors').insert(doctor).select(`
        doctor_id,
        department_id,
        specialization,
        bio,
        room_number
    `).select().single();
  if (error) throw new AppError(error.message, 500);
  return data;
}

export const updateDoctorById = async (doctorId, updateData) => {
  const { data, error } = await supabase.from('Doctors').update(updateData).eq('doctor_id', doctorId).select().single();
  if (error) throw new AppError(error.message, 500);
  return data;
}

export const deleteDoctorById = async (doctorId) => {
  const { data, error } = await supabase.from('Doctors').delete().eq('doctor_id', doctorId).select().single();
  if (error) throw new AppError(error.message, 500);
  return data;
}

