-- ============================================================
-- Dingalan Community College - Office of Student Affairs & Services (OSAS)
-- MySQL Database Export for Localhost / phpMyAdmin
-- Compatible with XAMPP / WAMP / LAMP / MySQL 5.7+ & MySQL 8.0+ / MariaDB
-- ============================================================

CREATE DATABASE IF NOT EXISTS `osas_dcc_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `osas_dcc_db`;

-- --------------------------------------------------------
-- Table structure for `users`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(50) NOT NULL,
  `student_id` VARCHAR(50) DEFAULT NULL,
  `full_name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `role` ENUM('ADMIN', 'STUDENT') NOT NULL DEFAULT 'STUDENT',
  `avatar_url` TEXT DEFAULT NULL,
  `year_level` VARCHAR(50) DEFAULT NULL,
  `course` VARCHAR(100) DEFAULT NULL,
  `one_time_password` VARCHAR(20) DEFAULT NULL,
  `is_suspended` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `announcements`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `announcements` (
  `id` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `category` ENUM('SCHOOL', 'SCHOLARSHIP', 'DORMITORY') NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expiration_date` DATE NOT NULL,
  `image_url` TEXT DEFAULT NULL,
  `external_link` TEXT DEFAULT NULL,
  `posted_by` VARCHAR(100) NOT NULL,
  `is_archived` TINYINT(1) NOT NULL DEFAULT 0,
  `scholarship_id` VARCHAR(50) DEFAULT NULL,
  `dorm_room_id` VARCHAR(50) DEFAULT NULL,
  `heart_reacts` JSON DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `scholarships`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `scholarships` (
  `id` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `requirements` TEXT NOT NULL,
  `deadline` DATE NOT NULL,
  `amount` VARCHAR(50) DEFAULT NULL,
  `status` ENUM('ACTIVE', 'CLOSED', 'DRAFT') NOT NULL DEFAULT 'ACTIVE',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_archived` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `scholarship_applications`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `scholarship_applications` (
  `id` VARCHAR(50) NOT NULL,
  `scholarship_id` VARCHAR(50) NOT NULL,
  `scholarship_title` VARCHAR(255) NOT NULL,
  `student_id` VARCHAR(50) NOT NULL,
  `student_name` VARCHAR(150) NOT NULL,
  `student_email` VARCHAR(150) NOT NULL,
  `course` VARCHAR(100) NOT NULL,
  `year_level` VARCHAR(50) NOT NULL,
  `applied_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` ENUM('PENDING', 'ACCEPTED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  `admin_notes` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_scholarship_id` (`scholarship_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `appointments`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `appointments` (
  `id` VARCHAR(50) NOT NULL,
  `student_id` VARCHAR(50) NOT NULL,
  `student_name` VARCHAR(150) NOT NULL,
  `student_email` VARCHAR(150) NOT NULL,
  `description` TEXT NOT NULL,
  `preferred_date` DATE NOT NULL,
  `preferred_time` VARCHAR(50) NOT NULL,
  `status` ENUM('PENDING', 'APPROVED', 'RESCHEDULED', 'REJECTED', 'DONE_ADMIN', 'DONE_STUDENT', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
  `admin_preferred_date` DATE DEFAULT NULL,
  `admin_preferred_time` VARCHAR(50) DEFAULT NULL,
  `admin_notes` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `admin_marked_done` TINYINT(1) NOT NULL DEFAULT 0,
  `student_marked_done` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `safety_reports`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `safety_reports` (
  `id` VARCHAR(50) NOT NULL,
  `student_id` VARCHAR(50) NOT NULL,
  `student_name` VARCHAR(150) NOT NULL,
  `is_anonymous` TINYINT(1) NOT NULL DEFAULT 0,
  `description` TEXT NOT NULL,
  `involved_persons` TEXT NOT NULL,
  `location` VARCHAR(255) NOT NULL,
  `evidence_url` TEXT DEFAULT NULL,
  `reported_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` ENUM('REPORTED', 'RESOLVED', 'ESCALATED') NOT NULL DEFAULT 'REPORTED',
  `is_urgent` TINYINT(1) NOT NULL DEFAULT 0,
  `notes` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `dorm_rooms`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `dorm_rooms` (
  `id` VARCHAR(50) NOT NULL,
  `room_number` VARCHAR(50) NOT NULL,
  `floor` VARCHAR(50) NOT NULL,
  `capacity` INT NOT NULL DEFAULT 4,
  `gender` ENUM('MALE', 'FEMALE', 'COED') NOT NULL DEFAULT 'COED',
  `occupied_count` INT NOT NULL DEFAULT 0,
  `status` ENUM('AVAILABLE', 'FULL', 'MAINTENANCE') NOT NULL DEFAULT 'AVAILABLE',
  `is_archived` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `dorm_residents`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `dorm_residents` (
  `id` VARCHAR(50) NOT NULL,
  `room_id` VARCHAR(50) NOT NULL,
  `student_id` VARCHAR(50) NOT NULL,
  `student_name` VARCHAR(150) NOT NULL,
  `assigned_date` DATE NOT NULL,
  `contact_number` VARCHAR(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_room_id` (`room_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `dorm_applicants`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `dorm_applicants` (
  `id` VARCHAR(50) NOT NULL,
  `student_id` VARCHAR(50) NOT NULL,
  `student_name` VARCHAR(150) NOT NULL,
  `student_email` VARCHAR(150) NOT NULL,
  `address` TEXT NOT NULL,
  `reason` TEXT NOT NULL,
  `attachment_url` TEXT DEFAULT NULL,
  `attachment_name` VARCHAR(255) DEFAULT NULL,
  `applied_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` ENUM('PENDING', 'ACCEPTED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  `assigned_room_number` VARCHAR(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `disciplinary_records`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `disciplinary_records` (
  `id` VARCHAR(50) NOT NULL,
  `student_id` VARCHAR(50) NOT NULL,
  `student_name` VARCHAR(150) NOT NULL,
  `offense_type` VARCHAR(150) NOT NULL,
  `description` TEXT NOT NULL,
  `sanction` TEXT NOT NULL,
  `date_logged` DATE NOT NULL,
  `issued_by` VARCHAR(150) NOT NULL,
  `is_archived` TINYINT(1) NOT NULL DEFAULT 0,
  `admin_marked_done` TINYINT(1) NOT NULL DEFAULT 0,
  `student_marked_done` TINYINT(1) NOT NULL DEFAULT 0,
  `status` ENUM('SANCTIONED', 'COMPLETED') NOT NULL DEFAULT 'SANCTIONED',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `student_feedbacks`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `student_feedbacks` (
  `id` VARCHAR(50) NOT NULL,
  `student_id` VARCHAR(50) NOT NULL,
  `student_name` VARCHAR(150) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `submitted_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `activity_logs`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` VARCHAR(50) NOT NULL,
  `action` VARCHAR(150) NOT NULL,
  `module` VARCHAR(100) NOT NULL,
  `performed_by` VARCHAR(150) NOT NULL,
  `details` TEXT NOT NULL,
  `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `system_notifications`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `system_notifications` (
  `id` VARCHAR(50) NOT NULL,
  `user_id` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `type` ENUM('SAFETY', 'APPOINTMENT', 'SCHOLARSHIP', 'DORM', 'ANNOUNCEMENT', 'SYSTEM') NOT NULL DEFAULT 'SYSTEM',
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `link_module` VARCHAR(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `archive_items`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `archive_items` (
  `id` VARCHAR(50) NOT NULL,
  `original_id` VARCHAR(50) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `details` TEXT DEFAULT NULL,
  `archived_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SEED DATA INSERTS
-- ============================================================

-- Inserting default Users (Admin & Students)
INSERT INTO `users` (`id`, `student_id`, `full_name`, `email`, `role`, `avatar_url`, `year_level`, `course`, `one_time_password`, `is_suspended`, `created_at`) VALUES
('admin-1', 'ADM-001', 'Dr. Maria Santos', 'admin@dcc.edu.ph', 'ADMIN', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria', NULL, NULL, '889922', 0, NOW()),
('stud-1', '2024-0101', 'Juan Dela Cruz', 'juan.delacruz@student.dcc.edu.ph', 'STUDENT', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Juan', '2nd Year', 'BS Information Technology', '123456', 0, NOW()),
('stud-2', '2024-0102', 'Maria Clara', 'maria.clara@student.dcc.edu.ph', 'STUDENT', 'https://api.dicebear.com/7.x/avataaars/svg?seed=MariaClara', '3rd Year', 'BS Education', '654321', 0, NOW()),
('stud-3', '2024-0103', 'Jose Rizal', 'jose.rizal@student.dcc.edu.ph', 'STUDENT', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jose', '4th Year', 'BS Hospitality Management', '112233', 0, NOW());

-- Inserting Announcements
INSERT INTO `announcements` (`id`, `title`, `content`, `category`, `created_at`, `expiration_date`, `image_url`, `external_link`, `posted_by`, `is_archived`, `scholarship_id`, `dorm_room_id`, `heart_reacts`) VALUES
('anc-1', 'Tulong Dunong Scholarship Batch 2025 Application Open', 'We are pleased to announce that applications for the Tulong Dunong Tertiary Education Subsidy are now open for qualified DCC students.', 'SCHOLARSHIP', NOW(), '2025-12-31', 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80', 'https://dcc.edu.ph/scholarships/tulong-dunong', 'OSAS Scholarship Committee', 0, 'sch-1', NULL, '["Juan Dela Cruz", "Maria Clara"]'),
('anc-2', 'Campus Male & Female Dormitory Slots Available', 'The Student Housing and Dormitory Office is now accepting applications for S.Y. 2025-2026 dorm residency.', 'DORMITORY', NOW(), '2025-11-30', 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80', NULL, 'DCC Student Housing Office', 0, NULL, 'room-101', '["Juan Dela Cruz"]'),
('anc-3', 'Annual Student Affairs Orientation & Leadership Summit', 'All student council officers and club presidents are invited to attend the OSAS Leadership Summit at the DCC Gymnasium.', 'SCHOOL', NOW(), '2025-10-15', 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80', NULL, 'OSAS Director', 0, NULL, NULL, '[]');

-- Inserting Scholarships
INSERT INTO `scholarships` (`id`, `title`, `description`, `requirements`, `deadline`, `amount`, `status`, `created_at`, `is_archived`) VALUES
('sch-1', 'Tulong Dunong Tertiary Subsidy', 'Government financial aid for deserving college students.', '1. Certified True Copy of Grades (GWA 85% or higher)\n2. Certificate of Indigency from Barangay\n3. Valid Student ID copy', '2025-12-31', '₱15,000 per semester', 'ACTIVE', NOW(), 0),
('sch-2', 'LGU Dingalan Academic Excellence Award', 'LGU funded scholarship for top performing students residing in Dingalan, Aurora.', '1. Certificate of Residency in Dingalan\n2. GWA of 1.75 or higher\n3. Enrollment Assessment Form', '2025-11-15', '₱10,000 per semester', 'ACTIVE', NOW(), 0);

-- Inserting Dorm Rooms
INSERT INTO `dorm_rooms` (`id`, `room_number`, `floor`, `capacity`, `gender`, `occupied_count`, `status`, `is_archived`) VALUES
('room-101', 'Room 101', '1st Floor - Male Wing', 4, 'MALE', 2, 'AVAILABLE', 0),
('room-102', 'Room 102', '1st Floor - Female Wing', 4, 'FEMALE', 4, 'FULL', 0),
('room-201', 'Room 201', '2nd Floor - Male Wing', 4, 'MALE', 1, 'AVAILABLE', 0);

-- Inserting Dorm Residents
INSERT INTO `dorm_residents` (`id`, `room_id`, `student_id`, `student_name`, `assigned_date`, `contact_number`) VALUES
('res-1', 'room-101', '2024-0101', 'Juan Dela Cruz', '2024-08-15', '09171234567'),
('res-2', 'room-101', '2024-0103', 'Jose Rizal', '2024-08-15', '09189876543');

-- Inserting Disciplinary Records
INSERT INTO `disciplinary_records` (`id`, `student_id`, `student_name`, `offense_type`, `description`, `sanction`, `date_logged`, `issued_by`, `is_archived`, `admin_marked_done`, `student_marked_done`, `status`) VALUES
('disc-1', '2024-0101', 'Juan Dela Cruz', 'Uniform Violation', 'Attended classes without prescribed college uniform and valid ID badge on Monday.', '4 Hours Community Service at Campus Library', '2025-01-10', 'OSAS Prefect of Discipline', 0, 1, 1, 'COMPLETED');

-- Inserting Activity Logs
INSERT INTO `activity_logs` (`id`, `action`, `module`, `performed_by`, `details`, `timestamp`) VALUES
('log-1', 'System Initialization', 'System Core', 'System Administrator', 'OSAS STU-SERVE Database engine & MySQL tables successfully generated.', NOW());

-- Commit transaction
COMMIT;
