-- =====================================================================
-- FxFitnessCenterDB.sql — Dữ liệu và Cấu trúc Database Mới Nhất
-- Ngày tạo: 2026-07-21T04:05:10.135Z
-- Tự động tạo cho Dự án SWP391 - FX Fitness Center
-- Hướng dẫn: Chạy script này trên SQL Server Management Studio (SSMS) hoặc Azure Data Studio
-- =====================================================================

USE [master];
GO

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = N'FxFitnessCenterDB')
BEGIN
    CREATE DATABASE [FxFitnessCenterDB];
END
GO

USE [FxFitnessCenterDB];
GO

-- ---------------------------------------------------------------------
-- 1. HỦY BỎ BẢNG CŨ (NẾU TỒN TẠI)
-- ---------------------------------------------------------------------
IF OBJECT_ID(N'dbo.[SequelizeMeta]', N'U') IS NOT NULL DROP TABLE dbo.[SequelizeMeta];
IF OBJECT_ID(N'dbo.[AppConfigs]', N'U') IS NOT NULL DROP TABLE dbo.[AppConfigs];
IF OBJECT_ID(N'dbo.[ChatMessages]', N'U') IS NOT NULL DROP TABLE dbo.[ChatMessages];
IF OBJECT_ID(N'dbo.[TrainerCertifications]', N'U') IS NOT NULL DROP TABLE dbo.[TrainerCertifications];
IF OBJECT_ID(N'dbo.[Reports]', N'U') IS NOT NULL DROP TABLE dbo.[Reports];
IF OBJECT_ID(N'dbo.[ProgressTrackings]', N'U') IS NOT NULL DROP TABLE dbo.[ProgressTrackings];
IF OBJECT_ID(N'dbo.[Payments]', N'U') IS NOT NULL DROP TABLE dbo.[Payments];
IF OBJECT_ID(N'dbo.[Notifications]', N'U') IS NOT NULL DROP TABLE dbo.[Notifications];
IF OBJECT_ID(N'dbo.[Announcements]', N'U') IS NOT NULL DROP TABLE dbo.[Announcements];
IF OBJECT_ID(N'dbo.[AIConsultations]', N'U') IS NOT NULL DROP TABLE dbo.[AIConsultations];
IF OBJECT_ID(N'dbo.[WorkoutExercises]', N'U') IS NOT NULL DROP TABLE dbo.[WorkoutExercises];
IF OBJECT_ID(N'dbo.[WorkoutPlans]', N'U') IS NOT NULL DROP TABLE dbo.[WorkoutPlans];
IF OBJECT_ID(N'dbo.[CheckIns]', N'U') IS NOT NULL DROP TABLE dbo.[CheckIns];
IF OBJECT_ID(N'dbo.[PtOffRequests]', N'U') IS NOT NULL DROP TABLE dbo.[PtOffRequests];
IF OBJECT_ID(N'dbo.[PtBookings]', N'U') IS NOT NULL DROP TABLE dbo.[PtBookings];
IF OBJECT_ID(N'dbo.[Appointments]', N'U') IS NOT NULL DROP TABLE dbo.[Appointments];
IF OBJECT_ID(N'dbo.[TrainerSchedules]', N'U') IS NOT NULL DROP TABLE dbo.[TrainerSchedules];
IF OBJECT_ID(N'dbo.[MemberTrainerPackages]', N'U') IS NOT NULL DROP TABLE dbo.[MemberTrainerPackages];
IF OBJECT_ID(N'dbo.[MemberServices]', N'U') IS NOT NULL DROP TABLE dbo.[MemberServices];
IF OBJECT_ID(N'dbo.[MemberMemberships]', N'U') IS NOT NULL DROP TABLE dbo.[MemberMemberships];
IF OBJECT_ID(N'dbo.[MembershipPlanServices]', N'U') IS NOT NULL DROP TABLE dbo.[MembershipPlanServices];
IF OBJECT_ID(N'dbo.[Services]', N'U') IS NOT NULL DROP TABLE dbo.[Services];
IF OBJECT_ID(N'dbo.[MembershipPlans]', N'U') IS NOT NULL DROP TABLE dbo.[MembershipPlans];
IF OBJECT_ID(N'dbo.[Trainers]', N'U') IS NOT NULL DROP TABLE dbo.[Trainers];
IF OBJECT_ID(N'dbo.[Members]', N'U') IS NOT NULL DROP TABLE dbo.[Members];
IF OBJECT_ID(N'dbo.[Users]', N'U') IS NOT NULL DROP TABLE dbo.[Users];
IF OBJECT_ID(N'dbo.[Roles]', N'U') IS NOT NULL DROP TABLE dbo.[Roles];
GO

-- ---------------------------------------------------------------------
-- 2. TẠO CẤU TRÚC CÁC BẢNG (TABLE SCHEMAS)
-- ---------------------------------------------------------------------

CREATE TABLE dbo.[Roles] (
    [role_id] INT NOT NULL,
    [role_name] VARCHAR(50) NOT NULL,
    CONSTRAINT [PK_Roles] PRIMARY KEY CLUSTERED ([role_id])
);
GO

CREATE TABLE dbo.[Users] (
    [user_id] INT IDENTITY(1,1) NOT NULL,
    [full_name] NVARCHAR(100) NOT NULL,
    [email] VARCHAR(100) NOT NULL,
    [password_hash] VARCHAR(255) NOT NULL,
    [phone_number] VARCHAR(20) NULL,
    [gender] NVARCHAR(10) NULL,
    [date_of_birth] DATE NULL,
    [role_id] INT NOT NULL,
    [status] VARCHAR(20) NULL DEFAULT ('Active'),
    [created_at] DATETIME NULL DEFAULT (getdate()),
    [avatar_url] VARCHAR(255) NULL,
    [must_change_password] BIT NOT NULL DEFAULT ((0)),
    [email_verification_token] NVARCHAR(500) NULL DEFAULT (NULL),
    CONSTRAINT [PK_Users] PRIMARY KEY CLUSTERED ([user_id])
);
GO

CREATE TABLE dbo.[Members] (
    [member_id] INT IDENTITY(1,1) NOT NULL,
    [user_id] INT NOT NULL,
    [height] FLOAT NULL,
    [weight] FLOAT NULL,
    [fitness_goal] NVARCHAR(100) NULL,
    [emergency_contact] VARCHAR(20) NULL,
    [joined_date] DATE NULL DEFAULT (getdate()),
    [fitness_level] NVARCHAR(50) NULL,
    CONSTRAINT [PK_Members] PRIMARY KEY CLUSTERED ([member_id])
);
GO

CREATE TABLE dbo.[Trainers] (
    [trainer_id] INT IDENTITY(1,1) NOT NULL,
    [user_id] INT NOT NULL,
    [specialization] NVARCHAR(100) NULL,
    [experience_years] INT NULL,
    [experience_description] NVARCHAR(MAX) NULL,
    [bio] NVARCHAR(MAX) NULL,
    [rating] FLOAT NULL DEFAULT ((0)),
    CONSTRAINT [PK_Trainers] PRIMARY KEY CLUSTERED ([trainer_id])
);
GO

CREATE TABLE dbo.[MembershipPlans] (
    [membership_plan_id] INT IDENTITY(1,1) NOT NULL,
    [plan_name] NVARCHAR(100) NOT NULL,
    [sport_type] VARCHAR(50) NOT NULL,
    [duration_months] INT NOT NULL,
    [price] DECIMAL(10,2) NOT NULL,
    [description] NVARCHAR(500) NULL,
    [status] VARCHAR(20) NULL DEFAULT ('Active'),
    CONSTRAINT [PK_MembershipPlans] PRIMARY KEY CLUSTERED ([membership_plan_id])
);
GO

CREATE TABLE dbo.[Services] (
    [service_id] INT IDENTITY(1,1) NOT NULL,
    [service_name] NVARCHAR(100) NOT NULL,
    [service_type] NVARCHAR(50) NULL,
    [description] NVARCHAR(500) NULL,
    [price] DECIMAL(10,2) NULL,
    [status] VARCHAR(20) NULL DEFAULT ('Available'),
    CONSTRAINT [PK_Services] PRIMARY KEY CLUSTERED ([service_id])
);
GO

CREATE TABLE dbo.[MembershipPlanServices] (
    [membership_plan_id] INT NOT NULL,
    [service_id] INT NOT NULL,
    [session_count] INT NULL,
    CONSTRAINT [PK_MembershipPlanServices] PRIMARY KEY CLUSTERED ([membership_plan_id], [service_id])
);
GO

CREATE TABLE dbo.[MemberMemberships] (
    [member_membership_id] INT IDENTITY(1,1) NOT NULL,
    [member_id] INT NOT NULL,
    [membership_plan_id] INT NOT NULL,
    [start_date] DATE NOT NULL,
    [end_date] DATE NOT NULL,
    [membership_status] VARCHAR(30) NULL DEFAULT ('Active'),
    CONSTRAINT [PK_MemberMemberships] PRIMARY KEY CLUSTERED ([member_membership_id])
);
GO

CREATE TABLE dbo.[MemberServices] (
    [member_service_id] INT IDENTITY(1,1) NOT NULL,
    [member_id] INT NOT NULL,
    [service_id] INT NOT NULL,
    [start_date] DATE NULL DEFAULT (getdate()),
    [end_date] DATE NULL,
    [service_status] VARCHAR(30) NULL DEFAULT ('Active'),
    [session_count] INT NOT NULL DEFAULT ((0)),
    CONSTRAINT [PK_MemberServices] PRIMARY KEY CLUSTERED ([member_service_id])
);
GO

CREATE TABLE dbo.[MemberTrainerPackages] (
    [package_id] INT IDENTITY(1,1) NOT NULL,
    [member_id] INT NOT NULL,
    [trainer_id] INT NOT NULL,
    [total_sessions] INT NOT NULL DEFAULT ((12)),
    [used_sessions] INT NOT NULL DEFAULT ((0)),
    [is_active] BIT NOT NULL DEFAULT ((1)),
    [created_at] DATETIME2 NOT NULL DEFAULT (getdate()),
    CONSTRAINT [PK_MemberTrainerPackages] PRIMARY KEY CLUSTERED ([package_id])
);
GO

CREATE TABLE dbo.[TrainerSchedules] (
    [schedule_id] INT IDENTITY(1,1) NOT NULL,
    [trainer_id] INT NOT NULL,
    [working_date] DATE NOT NULL,
    [start_time] TIME NOT NULL,
    [end_time] TIME NOT NULL,
    [availability_status] VARCHAR(20) NULL DEFAULT ('Available'),
    CONSTRAINT [PK_TrainerSchedules] PRIMARY KEY CLUSTERED ([schedule_id])
);
GO

CREATE TABLE dbo.[Appointments] (
    [appointment_id] INT IDENTITY(1,1) NOT NULL,
    [member_id] INT NOT NULL,
    [schedule_id] INT NOT NULL,
    [status] VARCHAR(30) NULL DEFAULT ('Pending'),
    [note] NVARCHAR(500) NULL,
    [created_at] DATETIME NULL DEFAULT (getdate()),
    [cancel_reason] NVARCHAR(1000) NULL,
    [cancel_requested_at] DATETIME NULL,
    [cancel_requested_by] VARCHAR(50) NULL,
    CONSTRAINT [PK_Appointments] PRIMARY KEY CLUSTERED ([appointment_id])
);
GO

CREATE TABLE dbo.[PtBookings] (
    [booking_id] INT IDENTITY(1,1) NOT NULL,
    [member_id] INT NOT NULL,
    [trainer_id] INT NOT NULL,
    [session_date] DATE NOT NULL,
    [shift_code] VARCHAR(10) NOT NULL,
    [status] NVARCHAR(20) NOT NULL DEFAULT ('Pending'),
    [reject_reason] NVARCHAR(500) NULL,
    [note] NVARCHAR(500) NULL,
    [created_at] DATETIME2 NOT NULL DEFAULT (getdate()),
    [updated_at] DATETIME2 NOT NULL DEFAULT (getdate()),
    [cancel_reason] NVARCHAR(500) NULL,
    [cancel_requested_at] DATETIME2 NULL,
    [cancel_requested_by] NVARCHAR(50) NULL,
    CONSTRAINT [PK_PtBookings] PRIMARY KEY CLUSTERED ([booking_id])
);
GO

CREATE TABLE dbo.[PtOffRequests] (
    [request_id] INT IDENTITY(1,1) NOT NULL,
    [trainer_id] INT NOT NULL,
    [off_date] DATE NOT NULL,
    [status] NVARCHAR(20) NOT NULL DEFAULT ('Pending'),
    [reject_reason] NVARCHAR(500) NULL,
    [created_at] DATETIME2 NOT NULL DEFAULT (getdate()),
    [updated_at] DATETIME2 NOT NULL DEFAULT (getdate()),
    CONSTRAINT [PK_PtOffRequests] PRIMARY KEY CLUSTERED ([request_id])
);
GO

CREATE TABLE dbo.[CheckIns] (
    [checkin_id] INT IDENTITY(1,1) NOT NULL,
    [member_id] INT NOT NULL,
    [checkin_time] DATETIME NOT NULL DEFAULT (getdate()),
    CONSTRAINT [PK_CheckIns] PRIMARY KEY CLUSTERED ([checkin_id])
);
GO


CREATE TABLE dbo.[WorkoutPlans] (
    [workout_plan_id] INT IDENTITY(1,1) NOT NULL,
    [trainer_id] INT NOT NULL,
    [member_id] INT NOT NULL,
    [title] NVARCHAR(200) NULL,
    [description] NVARCHAR(MAX) NULL,
    [created_at] DATETIME NULL DEFAULT (getdate()),
    [updated_at] DATETIME NULL,
    CONSTRAINT [PK_WorkoutPlans] PRIMARY KEY CLUSTERED ([workout_plan_id])
);
GO

CREATE TABLE dbo.[WorkoutExercises] (
    [exercise_id] INT IDENTITY(1,1) NOT NULL,
    [workout_plan_id] INT NOT NULL,
    [exercise_name] NVARCHAR(100) NULL,
    [sets] INT NULL,
    [reps] INT NULL,
    [duration_minutes] INT NULL,
    [calories_burned] INT NULL,
    [rpe] INT NULL,
    CONSTRAINT [PK_WorkoutExercises] PRIMARY KEY CLUSTERED ([exercise_id])
);
GO

CREATE TABLE dbo.[AIConsultations] (
    [consultation_id] INT IDENTITY(1,1) NOT NULL,
    [member_id] INT NULL,
    [guest_name] NVARCHAR(100) NULL,
    [consultation_type] VARCHAR(50) NULL,
    [age] INT NULL,
    [gender] NVARCHAR(10) NULL,
    [height] FLOAT NULL,
    [weight] FLOAT NULL,
    [bmi] AS (round([weight]/([height]*[height]),(2))),
    [fitness_goal] NVARCHAR(100) NULL,
    [recommended_sport] NVARCHAR(50) NULL,
    [recommended_membership] NVARCHAR(100) NULL,
    [recommended_schedule] NVARCHAR(MAX) NULL,
    [recommendation_detail] NVARCHAR(MAX) NULL,
    [created_at] DATETIME NULL DEFAULT (getdate()),
    CONSTRAINT [PK_AIConsultations] PRIMARY KEY CLUSTERED ([consultation_id])
);
GO

CREATE TABLE dbo.[Announcements] (
    [announcement_id] INT IDENTITY(1,1) NOT NULL,
    [admin_id] INT NOT NULL,
    [title] NVARCHAR(200) NULL,
    [content] NVARCHAR(MAX) NULL,
    [created_at] DATETIME NULL DEFAULT (getdate()),
    [updated_at] DATETIME NULL,
    CONSTRAINT [PK_Announcements] PRIMARY KEY CLUSTERED ([announcement_id])
);
GO

CREATE TABLE dbo.[Notifications] (
    [notification_id] INT IDENTITY(1,1) NOT NULL,
    [user_id] INT NOT NULL,
    [title] NVARCHAR(200) NULL,
    [content] NVARCHAR(MAX) NULL,
    [notification_type] VARCHAR(50) NULL,
    [is_read] BIT NULL DEFAULT ((0)),
    [created_at] DATETIME NULL DEFAULT (getdate()),
    CONSTRAINT [PK_Notifications] PRIMARY KEY CLUSTERED ([notification_id])
);
GO

CREATE TABLE dbo.[Payments] (
    [payment_id] INT IDENTITY(1,1) NOT NULL,
    [member_id] INT NOT NULL,
    [amount] DECIMAL(10,2) NOT NULL,
    [payment_type] VARCHAR(50) NULL,
    [payment_method] VARCHAR(50) NULL,
    [payment_status] VARCHAR(30) NULL,
    [transaction_code] VARCHAR(100) NULL,
    [payment_date] DATETIME NULL DEFAULT (getdate()),
    CONSTRAINT [PK_Payments] PRIMARY KEY CLUSTERED ([payment_id])
);
GO

CREATE TABLE dbo.[ProgressTrackings] (
    [progress_id] INT IDENTITY(1,1) NOT NULL,
    [member_id] INT NOT NULL,
    [height] FLOAT NULL,
    [weight] FLOAT NULL,
    [body_fat] FLOAT NULL,
    [muscle_mass] FLOAT NULL,
    [recorded_date] DATETIME NULL DEFAULT (getdate()),
    [note] NVARCHAR(300) NULL,
    CONSTRAINT [PK_ProgressTrackings] PRIMARY KEY CLUSTERED ([progress_id])
);
GO

CREATE TABLE dbo.[Reports] (
    [report_id] INT IDENTITY(1,1) NOT NULL,
    [reported_by] INT NOT NULL,
    [reported_user_id] INT NULL,
    [reported_service_id] INT NULL,
    [reported_membership_plan_id] INT NULL,
    [title] NVARCHAR(200) NOT NULL,
    [reason] NVARCHAR(MAX) NOT NULL,
    [status] VARCHAR(30) NULL DEFAULT ('Pending'),
    [created_at] DATETIME NULL DEFAULT (getdate()),
    [resolved_at] DATETIME NULL,
    [admin_note] NVARCHAR(MAX) NULL,
    CONSTRAINT [PK_Reports] PRIMARY KEY CLUSTERED ([report_id])
);
GO

CREATE TABLE dbo.[TrainerCertifications] (
    [certification_id] INT IDENTITY(1,1) NOT NULL,
    [trainer_id] INT NOT NULL,
    [certification_name] NVARCHAR(200) NULL,
    [issued_by] NVARCHAR(200) NULL,
    [issued_date] DATE NULL,
    [expiry_date] DATE NULL,
    CONSTRAINT [PK_TrainerCertifications] PRIMARY KEY CLUSTERED ([certification_id])
);
GO

CREATE TABLE dbo.[ChatMessages] (
    [message_id] INT IDENTITY(1,1) NOT NULL,
    [sender_id] INT NOT NULL,
    [receiver_id] INT NOT NULL,
    [message_content] NVARCHAR(MAX) NULL,
    [sent_at] DATETIME NULL DEFAULT (getdate()),
    [is_seen] BIT NULL DEFAULT ((0)),
    CONSTRAINT [PK_ChatMessages] PRIMARY KEY CLUSTERED ([message_id])
);
GO

