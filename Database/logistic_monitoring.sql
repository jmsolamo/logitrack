-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: May 11, 2026 at 03:53 AM
-- Server version: 8.4.3
-- PHP Version: 8.3.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `logistic_monitoring`
--

-- --------------------------------------------------------

--
-- Table structure for table `announcements`
--

CREATE TABLE `announcements` (
  `id` int UNSIGNED NOT NULL,
  `title` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `created_by` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `announcement_target_roles`
--

CREATE TABLE `announcement_target_roles` (
  `id` int UNSIGNED NOT NULL,
  `announcement_id` int UNSIGNED NOT NULL,
  `role_name` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `deliveries`
--

CREATE TABLE `deliveries` (
  `id` int UNSIGNED NOT NULL,
  `reference_no` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `delivery_type` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_from` datetime DEFAULT NULL,
  `date_to` datetime DEFAULT NULL,
  `vehicle_equipment` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tnvs_provider` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_budget` decimal(14,2) NOT NULL DEFAULT '0.00',
  `requested_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('Pending','In Transit','Completed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pending',
  `departure_date` datetime DEFAULT NULL,
  `arrival_date` datetime DEFAULT NULL,
  `delivery_charge` decimal(14,2) NOT NULL DEFAULT '0.00',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `delivery_activities`
--

CREATE TABLE `delivery_activities` (
  `id` int UNSIGNED NOT NULL,
  `delivery_id` int UNSIGNED NOT NULL,
  `value` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `delivery_charges`
--

CREATE TABLE `delivery_charges` (
  `id` int UNSIGNED NOT NULL,
  `plate_number` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `destination` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `charge` decimal(14,2) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `delivery_contingency`
--

CREATE TABLE `delivery_contingency` (
  `id` int UNSIGNED NOT NULL,
  `delivery_id` int UNSIGNED NOT NULL,
  `details` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amt` decimal(14,2) NOT NULL DEFAULT '0.00',
  `expense_date` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `delivery_customer_suppliers`
--

CREATE TABLE `delivery_customer_suppliers` (
  `id` int UNSIGNED NOT NULL,
  `delivery_id` int UNSIGNED NOT NULL,
  `value` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `delivery_destinations`
--

CREATE TABLE `delivery_destinations` (
  `id` int UNSIGNED NOT NULL,
  `delivery_id` int UNSIGNED NOT NULL,
  `value` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `delivery_drivers`
--

CREATE TABLE `delivery_drivers` (
  `id` int UNSIGNED NOT NULL,
  `delivery_id` int UNSIGNED NOT NULL,
  `value` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `delivery_fuel`
--

CREATE TABLE `delivery_fuel` (
  `id` int UNSIGNED NOT NULL,
  `delivery_id` int UNSIGNED NOT NULL,
  `liters` decimal(12,3) NOT NULL DEFAULT '0.000',
  `amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `gas_station` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoice_no` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_type` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expense_date` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `delivery_helpers`
--

CREATE TABLE `delivery_helpers` (
  `id` int UNSIGNED NOT NULL,
  `delivery_id` int UNSIGNED NOT NULL,
  `value` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `delivery_job_orders`
--

CREATE TABLE `delivery_job_orders` (
  `id` int UNSIGNED NOT NULL,
  `delivery_id` int UNSIGNED NOT NULL,
  `value` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `delivery_load_expenses`
--

CREATE TABLE `delivery_load_expenses` (
  `id` int UNSIGNED NOT NULL,
  `delivery_id` int UNSIGNED NOT NULL,
  `details` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amt` decimal(14,2) NOT NULL DEFAULT '0.00',
  `expense_date` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `delivery_meal_expenses`
--

CREATE TABLE `delivery_meal_expenses` (
  `id` int UNSIGNED NOT NULL,
  `delivery_id` int UNSIGNED NOT NULL,
  `details` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amt` decimal(14,2) NOT NULL DEFAULT '0.00',
  `expense_date` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `delivery_pier_expenses`
--

CREATE TABLE `delivery_pier_expenses` (
  `id` int UNSIGNED NOT NULL,
  `delivery_id` int UNSIGNED NOT NULL,
  `details` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amt` decimal(14,2) NOT NULL DEFAULT '0.00',
  `expense_date` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `delivery_purposes`
--

CREATE TABLE `delivery_purposes` (
  `id` int UNSIGNED NOT NULL,
  `delivery_id` int UNSIGNED NOT NULL,
  `value` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `delivery_repair_maintenance`
--

CREATE TABLE `delivery_repair_maintenance` (
  `id` int UNSIGNED NOT NULL,
  `delivery_id` int UNSIGNED NOT NULL,
  `details` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amt` decimal(14,2) NOT NULL DEFAULT '0.00',
  `expense_date` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `delivery_requests`
--

CREATE TABLE `delivery_requests` (
  `id` int UNSIGNED NOT NULL,
  `reference_no` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_type` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_from` datetime DEFAULT NULL,
  `date_to` datetime DEFAULT NULL,
  `vehicle_equipment` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tnvs_provider` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `requested_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_submitted` datetime DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `total_budget` decimal(14,2) NOT NULL DEFAULT '0.00',
  `requested_by_user_id` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `request_status` enum('Pending','Approved','Approved with Changes','For Review','Declined') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pending',
  `decline_reason` text COLLATE utf8mb4_unicode_ci,
  `reviewed_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `reviewer_status` enum('Pending','Accepted') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pending',
  `reviewer_notes` text COLLATE utf8mb4_unicode_ci,
  `reviewer_reviewed_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reviewer_reviewed_at` datetime DEFAULT NULL,
  `original_vehicle` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vehicle_changed` tinyint(1) NOT NULL DEFAULT '0',
  `vehicle_change_reason` text COLLATE utf8mb4_unicode_ci,
  `delivery_reference_no` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `combined_with_delivery` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `delivery_request_activities`
--

CREATE TABLE `delivery_request_activities` (
  `id` int UNSIGNED NOT NULL,
  `delivery_request_id` int UNSIGNED NOT NULL,
  `value` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `delivery_request_customer_suppliers`
--

CREATE TABLE `delivery_request_customer_suppliers` (
  `id` int UNSIGNED NOT NULL,
  `delivery_request_id` int UNSIGNED NOT NULL,
  `value` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `delivery_request_destinations`
--

CREATE TABLE `delivery_request_destinations` (
  `id` int UNSIGNED NOT NULL,
  `delivery_request_id` int UNSIGNED NOT NULL,
  `value` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `delivery_request_drivers`
--

CREATE TABLE `delivery_request_drivers` (
  `id` int UNSIGNED NOT NULL,
  `delivery_request_id` int UNSIGNED NOT NULL,
  `value` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `delivery_request_helpers`
--

CREATE TABLE `delivery_request_helpers` (
  `id` int UNSIGNED NOT NULL,
  `delivery_request_id` int UNSIGNED NOT NULL,
  `value` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `delivery_request_job_orders`
--

CREATE TABLE `delivery_request_job_orders` (
  `id` int UNSIGNED NOT NULL,
  `delivery_request_id` int UNSIGNED NOT NULL,
  `value` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `delivery_request_purposes`
--

CREATE TABLE `delivery_request_purposes` (
  `id` int UNSIGNED NOT NULL,
  `delivery_request_id` int UNSIGNED NOT NULL,
  `value` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `delivery_timeline`
--

CREATE TABLE `delivery_timeline` (
  `id` int UNSIGNED NOT NULL,
  `delivery_id` int UNSIGNED NOT NULL,
  `event_type` enum('departure','arrival') COLLATE utf8mb4_unicode_ci NOT NULL,
  `destination` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `event_time` datetime DEFAULT NULL,
  `destination_index` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `delivery_toll_fees`
--

CREATE TABLE `delivery_toll_fees` (
  `id` int UNSIGNED NOT NULL,
  `delivery_id` int UNSIGNED NOT NULL,
  `details` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amt` decimal(14,2) NOT NULL DEFAULT '0.00',
  `expense_date` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`id`, `name`, `created_at`, `updated_at`) VALUES
(1, 'Logistic', '2026-04-29 01:25:54', '2026-04-29 01:25:54'),
(4, 'Production', '2026-04-29 01:25:54', '2026-04-29 01:25:54'),
(5, 'Purchasing', '2026-04-29 01:25:54', '2026-04-29 01:25:54'),
(6, 'Servicing', '2026-04-29 01:25:54', '2026-04-29 01:25:54'),
(7, 'Operation', '2026-04-29 01:29:13', '2026-04-29 01:29:13');

-- --------------------------------------------------------

--
-- Table structure for table `destinations`
--

CREATE TABLE `destinations` (
  `id` int UNSIGNED NOT NULL,
  `destination` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `customer_supplier` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `login_history`
--

CREATE TABLE `login_history` (
  `id` int NOT NULL,
  `username` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `login_history`
--

INSERT INTO `login_history` (`id`, `username`, `status`, `reason`, `ip_address`, `created_at`) VALUES
(1, 'logistic-department', 'Success', 'Logged in successfully', '::1', '2026-04-30 00:30:03'),
(2, 'operation-department', 'Success', 'Logged in successfully', '::1', '2026-04-30 05:18:31'),
(3, 'reviewer-acc', 'Success', 'Logged in successfully', '::1', '2026-04-30 05:18:45'),
(4, 'logistic-department', 'Success', 'Logged in successfully', '::1', '2026-05-04 05:03:56'),
(5, 'logistic-department', 'Success', 'Logged in successfully', '::1', '2026-05-04 07:37:32'),
(6, 'logistic-department', 'Success', 'Logged in successfully', '::1', '2026-05-04 23:28:22'),
(7, 'logistic-department', 'Success', 'Logged in successfully', '::1', '2026-05-11 03:10:40'),
(8, 'logistic-department', 'Success', 'Logged in successfully', '::1', '2026-05-11 03:10:58'),
(9, 'reviewerr-acc', 'Failed', 'Invalid username', '::1', '2026-05-11 03:13:27'),
(10, 'reviewerr-acc', 'Failed', 'Invalid username', '::1', '2026-05-11 03:13:28'),
(11, 'reviewer-acc', 'Success', 'Logged in successfully', '::1', '2026-05-11 03:13:33'),
(12, 'logistic-department', 'Success', 'Logged in successfully', '::1', '2026-05-11 03:14:01'),
(13, 'operation-department', 'Success', 'Logged in successfully', '::1', '2026-05-11 03:14:07'),
(14, 'reviewer-acc', 'Success', 'Logged in successfully', '::1', '2026-05-11 03:14:19'),
(15, 'logistic-department', 'Success', 'Logged in successfully', '::1', '2026-05-11 03:15:35'),
(16, 'operation-department', 'Success', 'Logged in successfully', '::1', '2026-05-11 03:15:42'),
(17, 'reviewer-acc', 'Success', 'Logged in successfully', '::1', '2026-05-11 03:15:51'),
(18, 'logistic-department', 'Success', 'Logged in successfully', '::1', '2026-05-11 03:16:15'),
(19, 'logistic-department', 'Success', 'Logged in successfully', '::1', '2026-05-11 03:19:21'),
(20, 'logistic-department', 'Success', 'Logged in successfully', '::ffff:127.0.0.1', '2026-05-11 03:36:13'),
(21, 'logistic-department', 'Success', 'Logged in successfully', '::ffff:127.0.0.1', '2026-05-11 03:37:58'),
(22, 'operation-department', 'Success', 'Logged in successfully', '::ffff:127.0.0.1', '2026-05-11 03:38:07'),
(23, 'logistic-department', 'Success', 'Logged in successfully', '::ffff:127.0.0.1', '2026-05-11 03:41:05');

-- --------------------------------------------------------

--
-- Table structure for table `personnels`
--

CREATE TABLE `personnels` (
  `id` int UNSIGNED NOT NULL,
  `firstname` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lastname` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `position` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `personnels`
--

INSERT INTO `personnels` (`id`, `firstname`, `lastname`, `position`, `created_at`, `updated_at`) VALUES
(1, 'omar', 'diama', 'Driver', '2026-03-15 23:51:19.000', '2026-03-15 23:51:19.000'),
(2, 'arnulfo', 'tobias', 'Driver', '2026-03-15 23:51:31.000', '2026-03-15 23:51:31.000'),
(3, 'alex', 'calibjo', 'Driver', '2026-03-15 23:51:45.000', '2026-03-15 23:51:45.000'),
(4, 'ardy', 'sanoy', 'Driver', '2026-03-15 23:51:58.000', '2026-03-15 23:51:58.000'),
(5, 'clarence', 'labrador', 'Driver', '2026-03-15 23:52:39.000', '2026-03-15 23:52:39.000'),
(6, 'henry', 'villacruel', 'Driver', '2026-03-15 23:52:56.000', '2026-03-15 23:52:56.000'),
(7, 'edwin', 'visperas', 'Driver', '2026-03-15 23:53:13.000', '2026-03-15 23:53:13.000'),
(8, 'john marco', 'cura', 'Driver', '2026-03-15 23:53:33.000', '2026-03-15 23:53:33.000'),
(9, 'marvin', 'bueno', 'Driver', '2026-03-15 23:54:01.000', '2026-03-15 23:54:01.000'),
(10, 'johnrick', 'gapasinao', 'Driver', '2026-03-15 23:54:24.000', '2026-03-15 23:54:24.000'),
(11, 'ambrocio', 'mendoza', 'Helper', '2026-03-15 23:54:45.000', '2026-03-15 23:54:45.000'),
(12, 'rodel', 'barcel', 'Helper', '2026-03-15 23:56:46.000', '2026-03-15 23:56:46.000'),
(13, 'henry', 'emperador', 'Helper', '2026-03-15 23:57:43.000', '2026-03-15 23:57:43.000'),
(14, 'jojo', 'bongkato', 'Helper', '2026-03-15 23:58:04.000', '2026-03-16 00:00:09.000'),
(15, 'edwin', 'vispente', 'Helper', '2026-03-15 23:58:25.000', '2026-03-16 00:00:27.000'),
(16, 'reymond', 'fuentes', 'Helper', '2026-03-25 02:59:16.000', '2026-04-23 10:26:35.087');

-- --------------------------------------------------------

--
-- Table structure for table `purchases`
--

CREATE TABLE `purchases` (
  `id` int UNSIGNED NOT NULL,
  `date` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `items` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `qty` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `item_dates` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `item_amounts` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `supplier` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoice_no` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `purchased_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `budget` decimal(14,2) DEFAULT NULL,
  `used_for_note` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int UNSIGNED NOT NULL,
  `username` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `plain_password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `department` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `role` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password_hash`, `plain_password`, `department`, `role`, `created_at`, `updated_at`) VALUES
(1, 'logistic-department', '$2b$10$jh9nGnec2fzHKXB5S5b4qOZw/OdiMiAeei3nEAJRMUQMIv8mRb0yq', '123456', 'Logistic', 'admin', '2026-03-30 17:09:44.000', '2026-04-06 18:02:06.000'),
(2, 'operation-department', '$2b$10$VJvow8B3hA/HP75d85HDVepih/6b5NJMOi.LV9Jo8trAvFV2dHhxe', '123456', 'Operation', 'requestor', '2026-03-31 03:58:24.000', '2026-04-28 18:09:04.438'),
(3, 'warehouse-department', '$2b$10$B./ZWS23QkpFF6OVxfOMceYZEMrq11bD/6uGOkdwTNCxmRPCntI1O', '123456', 'Warehouse', 'requestor', '2026-04-06 16:06:31.000', '2026-04-28 10:55:59.156'),
(4, 'reviewer-acc', '$2b$10$D0YkKqUepSBclB0BkaG/L.R.agkULDGfiah9TE9V7pFhfLelSTNO.', '123456', 'Logistic', 'manager', '2026-04-15 15:53:58.000', '2026-04-28 10:54:27.452'),
(7, 'production-department', '$2b$10$m3Ga0erbxlrcJsDGAcMyEueLturClPUiHCp.dq.YS4cb3POfnJctu', '123456', 'Production', 'requestor', '2026-04-28 10:56:15.768', '2026-04-28 10:56:15.768');

-- --------------------------------------------------------

--
-- Table structure for table `vehicles`
--

CREATE TABLE `vehicles` (
  `id` int UNSIGNED NOT NULL,
  `plate_number` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('Available','Booked','Maintenance','Unavailable') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Available',
  `maintenance_reason` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `maintenance_start_date` datetime DEFAULT NULL,
  `maintenance_end_date` datetime DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `vehicles`
--

INSERT INTO `vehicles` (`id`, `plate_number`, `model`, `status`, `maintenance_reason`, `maintenance_start_date`, `maintenance_end_date`, `created_at`, `updated_at`) VALUES
(2, 'CRV 851', 'fighter', 'Available', '', NULL, NULL, '2026-03-16 00:13:09.000', '2026-03-16 00:13:16.000'),
(3, 'CRU 674', 'CANTER', 'Available', '', NULL, NULL, '2026-03-16 08:07:57.000', '2026-03-16 08:07:57.000'),
(4, 'RJV 170', 'VANETTE', 'Available', '', NULL, NULL, '2026-03-16 08:08:16.000', '2026-03-16 08:08:16.000'),
(5, 'RKJ 602', 'DOUBLE CAB GREEN', 'Available', '', NULL, NULL, '2026-03-16 08:08:51.000', '2026-03-16 08:08:51.000'),
(6, 'RKK 532', 'DUMPTRUCK', 'Available', '', NULL, NULL, '2026-03-16 08:09:17.000', '2026-03-16 08:09:17.000'),
(7, 'TEX 967', 'TEN WHEELER', 'Available', '', NULL, NULL, '2026-03-16 08:09:43.000', '2026-03-16 08:09:43.000'),
(8, 'PSJ 636', 'TADANO CRANE', 'Available', '', NULL, NULL, '2026-03-16 08:10:02.000', '2026-03-16 08:10:02.000'),
(9, 'ZL 90T', 'ZOOMLION', 'Available', '', NULL, NULL, '2026-03-16 08:10:26.000', '2026-03-16 08:10:26.000'),
(10, 'ZL 60T', 'ZOOMLION', 'Available', '', NULL, NULL, '2026-03-16 08:10:42.000', '2026-03-16 08:10:42.000'),
(11, 'BACKHOE PC 120', 'KOMATSU', 'Available', '', NULL, NULL, '2026-03-16 08:11:01.000', '2026-03-16 08:11:01.000'),
(12, 'ABS 2468', 'HOWO LOWBED', 'Available', '', NULL, NULL, '2026-03-16 08:11:34.000', '2026-03-16 08:11:34.000'),
(13, 'AAJ 1851', 'DROPSIDE', 'Available', '', NULL, NULL, '2026-03-16 08:11:57.000', '2026-04-20 17:05:11.000'),
(14, 'AAJ 1822', 'PASSENGER VAN', 'Available', '', NULL, NULL, '2026-03-16 08:12:29.000', '2026-03-16 08:12:38.000'),
(15, 'CSA 566', 'ROCSTA', 'Available', '', NULL, NULL, '2026-03-16 08:12:59.000', '2026-03-16 08:12:59.000'),
(16, 'TZI 240', 'ADVENTURE', 'Available', '', NULL, NULL, '2026-03-16 08:13:19.000', '2026-03-16 08:13:19.000'),
(17, 'TVQ 237', 'ADVENTURE', 'Available', '', NULL, NULL, '2026-03-16 08:14:28.000', '2026-03-16 08:14:28.000'),
(18, 'TWO 384', 'ADVENTURE', 'Available', '', NULL, NULL, '2026-03-16 08:14:51.000', '2026-03-16 08:14:51.000'),
(19, 'CDJ 2906', 'ADVENTURE', 'Available', '', NULL, NULL, '2026-03-16 08:15:26.000', '2026-03-16 08:15:26.000'),
(20, 'CDJ 2907', 'ADVENTURE', 'Available', '', NULL, NULL, '2026-03-16 08:15:52.000', '2026-03-17 00:10:01.000'),
(21, 'AAI 5604', 'ACCENT RED', 'Available', '', NULL, NULL, '2026-03-16 08:16:18.000', '2026-03-16 08:16:18.000'),
(22, 'NIU 7290', 'L3001', 'Available', '', NULL, NULL, '2026-03-16 08:16:36.000', '2026-04-28 11:30:06.899'),
(23, 'NKI 7822', 'L3002', 'Available', '', NULL, NULL, '2026-03-16 08:16:54.000', '2026-04-28 11:30:04.456'),
(24, 'NAH 7709', 'EON RED', 'Available', '', NULL, NULL, '2026-03-16 08:17:13.000', '2026-04-28 11:30:01.575'),
(25, 'MAI 1307', 'FVR', 'Available', '', NULL, NULL, '2026-03-16 08:17:40.000', '2026-04-30 08:30:18.632'),
(26, 'RKJ 123', 'DOUBLE CAB BLUE', 'Available', '', NULL, NULL, '2026-03-16 08:21:42.000', '2026-04-30 08:57:02.140');

-- --------------------------------------------------------

--
-- Table structure for table `vehicle_maintenance_logs`
--

CREATE TABLE `vehicle_maintenance_logs` (
  `id` int UNSIGNED NOT NULL,
  `vehicle_id` int UNSIGNED NOT NULL,
  `reason` varchar(512) DEFAULT NULL,
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `created_at` datetime(3) DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `announcements`
--
ALTER TABLE `announcements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_announcements_dates` (`start_date`,`end_date`),
  ADD KEY `idx_announcements_created_at` (`created_at`);

--
-- Indexes for table `announcement_target_roles`
--
ALTER TABLE `announcement_target_roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_ann_role` (`announcement_id`,`role_name`);

--
-- Indexes for table `deliveries`
--
ALTER TABLE `deliveries`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_deliveries_ref` (`reference_no`),
  ADD KEY `idx_deliveries_status` (`status`),
  ADD KEY `idx_deliveries_dates` (`date_from`,`date_to`),
  ADD KEY `idx_deliveries_requested_by` (`requested_by`);

--
-- Indexes for table `delivery_activities`
--
ALTER TABLE `delivery_activities`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_da_delivery` (`delivery_id`);

--
-- Indexes for table `delivery_charges`
--
ALTER TABLE `delivery_charges`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_delivery_charges_plate_dest` (`plate_number`,`destination`),
  ADD KEY `idx_delivery_charges_plate` (`plate_number`);

--
-- Indexes for table `delivery_contingency`
--
ALTER TABLE `delivery_contingency`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_dc_delivery` (`delivery_id`);

--
-- Indexes for table `delivery_customer_suppliers`
--
ALTER TABLE `delivery_customer_suppliers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_dcs_delivery` (`delivery_id`);

--
-- Indexes for table `delivery_destinations`
--
ALTER TABLE `delivery_destinations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_dd_delivery` (`delivery_id`);

--
-- Indexes for table `delivery_drivers`
--
ALTER TABLE `delivery_drivers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ddr_delivery` (`delivery_id`);

--
-- Indexes for table `delivery_fuel`
--
ALTER TABLE `delivery_fuel`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_dfuel_delivery` (`delivery_id`);

--
-- Indexes for table `delivery_helpers`
--
ALTER TABLE `delivery_helpers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_dh_delivery` (`delivery_id`);

--
-- Indexes for table `delivery_job_orders`
--
ALTER TABLE `delivery_job_orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_djo_delivery` (`delivery_id`);

--
-- Indexes for table `delivery_load_expenses`
--
ALTER TABLE `delivery_load_expenses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_dle_delivery` (`delivery_id`);

--
-- Indexes for table `delivery_meal_expenses`
--
ALTER TABLE `delivery_meal_expenses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_dme_delivery` (`delivery_id`);

--
-- Indexes for table `delivery_pier_expenses`
--
ALTER TABLE `delivery_pier_expenses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_dpe_delivery` (`delivery_id`);

--
-- Indexes for table `delivery_purposes`
--
ALTER TABLE `delivery_purposes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_dp_delivery` (`delivery_id`);

--
-- Indexes for table `delivery_repair_maintenance`
--
ALTER TABLE `delivery_repair_maintenance`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_drm_delivery` (`delivery_id`);

--
-- Indexes for table `delivery_requests`
--
ALTER TABLE `delivery_requests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_dr_ref` (`reference_no`),
  ADD KEY `idx_dr_status` (`request_status`),
  ADD KEY `idx_dr_user` (`requested_by_user_id`),
  ADD KEY `idx_dr_created_at` (`created_at`);

--
-- Indexes for table `delivery_request_activities`
--
ALTER TABLE `delivery_request_activities`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_dra_dr` (`delivery_request_id`);

--
-- Indexes for table `delivery_request_customer_suppliers`
--
ALTER TABLE `delivery_request_customer_suppliers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_drcs_dr` (`delivery_request_id`);

--
-- Indexes for table `delivery_request_destinations`
--
ALTER TABLE `delivery_request_destinations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_drd_dr` (`delivery_request_id`);

--
-- Indexes for table `delivery_request_drivers`
--
ALTER TABLE `delivery_request_drivers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_drr_dr` (`delivery_request_id`);

--
-- Indexes for table `delivery_request_helpers`
--
ALTER TABLE `delivery_request_helpers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_drh_dr` (`delivery_request_id`);

--
-- Indexes for table `delivery_request_job_orders`
--
ALTER TABLE `delivery_request_job_orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_drjo_dr` (`delivery_request_id`);

--
-- Indexes for table `delivery_request_purposes`
--
ALTER TABLE `delivery_request_purposes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_drp_dr` (`delivery_request_id`);

--
-- Indexes for table `delivery_timeline`
--
ALTER TABLE `delivery_timeline`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_dtl_delivery` (`delivery_id`);

--
-- Indexes for table `delivery_toll_fees`
--
ALTER TABLE `delivery_toll_fees`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_dtf_delivery` (`delivery_id`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `destinations`
--
ALTER TABLE `destinations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_destinations_name` (`destination`);

--
-- Indexes for table `login_history`
--
ALTER TABLE `login_history`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `personnels`
--
ALTER TABLE `personnels`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_personnels_name` (`lastname`,`firstname`);

--
-- Indexes for table `purchases`
--
ALTER TABLE `purchases`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_purchases_date` (`date`),
  ADD KEY `idx_purchases_category` (`category`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_users_username` (`username`),
  ADD KEY `idx_users_role` (`role`);

--
-- Indexes for table `vehicles`
--
ALTER TABLE `vehicles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_vehicles_plate` (`plate_number`),
  ADD KEY `idx_vehicles_status` (`status`);

--
-- Indexes for table `vehicle_maintenance_logs`
--
ALTER TABLE `vehicle_maintenance_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `vehicle_id` (`vehicle_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `announcements`
--
ALTER TABLE `announcements`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `announcement_target_roles`
--
ALTER TABLE `announcement_target_roles`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `deliveries`
--
ALTER TABLE `deliveries`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `delivery_activities`
--
ALTER TABLE `delivery_activities`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `delivery_charges`
--
ALTER TABLE `delivery_charges`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `delivery_contingency`
--
ALTER TABLE `delivery_contingency`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `delivery_customer_suppliers`
--
ALTER TABLE `delivery_customer_suppliers`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `delivery_destinations`
--
ALTER TABLE `delivery_destinations`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `delivery_drivers`
--
ALTER TABLE `delivery_drivers`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `delivery_fuel`
--
ALTER TABLE `delivery_fuel`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `delivery_helpers`
--
ALTER TABLE `delivery_helpers`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `delivery_job_orders`
--
ALTER TABLE `delivery_job_orders`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `delivery_load_expenses`
--
ALTER TABLE `delivery_load_expenses`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `delivery_meal_expenses`
--
ALTER TABLE `delivery_meal_expenses`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `delivery_pier_expenses`
--
ALTER TABLE `delivery_pier_expenses`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `delivery_purposes`
--
ALTER TABLE `delivery_purposes`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `delivery_repair_maintenance`
--
ALTER TABLE `delivery_repair_maintenance`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `delivery_requests`
--
ALTER TABLE `delivery_requests`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `delivery_request_activities`
--
ALTER TABLE `delivery_request_activities`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `delivery_request_customer_suppliers`
--
ALTER TABLE `delivery_request_customer_suppliers`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `delivery_request_destinations`
--
ALTER TABLE `delivery_request_destinations`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `delivery_request_drivers`
--
ALTER TABLE `delivery_request_drivers`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `delivery_request_helpers`
--
ALTER TABLE `delivery_request_helpers`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `delivery_request_job_orders`
--
ALTER TABLE `delivery_request_job_orders`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `delivery_request_purposes`
--
ALTER TABLE `delivery_request_purposes`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `delivery_timeline`
--
ALTER TABLE `delivery_timeline`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `delivery_toll_fees`
--
ALTER TABLE `delivery_toll_fees`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `destinations`
--
ALTER TABLE `destinations`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `login_history`
--
ALTER TABLE `login_history`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `personnels`
--
ALTER TABLE `personnels`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `purchases`
--
ALTER TABLE `purchases`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `vehicles`
--
ALTER TABLE `vehicles`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `vehicle_maintenance_logs`
--
ALTER TABLE `vehicle_maintenance_logs`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `announcement_target_roles`
--
ALTER TABLE `announcement_target_roles`
  ADD CONSTRAINT `fk_ann_roles_ann` FOREIGN KEY (`announcement_id`) REFERENCES `announcements` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `delivery_activities`
--
ALTER TABLE `delivery_activities`
  ADD CONSTRAINT `fk_da_delivery` FOREIGN KEY (`delivery_id`) REFERENCES `deliveries` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `delivery_contingency`
--
ALTER TABLE `delivery_contingency`
  ADD CONSTRAINT `fk_dc_delivery` FOREIGN KEY (`delivery_id`) REFERENCES `deliveries` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `delivery_customer_suppliers`
--
ALTER TABLE `delivery_customer_suppliers`
  ADD CONSTRAINT `fk_dcs_delivery` FOREIGN KEY (`delivery_id`) REFERENCES `deliveries` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `delivery_destinations`
--
ALTER TABLE `delivery_destinations`
  ADD CONSTRAINT `fk_dd_delivery` FOREIGN KEY (`delivery_id`) REFERENCES `deliveries` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `delivery_drivers`
--
ALTER TABLE `delivery_drivers`
  ADD CONSTRAINT `fk_ddr_delivery` FOREIGN KEY (`delivery_id`) REFERENCES `deliveries` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `delivery_fuel`
--
ALTER TABLE `delivery_fuel`
  ADD CONSTRAINT `fk_dfuel_delivery` FOREIGN KEY (`delivery_id`) REFERENCES `deliveries` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `delivery_helpers`
--
ALTER TABLE `delivery_helpers`
  ADD CONSTRAINT `fk_dh_delivery` FOREIGN KEY (`delivery_id`) REFERENCES `deliveries` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `delivery_job_orders`
--
ALTER TABLE `delivery_job_orders`
  ADD CONSTRAINT `fk_djo_delivery` FOREIGN KEY (`delivery_id`) REFERENCES `deliveries` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `delivery_load_expenses`
--
ALTER TABLE `delivery_load_expenses`
  ADD CONSTRAINT `fk_dle_delivery` FOREIGN KEY (`delivery_id`) REFERENCES `deliveries` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `delivery_meal_expenses`
--
ALTER TABLE `delivery_meal_expenses`
  ADD CONSTRAINT `fk_dme_delivery` FOREIGN KEY (`delivery_id`) REFERENCES `deliveries` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `delivery_pier_expenses`
--
ALTER TABLE `delivery_pier_expenses`
  ADD CONSTRAINT `fk_dpe_delivery` FOREIGN KEY (`delivery_id`) REFERENCES `deliveries` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `delivery_purposes`
--
ALTER TABLE `delivery_purposes`
  ADD CONSTRAINT `fk_dp_delivery` FOREIGN KEY (`delivery_id`) REFERENCES `deliveries` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `delivery_repair_maintenance`
--
ALTER TABLE `delivery_repair_maintenance`
  ADD CONSTRAINT `fk_drm_delivery` FOREIGN KEY (`delivery_id`) REFERENCES `deliveries` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `delivery_request_activities`
--
ALTER TABLE `delivery_request_activities`
  ADD CONSTRAINT `fk_dra_dr` FOREIGN KEY (`delivery_request_id`) REFERENCES `delivery_requests` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `delivery_request_customer_suppliers`
--
ALTER TABLE `delivery_request_customer_suppliers`
  ADD CONSTRAINT `fk_drcs_dr` FOREIGN KEY (`delivery_request_id`) REFERENCES `delivery_requests` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `delivery_request_destinations`
--
ALTER TABLE `delivery_request_destinations`
  ADD CONSTRAINT `fk_drd_dr` FOREIGN KEY (`delivery_request_id`) REFERENCES `delivery_requests` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `delivery_request_drivers`
--
ALTER TABLE `delivery_request_drivers`
  ADD CONSTRAINT `fk_drr_dr` FOREIGN KEY (`delivery_request_id`) REFERENCES `delivery_requests` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `delivery_request_helpers`
--
ALTER TABLE `delivery_request_helpers`
  ADD CONSTRAINT `fk_drh_dr` FOREIGN KEY (`delivery_request_id`) REFERENCES `delivery_requests` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `delivery_request_job_orders`
--
ALTER TABLE `delivery_request_job_orders`
  ADD CONSTRAINT `fk_drjo_dr` FOREIGN KEY (`delivery_request_id`) REFERENCES `delivery_requests` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `delivery_request_purposes`
--
ALTER TABLE `delivery_request_purposes`
  ADD CONSTRAINT `fk_drp_dr` FOREIGN KEY (`delivery_request_id`) REFERENCES `delivery_requests` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `delivery_timeline`
--
ALTER TABLE `delivery_timeline`
  ADD CONSTRAINT `fk_dtl_delivery` FOREIGN KEY (`delivery_id`) REFERENCES `deliveries` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `delivery_toll_fees`
--
ALTER TABLE `delivery_toll_fees`
  ADD CONSTRAINT `fk_dtf_delivery` FOREIGN KEY (`delivery_id`) REFERENCES `deliveries` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `vehicle_maintenance_logs`
--
ALTER TABLE `vehicle_maintenance_logs`
  ADD CONSTRAINT `vehicle_maintenance_logs_ibfk_1` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
