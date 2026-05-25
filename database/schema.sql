CREATE DATABASE IF NOT EXISTS dbmsproject
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE dbmsproject;

CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(120) NOT NULL,
  icon_path VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  base_price_inr INT NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_services_name (name),
  UNIQUE KEY uniq_services_slug (slug)
);

CREATE TABLE IF NOT EXISTS clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  city VARCHAR(120) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_clients_email (email),
  UNIQUE KEY uniq_clients_phone (phone)
);

CREATE TABLE IF NOT EXISTS professionals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  city VARCHAR(120) NOT NULL,
  area VARCHAR(120) NOT NULL,
  years_experience INT NOT NULL DEFAULT 0,
  hourly_rate_inr INT NOT NULL DEFAULT 0,
  distance_km DECIMAL(6,2) NOT NULL DEFAULT 0,
  photo_url VARCHAR(255) DEFAULT NULL,
  bio TEXT DEFAULT NULL,
  is_verified TINYINT(1) NOT NULL DEFAULT 0,
  rating_avg DECIMAL(4,2) NOT NULL DEFAULT 0,
  total_reviews INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_professionals_email (email),
  UNIQUE KEY uniq_professionals_phone (phone)
);

CREATE TABLE IF NOT EXISTS professional_services (
  professional_id INT NOT NULL,
  service_id INT NOT NULL,
  custom_rate_inr INT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (professional_id, service_id),
  CONSTRAINT fk_professional_services_professional
    FOREIGN KEY (professional_id) REFERENCES professionals(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_professional_services_service
    FOREIGN KEY (service_id) REFERENCES services(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  subject VARCHAR(120) DEFAULT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_code VARCHAR(30) NOT NULL,
  client_id INT DEFAULT NULL,
  guest_name VARCHAR(120) DEFAULT NULL,
  guest_email VARCHAR(160) DEFAULT NULL,
  guest_phone VARCHAR(20) DEFAULT NULL,
  professional_id INT NOT NULL,
  service_id INT NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time_slot VARCHAR(80) NOT NULL,
  address_area VARCHAR(180) NOT NULL,
  budget_inr INT NOT NULL,
  details TEXT DEFAULT NULL,
  status ENUM('pending', 'confirmed', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_bookings_code (booking_code),
  KEY idx_bookings_client (client_id),
  KEY idx_bookings_professional (professional_id),
  CONSTRAINT fk_bookings_client
    FOREIGN KEY (client_id) REFERENCES clients(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_bookings_professional
    FOREIGN KEY (professional_id) REFERENCES professionals(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_bookings_service
    FOREIGN KEY (service_id) REFERENCES services(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT DEFAULT NULL,
  client_id INT DEFAULT NULL,
  professional_id INT NOT NULL,
  rating TINYINT UNSIGNED NOT NULL,
  review_text TEXT DEFAULT NULL,
  reviewer_name VARCHAR(120) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_reviews_professional (professional_id),
  CONSTRAINT fk_reviews_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_reviews_client
    FOREIGN KEY (client_id) REFERENCES clients(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_reviews_professional
    FOREIGN KEY (professional_id) REFERENCES professionals(id)
    ON DELETE CASCADE,
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5)
);

DROP VIEW IF EXISTS professional_directory_vw;
CREATE VIEW professional_directory_vw AS
SELECT
  p.id AS id,
  p.full_name AS name,
  p.email AS email,
  p.phone AS phone,
  p.phone AS contact,
  p.city AS city,
  p.area AS area,
  p.years_experience AS experience,
  p.hourly_rate_inr AS hourlyRateInr,
  p.distance_km AS distance,
  COALESCE(p.photo_url, '/assets/gigconnect.logo.png') AS photo,
  COALESCE(p.bio, '') AS description,
  p.is_verified AS isVerified,
  ROUND(p.rating_avg, 1) AS ratings,
  p.total_reviews AS totalReviews,
  MIN(COALESCE(ps.custom_rate_inr, s.base_price_inr)) AS startingPriceInr,
  GROUP_CONCAT(DISTINCT s.name ORDER BY s.name SEPARATOR ', ') AS skills,
  p.created_at AS createdAt
FROM professionals p
JOIN professional_services ps ON ps.professional_id = p.id
JOIN services s ON s.id = ps.service_id
GROUP BY
  p.id,
  p.full_name,
  p.email,
  p.phone,
  p.city,
  p.area,
  p.years_experience,
  p.hourly_rate_inr,
  p.distance_km,
  p.photo_url,
  p.bio,
  p.is_verified,
  p.rating_avg,
  p.total_reviews,
  p.created_at;

DROP PROCEDURE IF EXISTS sp_create_booking_request;
DELIMITER $$
CREATE PROCEDURE sp_create_booking_request(
  IN p_booking_code VARCHAR(30),
  IN p_client_id INT,
  IN p_guest_name VARCHAR(120),
  IN p_guest_email VARCHAR(160),
  IN p_guest_phone VARCHAR(20),
  IN p_professional_id INT,
  IN p_service_id INT,
  IN p_preferred_date DATE,
  IN p_preferred_time_slot VARCHAR(80),
  IN p_address_area VARCHAR(180),
  IN p_budget_inr INT,
  IN p_details TEXT
)
BEGIN
  INSERT INTO bookings (
    booking_code,
    client_id,
    guest_name,
    guest_email,
    guest_phone,
    professional_id,
    service_id,
    preferred_date,
    preferred_time_slot,
    address_area,
    budget_inr,
    details
  ) VALUES (
    p_booking_code,
    p_client_id,
    p_guest_name,
    p_guest_email,
    p_guest_phone,
    p_professional_id,
    p_service_id,
    p_preferred_date,
    p_preferred_time_slot,
    p_address_area,
    p_budget_inr,
    p_details
  );
END $$
DELIMITER ;

DROP TRIGGER IF EXISTS trg_reviews_after_insert;
DELIMITER $$
CREATE TRIGGER trg_reviews_after_insert
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
  UPDATE professionals
  SET
    rating_avg = COALESCE((SELECT ROUND(AVG(rating), 2) FROM reviews WHERE professional_id = NEW.professional_id), 0),
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE professional_id = NEW.professional_id)
  WHERE id = NEW.professional_id;
END $$
DELIMITER ;

DROP TRIGGER IF EXISTS trg_reviews_after_update;
DELIMITER $$
CREATE TRIGGER trg_reviews_after_update
AFTER UPDATE ON reviews
FOR EACH ROW
BEGIN
  UPDATE professionals
  SET
    rating_avg = COALESCE((SELECT ROUND(AVG(rating), 2) FROM reviews WHERE professional_id = NEW.professional_id), 0),
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE professional_id = NEW.professional_id)
  WHERE id = NEW.professional_id;

  IF OLD.professional_id <> NEW.professional_id THEN
    UPDATE professionals
    SET
      rating_avg = COALESCE((SELECT ROUND(AVG(rating), 2) FROM reviews WHERE professional_id = OLD.professional_id), 0),
      total_reviews = (SELECT COUNT(*) FROM reviews WHERE professional_id = OLD.professional_id)
    WHERE id = OLD.professional_id;
  END IF;
END $$
DELIMITER ;

DROP TRIGGER IF EXISTS trg_reviews_after_delete;
DELIMITER $$
CREATE TRIGGER trg_reviews_after_delete
AFTER DELETE ON reviews
FOR EACH ROW
BEGIN
  UPDATE professionals
  SET
    rating_avg = COALESCE((SELECT ROUND(AVG(rating), 2) FROM reviews WHERE professional_id = OLD.professional_id), 0),
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE professional_id = OLD.professional_id)
  WHERE id = OLD.professional_id;
END $$
DELIMITER ;