CREATE TABLE dbo.[AppConfigs] (
    [config_key] NVARCHAR(100) NOT NULL,
    [config_value] NVARCHAR(MAX) NOT NULL,
    [description] NVARCHAR(255) NULL,
    [updated_at] DATETIMEOFFSET NULL,
    CONSTRAINT [PK_AppConfigs] PRIMARY KEY CLUSTERED ([config_key])
);
GO

CREATE TABLE dbo.[SequelizeMeta] (
    [name] NVARCHAR(255) NOT NULL,
    CONSTRAINT [PK_SequelizeMeta] PRIMARY KEY CLUSTERED ([name])
);
GO

-- ---------------------------------------------------------------------
-- 3. NẠP DỮ LIỆU THỰC TẾ & KHỞI TẠO (DATA INSERTS)
-- ---------------------------------------------------------------------

-- Data for table [Roles] (3 rows)
INSERT INTO dbo.[Roles] ([role_id], [role_name]) VALUES (3, N'Admin');
INSERT INTO dbo.[Roles] ([role_id], [role_name]) VALUES (1, N'Member');
INSERT INTO dbo.[Roles] ([role_id], [role_name]) VALUES (2, N'PT');
GO

-- Data for table [Users] (9 rows)
SET IDENTITY_INSERT dbo.[Users] ON;
INSERT INTO dbo.[Users] ([user_id], [full_name], [email], [password_hash], [phone_number], [gender], [date_of_birth], [role_id], [status], [created_at], [avatar_url], [must_change_password], [email_verification_token]) VALUES (1, N'Admin One', N'admin1@gmail.com', N'$2b$10$HAKmVHxgNT.7/9QqppD94OHc09ubbRgUme/4rd22en95RXhmcjHDK', NULL, NULL, NULL, 3, N'Active', '2026-06-02 10:33:06', NULL, 0, NULL);
INSERT INTO dbo.[Users] ([user_id], [full_name], [email], [password_hash], [phone_number], [gender], [date_of_birth], [role_id], [status], [created_at], [avatar_url], [must_change_password], [email_verification_token]) VALUES (2, N'Quản Trị Viên', N'admin@gym.com', N'$2b$10$B3gr04Hs2BZFRtmUs3ZBouMw02gDE/ToRAm0.COBTy0VYIIdWCHSW', N'0111222333', N'Male', '1990-01-01 00:00:00', 3, N'Active', '2026-06-05 03:07:48', NULL, 0, NULL);
INSERT INTO dbo.[Users] ([user_id], [full_name], [email], [password_hash], [phone_number], [gender], [date_of_birth], [role_id], [status], [created_at], [avatar_url], [must_change_password], [email_verification_token]) VALUES (3, N'HLV Nguyễn Văn A', N'trainer@gym.com', N'$2b$10$SbFRkN2mK1e2titQapx6H.BDp2XAxlq6FOJzBxlo6I2No2h1RQSvm', N'0444555666', N'Male', '1995-05-15 00:00:00', 2, N'Active', '2026-06-05 03:07:48', NULL, 0, NULL);
INSERT INTO dbo.[Users] ([user_id], [full_name], [email], [password_hash], [phone_number], [gender], [date_of_birth], [role_id], [status], [created_at], [avatar_url], [must_change_password], [email_verification_token]) VALUES (4, N'Hội Viên Trần Thị B', N'member@gym.com', N'$2b$10$SbFRkN2mK1e2titQapx6H.BDp2XAxlq6FOJzBxlo6I2No2h1RQSvm', N'0777888999', N'Female', NULL, 1, N'Inactive', '2026-06-05 03:07:48', NULL, 0, NULL);
INSERT INTO dbo.[Users] ([user_id], [full_name], [email], [password_hash], [phone_number], [gender], [date_of_birth], [role_id], [status], [created_at], [avatar_url], [must_change_password], [email_verification_token]) VALUES (23, N'Hoanglan1912a', N'hoanglan1912a@gmail.com', N'$2b$10$.yNla4.PTWcAK12EzqN4/eOk9SIKEy2vQpfpyQVCN5111DBBqUjLW', N'0855157236', NULL, NULL, 1, N'Active', '2026-06-07 22:30:50', NULL, 0, NULL);
INSERT INTO dbo.[Users] ([user_id], [full_name], [email], [password_hash], [phone_number], [gender], [date_of_birth], [role_id], [status], [created_at], [avatar_url], [must_change_password], [email_verification_token]) VALUES (24, N'Hoanglan1912bb', N'hoanglan1912bb@gmail.com', N'$2b$10$7Zjs6NjAaVM9t5.YafHOC.RsCHYkfqQMdJIAiFuVIHCR2nCK3RaxS', N'0855157236', N'Nam', NULL, 1, N'Active', '2026-06-08 10:11:06', NULL, 0, NULL);
INSERT INTO dbo.[Users] ([user_id], [full_name], [email], [password_hash], [phone_number], [gender], [date_of_birth], [role_id], [status], [created_at], [avatar_url], [must_change_password], [email_verification_token]) VALUES (26, N'Bùi Nguyễn Minh Tuệ', N'buinguyenminhtue@gmail.com', N'$2b$10$Xcxe3ZLMOKvTcpfFP5BKZeo4PK1aqixkUYzL2XKfCEntwa0EMUGha', N'123456789', N'Male', '1995-05-15 00:00:00', 2, N'Active', '2026-06-10 07:45:01', NULL, 0, NULL);
INSERT INTO dbo.[Users] ([user_id], [full_name], [email], [password_hash], [phone_number], [gender], [date_of_birth], [role_id], [status], [created_at], [avatar_url], [must_change_password], [email_verification_token]) VALUES (31, N'mie', N'nguyenngochuongmy2306@gmail.com', N'$2b$10$FBCv3/fUliZbmXZlDR/ffOMcSi0qh3CRq2zlPeqPgBzcC2Vqhhz.a', NULL, NULL, NULL, 2, N'Active', '2026-06-21 20:32:35', NULL, 0, NULL);
INSERT INTO dbo.[Users] ([user_id], [full_name], [email], [password_hash], [phone_number], [gender], [date_of_birth], [role_id], [status], [created_at], [avatar_url], [must_change_password], [email_verification_token]) VALUES (66, N'hương my', N'nguyenngochuongmy23062005@gmail.com', N'$2b$10$m4osBCB6d/.cG8ApxaUpu..6vxyGtAPeNWcI.nLuZYyHH0682UCmW', N'0899603387', N'Nữ', '2026-07-15 00:00:00', 1, N'Active', '2026-07-19 21:08:42', NULL, 0, NULL);
SET IDENTITY_INSERT dbo.[Users] OFF;
GO

-- Data for table [Members] (5 rows)
SET IDENTITY_INSERT dbo.[Members] ON;
INSERT INTO dbo.[Members] ([member_id], [user_id], [height], [weight], [fitness_goal], [emergency_contact], [joined_date], [fitness_level]) VALUES (1, 4, 1.9, 80, N'Tăng cơ', N'0999888777', '2026-06-05 00:00:00', N'Người mới bắt đầu');
INSERT INTO dbo.[Members] ([member_id], [user_id], [height], [weight], [fitness_goal], [emergency_contact], [joined_date], [fitness_level]) VALUES (19, 23, NULL, NULL, NULL, NULL, '2026-06-07 00:00:00', NULL);
INSERT INTO dbo.[Members] ([member_id], [user_id], [height], [weight], [fitness_goal], [emergency_contact], [joined_date], [fitness_level]) VALUES (20, 24, 1.9, 80, N'Tăng cơ', N'', '2026-06-08 00:00:00', N'Người mới bắt đầu');
INSERT INTO dbo.[Members] ([member_id], [user_id], [height], [weight], [fitness_goal], [emergency_contact], [joined_date], [fitness_level]) VALUES (27, 26, NULL, NULL, NULL, NULL, '2026-07-14 00:00:00', NULL);
INSERT INTO dbo.[Members] ([member_id], [user_id], [height], [weight], [fitness_goal], [emergency_contact], [joined_date], [fitness_level]) VALUES (48, 66, 1.54, 50, N'Giảm cân', NULL, '2026-07-19 00:00:00', N'Trung cấp');
SET IDENTITY_INSERT dbo.[Members] OFF;
GO

-- Data for table [Trainers] (3 rows)
SET IDENTITY_INSERT dbo.[Trainers] ON;
INSERT INTO dbo.[Trainers] ([trainer_id], [user_id], [specialization], [experience_years], [experience_description], [bio], [rating]) VALUES (1, 3, N'Fitness & Bodybuilding', 5, N'Nhiều năm kinh nghiệm giảng dạy cá nhân', N'Nhiệt tình, chu đáo', 5);
INSERT INTO dbo.[Trainers] ([trainer_id], [user_id], [specialization], [experience_years], [experience_description], [bio], [rating]) VALUES (2, 26, N'Fitness & Bodybuilding', 5, N'Nhiều năm kinh nghiệm giảng dạy cá nhân', N'Nhiệt tình, chu đáo', 5);
INSERT INTO dbo.[Trainers] ([trainer_id], [user_id], [specialization], [experience_years], [experience_description], [bio], [rating]) VALUES (6, 31, N'yoga', 12, NULL, N'pro', 5);
SET IDENTITY_INSERT dbo.[Trainers] OFF;
GO

-- Data for table [MembershipPlans] (17 rows)
SET IDENTITY_INSERT dbo.[MembershipPlans] ON;
INSERT INTO dbo.[MembershipPlans] ([membership_plan_id], [plan_name], [sport_type], [duration_months], [price], [description], [status]) VALUES (1, N'Gym 3 Tháng', N'Gym', 3, 3000000, N'Truy cập đầy đủ thiết bị Gym. Tặng 2 buổi PT miễn phí (không chọn PT). Đo inbody định kỳ.', N'Active');
INSERT INTO dbo.[MembershipPlans] ([membership_plan_id], [plan_name], [sport_type], [duration_months], [price], [description], [status]) VALUES (2, N'Gym 6 Tháng', N'Gym', 6, 5500000, N'Truy cập đầy đủ thiết bị Gym. Tặng 2 buổi PT miễn phí (không chọn PT). Đo inbody định kỳ.', N'Active');
INSERT INTO dbo.[MembershipPlans] ([membership_plan_id], [plan_name], [sport_type], [duration_months], [price], [description], [status]) VALUES (3, N'Yoga 6 Tháng', N'Yoga', 6, 6500000, N'Thoải mái tham gia các lớp Yoga hàng tuần. Tặng 2 buổi PT Yoga miễn phí (không chọn PT).', N'Active');
INSERT INTO dbo.[MembershipPlans] ([membership_plan_id], [plan_name], [sport_type], [duration_months], [price], [description], [status]) VALUES (4, N'Boxing 12 Tháng', N'Boxing', 12, 14000000, N'Truy cập phòng Boxing. Tặng 2 buổi PT Boxing miễn phí (không chọn PT).', N'Active');
INSERT INTO dbo.[MembershipPlans] ([membership_plan_id], [plan_name], [sport_type], [duration_months], [price], [description], [status]) VALUES (5, N'Premium Toàn Diện 12 Tháng', N'Mixed', 12, 60000, N'Sử dụng tất cả dịch vụ Gym, Yoga, Boxing', N'Active');
INSERT INTO dbo.[MembershipPlans] ([membership_plan_id], [plan_name], [sport_type], [duration_months], [price], [description], [status]) VALUES (6, N'Gym 3 Tháng', N'Gym', 3, 5000, N'Trải nghiệm phòng tập đẳng cấp với đầy đủ thiết bị hiện đại nhất.', N'Active');
INSERT INTO dbo.[MembershipPlans] ([membership_plan_id], [plan_name], [sport_type], [duration_months], [price], [description], [status]) VALUES (7, N'Gym 6 Tháng', N'Gym', 6, 10000, N'Gói phổ biến nhất, tiết kiệm chi phí và xây dựng thói quen lâu dài.', N'Active');
INSERT INTO dbo.[MembershipPlans] ([membership_plan_id], [plan_name], [sport_type], [duration_months], [price], [description], [status]) VALUES (8, N'Gym 12 Tháng', N'Gym', 12, 10000000, N'Truy cập đầy đủ thiết bị Gym. Tặng 2 buổi PT miễn phí (không chọn PT). Đo inbody định kỳ.', N'Active');
INSERT INTO dbo.[MembershipPlans] ([membership_plan_id], [plan_name], [sport_type], [duration_months], [price], [description], [status]) VALUES (9, N'Yoga 3 Tháng', N'Yoga', 3, 3500000, N'Thoải mái tham gia các lớp Yoga hàng tuần. Tặng 2 buổi PT Yoga miễn phí (không chọn PT).', N'Active');
INSERT INTO dbo.[MembershipPlans] ([membership_plan_id], [plan_name], [sport_type], [duration_months], [price], [description], [status]) VALUES (10, N'Yoga 6 Tháng', N'Yoga', 6, 10000, N'Tìm lại sự cân bằng, phù hợp cho người mới bắt đầu.', N'Active');
INSERT INTO dbo.[MembershipPlans] ([membership_plan_id], [plan_name], [sport_type], [duration_months], [price], [description], [status]) VALUES (11, N'Yoga 12 Tháng', N'Yoga', 12, 12000000, N'Thoải mái tham gia các lớp Yoga hàng tuần. Tặng 2 buổi PT Yoga miễn phí (không chọn PT).', N'Active');
INSERT INTO dbo.[MembershipPlans] ([membership_plan_id], [plan_name], [sport_type], [duration_months], [price], [description], [status]) VALUES (12, N'Boxing 3 Tháng', N'Boxing', 3, 4000000, N'Truy cập phòng Boxing. Tặng 2 buổi PT Boxing miễn phí (không chọn PT).', N'Active');
INSERT INTO dbo.[MembershipPlans] ([membership_plan_id], [plan_name], [sport_type], [duration_months], [price], [description], [status]) VALUES (13, N'Boxing 6 Tháng', N'Boxing', 6, 7500000, N'Truy cập phòng Boxing. Tặng 2 buổi PT Boxing miễn phí (không chọn PT).', N'Active');
INSERT INTO dbo.[MembershipPlans] ([membership_plan_id], [plan_name], [sport_type], [duration_months], [price], [description], [status]) VALUES (14, N'Boxing 12 Tháng', N'Boxing', 12, 15000, N'Trở thành phiên bản mạnh mẽ nhất của chính mình.', N'Active');
INSERT INTO dbo.[MembershipPlans] ([membership_plan_id], [plan_name], [sport_type], [duration_months], [price], [description], [status]) VALUES (15, N'Zumba 3 Tháng', N'Mixed', 3, 5000, N'L?p h?c Zumba sôi d?ng gi?i phóng nang lu?ng co th?.', N'Inactive');
INSERT INTO dbo.[MembershipPlans] ([membership_plan_id], [plan_name], [sport_type], [duration_months], [price], [description], [status]) VALUES (16, N'Zumba 6 Tháng', N'Mixed', 6, 10000, N'L?p h?c Zumba trung c?p cùng các HLV hàng d?u.', N'Inactive');
INSERT INTO dbo.[MembershipPlans] ([membership_plan_id], [plan_name], [sport_type], [duration_months], [price], [description], [status]) VALUES (17, N'Zumba 12 Tháng', N'Mixed', 12, 15000, N'Hành trình 1 nam Zumba r?c r? và tràn d?y ni?m vui.', N'Inactive');
SET IDENTITY_INSERT dbo.[MembershipPlans] OFF;
GO

