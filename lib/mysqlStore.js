const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

const seedData = require("../data/mysqlSeed");

const DEFAULT_PHOTO = "/assets/gigconnect.logo.png";
const DEFAULT_DATABASE = process.env.MYSQL_DATABASE || "dbmsproject";

const dbState = {
  connected: false,
  ready: false,
  lastError: null,
  database: DEFAULT_DATABASE
};

let pool = null;

function getConfig() {
  return {
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || DEFAULT_DATABASE
  };
}

function escapeIdentifier(identifier) {
  if (!/^[a-zA-Z0-9_]+$/.test(identifier)) {
    throw new Error("Unsafe MySQL identifier.");
  }

  return `\`${identifier}\``;
}

function parseSkills(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeLimit(limit, fallback = 10) {
  const parsed = Number(limit);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function normalizeProfessionalRow(row = {}) {
  return {
    id: Number(row.id),
    _id: String(row.id),
    name: row.name,
    ratings: Number(row.ratings || 0),
    experience: Number(row.experience || 0),
    distance: Number(row.distance || 0),
    photo: row.photo || DEFAULT_PHOTO,
    contact: row.contact || row.phone || row.email || "",
    email: row.email || "",
    phone: row.phone || "",
    city: row.city || "",
    area: row.area || "",
    skills: parseSkills(row.skills),
    description: row.description || "",
    isVerified: Boolean(row.isVerified),
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
    startingPrice: Number(row.startingPriceInr || 0),
    hourlyRateInr: Number(row.hourlyRateInr || 0),
    totalReviews: Number(row.totalReviews || 0)
  };
}

async function query(sql, params = []) {
  if (!pool) {
    throw new Error("MySQL pool is not initialized.");
  }

  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

async function ensureSchema() {
  const statements = [
    `
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
      )
    `,
    `
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
      )
    `,
    `
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
      )
    `,
    `
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
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS contact_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(120) NOT NULL,
        email VARCHAR(160) NOT NULL,
        phone VARCHAR(20) DEFAULT NULL,
        subject VARCHAR(120) DEFAULT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `,
    `
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
      )
    `,
    `
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
      )
    `
  ];

  for (const statement of statements) {
    await pool.query(statement);
  }

  await pool.query("DROP VIEW IF EXISTS professional_directory_vw");
  await pool.query(`
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
      COALESCE(p.photo_url, '${DEFAULT_PHOTO}') AS photo,
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
      p.created_at
  `);

  await pool.query("DROP VIEW IF EXISTS client_booking_summary_vw");
  await pool.query(`
    CREATE VIEW client_booking_summary_vw AS
    SELECT
      b.id,
      b.booking_code,
      b.client_id,
      b.guest_name,
      b.guest_email,
      b.guest_phone,
      b.preferred_date,
      b.preferred_time_slot,
      b.address_area,
      b.budget_inr,
      b.details,
      b.status,
      b.created_at,
      p.full_name AS professional_name,
      p.city AS professional_city,
      p.area AS professional_area,
      s.name AS service_name
    FROM bookings b
    JOIN professionals p ON p.id = b.professional_id
    JOIN services s ON s.id = b.service_id
  `);

  await pool.query("DROP VIEW IF EXISTS professional_booking_summary_vw");
  await pool.query(`
    CREATE VIEW professional_booking_summary_vw AS
    SELECT
      b.id,
      b.booking_code,
      b.professional_id,
      COALESCE(c.full_name, b.guest_name) AS client_name,
      COALESCE(c.email, b.guest_email) AS client_email,
      COALESCE(c.phone, b.guest_phone) AS client_phone,
      b.preferred_date,
      b.preferred_time_slot,
      b.address_area,
      b.budget_inr,
      b.details,
      b.status,
      b.created_at,
      s.name AS service_name
    FROM bookings b
    LEFT JOIN clients c ON c.id = b.client_id
    JOIN services s ON s.id = b.service_id
  `);

  await pool.query("DROP PROCEDURE IF EXISTS sp_create_booking_request");
  await pool.query(`
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
    END
  `);

  await pool.query("DROP TRIGGER IF EXISTS trg_reviews_after_insert");
  await pool.query(`
    CREATE TRIGGER trg_reviews_after_insert
    AFTER INSERT ON reviews
    FOR EACH ROW
    BEGIN
      UPDATE professionals
      SET
        rating_avg = COALESCE((SELECT ROUND(AVG(rating), 2) FROM reviews WHERE professional_id = NEW.professional_id), 0),
        total_reviews = (SELECT COUNT(*) FROM reviews WHERE professional_id = NEW.professional_id)
      WHERE id = NEW.professional_id;
    END
  `);

  await pool.query("DROP TRIGGER IF EXISTS trg_reviews_after_update");
  await pool.query(`
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
    END
  `);

  await pool.query("DROP TRIGGER IF EXISTS trg_reviews_after_delete");
  await pool.query(`
    CREATE TRIGGER trg_reviews_after_delete
    AFTER DELETE ON reviews
    FOR EACH ROW
    BEGIN
      UPDATE professionals
      SET
        rating_avg = COALESCE((SELECT ROUND(AVG(rating), 2) FROM reviews WHERE professional_id = OLD.professional_id), 0),
        total_reviews = (SELECT COUNT(*) FROM reviews WHERE professional_id = OLD.professional_id)
      WHERE id = OLD.professional_id;
    END
  `);
}

async function seedDatabase() {
  for (const service of seedData.services) {
    await query(
      `
        INSERT INTO services (name, slug, icon_path, description, base_price_inr)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          icon_path = VALUES(icon_path),
          description = VALUES(description),
          base_price_inr = VALUES(base_price_inr),
          is_active = 1
      `,
      [service.name, service.slug, service.icon, service.description, service.basePriceInr]
    );
  }

  for (const client of seedData.clients) {
    const passwordHash = await bcrypt.hash(client.password, 10);
    await query(
      `
        INSERT INTO clients (full_name, email, phone, password_hash, city)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          full_name = VALUES(full_name),
          phone = VALUES(phone),
          password_hash = VALUES(password_hash),
          city = VALUES(city)
      `,
      [client.fullName, client.email, client.phone, passwordHash, client.city]
    );
  }

  for (const professional of seedData.professionals) {
    const passwordHash = await bcrypt.hash(professional.password, 10);
    await query(
      `
        INSERT INTO professionals (
          full_name,
          email,
          phone,
          password_hash,
          city,
          area,
          years_experience,
          hourly_rate_inr,
          distance_km,
          photo_url,
          bio,
          is_verified
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          full_name = VALUES(full_name),
          phone = VALUES(phone),
          password_hash = VALUES(password_hash),
          city = VALUES(city),
          area = VALUES(area),
          years_experience = VALUES(years_experience),
          hourly_rate_inr = VALUES(hourly_rate_inr),
          distance_km = VALUES(distance_km),
          photo_url = VALUES(photo_url),
          bio = VALUES(bio),
          is_verified = VALUES(is_verified)
      `,
      [
        professional.fullName,
        professional.email,
        professional.phone,
        passwordHash,
        professional.city,
        professional.area,
        professional.yearsExperience,
        professional.hourlyRateInr,
        professional.distanceKm,
        professional.photoUrl,
        professional.bio,
        professional.isVerified ? 1 : 0
      ]
    );
  }

  const services = await query("SELECT id, slug FROM services");
  const serviceMap = new Map(services.map((row) => [row.slug, row.id]));
  const professionals = await query("SELECT id, email FROM professionals");
  const professionalMap = new Map(professionals.map((row) => [row.email, row.id]));
  const clients = await query("SELECT id, email FROM clients");
  const clientMap = new Map(clients.map((row) => [row.email, row.id]));

  for (const professional of seedData.professionals) {
    const professionalId = professionalMap.get(professional.email);
    if (!professionalId) continue;

    for (const slug of professional.serviceSlugs) {
      const serviceId = serviceMap.get(slug);
      if (!serviceId) continue;

      await query(
        `
          INSERT INTO professional_services (professional_id, service_id, custom_rate_inr)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE custom_rate_inr = VALUES(custom_rate_inr)
        `,
        [
          professionalId,
          serviceId,
          professional.customRates && professional.customRates[slug] ? professional.customRates[slug] : null
        ]
      );
    }
  }

  const bookingCount = await queryOne("SELECT COUNT(*) AS total FROM bookings");
  if (!bookingCount || Number(bookingCount.total) === 0) {
    for (const booking of seedData.bookings) {
      const clientId = clientMap.get(booking.clientEmail) || null;
      const professionalId = professionalMap.get(booking.professionalEmail);
      const serviceId = serviceMap.get(booking.serviceSlug);

      if (!professionalId || !serviceId) continue;

      await query(
        `
          INSERT INTO bookings (
            booking_code,
            client_id,
            professional_id,
            service_id,
            preferred_date,
            preferred_time_slot,
            address_area,
            budget_inr,
            details,
            status
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          booking.bookingCode,
          clientId,
          professionalId,
          serviceId,
          booking.preferredDate,
          booking.preferredTimeSlot,
          booking.addressArea,
          booking.budgetInr,
          booking.details,
          booking.status
        ]
      );
    }
  }

  const reviewCount = await queryOne("SELECT COUNT(*) AS total FROM reviews");
  if (!reviewCount || Number(reviewCount.total) === 0) {
    for (const review of seedData.reviews) {
      const professionalId = professionalMap.get(review.professionalEmail);
      const clientId = clientMap.get(review.clientEmail) || null;

      if (!professionalId) continue;

      await query(
        `
          INSERT INTO reviews (
            client_id,
            professional_id,
            rating,
            review_text,
            reviewer_name
          )
          VALUES (?, ?, ?, ?, ?)
        `,
        [clientId, professionalId, review.rating, review.reviewText, review.reviewerName]
      );
    }
  }
}

async function initializeMySql() {
  const config = getConfig();
  const database = escapeIdentifier(config.database);

  try {
    const adminPool = await mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      waitForConnections: true,
      connectionLimit: 5
    });

    await adminPool.query(`CREATE DATABASE IF NOT EXISTS ${database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await adminPool.end();

    pool = mysql.createPool({
      ...config,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    await query("SELECT 1");
    await ensureSchema();
    await seedDatabase();

    dbState.connected = true;
    dbState.ready = true;
    dbState.lastError = null;
  } catch (error) {
    dbState.connected = false;
    dbState.ready = false;
    dbState.lastError = error.message;
    pool = null;
  }

  return dbState;
}

function isDatabaseReady() {
  return dbState.connected && dbState.ready && Boolean(pool);
}

async function getServiceCatalog(limit = 8) {
  const safeLimit = normalizeLimit(limit, 8);
  const rows = await query(
    `
      SELECT
        s.id,
        s.name,
        s.slug,
        s.icon_path AS icon,
        s.description,
        s.base_price_inr AS basePriceInr,
        COUNT(DISTINCT ps.professional_id) AS professionalCount,
        MIN(COALESCE(ps.custom_rate_inr, s.base_price_inr)) AS startingPriceInr
      FROM services s
      LEFT JOIN professional_services ps ON ps.service_id = s.id
      WHERE s.is_active = 1
      GROUP BY s.id, s.name, s.slug, s.icon_path, s.description, s.base_price_inr
      ORDER BY professionalCount DESC, s.name ASC
      LIMIT ${safeLimit}
    `
  );

  return rows.map((row) => ({
    id: Number(row.id),
    name: row.name,
    slug: row.slug,
    icon: row.icon,
    description: row.description,
    basePriceInr: Number(row.basePriceInr || 0),
    startingPriceInr: Number(row.startingPriceInr || row.basePriceInr || 0),
    professionalCount: Number(row.professionalCount || 0)
  }));
}

async function getHomeStats() {
  const [professionalCountRow, bookingCountRow, ratingRow] = await Promise.all([
    queryOne("SELECT COUNT(*) AS total FROM professionals"),
    queryOne("SELECT COUNT(*) AS total FROM bookings"),
    queryOne("SELECT ROUND(AVG(rating), 1) AS averageRating FROM reviews")
  ]);

  return [
    { value: `${Number(professionalCountRow?.total || 0)}+`, label: "Active professionals" },
    { value: `${Number(ratingRow?.averageRating || 0).toFixed(1)}/5`, label: "Average rating" },
    { value: `${Number(bookingCountRow?.total || 0)}+`, label: "Booking requests" }
  ];
}

async function getFeaturedProfessionals(limit = 6) {
  const safeLimit = normalizeLimit(limit, 6);
  const rows = await query(
    `
      SELECT *
      FROM professional_directory_vw
      ORDER BY isVerified DESC, ratings DESC, experience DESC, distance ASC
      LIMIT ${safeLimit}
    `
  );

  return rows.map(normalizeProfessionalRow);
}

async function getTestimonials(limit = 3) {
  const safeLimit = normalizeLimit(limit, 3);
  const rows = await query(
    `
      SELECT
        r.review_text AS quote,
        r.reviewer_name AS name,
        CONCAT('Client, ', COALESCE(c.city, 'NCR')) AS role,
        COALESCE(p.photo_url, ?) AS image
      FROM reviews r
      LEFT JOIN clients c ON c.id = r.client_id
      JOIN professionals p ON p.id = r.professional_id
      WHERE COALESCE(r.review_text, '') <> ''
      ORDER BY r.rating DESC, r.created_at DESC
      LIMIT ${safeLimit}
    `,
    [DEFAULT_PHOTO]
  );

  return rows;
}

function getProfessionalSortClause(sortKey = "relevance") {
  switch (sortKey) {
    case "rating":
      return "isVerified DESC, ratings DESC, experience DESC, distance ASC";
    case "experience":
      return "experience DESC, ratings DESC, isVerified DESC, distance ASC";
    case "distance":
      return "distance ASC, ratings DESC, isVerified DESC";
    case "newest":
      return "createdAt DESC, isVerified DESC";
    default:
      return "isVerified DESC, ratings DESC, experience DESC, distance ASC";
  }
}

async function searchProfessionals({ queryText = "", cityQ = "", sortKey = "relevance", verifiedOnly = false, limit = 48 }) {
  const safeLimit = normalizeLimit(limit, 48);
  const filters = [];
  const params = [];

  if (queryText) {
    const like = `%${queryText}%`;
    filters.push("(name LIKE ? OR skills LIKE ? OR city LIKE ? OR area LIKE ?)");
    params.push(like, like, like, like);
  }

  if (cityQ) {
    const like = `%${cityQ}%`;
    filters.push("(city LIKE ? OR area LIKE ?)");
    params.push(like, like);
  }

  if (verifiedOnly) {
    filters.push("isVerified = 1");
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const sql = `
    SELECT *
    FROM professional_directory_vw
    ${whereClause}
    ORDER BY ${getProfessionalSortClause(sortKey)}
    LIMIT ${safeLimit}
  `;

  const rows = await query(sql, params);
  return rows.map(normalizeProfessionalRow);
}

async function getProfessionalById(professionalId) {
  const row = await queryOne("SELECT * FROM professional_directory_vw WHERE id = ?", [professionalId]);
  return row ? normalizeProfessionalRow(row) : null;
}

async function getProfessionalServiceOptions(professionalId) {
  return query(
    `
      SELECT
        s.id,
        s.name,
        s.slug,
        COALESCE(ps.custom_rate_inr, s.base_price_inr) AS priceInr
      FROM professional_services ps
      JOIN services s ON s.id = ps.service_id
      WHERE ps.professional_id = ?
      ORDER BY s.name ASC
    `,
    [professionalId]
  );
}

async function createContactMessage(data) {
  const result = await query(
    `
      INSERT INTO contact_messages (full_name, email, phone, subject, message)
      VALUES (?, ?, ?, ?, ?)
    `,
    [data.fullName, data.email, data.phone || null, data.subject || null, data.message]
  );

  return result.insertId;
}

async function createClientAccount(data) {
  const existing = await queryOne("SELECT id FROM clients WHERE email = ? OR phone = ?", [data.email, data.phone]);
  if (existing) {
    const error = new Error("That email or phone number is already registered.");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const result = await query(
    `
      INSERT INTO clients (full_name, email, phone, password_hash, city)
      VALUES (?, ?, ?, ?, ?)
    `,
    [data.fullName, data.email, data.phone, passwordHash, data.city]
  );

  return {
    id: result.insertId,
    name: data.fullName,
    email: data.email,
    phone: data.phone,
    city: data.city,
    role: "client"
  };
}

async function deleteClientAccount(clientId) {
  const result = await query("DELETE FROM clients WHERE id = ?", [clientId]);

  if (!result.affectedRows) {
    const error = new Error("That client profile could not be found.");
    error.statusCode = 404;
    throw error;
  }

  return true;
}

async function authenticateClient(email, password) {
  const client = await queryOne("SELECT * FROM clients WHERE email = ?", [email]);
  if (!client) return null;

  const isMatch = await bcrypt.compare(password, client.password_hash);
  if (!isMatch) return null;

  return {
    id: client.id,
    name: client.full_name,
    email: client.email,
    phone: client.phone,
    city: client.city,
    role: "client"
  };
}

async function createProfessionalAccount(data) {
  const existing = await queryOne("SELECT id FROM professionals WHERE email = ? OR phone = ?", [data.email, data.phone]);
  if (existing) {
    const error = new Error("That email or phone number is already registered.");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const result = await query(
    `
      INSERT INTO professionals (
        full_name,
        email,
        phone,
        password_hash,
        city,
        area,
        years_experience,
        hourly_rate_inr,
        distance_km,
        photo_url,
        bio,
        is_verified
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      data.fullName,
      data.email,
      data.phone,
      passwordHash,
      data.city,
      data.area,
      data.experience,
      data.hourlyRateInr,
      data.distanceKm || 0,
      data.photoUrl || DEFAULT_PHOTO,
      data.description || "",
      data.isVerified ? 1 : 0
    ]
  );

  const professionalId = result.insertId;
  for (const serviceId of data.serviceIds) {
    await query(
      `
        INSERT INTO professional_services (professional_id, service_id, custom_rate_inr)
        VALUES (?, ?, ?)
      `,
      [professionalId, serviceId, data.customRateInr || null]
    );
  }

  return {
    id: professionalId,
    name: data.fullName,
    email: data.email,
    phone: data.phone,
    city: data.city,
    role: "professional"
  };
}

async function deleteProfessionalAccount(professionalId) {
  const result = await query("DELETE FROM professionals WHERE id = ?", [professionalId]);

  if (!result.affectedRows) {
    const error = new Error("That professional profile could not be found.");
    error.statusCode = 404;
    throw error;
  }

  return true;
}

async function authenticateProfessional(login, password) {
  const professional = await queryOne(
    "SELECT * FROM professionals WHERE email = ? OR phone = ?",
    [login, login]
  );

  if (!professional) return null;

  const isMatch = await bcrypt.compare(password, professional.password_hash);
  if (!isMatch) return null;

  return {
    id: professional.id,
    name: professional.full_name,
    email: professional.email,
    phone: professional.phone,
    city: professional.city,
    role: "professional"
  };
}

function createBookingCode() {
  return `GC${Date.now().toString().slice(-7)}`;
}

async function createBooking(data) {
  const bookingCode = createBookingCode();

  await query(
    "CALL sp_create_booking_request(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      bookingCode,
      data.clientId || null,
      data.guestName || null,
      data.guestEmail || null,
      data.guestPhone || null,
      data.professionalId,
      data.serviceId,
      data.preferredDate,
      data.preferredTimeSlot,
      data.addressArea,
      data.budgetInr,
      data.details || null
    ]
  );

  return bookingCode;
}

async function createClientReview({ bookingId, clientId, rating, reviewText, reviewerName }) {
  const booking = await queryOne(
    `
      SELECT
        b.id,
        b.professional_id AS professionalId,
        b.status,
        c.full_name AS clientName
      FROM bookings b
      LEFT JOIN clients c ON c.id = b.client_id
      WHERE b.id = ? AND b.client_id = ?
    `,
    [bookingId, clientId]
  );

  if (!booking) {
    const error = new Error("That completed booking could not be found for your account.");
    error.statusCode = 404;
    throw error;
  }

  if (booking.status !== "completed") {
    const error = new Error("You can only rate a booking after the professional marks it as completed.");
    error.statusCode = 409;
    throw error;
  }

  const existingReview = await queryOne(
    `
      SELECT id
      FROM reviews
      WHERE booking_id = ? AND client_id = ?
      LIMIT 1
    `,
    [bookingId, clientId]
  );

  if (existingReview) {
    const error = new Error("You have already submitted a rating for this booking.");
    error.statusCode = 409;
    throw error;
  }

  const result = await query(
    `
      INSERT INTO reviews (
        booking_id,
        client_id,
        professional_id,
        rating,
        review_text,
        reviewer_name
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      bookingId,
      clientId,
      booking.professionalId,
      rating,
      reviewText || null,
      reviewerName || booking.clientName || "GigConnect client"
    ]
  );

  return result.insertId;
}

async function updateProfessionalBookingStatus({ bookingId, professionalId, nextStatus }) {
  const allowedTransitions = {
    confirmed: ["pending"],
    completed: ["confirmed"]
  };

  const validPreviousStates = allowedTransitions[nextStatus];
  if (!validPreviousStates) {
    const error = new Error("That booking action is not allowed.");
    error.statusCode = 400;
    throw error;
  }

  const booking = await queryOne(
    `
      SELECT id, status
      FROM bookings
      WHERE id = ? AND professional_id = ?
    `,
    [bookingId, professionalId]
  );

  if (!booking) {
    const error = new Error("That booking request could not be found.");
    error.statusCode = 404;
    throw error;
  }

  if (!validPreviousStates.includes(booking.status)) {
    const error = new Error(`This booking is already ${booking.status}, so that action is unavailable.`);
    error.statusCode = 409;
    throw error;
  }

  await query(
    `
      UPDATE bookings
      SET status = ?
      WHERE id = ? AND professional_id = ?
    `,
    [nextStatus, bookingId, professionalId]
  );

  return nextStatus;
}

async function getClientDashboardData(clientId) {
  const [bookings, summary, reviews] = await Promise.all([
    query(
      `
        SELECT *
        FROM client_booking_summary_vw
        WHERE client_id = ?
        ORDER BY created_at DESC
      `,
      [clientId]
    ),
    queryOne(
      `
        SELECT
          COUNT(*) AS totalBookings,
          SUM(status = 'confirmed') AS confirmedBookings,
          SUM(status = 'pending') AS pendingBookings
        FROM bookings
        WHERE client_id = ?
      `,
      [clientId]
    ),
    query(
      `
        SELECT
          id,
          booking_id AS bookingId,
          rating,
          review_text AS reviewText,
          created_at AS createdAt
        FROM reviews
        WHERE client_id = ?
        ORDER BY created_at DESC
      `,
      [clientId]
    )
  ]);

  const reviewMap = new Map();
  for (const review of reviews) {
    if (!review.bookingId || reviewMap.has(review.bookingId)) continue;

    reviewMap.set(review.bookingId, {
      id: review.id,
      rating: Number(review.rating || 0),
      reviewText: review.reviewText || "",
      createdAt: review.createdAt
    });
  }

  return {
    summary: {
      totalBookings: Number(summary?.totalBookings || 0),
      confirmedBookings: Number(summary?.confirmedBookings || 0),
      pendingBookings: Number(summary?.pendingBookings || 0)
    },
    bookings: bookings.map((booking) => ({
      id: booking.id,
      bookingCode: booking.booking_code,
      professionalName: booking.professional_name,
      professionalCity: booking.professional_city,
      professionalArea: booking.professional_area,
      serviceName: booking.service_name,
      preferredDate: booking.preferred_date,
      preferredTimeSlot: booking.preferred_time_slot,
      addressArea: booking.address_area,
      budgetInr: Number(booking.budget_inr || 0),
      details: booking.details || "",
      status: booking.status,
      createdAt: booking.created_at,
      review: reviewMap.get(booking.id) || null,
      canReview: booking.status === "completed" && !reviewMap.has(booking.id)
    }))
  };
}

async function getProfessionalDashboardData(professionalId) {
  const bookings = await query(
    `
      SELECT *
      FROM professional_booking_summary_vw
      WHERE professional_id = ?
      ORDER BY created_at DESC
    `,
    [professionalId]
  );

  const summary = await queryOne(
    `
      SELECT
        COUNT(*) AS totalRequests,
        SUM(status = 'confirmed') AS confirmedRequests,
        SUM(status = 'pending') AS pendingRequests,
        SUM(status = 'completed') AS completedRequests
      FROM bookings
      WHERE professional_id = ?
    `,
    [professionalId]
  );

  const profile = await getProfessionalById(professionalId);

  return {
    summary: {
      totalRequests: Number(summary?.totalRequests || 0),
      confirmedRequests: Number(summary?.confirmedRequests || 0),
      pendingRequests: Number(summary?.pendingRequests || 0),
      completedRequests: Number(summary?.completedRequests || 0)
    },
    profile,
    bookings: bookings.map((booking) => ({
      id: booking.id,
      bookingCode: booking.booking_code,
      clientName: booking.client_name || "Guest client",
      clientEmail: booking.client_email || "",
      clientPhone: booking.client_phone || "",
      serviceName: booking.service_name,
      preferredDate: booking.preferred_date,
      preferredTimeSlot: booking.preferred_time_slot,
      addressArea: booking.address_area,
      budgetInr: Number(booking.budget_inr || 0),
      details: booking.details || "",
      status: booking.status,
      createdAt: booking.created_at
    }))
  };
}

async function getServiceOptions() {
  return query(
    `
      SELECT id, name, slug, base_price_inr AS basePriceInr
      FROM services
      WHERE is_active = 1
      ORDER BY name ASC
    `
  );
}

module.exports = {
  dbState,
  initializeMySql,
  isDatabaseReady,
  getServiceCatalog,
  getHomeStats,
  getFeaturedProfessionals,
  getTestimonials,
  searchProfessionals,
  getProfessionalById,
  getProfessionalServiceOptions,
  createContactMessage,
  createClientAccount,
  deleteClientAccount,
  authenticateClient,
  createProfessionalAccount,
  deleteProfessionalAccount,
  authenticateProfessional,
  createBooking,
  createClientReview,
  updateProfessionalBookingStatus,
  getClientDashboardData,
  getProfessionalDashboardData,
  getServiceOptions,
  normalizeProfessionalRow
};
