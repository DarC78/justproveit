IF EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE name = N'UX_marketing_leads_normalized_email'
    AND object_id = OBJECT_ID(N'marketing.leads')
)
BEGIN
  DROP INDEX UX_marketing_leads_normalized_email ON marketing.leads;
END;
GO

IF EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE name = N'IX_marketing_leads_status_city'
    AND object_id = OBJECT_ID(N'marketing.leads')
)
BEGIN
  DROP INDEX IX_marketing_leads_status_city ON marketing.leads;
END;
GO

IF EXISTS (
  SELECT 1
  FROM sys.columns
  WHERE object_id = OBJECT_ID(N'marketing.leads')
    AND name = N'normalized_email'
)
BEGIN
  ALTER TABLE marketing.leads DROP COLUMN normalized_email;
END;
GO

IF EXISTS (
  SELECT 1
  FROM sys.columns
  WHERE object_id = OBJECT_ID(N'marketing.leads')
    AND name = N'email'
    AND is_nullable = 0
)
BEGIN
  ALTER TABLE marketing.leads ALTER COLUMN email NVARCHAR(320) NULL;
END;
GO

IF NOT EXISTS (
  SELECT 1
  FROM sys.columns
  WHERE object_id = OBJECT_ID(N'marketing.leads')
    AND name = N'normalized_email'
)
BEGIN
  ALTER TABLE marketing.leads ADD normalized_email AS LOWER(LTRIM(RTRIM(email))) PERSISTED;
END;
GO

IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE name = N'UX_marketing_leads_normalized_email'
    AND object_id = OBJECT_ID(N'marketing.leads')
)
BEGIN
  CREATE UNIQUE INDEX UX_marketing_leads_normalized_email
    ON marketing.leads(normalized_email)
    WHERE email IS NOT NULL;
END;
GO

IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE name = N'IX_marketing_leads_status_city'
    AND object_id = OBJECT_ID(N'marketing.leads')
)
BEGIN
  CREATE INDEX IX_marketing_leads_status_city ON marketing.leads(status, city_name) INCLUDE (business_name, email, business_type);
END;
GO

IF OBJECT_ID(N'marketing.lead_emails', N'U') IS NULL
BEGIN
  CREATE TABLE marketing.lead_emails (
    lead_email_id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_marketing_lead_emails PRIMARY KEY,
    lead_id BIGINT NOT NULL,
    email NVARCHAR(320) NOT NULL,
    normalized_email AS LOWER(LTRIM(RTRIM(email))) PERSISTED,
    is_primary BIT NOT NULL CONSTRAINT DF_marketing_lead_emails_is_primary DEFAULT 0,
    source NVARCHAR(80) NULL,
    first_seen_at DATETIME2(3) NOT NULL CONSTRAINT DF_marketing_lead_emails_first_seen_at DEFAULT SYSUTCDATETIME(),
    last_seen_at DATETIME2(3) NOT NULL CONSTRAINT DF_marketing_lead_emails_last_seen_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_marketing_lead_emails_lead FOREIGN KEY (lead_id) REFERENCES marketing.leads(lead_id)
  );

  CREATE UNIQUE INDEX UX_marketing_lead_emails_normalized_email ON marketing.lead_emails(normalized_email);
  CREATE INDEX IX_marketing_lead_emails_lead ON marketing.lead_emails(lead_id, is_primary DESC);
END;
GO

IF OBJECT_ID(N'marketing.lead_phone_numbers', N'U') IS NULL
BEGIN
  CREATE TABLE marketing.lead_phone_numbers (
    lead_phone_number_id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_marketing_lead_phone_numbers PRIMARY KEY,
    lead_id BIGINT NOT NULL,
    phone_number NVARCHAR(80) NOT NULL,
    normalized_phone AS REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(LTRIM(RTRIM(phone_number)), N' ', N''), N'-', N''), N'(', N''), N')', N''), N'+', N'') PERSISTED,
    is_primary BIT NOT NULL CONSTRAINT DF_marketing_lead_phone_numbers_is_primary DEFAULT 0,
    source NVARCHAR(80) NULL,
    first_seen_at DATETIME2(3) NOT NULL CONSTRAINT DF_marketing_lead_phone_numbers_first_seen_at DEFAULT SYSUTCDATETIME(),
    last_seen_at DATETIME2(3) NOT NULL CONSTRAINT DF_marketing_lead_phone_numbers_last_seen_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_marketing_lead_phone_numbers_lead FOREIGN KEY (lead_id) REFERENCES marketing.leads(lead_id)
  );

  CREATE UNIQUE INDEX UX_marketing_lead_phone_numbers_lead_phone ON marketing.lead_phone_numbers(lead_id, normalized_phone);
  CREATE INDEX IX_marketing_lead_phone_numbers_phone ON marketing.lead_phone_numbers(normalized_phone);
END;
GO

INSERT INTO marketing.lead_emails (lead_id, email, is_primary, source)
SELECT l.lead_id, l.email, 1, N'legacy_primary'
FROM marketing.leads l
WHERE NULLIF(LTRIM(RTRIM(l.email)), N'') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM marketing.lead_emails le
    WHERE le.normalized_email = l.normalized_email
  );
GO

INSERT INTO marketing.lead_phone_numbers (lead_id, phone_number, is_primary, source)
SELECT l.lead_id, l.phone_number, 1, N'legacy_primary'
FROM marketing.leads l
WHERE NULLIF(LTRIM(RTRIM(l.phone_number)), N'') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM marketing.lead_phone_numbers lpn
    WHERE lpn.lead_id = l.lead_id
      AND lpn.normalized_phone = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(LTRIM(RTRIM(l.phone_number)), N' ', N''), N'-', N''), N'(', N''), N')', N''), N'+', N'')
  );
GO
