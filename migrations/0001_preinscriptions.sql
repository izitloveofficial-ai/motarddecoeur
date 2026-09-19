CREATE TABLE IF NOT EXISTS preinscriptions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  first_name TEXT NOT NULL CHECK(length(trim(first_name)) BETWEEN 1 AND 80),
  email TEXT NOT NULL COLLATE NOCASE UNIQUE CHECK(length(email) <= 254),
  location TEXT CHECK(location IS NULL OR length(location) <= 120),
  rider_profile TEXT CHECK(rider_profile IS NULL OR length(rider_profile) <= 40),
  favorite_bike TEXT CHECK(favorite_bike IS NULL OR length(favorite_bike) <= 120),
  primary_interest TEXT CHECK(primary_interest IS NULL OR length(primary_interest) <= 40),
  message TEXT CHECK(message IS NULL OR length(message) <= 1000),
  consent_rgpd INTEGER NOT NULL CHECK(consent_rgpd = 1),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','invited','converted')),
  invitation_sent_at TEXT,
  converted_at TEXT,
  user_id TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS preinscriptions_created_at ON preinscriptions(created_at DESC);

CREATE TABLE IF NOT EXISTS preinscription_attempts (
  ip TEXT NOT NULL,
  attempted_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS preinscription_attempts_ip_time ON preinscription_attempts(ip, attempted_at);