-- Data for table [Services] (46 rows)
SET IDENTITY_INSERT dbo.[Services] ON;
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (1, N'Dịch vụ PT 1 kèm 1', N'Personal Training', N'Hỗ trợ tập luyện cùng HLV cá nhân', 500000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (2, N'Phòng Xông Hơi Sauna', N'Recovery', N'Sử dụng phòng xông hơi ướt và khô', 300000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (3, N'Căng Cơ Chuyên Sâu', N'Recovery', N'HLV hỗ trợ giãn cơ sau tập luyện', 250000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (4, N'Massage Thư Giãn', N'Recovery', N'Massage trị liệu phục hồi cơ bắp', 400000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (5, N'Dịch vụ Khăn Tập', N'Daily Utility', N'Cung cấp khăn sạch mỗi ngày khi đến tập', 150000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (6, N'Dịch vụ PT 1 kèm 1', N'Personal Training', N'Hỗ trợ tập luyện cùng HLV cá nhân', 500000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (7, N'Phòng Xông Hơi Sauna', N'Recovery', N'Sử dụng phòng xông hơi ướt và khô', 300000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (8, N'Căng Cơ Chuyên Sâu', N'Recovery', N'HLV hỗ trợ giãn cơ sau tập luyện', 250000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (9, N'Massage Thư Giãn', N'Recovery', N'Massage trị liệu phục hồi cơ bắp', 400000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (10, N'Dịch vụ Khăn Tập', N'Daily Utility', N'Cung cấp khăn sạch mỗi ngày khi đến tập', 150000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (11, N'Dịch vụ PT 1 kèm 1', N'Personal Training', N'Hỗ trợ tập luyện cùng HLV cá nhân', 500000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (12, N'Phòng Xông Hơi Sauna', N'Recovery', N'Sử dụng phòng xông hơi ướt và khô', 300000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (13, N'Căng Cơ Chuyên Sâu', N'Recovery', N'HLV hỗ trợ giãn cơ sau tập luyện', 250000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (14, N'Massage Thư Giãn', N'Recovery', N'Massage trị liệu phục hồi cơ bắp', 400000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (15, N'Dịch vụ Khăn Tập', N'Daily Utility', N'Cung cấp khăn sạch mỗi ngày khi đến tập', 150000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (16, N'Dịch vụ PT 1 kèm 1', N'Personal Training', N'Hỗ trợ tập luyện cùng HLV cá nhân', 500000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (17, N'Phòng Xông Hơi Sauna', N'Recovery', N'Sử dụng phòng xông hơi ướt và khô', 300000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (18, N'Căng Cơ Chuyên Sâu', N'Recovery', N'HLV hỗ trợ giãn cơ sau tập luyện', 250000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (19, N'Massage Thư Giãn', N'Recovery', N'Massage trị liệu phục hồi cơ bắp', 400000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (20, N'Dịch vụ Khăn Tập', N'Daily Utility', N'Cung cấp khăn sạch mỗi ngày khi đến tập', 150000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (21, N'Dịch vụ PT 1 kèm 1', N'Personal Training', N'Hỗ trợ tập luyện cùng HLV cá nhân', 500000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (22, N'Phòng Xông Hơi Sauna', N'Recovery', N'Sử dụng phòng xông hơi ướt và khô', 300000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (23, N'Căng Cơ Chuyên Sâu', N'Recovery', N'HLV hỗ trợ giãn cơ sau tập luyện', 250000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (24, N'Massage Thư Giãn', N'Recovery', N'Massage trị liệu phục hồi cơ bắp', 400000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (25, N'Dịch vụ Khăn Tập', N'Daily Utility', N'Cung cấp khăn sạch mỗi ngày khi đến tập', 150000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (26, N'Dịch vụ PT 1 kèm 1', N'Personal Training', N'Hỗ trợ tập luyện cùng HLV cá nhân', 500000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (27, N'Phòng Xông Hơi Sauna', N'Recovery', N'Sử dụng phòng xông hơi ướt và khô', 300000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (28, N'Căng Cơ Chuyên Sâu', N'Recovery', N'HLV hỗ trợ giãn cơ sau tập luyện', 250000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (29, N'Massage Thư Giãn', N'Recovery', N'Massage trị liệu phục hồi cơ bắp', 400000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (30, N'Dịch vụ Khăn Tập', N'Daily Utility', N'Cung cấp khăn sạch mỗi ngày khi đến tập', 150000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (31, N'Dịch vụ PT 1 kèm 1', N'Personal Training', N'Hỗ trợ tập luyện cùng HLV cá nhân', 500000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (32, N'Phòng Xông Hơi Sauna', N'Recovery', N'Sử dụng phòng xông hơi ướt và khô', 300000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (33, N'Căng Cơ Chuyên Sâu', N'Recovery', N'HLV hỗ trợ giãn cơ sau tập luyện', 250000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (34, N'Massage Thư Giãn', N'Recovery', N'Massage trị liệu phục hồi cơ bắp', 400000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (35, N'Dịch vụ Khăn Tập', N'Daily Utility', N'Cung cấp khăn sạch mỗi ngày khi đến tập', 150000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (36, N'Thuê PT (10 buổi)', N'Huấn luyện', N'Tập luyện 1 kèm 1 theo lộ trình cơ bản, làm quen kỹ thuật.', 5000000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (37, N'Thuê PT (20 buổi)', N'Huấn luyện', N'Lộ trình chuyên sâu, cải thiện vóc dáng rõ rệt.', 9000000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (38, N'Thuê PT dài hạn (3 tháng)', N'Huấn luyện', N'Đồng hành 3 tháng liên tục, xây dựng chế độ dinh dưỡng chuyên biệt.', 12000000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (39, N'Thuê PT dài hạn (6 tháng)', N'Huấn luyện', N'Thay đổi toàn diện, phá vỡ giới hạn bản thân cùng PT.', 22000000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (40, N'Thuê PT dài hạn (9 tháng)', N'Huấn luyện', N'Gói cam kết hình thể dài hạn, tối ưu hóa sức khỏe trọn vẹn.', 30000000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (41, N'Thuê Khăn (1 tháng)', N'Tiện ích', N'Cung cấp khăn sạch mỗi buổi tập.', 200000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (42, N'Gói Nước Uống (1 tháng)', N'Tiện ích', N'Sử dụng nước uống thả ga không giới hạn.', 150000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (43, N'Phòng Xông Hơi (1 tháng)', N'Tiện ích', N'Tự do sử dụng phòng xông hơi ướt/khô.', 400000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (44, N'Giãn cơ Massage (1 tháng)', N'Tiện ích', N'Dịch vụ giãn cơ và massage sau các buổi tập.', 1000000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (45, N'Thuê PT (15 buổi)', N'Huấn luyện', N'Được quyền CHỌN huấn luyện viên riêng. Tập luyện 1 kèm 1 theo lộ trình thiết kế.', 7500000, N'Available');
INSERT INTO dbo.[Services] ([service_id], [service_name], [service_type], [description], [price], [status]) VALUES (46, N'Thuê PT (30 buổi)', N'Huấn luyện', N'Được quyền CHỌN huấn luyện viên riêng. Tập luyện 1 kèm 1 theo lộ trình chuyên sâu.', 14000000, N'Available');
SET IDENTITY_INSERT dbo.[Services] OFF;
GO

-- Data for table [MemberMemberships] (5 rows)
SET IDENTITY_INSERT dbo.[MemberMemberships] ON;
INSERT INTO dbo.[MemberMemberships] ([member_membership_id], [member_id], [membership_plan_id], [start_date], [end_date], [membership_status]) VALUES (10, 19, 1, '2026-06-07 00:00:00', '2026-09-07 00:00:00', N'Active');
INSERT INTO dbo.[MemberMemberships] ([member_membership_id], [member_id], [membership_plan_id], [start_date], [end_date], [membership_status]) VALUES (11, 19, 1, '2026-06-07 00:00:00', '2026-09-07 00:00:00', N'Active');
INSERT INTO dbo.[MemberMemberships] ([member_membership_id], [member_id], [membership_plan_id], [start_date], [end_date], [membership_status]) VALUES (12, 20, 1, '2026-06-08 00:00:00', '2027-06-08 00:00:00', N'Active');
INSERT INTO dbo.[MemberMemberships] ([member_membership_id], [member_id], [membership_plan_id], [start_date], [end_date], [membership_status]) VALUES (15, 20, 9, '2026-06-22 00:00:00', '2026-09-22 00:00:00', N'Active');
INSERT INTO dbo.[MemberMemberships] ([member_membership_id], [member_id], [membership_plan_id], [start_date], [end_date], [membership_status]) VALUES (27, 48, 5, '2026-07-19 00:00:00', '2027-07-19 00:00:00', N'Active');
SET IDENTITY_INSERT dbo.[MemberMemberships] OFF;
GO

-- Data for table [MemberServices] (7 rows)
SET IDENTITY_INSERT dbo.[MemberServices] ON;
INSERT INTO dbo.[MemberServices] ([member_service_id], [member_id], [service_id], [start_date], [end_date], [service_status], [session_count]) VALUES (1, 20, 44, '2026-07-14 00:00:00', '2026-08-14 00:00:00', N'Active', 0);
INSERT INTO dbo.[MemberServices] ([member_service_id], [member_id], [service_id], [start_date], [end_date], [service_status], [session_count]) VALUES (2, 20, 35, '2026-07-14 00:00:00', '2026-08-14 00:00:00', N'Active', 0);
INSERT INTO dbo.[MemberServices] ([member_service_id], [member_id], [service_id], [start_date], [end_date], [service_status], [session_count]) VALUES (3, 20, 32, '2026-07-14 00:00:00', '2026-08-14 00:00:00', N'Active', 0);
INSERT INTO dbo.[MemberServices] ([member_service_id], [member_id], [service_id], [start_date], [end_date], [service_status], [session_count]) VALUES (4, 27, 42, '2026-07-14 00:00:00', '2026-08-14 00:00:00', N'Active', 0);
INSERT INTO dbo.[MemberServices] ([member_service_id], [member_id], [service_id], [start_date], [end_date], [service_status], [session_count]) VALUES (5, 27, 43, '2026-07-14 00:00:00', '2026-08-14 00:00:00', N'Active', 0);
INSERT INTO dbo.[MemberServices] ([member_service_id], [member_id], [service_id], [start_date], [end_date], [service_status], [session_count]) VALUES (6, 20, 42, '2026-07-14 00:00:00', '2026-08-14 00:00:00', N'Active', 0);
INSERT INTO dbo.[MemberServices] ([member_service_id], [member_id], [service_id], [start_date], [end_date], [service_status], [session_count]) VALUES (9, 48, 3, '2026-07-19 00:00:00', '2027-07-19 00:00:00', N'Active', 0);
SET IDENTITY_INSERT dbo.[MemberServices] OFF;
GO

-- Data for table [MemberTrainerPackages] (1 rows)
SET IDENTITY_INSERT dbo.[MemberTrainerPackages] ON;
INSERT INTO dbo.[MemberTrainerPackages] ([package_id], [member_id], [trainer_id], [total_sessions], [used_sessions], [is_active], [created_at]) VALUES (7, 20, 2, 12, 0, 1, '2026-07-14 22:13:33');
SET IDENTITY_INSERT dbo.[MemberTrainerPackages] OFF;
GO

-- Data for table [TrainerSchedules] (38 rows)
SET IDENTITY_INSERT dbo.[TrainerSchedules] ON;
INSERT INTO dbo.[TrainerSchedules] ([schedule_id], [trainer_id], [working_date], [start_time], [end_time], [availability_status]) VALUES (7, 1, '2026-06-08 00:00:00', '1970-01-01 09:00:00', '1970-01-01 10:30:00', N'Busy');
INSERT INTO dbo.[TrainerSchedules] ([schedule_id], [trainer_id], [working_date], [start_time], [end_time], [availability_status]) VALUES (8, 1, '2026-06-08 00:00:00', '1970-01-01 15:00:00', '1970-01-01 16:30:00', N'Busy');
INSERT INTO dbo.[TrainerSchedules] ([schedule_id], [trainer_id], [working_date], [start_time], [end_time], [availability_status]) VALUES (9, 1, '2026-06-09 00:00:00', '1970-01-01 17:00:00', '1970-01-01 18:30:00', N'Available');
INSERT INTO dbo.[TrainerSchedules] ([schedule_id], [trainer_id], [working_date], [start_time], [end_time], [availability_status]) VALUES (10, 2, '2026-06-18 00:00:00', '1970-01-01 07:00:00', '1970-01-01 08:30:00', N'Available');
INSERT INTO dbo.[TrainerSchedules] ([schedule_id], [trainer_id], [working_date], [start_time], [end_time], [availability_status]) VALUES (11, 1, '2026-06-19 00:00:00', '1970-01-01 08:00:00', '1970-01-01 09:30:00', N'Available');
INSERT INTO dbo.[TrainerSchedules] ([schedule_id], [trainer_id], [working_date], [start_time], [end_time], [availability_status]) VALUES (12, 2, '2026-06-19 00:00:00', '1970-01-01 09:00:00', '1970-01-01 10:30:00', N'Available');
INSERT INTO dbo.[TrainerSchedules] ([schedule_id], [trainer_id], [working_date], [start_time], [end_time], [availability_status]) VALUES (13, 2, '2026-06-26 00:00:00', '1970-01-01 09:00:00', '1970-01-01 10:30:00', N'Available');
INSERT INTO dbo.[TrainerSchedules] ([schedule_id], [trainer_id], [working_date], [start_time], [end_time], [availability_status]) VALUES (14, 2, '2026-06-28 00:00:00', '1970-01-01 09:00:00', '1970-01-01 10:30:00', N'Available');
INSERT INTO dbo.[TrainerSchedules] ([schedule_id], [trainer_id], [working_date], [start_time], [end_time], [availability_status]) VALUES (15, 2, '2026-07-27 00:00:00', '1970-01-01 07:00:00', '1970-01-01 08:30:00', N'Available');
INSERT INTO dbo.[TrainerSchedules] ([schedule_id], [trainer_id], [working_date], [start_time], [end_time], [availability_status]) VALUES (16, 1, '2026-06-30 00:00:00', '1970-01-01 07:00:00', '1970-01-01 08:30:00', N'Available');
INSERT INTO dbo.[TrainerSchedules] ([schedule_id], [trainer_id], [working_date], [start_time], [end_time], [availability_status]) VALUES (17, 2, '2026-06-30 00:00:00', '1970-01-01 07:00:00', '1970-01-01 08:30:00', N'Busy');
INSERT INTO dbo.[TrainerSchedules] ([schedule_id], [trainer_id], [working_date], [start_time], [end_time], [availability_status]) VALUES (18, 2, '2026-06-24 00:00:00', '1970-01-01 07:00:00', '1970-01-01 08:30:00', N'Available');
INSERT INTO dbo.[TrainerSchedules] ([schedule_id], [trainer_id], [working_date], [start_time], [end_time], [availability_status]) VALUES (19, 2, '2026-06-27 00:00:00', '1970-01-01 14:00:00', '1970-01-01 15:30:00', N'Busy');
INSERT INTO dbo.[TrainerSchedules] ([schedule_id], [trainer_id], [working_date], [start_time], [end_time], [availability_status]) VALUES (20, 2, '2026-06-23 00:00:00', '1970-01-01 16:00:00', '1970-01-01 17:30:00', N'Available');
INSERT INTO dbo.[TrainerSchedules] ([schedule_id], [trainer_id], [working_date], [start_time], [end_time], [availability_status]) VALUES (21, 2, '2026-06-26 00:00:00', '1970-01-01 08:00:00', '1970-01-01 09:30:00', N'Busy');
INSERT INTO dbo.[TrainerSchedules] ([schedule_id], [trainer_id], [working_date], [start_time], [end_time], [availability_status]) VALUES (22, 2, '2026-06-25 00:00:00', '1970-01-01 10:00:00', '1970-01-01 11:30:00', N'Available');
INSERT INTO dbo.[TrainerSchedules] ([schedule_id], [trainer_id], [working_date], [start_time], [end_time], [availability_status]) VALUES (23, 2, '2026-06-30 00:00:00', '1970-01-01 14:00:00', '1970-01-01 15:30:00', N'Busy');
INSERT INTO dbo.[TrainerSchedules] ([schedule_id], [trainer_id], [working_date], [start_time], [end_time], [availability_status]) VALUES (25, 2, '2026-06-30 00:00:00', '1970-01-01 11:00:00', '1970-01-01 12:30:00', N'Busy');
INSERT INTO dbo.[TrainerSchedules] ([schedule_id], [trainer_id], [working_date], [start_time], [end_time], [availability_status]) VALUES (59, 2, '2026-07-01 00:00:00', '1970-01-01 09:00:00', '1970-01-01 10:30:00', N'Busy');
INSERT INTO dbo.[TrainerSchedules] ([schedule_id], [trainer_id], [working_date], [start_time], [end_time], [availability_status]) VALUES (97, 2, '2026-07-02 00:00:00', '1970-01-01 11:00:00', '1970-01-01 12:30:00', N'Busy');
INSERT INTO dbo.[TrainerSchedules] ([schedule_id], [trainer_id], [working_date], [start_time], [end_time], [availability_status]) VALUES (98, 2, '2026-07-04 00:00:00', '1970-01-01 05:00:00', '1970-01-01 06:30:00', N'Busy');
INSERT INTO dbo.[TrainerSchedules] ([schedule_id], [trainer_id], [working_date], [start_time], [end_time], [availability_status]) VALUES (99, 2, '2026-07-01 00:00:00', '1970-01-01 11:00:00', '1970-01-01 12:30:00', N'Busy');
INSERT INTO dbo.[TrainerSchedules] ([schedule_id], [trainer_id], [working_date], [start_time], [end_time], [availability_status]) VALUES (100, 2, '2026-07-01 00:00:00', '1970-01-01 14:00:00', '1970-01-01 15:30:00', N'Busy');
INSERT INTO dbo.[TrainerSchedules] ([schedule_id], [trainer_id], [working_date], [start_time], [end_time], [availability_status]) VALUES (101, 2, '2026-07-04 00:00:00', '1970-01-01 16:00:00', '1970-01-01 17:30:00', N'Busy');
INSERT INTO dbo.[TrainerSchedules] ([schedule_id], [trainer_id], [working_date], [start_time], [end_time], [availability_status]) VALUES (102, 2, '2026-07-04 00:00:00', '1970-01-01 14:00:00', '1970-01-01 15:30:00', N'Busy');
INSERT INTO dbo.[TrainerSchedules] ([schedule_id], [trainer_id], [working_date], [start_time], [end_time], [availability_status]) VALUES (103, 2, '2026-07-08 00:00:00', '1970-01-01 05:00:00', '1970-01-01 06:30:00', N'Busy');
INSERT INTO dbo.[TrainerSchedules] ([schedule_id], [trainer_id], [working_date], [start_time], [end_time], [availability_status]) VALUES (104, 2, '2026-07-11 00:00:00', '1970-01-01 11:00:00', '1970-01-01 12:30:00', N'Busy');
INSERT INTO dbo.[TrainerSchedules] ([schedule_id], [trainer_id], [working_date], [start_time], [end_time], [availability_status]) VALUES (105, 2, '2026-07-11 00:00:00', '1970-01-01 14:00:00', '1970-01-01 15:30:00', N'Busy');
INSERT INTO dbo.[TrainerSchedules] ([schedule_id], [trainer_id], [working_date], [start_time], [end_time], [availability_status]) VALUES (106, 2, '2026-07-08 00:00:00', '1970-01-01 09:00:00', '1970-01-01 10:30:00', N'Available');
INSERT INTO dbo.[TrainerSchedules] ([schedule_id], [trainer_id], [working_date], [start_time], [end_time], [availability_status]) VALUES (107, 2, '2026-07-09 00:00:00', '1970-01-01 11:00:00', '1970-01-01 12:30:00', N'Available');
INSERT INTO dbo.[TrainerSchedules] ([schedule_id], [trainer_id], [working_date], [start_time], [end_time], [availability_status]) VALUES (108, 2, '2026-07-09 00:00:00', '1970-01-01 05:00:00', '1970-01-01 06:30:00', N'Available');
INSERT INTO dbo.[TrainerSchedules] ([schedule_id], [trainer_id], [working_date], [start_time], [end_time], [availability_status]) VALUES (109, 2, '2026-07-10 00:00:00', '1970-01-01 20:00:00', '1970-01-01 21:30:00', N'Busy');
INSERT INTO dbo.[TrainerSchedules] ([schedule_id], [trainer_id], [working_date], [start_time], [end_time], [availability_status]) VALUES (110, 2, '2026-07-14 00:00:00', '1970-01-01 11:00:00', '1970-01-01 12:30:00', N'Available');
INSERT INTO dbo.[TrainerSchedules] ([schedule_id], [trainer_id], [working_date], [start_time], [end_time], [availability_status]) VALUES (111, 2, '2026-07-15 00:00:00', '1970-01-01 05:00:00', '1970-01-01 06:30:00', N'Available');
INSERT INTO dbo.[TrainerSchedules] ([schedule_id], [trainer_id], [working_date], [start_time], [end_time], [availability_status]) VALUES (112, 2, '2026-07-17 00:00:00', '1970-01-01 11:00:00', '1970-01-01 12:30:00', N'Busy');
INSERT INTO dbo.[TrainerSchedules] ([schedule_id], [trainer_id], [working_date], [start_time], [end_time], [availability_status]) VALUES (117, 1, '2026-07-20 00:00:00', '1970-01-01 00:00:00', '1970-01-01 23:59:59', N'Off');
INSERT INTO dbo.[TrainerSchedules] ([schedule_id], [trainer_id], [working_date], [start_time], [end_time], [availability_status]) VALUES (118, 2, '2026-07-19 00:00:00', '1970-01-01 00:00:00', '1970-01-01 23:59:59', N'Off');
INSERT INTO dbo.[TrainerSchedules] ([schedule_id], [trainer_id], [working_date], [start_time], [end_time], [availability_status]) VALUES (119, 2, '2026-07-21 00:00:00', '1970-01-01 00:00:00', '1970-01-01 23:59:59', N'Off');
SET IDENTITY_INSERT dbo.[TrainerSchedules] OFF;
GO

-- Data for table [Appointments] (28 rows)
SET IDENTITY_INSERT dbo.[Appointments] ON;
INSERT INTO dbo.[Appointments] ([appointment_id], [member_id], [schedule_id], [status], [note], [created_at], [cancel_reason], [cancel_requested_at], [cancel_requested_by]) VALUES (4, 1, 7, N'CancelPending', N'Tập trung tập bụng và đùi', '2026-06-08 11:22:49', N'Test lý do hủy', '2026-07-08 09:19:46', NULL);
INSERT INTO dbo.[Appointments] ([appointment_id], [member_id], [schedule_id], [status], [note], [created_at], [cancel_reason], [cancel_requested_at], [cancel_requested_by]) VALUES (5, 1, 8, N'Confirmed', N'Bài tập thể lực Cardio nhẹ', '2026-06-08 11:22:49', NULL, NULL, NULL);
INSERT INTO dbo.[Appointments] ([appointment_id], [member_id], [schedule_id], [status], [note], [created_at], [cancel_reason], [cancel_requested_at], [cancel_requested_by]) VALUES (6, 19, 10, N'Cancelled', N'oke', '2026-06-17 08:00:45', NULL, NULL, NULL);
INSERT INTO dbo.[Appointments] ([appointment_id], [member_id], [schedule_id], [status], [note], [created_at], [cancel_reason], [cancel_requested_at], [cancel_requested_by]) VALUES (7, 19, 11, N'Cancelled', N'oke', '2026-06-17 08:02:15', NULL, NULL, NULL);
INSERT INTO dbo.[Appointments] ([appointment_id], [member_id], [schedule_id], [status], [note], [created_at], [cancel_reason], [cancel_requested_at], [cancel_requested_by]) VALUES (8, 20, 12, N'Cancelled', N'oke', '2026-06-17 08:03:51', NULL, NULL, NULL);
INSERT INTO dbo.[Appointments] ([appointment_id], [member_id], [schedule_id], [status], [note], [created_at], [cancel_reason], [cancel_requested_at], [cancel_requested_by]) VALUES (9, 20, 13, N'Cancelled', N'oke', '2026-06-17 08:04:24', NULL, NULL, NULL);
INSERT INTO dbo.[Appointments] ([appointment_id], [member_id], [schedule_id], [status], [note], [created_at], [cancel_reason], [cancel_requested_at], [cancel_requested_by]) VALUES (10, 20, 14, N'Cancelled', N'12', '2026-06-17 08:13:17', NULL, NULL, NULL);
INSERT INTO dbo.[Appointments] ([appointment_id], [member_id], [schedule_id], [status], [note], [created_at], [cancel_reason], [cancel_requested_at], [cancel_requested_by]) VALUES (11, 20, 15, N'Cancelled', N'123', '2026-06-17 08:22:58', NULL, NULL, NULL);
INSERT INTO dbo.[Appointments] ([appointment_id], [member_id], [schedule_id], [status], [note], [created_at], [cancel_reason], [cancel_requested_at], [cancel_requested_by]) VALUES (12, 20, 16, N'Cancelled', N'111', '2026-06-17 08:24:01', NULL, NULL, NULL);
INSERT INTO dbo.[Appointments] ([appointment_id], [member_id], [schedule_id], [status], [note], [created_at], [cancel_reason], [cancel_requested_at], [cancel_requested_by]) VALUES (13, 20, 17, N'Cancelled', N'111', '2026-06-17 08:24:24', NULL, NULL, NULL);
INSERT INTO dbo.[Appointments] ([appointment_id], [member_id], [schedule_id], [status], [note], [created_at], [cancel_reason], [cancel_requested_at], [cancel_requested_by]) VALUES (14, 20, 18, N'Cancelled', N'123', '2026-06-17 08:29:11', NULL, NULL, NULL);
INSERT INTO dbo.[Appointments] ([appointment_id], [member_id], [schedule_id], [status], [note], [created_at], [cancel_reason], [cancel_requested_at], [cancel_requested_by]) VALUES (15, 20, 19, N'Confirmed', N'helo', '2026-06-19 11:10:40', NULL, NULL, NULL);
INSERT INTO dbo.[Appointments] ([appointment_id], [member_id], [schedule_id], [status], [note], [created_at], [cancel_reason], [cancel_requested_at], [cancel_requested_by]) VALUES (16, 20, 20, N'Cancelled', N'tới đúng h', '2026-06-21 20:38:54', NULL, NULL, NULL);
INSERT INTO dbo.[Appointments] ([appointment_id], [member_id], [schedule_id], [status], [note], [created_at], [cancel_reason], [cancel_requested_at], [cancel_requested_by]) VALUES (17, 20, 21, N'Confirmed', N'oke', '2026-06-22 09:54:18', NULL, NULL, NULL);
INSERT INTO dbo.[Appointments] ([appointment_id], [member_id], [schedule_id], [status], [note], [created_at], [cancel_reason], [cancel_requested_at], [cancel_requested_by]) VALUES (18, 20, 22, N'Cancelled', N'oke', '2026-06-22 10:01:58', NULL, NULL, NULL);
INSERT INTO dbo.[Appointments] ([appointment_id], [member_id], [schedule_id], [status], [note], [created_at], [cancel_reason], [cancel_requested_at], [cancel_requested_by]) VALUES (19, 20, 23, N'Confirmed', N'zzz', '2026-06-22 10:12:19', NULL, NULL, NULL);
INSERT INTO dbo.[Appointments] ([appointment_id], [member_id], [schedule_id], [status], [note], [created_at], [cancel_reason], [cancel_requested_at], [cancel_requested_by]) VALUES (20, 20, 25, N'Confirmed', N'ads', '2026-06-29 11:05:22', NULL, NULL, NULL);
INSERT INTO dbo.[Appointments] ([appointment_id], [member_id], [schedule_id], [status], [note], [created_at], [cancel_reason], [cancel_requested_at], [cancel_requested_by]) VALUES (22, 20, 59, N'Confirmed', N'qưe', '2026-06-29 11:32:01', NULL, NULL, NULL);
INSERT INTO dbo.[Appointments] ([appointment_id], [member_id], [schedule_id], [status], [note], [created_at], [cancel_reason], [cancel_requested_at], [cancel_requested_by]) VALUES (23, 20, 97, N'Confirmed', N'kkk', '2026-07-01 08:08:52', NULL, NULL, NULL);
INSERT INTO dbo.[Appointments] ([appointment_id], [member_id], [schedule_id], [status], [note], [created_at], [cancel_reason], [cancel_requested_at], [cancel_requested_by]) VALUES (24, 20, 98, N'Confirmed', N'qưa', '2026-07-01 08:10:23', NULL, NULL, NULL);
INSERT INTO dbo.[Appointments] ([appointment_id], [member_id], [schedule_id], [status], [note], [created_at], [cancel_reason], [cancel_requested_at], [cancel_requested_by]) VALUES (25, 20, 102, N'Confirmed', N'okoko', '2026-07-01 08:17:34', NULL, NULL, NULL);
INSERT INTO dbo.[Appointments] ([appointment_id], [member_id], [schedule_id], [status], [note], [created_at], [cancel_reason], [cancel_requested_at], [cancel_requested_by]) VALUES (26, 20, 103, N'Confirmed', N'12123123123', '2026-07-07 18:46:24', NULL, NULL, NULL);
INSERT INTO dbo.[Appointments] ([appointment_id], [member_id], [schedule_id], [status], [note], [created_at], [cancel_reason], [cancel_requested_at], [cancel_requested_by]) VALUES (27, 20, 106, N'Cancelled', N'haobutuay', '2026-07-07 19:13:56', NULL, NULL, NULL);
INSERT INTO dbo.[Appointments] ([appointment_id], [member_id], [schedule_id], [status], [note], [created_at], [cancel_reason], [cancel_requested_at], [cancel_requested_by]) VALUES (28, 20, 107, N'Cancelled', N'123123', '2026-07-07 19:19:37', N'tôi mệt', '2026-07-08 09:25:49', N'TRAINER');
INSERT INTO dbo.[Appointments] ([appointment_id], [member_id], [schedule_id], [status], [note], [created_at], [cancel_reason], [cancel_requested_at], [cancel_requested_by]) VALUES (29, 20, 108, N'Cancelled', N'oke', '2026-07-08 09:06:19', N'tôi dau', '2026-07-08 09:22:43', N'MEMBER');
INSERT INTO dbo.[Appointments] ([appointment_id], [member_id], [schedule_id], [status], [note], [created_at], [cancel_reason], [cancel_requested_at], [cancel_requested_by]) VALUES (30, 20, 109, N'Confirmed', N'oke', '2026-07-08 09:24:52', NULL, NULL, NULL);
INSERT INTO dbo.[Appointments] ([appointment_id], [member_id], [schedule_id], [status], [note], [created_at], [cancel_reason], [cancel_requested_at], [cancel_requested_by]) VALUES (31, 20, 110, N'Cancelled', N'oke kh', '2026-07-13 09:51:49', N'meetj', '2026-07-13 09:52:43', N'TRAINER');
INSERT INTO dbo.[Appointments] ([appointment_id], [member_id], [schedule_id], [status], [note], [created_at], [cancel_reason], [cancel_requested_at], [cancel_requested_by]) VALUES (32, 20, 111, N'Cancelled', N'đâsd', '2026-07-13 11:19:34', N'mêty', '2026-07-13 11:21:59', N'TRAINER');
SET IDENTITY_INSERT dbo.[Appointments] OFF;
GO

-- Data for table [PtBookings] (9 rows)
SET IDENTITY_INSERT dbo.[PtBookings] ON;
INSERT INTO dbo.[PtBookings] ([booking_id], [member_id], [trainer_id], [session_date], [shift_code], [status], [reject_reason], [note], [created_at], [updated_at], [cancel_reason], [cancel_requested_at], [cancel_requested_by]) VALUES (7, 20, 2, '2026-07-15 00:00:00', N'CA2', N'Cancelled', NULL, N'oke', '2026-07-14 22:13:33', '2026-07-14 23:08:24', NULL, NULL, NULL);
INSERT INTO dbo.[PtBookings] ([booking_id], [member_id], [trainer_id], [session_date], [shift_code], [status], [reject_reason], [note], [created_at], [updated_at], [cancel_reason], [cancel_requested_at], [cancel_requested_by]) VALUES (14, 20, 2, '2026-07-17 00:00:00', N'CA1', N'Cancelled', NULL, N'oke', '2026-07-14 22:48:32', '2026-07-14 22:49:17', NULL, NULL, NULL);
INSERT INTO dbo.[PtBookings] ([booking_id], [member_id], [trainer_id], [session_date], [shift_code], [status], [reject_reason], [note], [created_at], [updated_at], [cancel_reason], [cancel_requested_at], [cancel_requested_by]) VALUES (18, 20, 2, '2026-07-16 00:00:00', N'CA7', N'Cancelled', NULL, N'oke', '2026-07-14 22:54:09', '2026-07-14 23:08:26', NULL, NULL, NULL);
INSERT INTO dbo.[PtBookings] ([booking_id], [member_id], [trainer_id], [session_date], [shift_code], [status], [reject_reason], [note], [created_at], [updated_at], [cancel_reason], [cancel_requested_at], [cancel_requested_by]) VALUES (22, 20, 2, '2026-07-17 00:00:00', N'CA1', N'Cancelled', NULL, N'oke', '2026-07-14 23:07:27', '2026-07-14 23:08:28', NULL, NULL, NULL);
INSERT INTO dbo.[PtBookings] ([booking_id], [member_id], [trainer_id], [session_date], [shift_code], [status], [reject_reason], [note], [created_at], [updated_at], [cancel_reason], [cancel_requested_at], [cancel_requested_by]) VALUES (23, 20, 2, '2026-07-18 00:00:00', N'CA5', N'Cancelled', NULL, N'oke', '2026-07-14 23:27:30', '2026-07-14 23:30:24', NULL, NULL, NULL);
INSERT INTO dbo.[PtBookings] ([booking_id], [member_id], [trainer_id], [session_date], [shift_code], [status], [reject_reason], [note], [created_at], [updated_at], [cancel_reason], [cancel_requested_at], [cancel_requested_by]) VALUES (24, 20, 2, '2026-07-17 00:00:00', N'CA3', N'Cancelled', NULL, N'oke', '2026-07-14 23:31:51', '2026-07-14 23:33:27', NULL, NULL, NULL);
INSERT INTO dbo.[PtBookings] ([booking_id], [member_id], [trainer_id], [session_date], [shift_code], [status], [reject_reason], [note], [created_at], [updated_at], [cancel_reason], [cancel_requested_at], [cancel_requested_by]) VALUES (25, 20, 2, '2026-07-16 00:00:00', N'CA5', N'Cancelled', NULL, N'oke', '2026-07-14 23:35:36', '2026-07-14 23:40:06', NULL, NULL, NULL);
INSERT INTO dbo.[PtBookings] ([booking_id], [member_id], [trainer_id], [session_date], [shift_code], [status], [reject_reason], [note], [created_at], [updated_at], [cancel_reason], [cancel_requested_at], [cancel_requested_by]) VALUES (26, 20, 2, '2026-07-17 00:00:00', N'CA4', N'Cancelled', NULL, N'oke', '2026-07-15 07:13:58', '2026-07-15 07:22:35', NULL, NULL, NULL);
INSERT INTO dbo.[PtBookings] ([booking_id], [member_id], [trainer_id], [session_date], [shift_code], [status], [reject_reason], [note], [created_at], [updated_at], [cancel_reason], [cancel_requested_at], [cancel_requested_by]) VALUES (27, 20, 2, '2026-07-22 00:00:00', N'CA4', N'Cancelled', NULL, N'oke', '2026-07-20 11:28:37', '2026-07-20 11:29:40', NULL, NULL, NULL);
SET IDENTITY_INSERT dbo.[PtBookings] OFF;
GO

-- Data for table [PtOffRequests] (3 rows)
SET IDENTITY_INSERT dbo.[PtOffRequests] ON;
INSERT INTO dbo.[PtOffRequests] ([request_id], [trainer_id], [off_date], [status], [reject_reason], [created_at], [updated_at]) VALUES (6, 1, '2026-07-20 00:00:00', N'Approved', NULL, '2026-07-14 21:05:30', '2026-07-14 21:07:26');
INSERT INTO dbo.[PtOffRequests] ([request_id], [trainer_id], [off_date], [status], [reject_reason], [created_at], [updated_at]) VALUES (7, 2, '2026-07-19 00:00:00', N'Approved', NULL, '2026-07-14 21:06:45', '2026-07-14 21:07:22');
INSERT INTO dbo.[PtOffRequests] ([request_id], [trainer_id], [off_date], [status], [reject_reason], [created_at], [updated_at]) VALUES (8, 2, '2026-07-21 00:00:00', N'Approved', NULL, '2026-07-14 21:39:04', '2026-07-14 21:39:23');
SET IDENTITY_INSERT dbo.[PtOffRequests] OFF;
GO

-- Data for table [CheckIns] (2 rows)
SET IDENTITY_INSERT dbo.[CheckIns] ON;
INSERT INTO dbo.[CheckIns] ([checkin_id], [member_id], [checkin_time]) VALUES (18, 20, '2026-07-17 11:12:40');
INSERT INTO dbo.[CheckIns] ([checkin_id], [member_id], [checkin_time]) VALUES (24, 48, '2026-07-19 21:13:14');
SET IDENTITY_INSERT dbo.[CheckIns] OFF;
GO


-- Data for table [WorkoutPlans] (16 rows)
SET IDENTITY_INSERT dbo.[WorkoutPlans] ON;
INSERT INTO dbo.[WorkoutPlans] ([workout_plan_id], [trainer_id], [member_id], [title], [description], [created_at], [updated_at]) VALUES (1, 1, 19, N'Lộ trình luyện tập với HLV 1', N'Lộ trình được tạo tự động sau khi đăng ký gói tập cùng HLV.', '2026-06-07 23:33:05', NULL);
INSERT INTO dbo.[WorkoutPlans] ([workout_plan_id], [trainer_id], [member_id], [title], [description], [created_at], [updated_at]) VALUES (24, 2, 20, N'HIIT Đốt Mỡ Nâng Cao', N'Giáo án được giao từ huấn luyện viên qua dashboard.', '2026-07-14 00:17:01', '2026-07-14 00:17:01');
INSERT INTO dbo.[WorkoutPlans] ([workout_plan_id], [trainer_id], [member_id], [title], [description], [created_at], [updated_at]) VALUES (25, 2, 20, N'Full Body Khởi Đầu', N'Giáo án được giao từ huấn luyện viên qua dashboard.', '2026-07-14 00:17:01', '2026-07-14 00:17:01');
INSERT INTO dbo.[WorkoutPlans] ([workout_plan_id], [trainer_id], [member_id], [title], [description], [created_at], [updated_at]) VALUES (26, 2, 20, N'Full Body Khởi Đầu', N'Giáo án được giao từ huấn luyện viên qua dashboard.', '2026-07-14 00:17:01', '2026-07-14 00:17:01');
INSERT INTO dbo.[WorkoutPlans] ([workout_plan_id], [trainer_id], [member_id], [title], [description], [created_at], [updated_at]) VALUES (27, 2, 20, N'Full Body Khởi Đầu', N'Giáo án được giao từ huấn luyện viên qua dashboard.', '2026-07-14 00:17:01', '2026-07-14 00:17:01');
INSERT INTO dbo.[WorkoutPlans] ([workout_plan_id], [trainer_id], [member_id], [title], [description], [created_at], [updated_at]) VALUES (28, 2, 20, N'Powerlifting Cơ Bản', N'Giáo án được giao từ huấn luyện viên qua dashboard.', '2026-07-14 00:17:01', '2026-07-14 00:17:01');
INSERT INTO dbo.[WorkoutPlans] ([workout_plan_id], [trainer_id], [member_id], [title], [description], [created_at], [updated_at]) VALUES (30, 2, 20, N'Full Body Khởi Đầu', N'Giáo án được giao từ huấn luyện viên qua dashboard.', '2026-07-14 00:17:01', '2026-07-14 00:17:01');
INSERT INTO dbo.[WorkoutPlans] ([workout_plan_id], [trainer_id], [member_id], [title], [description], [created_at], [updated_at]) VALUES (31, 2, 20, N'Full Body Khởi Đầu', N'Giáo án được giao từ huấn luyện viên qua dashboard.', '2026-07-14 00:17:01', '2026-07-14 00:17:01');
INSERT INTO dbo.[WorkoutPlans] ([workout_plan_id], [trainer_id], [member_id], [title], [description], [created_at], [updated_at]) VALUES (32, 2, 20, N'Powerlifting Cơ Bản', N'Giáo án được giao từ huấn luyện viên qua dashboard.', '2026-07-14 00:17:01', '2026-07-14 00:17:01');
INSERT INTO dbo.[WorkoutPlans] ([workout_plan_id], [trainer_id], [member_id], [title], [description], [created_at], [updated_at]) VALUES (33, 2, 20, N'HIIT Đốt Mỡ Nâng Cao', N'Giáo án được giao từ huấn luyện viên qua dashboard.', '2026-07-14 00:17:01', '2026-07-14 00:17:01');
INSERT INTO dbo.[WorkoutPlans] ([workout_plan_id], [trainer_id], [member_id], [title], [description], [created_at], [updated_at]) VALUES (37, 2, 20, N'Full Body Khởi Đầu', N'Khởi động cơ xương khớp cho người mới bắt đầu.', '2026-07-14 00:17:01', '2026-07-14 00:17:01');
INSERT INTO dbo.[WorkoutPlans] ([workout_plan_id], [trainer_id], [member_id], [title], [description], [created_at], [updated_at]) VALUES (38, 2, 20, N'Powerlifting Cơ Bản', N'Tập trung xây dựng sức mạnh cơ bắp thô.', '2026-07-14 00:17:01', '2026-07-14 00:17:01');
INSERT INTO dbo.[WorkoutPlans] ([workout_plan_id], [trainer_id], [member_id], [title], [description], [created_at], [updated_at]) VALUES (39, 2, 20, N'HIIT Đốt Mỡ Nâng Cao', N'Đốt mỡ cường độ cao cho người thừa cân nhẹ.', '2026-07-14 00:17:01', '2026-07-14 00:17:01');
INSERT INTO dbo.[WorkoutPlans] ([workout_plan_id], [trainer_id], [member_id], [title], [description], [created_at], [updated_at]) VALUES (40, 2, 20, N'HIIT Đốt Mỡ Nâng Cao', N'Đốt mỡ cường độ cao cho người thừa cân nhẹ.', '2026-07-14 00:17:01', '2026-07-14 00:17:01');
INSERT INTO dbo.[WorkoutPlans] ([workout_plan_id], [trainer_id], [member_id], [title], [description], [created_at], [updated_at]) VALUES (41, 2, 20, N'Full Body Khởi Đầu', N'Khởi động cơ xương khớp cho người mới bắt đầu.', '2026-07-14 00:17:01', '2026-07-14 00:17:01');
INSERT INTO dbo.[WorkoutPlans] ([workout_plan_id], [trainer_id], [member_id], [title], [description], [created_at], [updated_at]) VALUES (42, 2, 20, N'Full Body Khởi Đầu', N'Khởi động cơ xương khớp cho người mới bắt đầu.', '2026-07-14 00:17:01', '2026-07-14 00:17:01');
SET IDENTITY_INSERT dbo.[WorkoutPlans] OFF;
GO

-- Data for table [WorkoutExercises] (56 rows)
SET IDENTITY_INSERT dbo.[WorkoutExercises] ON;
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (2, 24, N'Burpees', 4, 15, 2, 80, NULL);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (3, 24, N'Jumping Jacks', 3, 30, 1, 40, NULL);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (4, 24, N'Mountain Climbers', 4, 20, 2, 60, NULL);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (5, 24, N'High Knees (Nâng cao đùi)', 3, 30, 1, 50, NULL);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (6, 25, N'Squat (Bodyweight)', 3, 15, 2, 45, NULL);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (7, 25, N'Push-up (Hít đất)', 3, 10, 1, 30, NULL);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (8, 25, N'Dumbbell Shoulder Press', 3, 12, 2, 40, NULL);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (9, 25, N'Plank giữ cơ bụng', 3, 1, 1, 20, NULL);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (10, 26, N'Squat (Bodyweight)', 3, 15, 2, 45, NULL);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (11, 26, N'Push-up (Hít đất)', 3, 10, 1, 30, NULL);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (12, 26, N'Dumbbell Shoulder Press', 3, 12, 2, 40, NULL);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (13, 26, N'Plank giữ cơ bụng', 3, 1, 1, 20, NULL);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (19, 30, N'Squat (Bodyweight)', 3, 15, 2, 45, 6);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (20, 30, N'Push-up (Hít đất)', 3, 10, 1, 30, 7);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (21, 30, N'Dumbbell Shoulder Press', 3, 12, 2, 40, 7);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (22, 30, N'Plank giữ cơ bụng', 3, 1, 1, 20, 5);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (23, 28, N'Barbell Squat', 3, 5, 3, 60, 8);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (24, 28, N'Barbell Deadlift', 3, 5, 4, 80, 9);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (25, 28, N'Barbell Bench Press', 3, 5, 3, 50, 8);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (26, 31, N'Squat (Bodyweight)', 3, 15, 2, 45, 6);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (27, 31, N'Push-up (Hít đất)', 3, 10, 1, 30, 7);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (28, 31, N'Dumbbell Shoulder Press', 3, 12, 2, 40, 7);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (29, 31, N'Plank giữ cơ bụng', 3, 1, 1, 20, 5);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (30, 32, N'Barbell Squat', 3, 5, 3, 60, 8);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (31, 32, N'Barbell Deadlift', 3, 5, 4, 80, 9);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (32, 32, N'Barbell Bench Press', 3, 5, 3, 50, 8);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (33, 33, N'Nhảy dây (Jumping Jacks)', 3, 30, 1, 40, 7);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (34, 33, N'Squat (Bodyweight)', 4, 15, 2, 50, 8);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (35, 33, N'Plank giữ cơ bụng', 3, 1, 1, 20, 6);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (36, 33, N'Burpees', 4, 15, 2, 80, 9);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (37, 33, N'Chạy nước rút (Sprint)', 3, 1, 1, 60, 9);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (43, 37, N'Squat (Bodyweight)', 3, 15, 2, 45, 6);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (44, 37, N'Push-up (Hít đất)', 3, 10, 1, 30, 7);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (45, 37, N'Dumbbell Shoulder Press', 3, 12, 2, 40, 7);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (46, 37, N'Plank giữ cơ bụng', 3, 1, 1, 20, 5);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (47, 38, N'Barbell Squat', 3, 5, 3, 60, 8);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (48, 38, N'Barbell Deadlift', 3, 5, 4, 80, 9);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (49, 38, N'Barbell Bench Press', 3, 5, 3, 50, 8);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (50, 39, N'Nhảy dây (Jumping Jacks)', 3, 30, 1, 40, 7);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (51, 39, N'Squat (Bodyweight)', 4, 15, 2, 50, 8);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (52, 39, N'Plank giữ cơ bụng', 3, 1, 1, 20, 6);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (53, 39, N'Burpees', 4, 15, 2, 80, 9);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (54, 39, N'Chạy nước rút (Sprint)', 3, 1, 1, 60, 9);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (55, 40, N'Nhảy dây (Jumping Jacks)', 3, 30, 1, 40, 7);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (56, 40, N'Squat (Bodyweight)', 4, 15, 2, 50, 8);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (57, 40, N'Plank giữ cơ bụng', 3, 1, 1, 20, 6);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (58, 40, N'Burpees', 4, 15, 2, 80, 9);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (59, 40, N'Chạy nước rút (Sprint)', 3, 1, 1, 60, 9);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (60, 41, N'Squat (Bodyweight)', 3, 15, 2, 45, 6);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (61, 41, N'Push-up (Hít đất)', 3, 10, 1, 30, 7);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (62, 41, N'Dumbbell Shoulder Press', 3, 12, 2, 40, 7);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (63, 41, N'Plank giữ cơ bụng', 3, 1, 1, 20, 5);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (64, 42, N'Squat (Bodyweight)', 3, 15, 2, 45, 6);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (65, 42, N'Push-up (Hít đất)', 3, 10, 1, 30, 7);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (66, 42, N'Dumbbell Shoulder Press', 3, 12, 2, 40, 7);
INSERT INTO dbo.[WorkoutExercises] ([exercise_id], [workout_plan_id], [exercise_name], [sets], [reps], [duration_minutes], [calories_burned], [rpe]) VALUES (67, 42, N'Plank giữ cơ bụng', 3, 1, 1, 20, 5);
SET IDENTITY_INSERT dbo.[WorkoutExercises] OFF;
GO

-- Data for table [AIConsultations] (23 rows)
SET IDENTITY_INSERT dbo.[AIConsultations] ON;
INSERT INTO dbo.[AIConsultations] ([consultation_id], [member_id], [guest_name], [consultation_type], [age], [gender], [height], [weight], [fitness_goal], [recommended_sport], [recommended_membership], [recommended_schedule], [recommendation_detail], [created_at]) VALUES (1, NULL, N'Test Guest', N'BMI', 25, N'Nam', 1.7, 65, NULL, N'Gym & Bơi lội thể lực', N'Gói Năm', N'Thứ 2: Tập thể lực toàn thân, Thứ 4: Bơi tự do giải tỏa cơ, Thứ 6: Yoga dẻo dai', N'Chỉ số BMI của bạn là 22.49 (Bình thường lý tưởng). Hãy tiếp tục rèn luyện đa dạng để duy trì cơ bắp săn chắc và tối ưu hóa chức năng tim mạch. Một chế độ ăn đầy đủ đa lượng dưỡng chất kết hợp lối sống lành mạnh sẽ giữ cơ thể bạn luôn tràn đầy năng lượng tích cực mỗi ngày.', '2026-06-15 19:25:37');
INSERT INTO dbo.[AIConsultations] ([consultation_id], [member_id], [guest_name], [consultation_type], [age], [gender], [height], [weight], [fitness_goal], [recommended_sport], [recommended_membership], [recommended_schedule], [recommendation_detail], [created_at]) VALUES (2, NULL, N'Khách truy cập', N'General Fitness', 25, N'Nam', 1.7, 65, NULL, N'Gym & Bơi lội thể lực', N'Gói Năm', N'Thứ 2: Tập thể lực toàn thân, Thứ 4: Bơi tự do giải tỏa cơ, Thứ 6: Yoga dẻo dai', N'Chỉ số BMI của bạn là 22.49 (Bình thường lý tưởng). Hãy tiếp tục rèn luyện đa dạng để duy trì cơ bắp săn chắc và tối ưu hóa chức năng tim mạch. Một chế độ ăn đầy đủ đa lượng dưỡng chất kết hợp lối sống lành mạnh sẽ giữ cơ thể bạn luôn tràn đầy năng lượng tích cực mỗi ngày.', '2026-06-15 19:30:42');
INSERT INTO dbo.[AIConsultations] ([consultation_id], [member_id], [guest_name], [consultation_type], [age], [gender], [height], [weight], [fitness_goal], [recommended_sport], [recommended_membership], [recommended_schedule], [recommendation_detail], [created_at]) VALUES (3, NULL, N'Khách truy cập', N'General Fitness', 22, N'Nam', 1.83, 70, NULL, N'Gym & Bơi lội thể lực', N'Gói Năm', N'Thứ 2: Tập thể lực toàn thân, Thứ 4: Bơi tự do giải tỏa cơ, Thứ 6: Yoga dẻo dai', N'Chỉ số BMI của bạn là 20.9 (Bình thường lý tưởng). Hãy tiếp tục rèn luyện đa dạng để duy trì cơ bắp săn chắc và tối ưu hóa chức năng tim mạch. Một chế độ ăn đầy đủ đa lượng dưỡng chất kết hợp lối sống lành mạnh sẽ giữ cơ thể bạn luôn tràn đầy năng lượng tích cực mỗi ngày.', '2026-06-15 19:32:49');
INSERT INTO dbo.[AIConsultations] ([consultation_id], [member_id], [guest_name], [consultation_type], [age], [gender], [height], [weight], [fitness_goal], [recommended_sport], [recommended_membership], [recommended_schedule], [recommendation_detail], [created_at]) VALUES (4, 20, NULL, N'General Fitness', 25, N'Nam', 1.9, 80, NULL, N'Gym & Bơi lội thể lực', N'Gói Năm', N'Thứ 2: Tập thể lực toàn thân, Thứ 4: Bơi tự do giải tỏa cơ, Thứ 6: Yoga dẻo dai', N'Chỉ số BMI của bạn là 22.16 (Bình thường lý tưởng). Hãy tiếp tục rèn luyện đa dạng để duy trì cơ bắp săn chắc và tối ưu hóa chức năng tim mạch. Một chế độ ăn đầy đủ đa lượng dưỡng chất kết hợp lối sống lành mạnh sẽ giữ cơ thể bạn luôn tràn đầy năng lượng tích cực mỗi ngày.', '2026-06-15 19:34:17');
INSERT INTO dbo.[AIConsultations] ([consultation_id], [member_id], [guest_name], [consultation_type], [age], [gender], [height], [weight], [fitness_goal], [recommended_sport], [recommended_membership], [recommended_schedule], [recommendation_detail], [created_at]) VALUES (5, NULL, N'Test Unicode Guest', N'BMI', 25, N'Nam', 1.7, 65, NULL, N'Gym & Bơi lội thể lực', N'Gói Năm', N'Thứ 2: Tập thể lực toàn thân, Thứ 4: Bơi tự do giải tỏa cơ, Thứ 6: Yoga dẻo dai', N'Chỉ số BMI của bạn là 22.49 (Bình thường lý tưởng). Hãy tiếp tục rèn luyện đa dạng để duy trì cơ bắp săn chắc và tối ưu hóa chức năng tim mạch. Một chế độ ăn đầy đủ đa lượng dưỡng chất kết hợp lối sống lành mạnh sẽ giữ cơ thể bạn luôn tràn đầy năng lượng tích cực mỗi ngày.', '2026-06-15 19:40:55');
INSERT INTO dbo.[AIConsultations] ([consultation_id], [member_id], [guest_name], [consultation_type], [age], [gender], [height], [weight], [fitness_goal], [recommended_sport], [recommended_membership], [recommended_schedule], [recommendation_detail], [created_at]) VALUES (6, NULL, N'Khách truy cập', N'BMI', 25, N'Nam', 1.7, 100, NULL, N'Đi bộ máy dốc & Yoga nhẹ nhàng', N'Gói Năm', N'Thứ 2: Đi bộ chậm trên dốc, Thứ 4: Đạp xe tĩnh lực, Thứ 6: Yoga phục hồi khớp', N'Chỉ số BMI của bạn là 34.6 (Thuộc nhóm béo phì). Hãy bắt đầu một cách chậm rãi để bảo vệ hệ khớp gối và cột sống khỏi chấn thương. Bạn nên tập các bài nhẹ nhàng kết hợp chế độ ăn kiêng kỷ luật, bổ sung nhiều xơ xanh, giảm muối và tránh tinh bột hấp thụ nhanh. Hãy tin tưởng vào hành trình dài hạn này!', '2026-06-15 23:38:58');
INSERT INTO dbo.[AIConsultations] ([consultation_id], [member_id], [guest_name], [consultation_type], [age], [gender], [height], [weight], [fitness_goal], [recommended_sport], [recommended_membership], [recommended_schedule], [recommendation_detail], [created_at]) VALUES (7, NULL, N'Khách truy cập', N'BMI', 25, N'Nam', 1.7, 100, NULL, N'Đi bộ máy dốc & Yoga nhẹ nhàng', N'Gói Năm', N'Thứ 2: Đi bộ chậm trên dốc, Thứ 4: Đạp xe tĩnh lực, Thứ 6: Yoga phục hồi khớp', N'Chỉ số BMI của bạn là 34.6 (Thuộc nhóm béo phì). Hãy bắt đầu một cách chậm rãi để bảo vệ hệ khớp gối và cột sống khỏi chấn thương. Bạn nên tập các bài nhẹ nhàng kết hợp chế độ ăn kiêng kỷ luật, bổ sung nhiều xơ xanh, giảm muối và tránh tinh bột hấp thụ nhanh. Hãy tin tưởng vào hành trình dài hạn này!', '2026-06-15 23:55:07');
INSERT INTO dbo.[AIConsultations] ([consultation_id], [member_id], [guest_name], [consultation_type], [age], [gender], [height], [weight], [fitness_goal], [recommended_sport], [recommended_membership], [recommended_schedule], [recommendation_detail], [created_at]) VALUES (8, NULL, N'Khách truy cập', N'BMI', 25, N'Nam', 1.7, 65, NULL, N'Gym & Bơi lội thể lực', N'Gói Năm', N'Thứ 2: Tập thể lực toàn thân, Thứ 4: Bơi tự do giải tỏa cơ, Thứ 6: Yoga dẻo dai', N'Chỉ số BMI của bạn là 22.49 (Bình thường lý tưởng). Hãy tiếp tục rèn luyện đa dạng để duy trì cơ bắp săn chắc và tối ưu hóa chức năng tim mạch. Một chế độ ăn đầy đủ đa lượng dưỡng chất kết hợp lối sống lành mạnh sẽ giữ cơ thể bạn luôn tràn đầy năng lượng tích cực mỗi ngày.', '2026-06-16 01:20:27');
INSERT INTO dbo.[AIConsultations] ([consultation_id], [member_id], [guest_name], [consultation_type], [age], [gender], [height], [weight], [fitness_goal], [recommended_sport], [recommended_membership], [recommended_schedule], [recommendation_detail], [created_at]) VALUES (9, NULL, N'mie', N'BMI', 25, N'Nữ', 1.53, 54, NULL, N'Gym & Bơi lội thể lực', N'Gói Năm', N'Thứ 2: Tập thể lực toàn thân, Thứ 4: Bơi tự do giải tỏa cơ, Thứ 6: Yoga dẻo dai', N'Chỉ số BMI của bạn là 23.07 (Bình thường lý tưởng). Hãy tiếp tục rèn luyện đa dạng để duy trì cơ bắp săn chắc và tối ưu hóa chức năng tim mạch. Một chế độ ăn đầy đủ đa lượng dưỡng chất kết hợp lối sống lành mạnh sẽ giữ cơ thể bạn luôn tràn đầy năng lượng tích cực mỗi ngày.', '2026-06-21 21:28:07');
INSERT INTO dbo.[AIConsultations] ([consultation_id], [member_id], [guest_name], [consultation_type], [age], [gender], [height], [weight], [fitness_goal], [recommended_sport], [recommended_membership], [recommended_schedule], [recommendation_detail], [created_at]) VALUES (10, NULL, N'mie', N'BMI', 25, N'Nữ', 1.53, 54, NULL, N'Gym & Bơi lội thể lực', N'Gói Năm', N'Thứ 2: Tập thể lực toàn thân, Thứ 4: Bơi tự do giải tỏa cơ, Thứ 6: Yoga dẻo dai', N'Chỉ số BMI của bạn là 23.07 (Bình thường lý tưởng). Hãy tiếp tục rèn luyện đa dạng để duy trì cơ bắp săn chắc và tối ưu hóa chức năng tim mạch. Một chế độ ăn đầy đủ đa lượng dưỡng chất kết hợp lối sống lành mạnh sẽ giữ cơ thể bạn luôn tràn đầy năng lượng tích cực mỗi ngày.', '2026-06-21 21:30:01');
INSERT INTO dbo.[AIConsultations] ([consultation_id], [member_id], [guest_name], [consultation_type], [age], [gender], [height], [weight], [fitness_goal], [recommended_sport], [recommended_membership], [recommended_schedule], [recommendation_detail], [created_at]) VALUES (11, NULL, N'mie', N'Weight Loss', 22, N'Nữ', 1.53, 53, NULL, N'Gym & Bơi lội thể lực', N'Gói Năm', N'Thứ 2: Tập thể lực toàn thân, Thứ 4: Bơi tự do giải tỏa cơ, Thứ 6: Yoga dẻo dai', N'Chỉ số BMI của bạn là 22.64 (Bình thường lý tưởng). Hãy tiếp tục rèn luyện đa dạng để duy trì cơ bắp săn chắc và tối ưu hóa chức năng tim mạch. Một chế độ ăn đầy đủ đa lượng dưỡng chất kết hợp lối sống lành mạnh sẽ giữ cơ thể bạn luôn tràn đầy năng lượng tích cực mỗi ngày.', '2026-06-21 21:31:01');
INSERT INTO dbo.[AIConsultations] ([consultation_id], [member_id], [guest_name], [consultation_type], [age], [gender], [height], [weight], [fitness_goal], [recommended_sport], [recommended_membership], [recommended_schedule], [recommendation_detail], [created_at]) VALUES (12, NULL, N'lân', N'Muscle Gain', 22, N'Nam', 1.84, 70, NULL, N'Gym & Bơi lội thể lực', N'Gói Năm', N'Thứ 2: Tập thể lực toàn thân, Thứ 4: Bơi tự do giải tỏa cơ, Thứ 6: Yoga dẻo dai', N'Chỉ số BMI của bạn là 20.68 (Bình thường lý tưởng). Hãy tiếp tục rèn luyện đa dạng để duy trì cơ bắp săn chắc và tối ưu hóa chức năng tim mạch. Một chế độ ăn đầy đủ đa lượng dưỡng chất kết hợp lối sống lành mạnh sẽ giữ cơ thể bạn luôn tràn đầy năng lượng tích cực mỗi ngày.', '2026-06-21 21:32:17');
INSERT INTO dbo.[AIConsultations] ([consultation_id], [member_id], [guest_name], [consultation_type], [age], [gender], [height], [weight], [fitness_goal], [recommended_sport], [recommended_membership], [recommended_schedule], [recommendation_detail], [created_at]) VALUES (13, NULL, N'lân', N'Muscle Gain', 22, N'Nam', 1.84, 100, NULL, N'HIIT & Cardio cường độ cao', N'Gói 3 Tháng', N'Thứ 2: HIIT đốt calo, Thứ 4: Tập đùi bụng đai mỡ, Thứ 6: Đạp xe nhanh dốc', N'Chỉ số BMI của bạn là 29.54 (Thừa cân nhẹ). Bạn nên thiết lập chế độ ăn thâm hụt calo nhẹ từ 300 - 500 kcal mỗi ngày, cắt giảm đường và chất béo xấu. Tập trung vào tập luyện HIIT/Cardio đan xen các buổi kháng lực để đốt mỡ mà vẫn giữ được cơ bắp khỏe khoắn.', '2026-06-21 21:32:37');
INSERT INTO dbo.[AIConsultations] ([consultation_id], [member_id], [guest_name], [consultation_type], [age], [gender], [height], [weight], [fitness_goal], [recommended_sport], [recommended_membership], [recommended_schedule], [recommendation_detail], [created_at]) VALUES (14, NULL, N'B', N'BMI', 25, N'Nam', 1.86, 50, NULL, N'Gym (Tăng cơ kháng lực)', N'Gói 3 Tháng', N'Thứ 2: Ngực - Tay sau, Thứ 4: Chân - Mông đùi, Thứ 6: Lưng - Bả vai', N'Chỉ số BMI của bạn là 14.45 (Hơi gầy). Bạn cần ưu tiên các bài tập kháng lực với tạ để kích thích phát triển thớ cơ, tránh các buổi tập cardio dài gây thâm hụt năng lượng lớn. Hãy bổ sung dinh dưỡng thặng dư calo (đặc biệt nạp đủ protein 1.6-2g/kg trọng lượng cơ thể) và nghỉ ngơi điều độ để đạt hiệu quả tăng cân, tăng cơ tối ưu nhé!', '2026-06-22 09:51:24');
INSERT INTO dbo.[AIConsultations] ([consultation_id], [member_id], [guest_name], [consultation_type], [age], [gender], [height], [weight], [fitness_goal], [recommended_sport], [recommended_membership], [recommended_schedule], [recommendation_detail], [created_at]) VALUES (15, NULL, N'B ', N'Weight Loss', 23, N'Nam', 1.8, 50, NULL, N'Gym (Tăng cơ kháng lực)', N'Gói 3 Tháng', N'Thứ 2: Ngực - Tay sau, Thứ 4: Chân - Mông đùi, Thứ 6: Lưng - Bả vai', N'Chỉ số BMI của bạn là 15.43 (Hơi gầy). Bạn cần ưu tiên các bài tập kháng lực với tạ để kích thích phát triển thớ cơ, tránh các buổi tập cardio dài gây thâm hụt năng lượng lớn. Hãy bổ sung dinh dưỡng thặng dư calo (đặc biệt nạp đủ protein 1.6-2g/kg trọng lượng cơ thể) và nghỉ ngơi điều độ để đạt hiệu quả tăng cân, tăng cơ tối ưu nhé!', '2026-06-22 10:00:11');
INSERT INTO dbo.[AIConsultations] ([consultation_id], [member_id], [guest_name], [consultation_type], [age], [gender], [height], [weight], [fitness_goal], [recommended_sport], [recommended_membership], [recommended_schedule], [recommendation_detail], [created_at]) VALUES (16, 20, NULL, N'General Fitness', 25, N'Nam', 1.9, 80, NULL, N'Gym & Bơi lội thể lực', N'Gói Năm', N'Thứ 2: Tập thể lực toàn thân, Thứ 4: Bơi tự do giải tỏa cơ, Thứ 6: Yoga dẻo dai', N'Chỉ số BMI của bạn là 22.16 (Bình thường lý tưởng). Hãy tiếp tục rèn luyện đa dạng để duy trì cơ bắp săn chắc và tối ưu hóa chức năng tim mạch. Một chế độ ăn đầy đủ đa lượng dưỡng chất kết hợp lối sống lành mạnh sẽ giữ cơ thể bạn luôn tràn đầy năng lượng tích cực mỗi ngày.', '2026-06-29 10:44:06');
INSERT INTO dbo.[AIConsultations] ([consultation_id], [member_id], [guest_name], [consultation_type], [age], [gender], [height], [weight], [fitness_goal], [recommended_sport], [recommended_membership], [recommended_schedule], [recommendation_detail], [created_at]) VALUES (17, NULL, N'alo', N'BMI', 23, N'Nam', 0.018000000000000002, 46, NULL, N'Đi bộ máy dốc & Yoga nhẹ nhàng', N'Gói Năm', N'Thứ 2: Đi bộ chậm trên dốc, Thứ 4: Đạp xe tĩnh lực, Thứ 6: Yoga phục hồi khớp', N'Chỉ số BMI của bạn là 141975.31 (Thuộc nhóm béo phì). Hãy bắt đầu một cách chậm rãi để bảo vệ hệ khớp gối và cột sống khỏi chấn thương. Bạn nên tập các bài nhẹ nhàng kết hợp chế độ ăn kiêng kỷ luật, bổ sung nhiều xơ xanh, giảm muối và tránh tinh bột hấp thụ nhanh. Hãy tin tưởng vào hành trình dài hạn này!', '2026-06-29 10:50:20');
INSERT INTO dbo.[AIConsultations] ([consultation_id], [member_id], [guest_name], [consultation_type], [age], [gender], [height], [weight], [fitness_goal], [recommended_sport], [recommended_membership], [recommended_schedule], [recommendation_detail], [created_at]) VALUES (18, NULL, N'alo', N'BMI', 23, N'Nam', 0.018000000000000002, 46, NULL, N'Đi bộ máy dốc & Yoga nhẹ nhàng', N'Gói Năm', N'Thứ 2: Đi bộ chậm trên dốc, Thứ 4: Đạp xe tĩnh lực, Thứ 6: Yoga phục hồi khớp', N'Chỉ số BMI của bạn là 141975.31 (Thuộc nhóm béo phì). Hãy bắt đầu một cách chậm rãi để bảo vệ hệ khớp gối và cột sống khỏi chấn thương. Bạn nên tập các bài nhẹ nhàng kết hợp chế độ ăn kiêng kỷ luật, bổ sung nhiều xơ xanh, giảm muối và tránh tinh bột hấp thụ nhanh. Hãy tin tưởng vào hành trình dài hạn này!', '2026-06-29 10:50:42');
INSERT INTO dbo.[AIConsultations] ([consultation_id], [member_id], [guest_name], [consultation_type], [age], [gender], [height], [weight], [fitness_goal], [recommended_sport], [recommended_membership], [recommended_schedule], [recommendation_detail], [created_at]) VALUES (19, NULL, N'alo', N'BMI', 23, N'Nam', 0.018000000000000002, 40, NULL, N'Đi bộ máy dốc & Yoga nhẹ nhàng', N'Gói Năm', N'Thứ 2: Đi bộ chậm trên dốc, Thứ 4: Đạp xe tĩnh lực, Thứ 6: Yoga phục hồi khớp', N'Chỉ số BMI của bạn là 123456.79 (Thuộc nhóm béo phì). Hãy bắt đầu một cách chậm rãi để bảo vệ hệ khớp gối và cột sống khỏi chấn thương. Bạn nên tập các bài nhẹ nhàng kết hợp chế độ ăn kiêng kỷ luật, bổ sung nhiều xơ xanh, giảm muối và tránh tinh bột hấp thụ nhanh. Hãy tin tưởng vào hành trình dài hạn này!', '2026-06-29 10:51:04');
INSERT INTO dbo.[AIConsultations] ([consultation_id], [member_id], [guest_name], [consultation_type], [age], [gender], [height], [weight], [fitness_goal], [recommended_sport], [recommended_membership], [recommended_schedule], [recommendation_detail], [created_at]) VALUES (20, NULL, N'Test User', N'BMI', 20, N'Nam', 1.8, 45, NULL, N'Gym (Tăng cơ kháng lực)', N'Gói 3 Tháng', N'Thứ 2: Ngực - Tay sau, Thứ 4: Chân - Mông đùi, Thứ 6: Lưng - Bả vai', N'Chỉ số BMI của bạn là 13.89 (Hơi gầy). Bạn cần ưu tiên các bài tập kháng lực với tạ để kích thích phát triển thớ cơ, tránh các buổi tập cardio dài gây thâm hụt năng lượng lớn. Hãy bổ sung dinh dưỡng thặng dư calo (đặc biệt nạp đủ protein 1.6-2g/kg trọng lượng cơ thể) và nghỉ ngơi điều độ để đạt hiệu quả tăng cân, tăng cơ tối ưu nhé!', '2026-06-29 10:53:02');
INSERT INTO dbo.[AIConsultations] ([consultation_id], [member_id], [guest_name], [consultation_type], [age], [gender], [height], [weight], [fitness_goal], [recommended_sport], [recommended_membership], [recommended_schedule], [recommendation_detail], [created_at]) VALUES (21, NULL, N'oke', N'BMI', 25, N'Nam', 1.8, 45, NULL, N'Gym (Tăng cơ kháng lực)', N'Gói 3 Tháng', N'Thứ 2: Ngực - Tay sau, Thứ 4: Chân - Mông đùi, Thứ 6: Lưng - Bả vai', N'Chỉ số BMI của bạn là 13.89 (Hơi gầy). Bạn cần ưu tiên các bài tập kháng lực với tạ để kích thích phát triển thớ cơ, tránh các buổi tập cardio dài gây thâm hụt năng lượng lớn. Hãy bổ sung dinh dưỡng thặng dư calo (đặc biệt nạp đủ protein 1.6-2g/kg trọng lượng cơ thể) và nghỉ ngơi điều độ để đạt hiệu quả tăng cân, tăng cơ tối ưu nhé!', '2026-06-29 10:55:17');
INSERT INTO dbo.[AIConsultations] ([consultation_id], [member_id], [guest_name], [consultation_type], [age], [gender], [height], [weight], [fitness_goal], [recommended_sport], [recommended_membership], [recommended_schedule], [recommendation_detail], [created_at]) VALUES (22, NULL, N'djslajdls', N'BMI', 23, N'Nữ', 1.23, 45, NULL, N'HIIT & Cardio cường độ cao', N'Gói 3 Tháng', N'Thứ 2: HIIT đốt calo, Thứ 4: Tập đùi bụng đai mỡ, Thứ 6: Đạp xe nhanh dốc', N'Chỉ số BMI của bạn là 29.74 (Thừa cân nhẹ). Bạn nên thiết lập chế độ ăn thâm hụt calo nhẹ từ 300 - 500 kcal mỗi ngày, cắt giảm đường và chất béo xấu. Tập trung vào tập luyện HIIT/Cardio đan xen các buổi kháng lực để đốt mỡ mà vẫn giữ được cơ bắp khỏe khoắn.', '2026-07-14 21:40:23');
INSERT INTO dbo.[AIConsultations] ([consultation_id], [member_id], [guest_name], [consultation_type], [age], [gender], [height], [weight], [fitness_goal], [recommended_sport], [recommended_membership], [recommended_schedule], [recommendation_detail], [created_at]) VALUES (23, NULL, N'hoàng lân ', N'BMI', 25, N'Nữ', 1.6, 60, NULL, N'Gym & Bơi lội thể lực', N'Gói Năm', N'Thứ 2: Tập thể lực toàn thân, Thứ 4: Bơi tự do giải tỏa cơ, Thứ 6: Yoga dẻo dai', N'Chỉ số BMI của bạn là 23.44 (Bình thường lý tưởng). Hãy tiếp tục rèn luyện đa dạng để duy trì cơ bắp săn chắc và tối ưu hóa chức năng tim mạch. Một chế độ ăn đầy đủ đa lượng dưỡng chất kết hợp lối sống lành mạnh sẽ giữ cơ thể bạn luôn tràn đầy năng lượng tích cực mỗi ngày.', '2026-07-15 07:31:45');
SET IDENTITY_INSERT dbo.[AIConsultations] OFF;
GO

-- Data for table [Notifications] (76 rows)
SET IDENTITY_INSERT dbo.[Notifications] ON;
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (1, 26, N'Yêu cầu đặt lịch mới', N'Hội viên Hoanglan1912bb đã gửi yêu cầu đặt lịch tập mới vào ngày 08/07/2026 lúc 09:00.', N'appointment_booked', 1, '2026-07-07 19:13:56');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (2, 24, N'Lịch hẹn được xác nhận', N'Lịch hẹn tập của bạn với HLV Bùi Nguyễn Minh Tuệ vào ngày 08/07/2026 lúc 09:00 đã được xác nhận.', N'appointment_confirmed', 1, '2026-07-07 19:14:22');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (3, 26, N'Yêu cầu đặt lịch mới', N'Hội viên Hoanglan1912bb đã gửi yêu cầu đặt lịch tập mới vào ngày 09/07/2026 lúc 11:00.', N'appointment_booked', 1, '2026-07-07 19:19:38');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (4, 24, N'Lịch hẹn được xác nhận', N'Lịch hẹn tập của bạn với HLV Bùi Nguyễn Minh Tuệ vào ngày 09/07/2026 lúc 11:00 đã được xác nhận.', N'appointment_confirmed', 1, '2026-07-07 19:19:51');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (5, 26, N'Yêu cầu đặt lịch mới', N'Hội viên Hoanglan1912bb đã gửi yêu cầu đặt lịch tập mới vào ngày 09/07/2026 lúc 05:00.', N'appointment_booked', 1, '2026-07-08 09:06:19');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (6, 24, N'Lịch hẹn được xác nhận', N'Lịch hẹn tập của bạn với HLV Bùi Nguyễn Minh Tuệ vào ngày 09/07/2026 lúc 05:00 đã được xác nhận.', N'appointment_confirmed', 1, '2026-07-08 09:15:55');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (7, 26, N'Yêu cầu hủy lịch hẹn tập', N'Học viên Hoanglan1912bb gửi yêu cầu hủy lịch dạy lúc 05:00 - 06:30 ngày 09/07/2026. Lý do: tôi đau', N'appointment_cancel_request', 1, '2026-07-08 09:22:43');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (8, 24, N'Yêu cầu hủy lịch đã được chấp nhận', N'HLV Bùi Nguyễn Minh Tuệ đã đồng ý hủy lịch dạy ngày 09/07/2026 lúc 05:00.', N'appointment_cancel_accepted', 1, '2026-07-08 09:23:30');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (9, 26, N'Yêu cầu đặt lịch mới', N'Hội viên Hoanglan1912bb đã gửi yêu cầu đặt lịch tập mới vào ngày 10/07/2026 lúc 20:00.', N'appointment_booked', 1, '2026-07-08 09:24:52');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (10, 24, N'Lịch hẹn được xác nhận', N'Lịch hẹn tập của bạn với HLV Bùi Nguyễn Minh Tuệ vào ngày 10/07/2026 lúc 20:00 đã được xác nhận.', N'appointment_confirmed', 1, '2026-07-08 09:25:16');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (11, 24, N'Huấn luyện viên yêu cầu hủy lịch dạy', N'HLV Bùi Nguyễn Minh Tuệ gửi yêu cầu hủy lịch dạy lúc 11:00 - 12:30 ngày 09/07/2026. Lý do: tôi mệt', N'appointment_cancel_request_pt', 1, '2026-07-08 09:25:49');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (12, 26, N'Yêu cầu hủy lịch dạy đã được đồng ý', N'Học viên Hoanglan1912bb đã đồng ý hủy lịch dạy ngày 09/07/2026 lúc 11:00.', N'appointment_cancel_accepted_member', 1, '2026-07-08 09:31:30');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (13, 26, N'Yêu cầu đặt lịch mới', N'Hội viên Hoanglan1912bb đã gửi yêu cầu đặt lịch tập mới vào ngày 14/07/2026 lúc 11:00.', N'appointment_booked', 1, '2026-07-13 09:51:49');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (14, 24, N'Lịch hẹn được xác nhận', N'Lịch hẹn tập của bạn với HLV Bùi Nguyễn Minh Tuệ vào ngày 14/07/2026 lúc 11:00 đã được xác nhận.', N'appointment_confirmed', 1, '2026-07-13 09:52:06');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (15, 24, N'Huấn luyện viên yêu cầu hủy lịch dạy', N'HLV Bùi Nguyễn Minh Tuệ gửi yêu cầu hủy lịch dạy lúc 11:00 - 12:30 ngày 14/07/2026. Lý do: meetj', N'appointment_cancel_request_pt', 1, '2026-07-13 09:52:43');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (16, 26, N'Yêu cầu hủy lịch dạy đã được đồng ý', N'Học viên Hoanglan1912bb đã đồng ý hủy lịch dạy ngày 14/07/2026 lúc 11:00.', N'appointment_cancel_accepted_member', 1, '2026-07-13 09:53:06');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (17, 26, N'Yêu cầu đặt lịch mới', N'Hội viên Hoanglan1912bb đã gửi yêu cầu đặt lịch tập mới vào ngày 15/07/2026 lúc 05:00.', N'appointment_booked', 1, '2026-07-13 11:19:34');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (18, 24, N'Lịch hẹn được xác nhận', N'Lịch hẹn tập của bạn với HLV Bùi Nguyễn Minh Tuệ vào ngày 15/07/2026 lúc 05:00 đã được xác nhận.', N'appointment_confirmed', 1, '2026-07-13 11:19:47');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (19, 24, N'Huấn luyện viên yêu cầu hủy lịch dạy', N'HLV Bùi Nguyễn Minh Tuệ gửi yêu cầu hủy lịch dạy lúc 05:00 - 06:30 ngày 15/07/2026. Lý do: mêty', N'appointment_cancel_request_pt', 1, '2026-07-13 11:21:59');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (20, 26, N'Yêu cầu hủy lịch dạy đã được đồng ý', N'Học viên Hoanglan1912bb đã đồng ý hủy lịch dạy ngày 15/07/2026 lúc 05:00.', N'appointment_cancel_accepted_member', 1, '2026-07-13 11:22:48');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (21, 24, N'Tiến độ tập luyện hoàn thành', N'HLV HLV Nguyễn Văn A đã xác nhận hoàn thành & kết thúc tiến độ giáo án hiện tại. Bạn có thể xem lại ở phần Lịch sử.', N'plan_completed', 1, '2026-07-14 03:07:29');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (22, 24, N'Tiến độ tập luyện hoàn thành', N'HLV Bùi Nguyễn Minh Tuệ đã xác nhận hoàn thành & kết thúc tiến độ giáo án hiện tại. Bạn có thể xem lại ở phần Lịch sử.', N'plan_completed', 1, '2026-07-14 03:08:13');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (23, 24, N'Tiến độ tập luyện hoàn thành', N'HLV Bùi Nguyễn Minh Tuệ đã xác nhận hoàn thành & kết thúc tiến độ giáo án hiện tại. Bạn có thể xem lại ở phần Lịch sử.', N'plan_completed', 1, '2026-07-14 03:09:27');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (29, 1, N'Yêu cầu nghỉ phép mới', N'PT HLV Nguyễn Văn A vừa gửi yêu cầu nghỉ phép cho 1 ngày.', N'OFF_REQUEST_CREATED', 1, '2026-07-14 21:05:30');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (30, 2, N'Yêu cầu nghỉ phép mới', N'PT HLV Nguyễn Văn A vừa gửi yêu cầu nghỉ phép cho 1 ngày.', N'OFF_REQUEST_CREATED', 0, '2026-07-14 21:05:30');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (32, 1, N'Yêu cầu nghỉ phép mới', N'PT Bùi Nguyễn Minh Tuệ vừa gửi yêu cầu nghỉ phép cho 1 ngày.', N'OFF_REQUEST_CREATED', 1, '2026-07-14 21:06:45');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (33, 2, N'Yêu cầu nghỉ phép mới', N'PT Bùi Nguyễn Minh Tuệ vừa gửi yêu cầu nghỉ phép cho 1 ngày.', N'OFF_REQUEST_CREATED', 0, '2026-07-14 21:06:45');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (35, 26, N'Yêu cầu nghỉ phép được duyệt', N'Yêu cầu nghỉ phép ngày 2026-07-19 của bạn đã được duyệt.', N'OFF_REQUEST_APPROVED', 1, '2026-07-14 21:07:22');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (36, 3, N'Yêu cầu nghỉ phép được duyệt', N'Yêu cầu nghỉ phép ngày 2026-07-20 của bạn đã được duyệt.', N'OFF_REQUEST_APPROVED', 0, '2026-07-14 21:07:26');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (37, 24, N'Tiến độ tập luyện hoàn thành', N'HLV Bùi Nguyễn Minh Tuệ đã xác nhận hoàn thành & kết thúc tiến độ giáo án hiện tại. Bạn có thể xem lại ở phần Lịch sử.', N'plan_completed', 1, '2026-07-14 21:36:57');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (38, 1, N'Yêu cầu nghỉ phép mới', N'PT Bùi Nguyễn Minh Tuệ vừa gửi yêu cầu nghỉ phép cho 1 ngày.', N'OFF_REQUEST_CREATED', 1, '2026-07-14 21:39:04');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (39, 2, N'Yêu cầu nghỉ phép mới', N'PT Bùi Nguyễn Minh Tuệ vừa gửi yêu cầu nghỉ phép cho 1 ngày.', N'OFF_REQUEST_CREATED', 0, '2026-07-14 21:39:04');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (41, 26, N'Yêu cầu nghỉ phép được duyệt', N'Yêu cầu nghỉ phép ngày 2026-07-21 của bạn đã được duyệt.', N'OFF_REQUEST_APPROVED', 1, '2026-07-14 21:39:23');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (42, 24, N'Tiến độ tập luyện hoàn thành', N'HLV Bùi Nguyễn Minh Tuệ đã xác nhận hoàn thành & kết thúc tiến độ giáo án hiện tại. Bạn có thể xem lại ở phần Lịch sử.', N'plan_completed', 1, '2026-07-14 21:47:12');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (48, 26, N'Yêu cầu đặt lịch mới', N'Học viên Hoanglan1912bb đã đặt lịch tập ca CA2 ngày 2026-07-15', N'BOOKING_CREATED', 1, '2026-07-14 22:13:33');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (49, 24, N'Yêu cầu đặt lịch được duyệt', N'HLV đã duyệt yêu cầu đặt lịch ca CA2 ngày 2026-07-15 của bạn.', N'BOOKING_APPROVED', 1, '2026-07-14 22:13:47');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (50, 24, N'Tiến độ tập luyện hoàn thành', N'HLV Bùi Nguyễn Minh Tuệ đã xác nhận hoàn thành & kết thúc tiến độ giáo án hiện tại. Bạn có thể xem lại ở phần Lịch sử.', N'plan_completed', 1, '2026-07-14 22:14:19');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (51, 24, N'Tiến độ tập luyện hoàn thành', N'HLV Bùi Nguyễn Minh Tuệ đã xác nhận hoàn thành & kết thúc tiến độ giáo án hiện tại. Bạn có thể xem lại ở phần Lịch sử.', N'plan_completed', 1, '2026-07-14 22:26:54');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (52, 24, N'Tiến độ tập luyện hoàn thành', N'HLV Bùi Nguyễn Minh Tuệ đã xác nhận hoàn thành & kết thúc tiến độ giáo án hiện tại. Bạn có thể xem lại ở phần Lịch sử.', N'plan_completed', 1, '2026-07-14 22:29:56');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (58, 24, N'Tiến độ tập luyện hoàn thành', N'HLV Bùi Nguyễn Minh Tuệ đã xác nhận hoàn thành & kết thúc tiến độ giáo án hiện tại. Bạn có thể xem lại ở phần Lịch sử.', N'plan_completed', 1, '2026-07-14 22:33:29');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (64, 24, N'Tiến độ tập luyện hoàn thành', N'HLV Bùi Nguyễn Minh Tuệ đã xác nhận hoàn thành & kết thúc tiến độ giáo án hiện tại. Bạn có thể xem lại ở phần Lịch sử.', N'plan_completed', 1, '2026-07-14 22:41:53');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (65, 26, N'Yêu cầu hủy lịch tập', N'Học viên Hoanglan1912bb gửi yêu cầu hủy lịch tập ca CA2 ngày 2026-07-15. Lý do: mệt', N'BOOKING_CANCEL_REQUESTED', 1, '2026-07-14 22:46:28');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (66, 26, N'Yêu cầu đặt lịch mới', N'Học viên Hoanglan1912bb đã đặt lịch tập ca CA1 ngày 2026-07-17', N'BOOKING_CREATED', 1, '2026-07-14 22:48:32');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (67, 24, N'Yêu cầu đặt lịch được duyệt', N'HLV đã duyệt yêu cầu đặt lịch ca CA1 ngày 2026-07-17 của bạn.', N'BOOKING_APPROVED', 1, '2026-07-14 22:48:49');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (68, 24, N'HLV xin hủy lịch tập', N'HLV Bùi Nguyễn Minh Tuệ đã gửi yêu cầu hủy lịch tập ca CA1 ngày 2026-07-17. Lý do: mệt quá ', N'BOOKING_CANCEL_REQUESTED', 1, '2026-07-14 22:49:05');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (69, 26, N'Học viên phản hồi yêu cầu hủy', N'Học viên Hoanglan1912bb đã đồng ý yêu cầu hủy lịch ca CA1 ngày 2026-07-17 của bạn.', N'BOOKING_CANCEL_ACCEPTED', 1, '2026-07-14 22:49:17');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (75, 26, N'Yêu cầu đặt lịch mới', N'Học viên Hoanglan1912bb đã đặt lịch tập ca CA7 ngày 2026-07-16', N'BOOKING_CREATED', 1, '2026-07-14 22:54:09');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (76, 24, N'Yêu cầu đặt lịch được duyệt', N'HLV đã duyệt yêu cầu đặt lịch ca CA7 ngày 2026-07-16 của bạn.', N'BOOKING_APPROVED', 1, '2026-07-14 22:54:24');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (77, 26, N'Yêu cầu hủy lịch tập', N'Học viên Hoanglan1912bb gửi yêu cầu hủy lịch tập ca CA7 ngày 2026-07-16. Lý do: mệt', N'BOOKING_CANCEL_REQUESTED', 1, '2026-07-14 22:55:14');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (83, 26, N'Yêu cầu đặt lịch mới', N'Học viên Hoanglan1912bb đã đặt lịch tập ca CA1 ngày 2026-07-17', N'BOOKING_CREATED', 1, '2026-07-14 23:07:27');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (84, 24, N'Yêu cầu đặt lịch được duyệt', N'HLV đã duyệt yêu cầu đặt lịch ca CA1 ngày 2026-07-17 của bạn.', N'BOOKING_APPROVED', 1, '2026-07-14 23:07:40');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (85, 26, N'Yêu cầu hủy lịch tập', N'Học viên Hoanglan1912bb gửi yêu cầu hủy lịch tập ca CA1 ngày 2026-07-17. Lý do: mệt', N'BOOKING_CANCEL_REQUESTED', 1, '2026-07-14 23:08:00');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (86, 24, N'Kết quả yêu cầu hủy lịch tập', N'HLV Bùi Nguyễn Minh Tuệ đã đồng ý yêu cầu hủy lịch tập ca CA2 ngày 2026-07-15 của bạn.', N'BOOKING_CANCEL_ACCEPTED', 1, '2026-07-14 23:08:24');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (87, 24, N'Kết quả yêu cầu hủy lịch tập', N'HLV Bùi Nguyễn Minh Tuệ đã đồng ý yêu cầu hủy lịch tập ca CA7 ngày 2026-07-16 của bạn.', N'BOOKING_CANCEL_ACCEPTED', 1, '2026-07-14 23:08:26');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (88, 24, N'Kết quả yêu cầu hủy lịch tập', N'HLV Bùi Nguyễn Minh Tuệ đã đồng ý yêu cầu hủy lịch tập ca CA1 ngày 2026-07-17 của bạn.', N'BOOKING_CANCEL_ACCEPTED', 1, '2026-07-14 23:08:28');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (89, 26, N'Yêu cầu đặt lịch mới', N'Học viên Hoanglan1912bb đã đặt lịch tập ca CA5 ngày 2026-07-18', N'BOOKING_CREATED', 1, '2026-07-14 23:27:30');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (90, 24, N'Yêu cầu đặt lịch được duyệt', N'HLV đã duyệt yêu cầu đặt lịch ca CA5 ngày 2026-07-18 của bạn.', N'BOOKING_APPROVED', 1, '2026-07-14 23:27:42');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (91, 26, N'Yêu cầu hủy lịch tập', N'Học viên Hoanglan1912bb gửi yêu cầu hủy lịch tập ca CA5 ngày 2026-07-18. Lý do: meeth ', N'BOOKING_CANCEL_REQUESTED', 1, '2026-07-14 23:28:08');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (92, 24, N'Kết quả yêu cầu hủy lịch tập', N'HLV Bùi Nguyễn Minh Tuệ đã đồng ý yêu cầu hủy lịch tập ca CA5 ngày 2026-07-18 của bạn.', N'BOOKING_CANCEL_ACCEPTED', 1, '2026-07-14 23:30:24');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (93, 26, N'Yêu cầu đặt lịch mới', N'Học viên Hoanglan1912bb đã đặt lịch tập ca CA3 ngày 2026-07-17', N'BOOKING_CREATED', 1, '2026-07-14 23:31:51');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (94, 24, N'Yêu cầu đặt lịch được duyệt', N'HLV đã duyệt yêu cầu đặt lịch ca CA3 ngày 2026-07-17 của bạn.', N'BOOKING_APPROVED', 1, '2026-07-14 23:32:02');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (95, 24, N'HLV xin hủy lịch tập', N'HLV Bùi Nguyễn Minh Tuệ đã gửi yêu cầu hủy lịch tập ca CA3 ngày 2026-07-17. Lý do: mệt', N'BOOKING_CANCEL_REQUESTED', 1, '2026-07-14 23:32:12');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (96, 26, N'Học viên phản hồi yêu cầu hủy', N'Học viên Hoanglan1912bb đã đồng ý yêu cầu hủy lịch ca CA3 ngày 2026-07-17 của bạn.', N'BOOKING_CANCEL_ACCEPTED', 1, '2026-07-14 23:33:27');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (97, 26, N'Yêu cầu đặt lịch mới', N'Học viên Hoanglan1912bb đã đặt lịch tập ca CA5 ngày 2026-07-16', N'BOOKING_CREATED', 1, '2026-07-14 23:35:36');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (98, 24, N'Yêu cầu đặt lịch được duyệt', N'HLV đã duyệt yêu cầu đặt lịch ca CA5 ngày 2026-07-16 của bạn.', N'BOOKING_APPROVED', 1, '2026-07-14 23:35:45');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (99, 26, N'Yêu cầu hủy lịch tập', N'Học viên Hoanglan1912bb gửi yêu cầu hủy lịch tập ca CA5 ngày 2026-07-16. Lý do: mệt', N'BOOKING_CANCEL_REQUESTED', 1, '2026-07-14 23:36:09');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (100, 24, N'Kết quả yêu cầu hủy lịch tập', N'HLV Bùi Nguyễn Minh Tuệ đã đồng ý yêu cầu hủy lịch tập ca CA5 ngày 2026-07-16 của bạn.', N'BOOKING_CANCEL_ACCEPTED', 1, '2026-07-14 23:40:06');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (101, 26, N'Yêu cầu đặt lịch mới', N'Học viên Hoanglan1912bb đã đặt lịch tập ca CA4 ngày 2026-07-17', N'BOOKING_CREATED', 1, '2026-07-15 07:13:58');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (102, 24, N'Yêu cầu đặt lịch được duyệt', N'HLV đã duyệt yêu cầu đặt lịch ca CA4 ngày 2026-07-17 của bạn.', N'BOOKING_APPROVED', 1, '2026-07-15 07:14:19');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (103, 24, N'Tiến độ tập luyện hoàn thành', N'HLV Bùi Nguyễn Minh Tuệ đã xác nhận hoàn thành & kết thúc tiến độ giáo án hiện tại. Bạn có thể xem lại ở phần Lịch sử.', N'plan_completed', 1, '2026-07-15 07:17:01');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (104, 26, N'Yêu cầu hủy lịch tập', N'Học viên Hoanglan1912bb gửi yêu cầu hủy lịch tập ca CA4 ngày 2026-07-17. Lý do: mệt', N'BOOKING_CANCEL_REQUESTED', 1, '2026-07-15 07:22:17');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (105, 24, N'Kết quả yêu cầu hủy lịch tập', N'HLV Bùi Nguyễn Minh Tuệ đã đồng ý yêu cầu hủy lịch tập ca CA4 ngày 2026-07-17 của bạn.', N'BOOKING_CANCEL_ACCEPTED', 1, '2026-07-15 07:22:35');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (106, 26, N'Yêu cầu đặt lịch mới', N'Học viên Hoanglan1912bb đã đặt lịch tập ca CA4 ngày 2026-07-22', N'BOOKING_CREATED', 0, '2026-07-20 11:28:37');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (107, 24, N'Yêu cầu đặt lịch được duyệt', N'HLV đã duyệt yêu cầu đặt lịch ca CA4 ngày 2026-07-22 của bạn.', N'BOOKING_APPROVED', 0, '2026-07-20 11:28:49');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (108, 24, N'HLV xin hủy lịch tập', N'HLV Bùi Nguyễn Minh Tuệ đã gửi yêu cầu hủy lịch tập ca CA4 ngày 2026-07-22. Lý do: tôi mệt', N'BOOKING_CANCEL_REQUESTED', 0, '2026-07-20 11:29:19');
INSERT INTO dbo.[Notifications] ([notification_id], [user_id], [title], [content], [notification_type], [is_read], [created_at]) VALUES (109, 26, N'Học viên phản hồi yêu cầu hủy', N'Học viên Hoanglan1912bb đã đồng ý yêu cầu hủy lịch ca CA4 ngày 2026-07-22 của bạn.', N'BOOKING_CANCEL_ACCEPTED', 0, '2026-07-20 11:29:40');
SET IDENTITY_INSERT dbo.[Notifications] OFF;
GO

-- Data for table [Payments] (44 rows)
SET IDENTITY_INSERT dbo.[Payments] ON;
INSERT INTO dbo.[Payments] ([payment_id], [member_id], [amount], [payment_type], [payment_method], [payment_status], [transaction_code], [payment_date]) VALUES (10, 19, 5000, N'Membership', N'PayOS', N'Paid', N'84624017359', '2026-06-07 22:30:50');
INSERT INTO dbo.[Payments] ([payment_id], [member_id], [amount], [payment_type], [payment_method], [payment_status], [transaction_code], [payment_date]) VALUES (11, 19, 5000, N'Membership', N'PayOS', N'Paid', N'84986430029', '2026-06-07 23:33:05');
INSERT INTO dbo.[Payments] ([payment_id], [member_id], [amount], [payment_type], [payment_method], [payment_status], [transaction_code], [payment_date]) VALUES (12, 20, 5000, N'Membership', N'PayOS', N'Paid', N'88824504023', '2026-06-08 10:11:06');
INSERT INTO dbo.[Payments] ([payment_id], [member_id], [amount], [payment_type], [payment_method], [payment_status], [transaction_code], [payment_date]) VALUES (15, 20, 5000, N'Membership', N'PayOS', N'Paid', N'210106960497', '2026-06-22 11:07:24');
INSERT INTO dbo.[Payments] ([payment_id], [member_id], [amount], [payment_type], [payment_method], [payment_status], [transaction_code], [payment_date]) VALUES (16, 20, 5000, N'Membership', N'PayOS', N'Paid', N'210147920566', '2026-06-22 11:11:21');
INSERT INTO dbo.[Payments] ([payment_id], [member_id], [amount], [payment_type], [payment_method], [payment_status], [transaction_code], [payment_date]) VALUES (17, 20, 1150000, N'Service', N'PayOS', N'Paid', N'397062384764', '2026-07-14 02:25:31');
INSERT INTO dbo.[Payments] ([payment_id], [member_id], [amount], [payment_type], [payment_method], [payment_status], [transaction_code], [payment_date]) VALUES (18, 20, 300000, N'Service', N'PayOS', N'Paid', N'397356919589', '2026-07-14 03:12:50');
INSERT INTO dbo.[Payments] ([payment_id], [member_id], [amount], [payment_type], [payment_method], [payment_status], [transaction_code], [payment_date]) VALUES (19, 20, 10000, N'Membership', N'PayOS', N'Paid', N'403988720361', '2026-07-14 21:38:09');
INSERT INTO dbo.[Payments] ([payment_id], [member_id], [amount], [payment_type], [payment_method], [payment_status], [transaction_code], [payment_date]) VALUES (20, 27, 550000, N'Service', N'PayOS', N'Paid', N'404096329243', '2026-07-14 21:56:05');
INSERT INTO dbo.[Payments] ([payment_id], [member_id], [amount], [payment_type], [payment_method], [payment_status], [transaction_code], [payment_date]) VALUES (21, 20, 150000, N'Service', N'PayOS', N'Paid', N'404104067244', '2026-07-14 21:57:22');
INSERT INTO dbo.[Payments] ([payment_id], [member_id], [amount], [payment_type], [payment_method], [payment_status], [transaction_code], [payment_date]) VALUES (52, 1, 2000, N'Membership', N'PayOS', N'Paid', N'RAW_TEST_1784337566', '2025-01-10 12:00:00');
INSERT INTO dbo.[Payments] ([payment_id], [member_id], [amount], [payment_type], [payment_method], [payment_status], [transaction_code], [payment_date]) VALUES (53, 1, 2000, N'Membership', N'PayOS', N'Paid', N'PARAM_RAW_TEST_1784312415101', '2025-01-10 12:00:00');
INSERT INTO dbo.[Payments] ([payment_id], [member_id], [amount], [payment_type], [payment_method], [payment_status], [transaction_code], [payment_date]) VALUES (54, 1, 500000, N'Service', N'PayOS', N'Paid', N'TXN100000000000', '2025-01-10 12:00:00');
INSERT INTO dbo.[Payments] ([payment_id], [member_id], [amount], [payment_type], [payment_method], [payment_status], [transaction_code], [payment_date]) VALUES (55, 19, 5500000, N'Membership', N'VNPAY', N'Paid', N'TXN100000000001', '2025-01-22 12:00:00');
INSERT INTO dbo.[Payments] ([payment_id], [member_id], [amount], [payment_type], [payment_method], [payment_status], [transaction_code], [payment_date]) VALUES (56, 20, 6500000, N'Membership', N'PayOS', N'Paid', N'TXN100000000002', '2025-02-15 12:00:00');
INSERT INTO dbo.[Payments] ([payment_id], [member_id], [amount], [payment_type], [payment_method], [payment_status], [transaction_code], [payment_date]) VALUES (57, 27, 400000, N'Service', N'VNPAY', N'Paid', N'TXN100000000003', '2025-02-28 12:00:00');
INSERT INTO dbo.[Payments] ([payment_id], [member_id], [amount], [payment_type], [payment_method], [payment_status], [transaction_code], [payment_date]) VALUES (59, 1, 5000, N'Membership', N'VNPAY', N'Paid', N'TXN100000000005', '2025-03-20 12:00:00');
INSERT INTO dbo.[Payments] ([payment_id], [member_id], [amount], [payment_type], [payment_method], [payment_status], [transaction_code], [payment_date]) VALUES (60, 19, 300000, N'Service', N'PayOS', N'Paid', N'TXN100000000006', '2025-04-12 12:00:00');
INSERT INTO dbo.[Payments] ([payment_id], [member_id], [amount], [payment_type], [payment_method], [payment_status], [transaction_code], [payment_date]) VALUES (61, 20, 10000000, N'Membership', N'VNPAY', N'Paid', N'TXN100000000007', '2025-04-25 12:00:00');
INSERT INTO dbo.[Payments] ([payment_id], [member_id], [amount], [payment_type], [payment_method], [payment_status], [transaction_code], [payment_date]) VALUES (62, 27, 3500000, N'Membership', N'PayOS', N'Paid', N'TXN100000000008', '2025-05-08 12:00:00');
INSERT INTO dbo.[Payments] ([payment_id], [member_id], [amount], [payment_type], [payment_method], [payment_status], [transaction_code], [payment_date]) VALUES (64, 1, 12000000, N'Membership', N'PayOS', N'Paid', N'TXN100000000010', '2025-06-03 12:00:00');
INSERT INTO dbo.[Payments] ([payment_id], [member_id], [amount], [payment_type], [payment_method], [payment_status], [transaction_code], [payment_date]) VALUES (65, 19, 4000000, N'Membership', N'VNPAY', N'Paid', N'TXN100000000011', '2025-06-19 12:00:00');
INSERT INTO dbo.[Payments] ([payment_id], [member_id], [amount], [payment_type], [payment_method], [payment_status], [transaction_code], [payment_date]) VALUES (66, 20, 250000, N'Service', N'PayOS', N'Paid', N'TXN100000000012', '2025-07-02 12:00:00');
INSERT INTO dbo.[Payments] ([payment_id], [member_id], [amount], [payment_type], [payment_method], [payment_status], [transaction_code], [payment_date]) VALUES (67, 27, 15000, N'Membership', N'VNPAY', N'Paid', N'TXN100000000013', '2025-07-29 12:00:00');
INSERT INTO dbo.[Payments] ([payment_id], [member_id], [amount], [payment_type], [payment_method], [payment_status], [transaction_code], [payment_date]) VALUES (69, 1, 500000, N'Service', N'VNPAY', N'Paid', N'TXN100000000015', '2025-08-23 12:00:00');
INSERT INTO dbo.[Payments] ([payment_id], [member_id], [amount], [payment_type], [payment_method], [payment_status], [transaction_code], [payment_date]) VALUES (70, 19, 15000, N'Membership', N'PayOS', N'Paid', N'TXN100000000016', '2025-09-07 12:00:00');
INSERT INTO dbo.[Payments] ([payment_id], [member_id], [amount], [payment_type], [payment_method], [payment_status], [transaction_code], [payment_date]) VALUES (71, 20, 3000000, N'Membership', N'VNPAY', N'Paid', N'TXN100000000017', '2025-09-22 12:00:00');
INSERT INTO dbo.[Payments] ([payment_id], [member_id], [amount], [payment_type], [payment_method], [payment_status], [transaction_code], [payment_date]) VALUES (72, 27, 400000, N'Service', N'PayOS', N'Paid', N'TXN100000000018', '2025-10-04 12:00:00');
INSERT INTO dbo.[Payments] ([payment_id], [member_id], [amount], [payment_type], [payment_method], [payment_status], [transaction_code], [payment_date]) VALUES (74, 1, 14000000, N'Membership', N'PayOS', N'Paid', N'TXN100000000020', '2025-11-12 12:00:00');
INSERT INTO dbo.[Payments] ([payment_id], [member_id], [amount], [payment_type], [payment_method], [payment_status], [transaction_code], [payment_date]) VALUES (75, 19, 300000, N'Service', N'VNPAY', N'Paid', N'TXN100000000021', '2025-11-27 12:00:00');
INSERT INTO dbo.[Payments] ([payment_id], [member_id], [amount], [payment_type], [payment_method], [payment_status], [transaction_code], [payment_date]) VALUES (76, 20, 5000, N'Membership', N'PayOS', N'Paid', N'TXN100000000022', '2025-12-05 12:00:00');
INSERT INTO dbo.[Payments] ([payment_id], [member_id], [amount], [payment_type], [payment_method], [payment_status], [transaction_code], [payment_date]) VALUES (77, 27, 10000, N'Membership', N'VNPAY', N'Paid', N'TXN100000000023', '2025-12-25 12:00:00');
INSERT INTO dbo.[Payments] ([payment_id], [member_id], [amount], [payment_type], [payment_method], [payment_status], [transaction_code], [payment_date]) VALUES (79, 1, 3500000, N'Membership', N'VNPAY', N'Paid', N'TXN100000000025', '2026-01-20 12:00:00');
INSERT INTO dbo.[Payments] ([payment_id], [member_id], [amount], [payment_type], [payment_method], [payment_status], [transaction_code], [payment_date]) VALUES (80, 19, 10000, N'Membership', N'PayOS', N'Paid', N'TXN100000000026', '2026-02-05 12:00:00');
INSERT INTO dbo.[Payments] ([payment_id], [member_id], [amount], [payment_type], [payment_method], [payment_status], [transaction_code], [payment_date]) VALUES (81, 20, 250000, N'Service', N'VNPAY', N'Paid', N'TXN100000000027', '2026-02-24 12:00:00');
INSERT INTO dbo.[Payments] ([payment_id], [member_id], [amount], [payment_type], [payment_method], [payment_status], [transaction_code], [payment_date]) VALUES (82, 27, 4000000, N'Membership', N'PayOS', N'Paid', N'TXN100000000028', '2026-03-12 12:00:00');
INSERT INTO dbo.[Payments] ([payment_id], [member_id], [amount], [payment_type], [payment_method], [payment_status], [transaction_code], [payment_date]) VALUES (84, 1, 500000, N'Service', N'PayOS', N'Paid', N'TXN100000000030', '2026-04-05 12:00:00');
INSERT INTO dbo.[Payments] ([payment_id], [member_id], [amount], [payment_type], [payment_method], [payment_status], [transaction_code], [payment_date]) VALUES (85, 19, 5000, N'Membership', N'VNPAY', N'Paid', N'TXN100000000031', '2026-04-22 12:00:00');
INSERT INTO dbo.[Payments] ([payment_id], [member_id], [amount], [payment_type], [payment_method], [payment_status], [transaction_code], [payment_date]) VALUES (86, 20, 10000, N'Membership', N'PayOS', N'Paid', N'TXN100000000032', '2026-05-15 12:00:00');
INSERT INTO dbo.[Payments] ([payment_id], [member_id], [amount], [payment_type], [payment_method], [payment_status], [transaction_code], [payment_date]) VALUES (87, 27, 400000, N'Service', N'VNPAY', N'Paid', N'TXN100000000033', '2026-05-30 12:00:00');
INSERT INTO dbo.[Payments] ([payment_id], [member_id], [amount], [payment_type], [payment_method], [payment_status], [transaction_code], [payment_date]) VALUES (89, 1, 5500000, N'Membership', N'VNPAY', N'Paid', N'TXN100000000035', '2026-06-18 12:00:00');
INSERT INTO dbo.[Payments] ([payment_id], [member_id], [amount], [payment_type], [payment_method], [payment_status], [transaction_code], [payment_date]) VALUES (90, 19, 9000000, N'Service', N'PayOS', N'Paid', N'TXN100000000036', '2026-07-01 12:00:00');
INSERT INTO dbo.[Payments] ([payment_id], [member_id], [amount], [payment_type], [payment_method], [payment_status], [transaction_code], [payment_date]) VALUES (91, 20, 14000000, N'Membership', N'VNPAY', N'Paid', N'TXN100000000037', '2026-07-15 12:00:00');
INSERT INTO dbo.[Payments] ([payment_id], [member_id], [amount], [payment_type], [payment_method], [payment_status], [transaction_code], [payment_date]) VALUES (92, 48, 310000, N'Membership', N'PayOS', N'Paid', N'447007543398', '2026-07-19 21:08:42');
SET IDENTITY_INSERT dbo.[Payments] OFF;
GO

-- Data for table [Reports] (2 rows)
SET IDENTITY_INSERT dbo.[Reports] ON;
INSERT INTO dbo.[Reports] ([report_id], [reported_by], [reported_user_id], [reported_service_id], [reported_membership_plan_id], [title], [reason], [status], [created_at], [resolved_at], [admin_note]) VALUES (4, 4, NULL, 1, NULL, N'Lỗi tủ locker', N'Hệ thống tủ locker khu vực nam bị lỗi quét mã vòng tay, không mở được ngăn 14.', N'Pending', '2026-06-08 11:23:51', NULL, NULL);
INSERT INTO dbo.[Reports] ([report_id], [reported_by], [reported_user_id], [reported_service_id], [reported_membership_plan_id], [title], [reason], [status], [created_at], [resolved_at], [admin_note]) VALUES (5, 4, NULL, NULL, 1, N'Yêu cầu hoàn trả chi phí', N'Yêu cầu xem xét hoàn trả chi phí gói tập do lịch đi công tác đột xuất không sử dụng được.', N'Pending', '2026-06-08 11:23:51', NULL, NULL);
SET IDENTITY_INSERT dbo.[Reports] OFF;
GO

-- Data for table [AppConfigs] (3 rows)
INSERT INTO dbo.[AppConfigs] ([config_key], [config_value], [description], [updated_at]) VALUES (N'core_sports', N'[{"name":"Gym","description":"Khu vực tạ tự do, máy khối, dàn tạ chất lượng cao giúp tăng cơ giảm mỡ hiệu quả.","image":"/assets/images/gym.png"},{"name":"Yoga","description":"Không gian yên tĩnh, các lớp Yoga từ cơ bản đến nâng cao giúp cải thiện sức khỏe và tinh thần.","image":"/assets/images/yoga.png"},{"name":"Boxing","description":"Khu vực Boxing tiêu chuẩn, xả stress hiệu quả và đốt cháy calo vượt trội.","image":"/assets/images/boxing.png"}]', N'C?u hình 3 b? môn trên trang ch?', '2026-07-07 11:41:45');
INSERT INTO dbo.[AppConfigs] ([config_key], [config_value], [description], [updated_at]) VALUES (N'meal_templates', N'[{"sport_type":"Gym","title":"Chế độ giảm cân thâm hụt 500kcal","description":"Giàu đạm, ít tinh bột nhanh. Sáng ức gà chiên không dầu, trưa cơm gạo lứt cá hồi, tối salad xanh."},{"sport_type":"Gym","title":"Ăn kiêng Low-Carb cơ bản","description":"Giảm thiểu tinh bột xấu, tăng chất béo tốt. Ưu tiên thịt bò, trứng luộc, quả bơ, rau xanh các bữa chính."},{"sport_type":"Gym","title":"Tăng cơ nạc (Lean Bulking)","description":"Dư thừa nhẹ 200kcal, ưu tiên đạm tinh khiết cho sự phát triển của thớ cơ. Sử dụng yến mạch, whey protein hỗ trợ."},{"sport_type":"Yoga","title":"Thực đơn thuần chay thanh lọc","description":"Chế độ ăn nhẹ nhàng, giàu chất xơ và vitamin để cơ thể dẻo dai. Sáng sinh tố bơ chuối, trưa salad đậu hũ, tối súp rau củ thanh đạm."},{"sport_type":"Yoga","title":"Thực đơn dinh dưỡng duy trì vóc dáng","description":"Cân bằng tinh bột phức and đạm thực vật. Tốt cho sức khỏe và tim mạch."},{"sport_type":"Boxing","title":"Thực đơn võ sĩ tăng cơ đốt mỡ","description":"Bữa ăn giàu protein và tinh bột hấp thụ chậm để duy trì năng lượng tập luyện cao. Sáng bò áp chảo, trưa cơm trắng + ức gà, tối cá hồi hấp."}]', N'Meal Plan templates filtered by sport types', '2026-06-29 03:37:50');
INSERT INTO dbo.[AppConfigs] ([config_key], [config_value], [description], [updated_at]) VALUES (N'workout_templates', N'[{"sport_type":"Gym","title":"HIIT Đốt Mỡ Nâng Cao","description":"Đốt mỡ cường độ cao cho người thừa cân nhẹ.","exercises":[{"exercise_name":"Nhảy dây (Jumping Jacks)","sets":3,"reps":30,"duration_minutes":1,"calories_burned":40,"rpe":7},{"exercise_name":"Squat (Bodyweight)","sets":4,"reps":15,"duration_minutes":2,"calories_burned":50,"rpe":8},{"exercise_name":"Plank giữ cơ bụng","sets":3,"reps":1,"duration_minutes":1,"calories_burned":20,"rpe":6},{"exercise_name":"Burpees","sets":4,"reps":15,"duration_minutes":2,"calories_burned":80,"rpe":9},{"exercise_name":"Chạy nước rút (Sprint)","sets":3,"reps":1,"duration_minutes":1,"calories_burned":60,"rpe":9}]},{"sport_type":"Gym","title":"Full Body Khởi Đầu","description":"Khởi động cơ xương khớp cho người mới bắt đầu.","exercises":[{"exercise_name":"Squat (Bodyweight)","sets":3,"reps":15,"duration_minutes":2,"calories_burned":45,"rpe":6},{"exercise_name":"Push-up (Hít đất)","sets":3,"reps":10,"duration_minutes":1,"calories_burned":30,"rpe":7},{"exercise_name":"Dumbbell Shoulder Press","sets":3,"reps":12,"duration_minutes":2,"calories_burned":40,"rpe":7},{"exercise_name":"Plank giữ cơ bụng","sets":3,"reps":1,"duration_minutes":1,"calories_burned":20,"rpe":5}]},{"sport_type":"Gym","title":"Powerlifting Cơ Bản","description":"Tập trung xây dựng sức mạnh cơ bắp thô.","exercises":[{"exercise_name":"Barbell Squat","sets":3,"reps":5,"duration_minutes":3,"calories_burned":60,"rpe":8},{"exercise_name":"Barbell Deadlift","sets":3,"reps":5,"duration_minutes":4,"calories_burned":80,"rpe":9},{"exercise_name":"Barbell Bench Press","sets":3,"reps":5,"duration_minutes":3,"calories_burned":50,"rpe":8}]},{"sport_type":"Yoga","title":"Yoga dẻo dai khớp vai","description":"Các tư thế vặn xoắn và giãn cơ mở rộng khớp vai giúp cơ bắp linh hoạt và phục hồi đau nhức cơ.","exercises":[{"exercise_name":"Tư thế em bé (Child Pose)","sets":3,"reps":1,"duration_minutes":2,"calories_burned":15,"rpe":3},{"exercise_name":"Tư thế chiến binh (Warrior Pose)","sets":3,"reps":5,"duration_minutes":2,"calories_burned":25,"rpe":5},{"exercise_name":"Giãn cơ vai (Shoulder Stretch)","sets":3,"reps":5,"duration_minutes":2,"calories_burned":20,"rpe":4}]},{"sport_type":"Yoga","title":"Yoga cân bằng tâm trí","description":"Giúp bình tâm và thư giãn hệ thần kinh.","exercises":[{"exercise_name":"Tư thế cây (Tree Pose)","sets":3,"reps":1,"duration_minutes":2,"calories_burned":10,"rpe":2},{"exercise_name":"Tư thế tam giác (Triangle Pose)","sets":3,"reps":5,"duration_minutes":2,"calories_burned":20,"rpe":4},{"exercise_name":"Tư thế xác chết (Savasana)","sets":1,"reps":1,"duration_minutes":5,"calories_burned":5,"rpe":1}]},{"sport_type":"Boxing","title":"Boxing Cardio Đốt Calo","description":"Rèn luyện thể lực và phản xạ nhanh.","exercises":[{"exercise_name":"Đấm thẳng (Jabs & Crosses)","sets":4,"reps":50,"duration_minutes":2,"calories_burned":60,"rpe":6},{"exercise_name":"Đấm móc (Hooks & Uppercuts)","sets":4,"reps":40,"duration_minutes":2,"calories_burned":70,"rpe":7},{"exercise_name":"Di chuyển tránh đòn (Slipping & Weaving)","sets":3,"reps":30,"duration_minutes":2,"calories_burned":50,"rpe":6}]}]', N'Workout Plan templates filtered by sport types', '2026-06-29 03:37:50');
GO

-- Data for table [SequelizeMeta] (5 rows)
INSERT INTO dbo.[SequelizeMeta] ([name]) VALUES (N'20260616000000-initial-schema.js');
INSERT INTO dbo.[SequelizeMeta] ([name]) VALUES (N'20260616010000-add-email-verification-token.js');
INSERT INTO dbo.[SequelizeMeta] ([name]) VALUES (N'20260702_add_session_count_to_memberservices.js');
INSERT INTO dbo.[SequelizeMeta] ([name]) VALUES (N'20260708023700-add-appointment-cancel-columns.js');
INSERT INTO dbo.[SequelizeMeta] ([name]) VALUES (N'20260709033616-create-membership-plan-services.js');
GO

