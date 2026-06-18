IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'marketing')
BEGIN
  EXEC(N'CREATE SCHEMA marketing');
END;
GO

IF OBJECT_ID(N'marketing.lead_sources', N'U') IS NULL
BEGIN
  CREATE TABLE marketing.lead_sources (
    source_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_marketing_lead_sources PRIMARY KEY,
    source_key NVARCHAR(120) NOT NULL,
    source_name NVARCHAR(240) NOT NULL,
    source_type NVARCHAR(40) NOT NULL CONSTRAINT DF_marketing_lead_sources_source_type DEFAULT N'csv',
    source_file NVARCHAR(500) NULL,
    imported_at DATETIME2(3) NOT NULL CONSTRAINT DF_marketing_lead_sources_imported_at DEFAULT SYSUTCDATETIME(),
    notes NVARCHAR(1000) NULL,
    CONSTRAINT UQ_marketing_lead_sources_source_key UNIQUE (source_key)
  );
END;
GO

IF OBJECT_ID(N'marketing.leads', N'U') IS NULL
BEGIN
  CREATE TABLE marketing.leads (
    lead_id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_marketing_leads PRIMARY KEY,
    lead_guid UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_marketing_leads_lead_guid DEFAULT NEWID(),
    source_id INT NULL,
    source_external_id NVARCHAR(200) NULL,
    source_row_hash VARBINARY(32) NULL,
    email NVARCHAR(320) NULL,
    normalized_email AS LOWER(LTRIM(RTRIM(email))) PERSISTED,
    business_name NVARCHAR(300) NULL,
    contact_name NVARCHAR(200) NULL,
    phone_number NVARCHAR(80) NULL,
    website_url NVARCHAR(1000) NULL,
    contact_page_url NVARCHAR(1000) NULL,
    city_name NVARCHAR(160) NULL,
    region_name NVARCHAR(160) NULL,
    country_code CHAR(2) NOT NULL CONSTRAINT DF_marketing_leads_country_code DEFAULT 'GB',
    business_type NVARCHAR(160) NULL,
    status NVARCHAR(40) NOT NULL CONSTRAINT DF_marketing_leads_status DEFAULT N'active',
    is_unsubscribed BIT NOT NULL CONSTRAINT DF_marketing_leads_is_unsubscribed DEFAULT 0,
    unsubscribed_at DATETIME2(3) NULL,
    last_email_sent_at DATETIME2(3) NULL,
    last_engaged_at DATETIME2(3) NULL,
    created_at DATETIME2(3) NOT NULL CONSTRAINT DF_marketing_leads_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(3) NOT NULL CONSTRAINT DF_marketing_leads_updated_at DEFAULT SYSUTCDATETIME(),
    raw_json NVARCHAR(MAX) NULL,
    CONSTRAINT FK_marketing_leads_source FOREIGN KEY (source_id) REFERENCES marketing.lead_sources(source_id),
    CONSTRAINT CK_marketing_leads_status CHECK (status IN (N'active', N'do_not_contact', N'bounced', N'unsubscribed', N'archived'))
  );

  CREATE UNIQUE INDEX UX_marketing_leads_normalized_email ON marketing.leads(normalized_email) WHERE email IS NOT NULL;
  CREATE INDEX IX_marketing_leads_status_city ON marketing.leads(status, city_name) INCLUDE (business_name, email, business_type);
  CREATE INDEX IX_marketing_leads_source ON marketing.leads(source_id);
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

IF OBJECT_ID(N'marketing.services', N'U') IS NULL
BEGIN
  CREATE TABLE marketing.services (
    service_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_marketing_services PRIMARY KEY,
    service_key NVARCHAR(80) NOT NULL,
    service_name NVARCHAR(160) NOT NULL,
    is_active BIT NOT NULL CONSTRAINT DF_marketing_services_is_active DEFAULT 1,
    created_at DATETIME2(3) NOT NULL CONSTRAINT DF_marketing_services_created_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_marketing_services_service_key UNIQUE (service_key)
  );
END;
GO

MERGE marketing.services AS target
USING (VALUES
  (N'plumbing', N'Plumbing'),
  (N'emergency_plumber', N'Emergency plumber'),
  (N'plumbing_heating', N'Plumbing and heating'),
  (N'gas_engineer', N'Gas engineer'),
  (N'boiler_repair', N'Boiler repair'),
  (N'boiler_installation', N'Boiler installation'),
  (N'central_heating', N'Central heating'),
  (N'bathroom_plumbing', N'Bathroom plumbing'),
  (N'drainage', N'Drainage')
) AS source(service_key, service_name)
ON target.service_key = source.service_key
WHEN MATCHED THEN UPDATE SET service_name = source.service_name, is_active = 1
WHEN NOT MATCHED THEN INSERT (service_key, service_name) VALUES (source.service_key, source.service_name);
GO

IF OBJECT_ID(N'marketing.lead_service_interests', N'U') IS NULL
BEGIN
  CREATE TABLE marketing.lead_service_interests (
    lead_service_interest_id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_marketing_lead_service_interests PRIMARY KEY,
    lead_id BIGINT NOT NULL,
    service_id INT NOT NULL,
    interest_score INT NOT NULL CONSTRAINT DF_marketing_lead_service_interests_interest_score DEFAULT 0,
    source NVARCHAR(40) NOT NULL CONSTRAINT DF_marketing_lead_service_interests_source DEFAULT N'imported_category',
    first_detected_at DATETIME2(3) NOT NULL CONSTRAINT DF_marketing_lead_service_interests_first_detected_at DEFAULT SYSUTCDATETIME(),
    last_detected_at DATETIME2(3) NOT NULL CONSTRAINT DF_marketing_lead_service_interests_last_detected_at DEFAULT SYSUTCDATETIME(),
    evidence NVARCHAR(1000) NULL,
    CONSTRAINT FK_marketing_lead_service_interests_lead FOREIGN KEY (lead_id) REFERENCES marketing.leads(lead_id),
    CONSTRAINT FK_marketing_lead_service_interests_service FOREIGN KEY (service_id) REFERENCES marketing.services(service_id),
    CONSTRAINT UQ_marketing_lead_service_interests_lead_service UNIQUE (lead_id, service_id),
    CONSTRAINT CK_marketing_lead_service_interests_score CHECK (interest_score >= 0)
  );

  CREATE INDEX IX_marketing_lead_service_interests_service_score ON marketing.lead_service_interests(service_id, interest_score DESC, last_detected_at DESC);
END;
GO

IF OBJECT_ID(N'marketing.email_templates', N'U') IS NULL
BEGIN
  CREATE TABLE marketing.email_templates (
    template_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_marketing_email_templates PRIMARY KEY,
    template_key NVARCHAR(120) NOT NULL,
    service_id INT NULL,
    template_name NVARCHAR(240) NOT NULL,
    subject NVARCHAR(300) NOT NULL,
    html_body NVARCHAR(MAX) NULL,
    text_body NVARCHAR(MAX) NULL,
    is_active BIT NOT NULL CONSTRAINT DF_marketing_email_templates_is_active DEFAULT 1,
    created_at DATETIME2(3) NOT NULL CONSTRAINT DF_marketing_email_templates_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(3) NOT NULL CONSTRAINT DF_marketing_email_templates_updated_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_marketing_email_templates_template_key UNIQUE (template_key),
    CONSTRAINT FK_marketing_email_templates_service FOREIGN KEY (service_id) REFERENCES marketing.services(service_id)
  );
END;
GO

IF OBJECT_ID(N'marketing.email_messages', N'U') IS NULL
BEGIN
  CREATE TABLE marketing.email_messages (
    message_id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_marketing_email_messages PRIMARY KEY,
    lead_id BIGINT NOT NULL,
    template_id INT NULL,
    service_id INT NULL,
    sequence_enrollment_id BIGINT NULL,
    provider NVARCHAR(80) NULL,
    provider_message_id NVARCHAR(255) NULL,
    from_email NVARCHAR(320) NULL,
    to_email NVARCHAR(320) NOT NULL,
    subject NVARCHAR(300) NOT NULL,
    status NVARCHAR(40) NOT NULL CONSTRAINT DF_marketing_email_messages_status DEFAULT N'queued',
    queued_at DATETIME2(3) NOT NULL CONSTRAINT DF_marketing_email_messages_queued_at DEFAULT SYSUTCDATETIME(),
    sent_at DATETIME2(3) NULL,
    delivered_at DATETIME2(3) NULL,
    bounced_at DATETIME2(3) NULL,
    unsubscribed_at DATETIME2(3) NULL,
    metadata_json NVARCHAR(MAX) NULL,
    CONSTRAINT FK_marketing_email_messages_lead FOREIGN KEY (lead_id) REFERENCES marketing.leads(lead_id),
    CONSTRAINT FK_marketing_email_messages_template FOREIGN KEY (template_id) REFERENCES marketing.email_templates(template_id),
    CONSTRAINT FK_marketing_email_messages_service FOREIGN KEY (service_id) REFERENCES marketing.services(service_id),
    CONSTRAINT CK_marketing_email_messages_status CHECK (status IN (N'queued', N'sent', N'delivered', N'opened', N'clicked', N'bounced', N'complained', N'unsubscribed', N'failed'))
  );

  CREATE UNIQUE INDEX UX_marketing_email_messages_provider_message_id
    ON marketing.email_messages(provider, provider_message_id)
    WHERE provider IS NOT NULL AND provider_message_id IS NOT NULL;
  CREATE INDEX IX_marketing_email_messages_lead_sent ON marketing.email_messages(lead_id, sent_at DESC);
  CREATE INDEX IX_marketing_email_messages_service_status ON marketing.email_messages(service_id, status, sent_at DESC);
END;
GO

IF OBJECT_ID(N'marketing.email_links', N'U') IS NULL
BEGIN
  CREATE TABLE marketing.email_links (
    email_link_id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_marketing_email_links PRIMARY KEY,
    message_id BIGINT NOT NULL,
    service_id INT NULL,
    link_key NVARCHAR(120) NULL,
    destination_url NVARCHAR(1200) NOT NULL,
    tracking_token UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_marketing_email_links_tracking_token DEFAULT NEWID(),
    created_at DATETIME2(3) NOT NULL CONSTRAINT DF_marketing_email_links_created_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_marketing_email_links_message FOREIGN KEY (message_id) REFERENCES marketing.email_messages(message_id),
    CONSTRAINT FK_marketing_email_links_service FOREIGN KEY (service_id) REFERENCES marketing.services(service_id),
    CONSTRAINT UQ_marketing_email_links_tracking_token UNIQUE (tracking_token)
  );

  CREATE INDEX IX_marketing_email_links_message ON marketing.email_links(message_id);
  CREATE INDEX IX_marketing_email_links_service ON marketing.email_links(service_id);
END;
GO

IF OBJECT_ID(N'marketing.email_events', N'U') IS NULL
BEGIN
  CREATE TABLE marketing.email_events (
    event_id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_marketing_email_events PRIMARY KEY,
    provider NVARCHAR(80) NULL,
    provider_event_id NVARCHAR(255) NULL,
    event_type NVARCHAR(40) NOT NULL,
    event_at DATETIME2(3) NOT NULL CONSTRAINT DF_marketing_email_events_event_at DEFAULT SYSUTCDATETIME(),
    lead_id BIGINT NULL,
    message_id BIGINT NULL,
    email_link_id BIGINT NULL,
    service_id INT NULL,
    email NVARCHAR(320) NULL,
    url NVARCHAR(1200) NULL,
    user_agent NVARCHAR(1000) NULL,
    ip_hash VARBINARY(32) NULL,
    metadata_json NVARCHAR(MAX) NULL,
    created_at DATETIME2(3) NOT NULL CONSTRAINT DF_marketing_email_events_created_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_marketing_email_events_lead FOREIGN KEY (lead_id) REFERENCES marketing.leads(lead_id),
    CONSTRAINT FK_marketing_email_events_message FOREIGN KEY (message_id) REFERENCES marketing.email_messages(message_id),
    CONSTRAINT FK_marketing_email_events_link FOREIGN KEY (email_link_id) REFERENCES marketing.email_links(email_link_id),
    CONSTRAINT FK_marketing_email_events_service FOREIGN KEY (service_id) REFERENCES marketing.services(service_id),
    CONSTRAINT CK_marketing_email_events_event_type CHECK (event_type IN (N'queued', N'sent', N'delivered', N'open', N'click', N'bounce', N'complaint', N'unsubscribe', N'failed', N'dropped'))
  );

  CREATE UNIQUE INDEX UX_marketing_email_events_provider_event_id
    ON marketing.email_events(provider, provider_event_id)
    WHERE provider IS NOT NULL AND provider_event_id IS NOT NULL;
  CREATE INDEX IX_marketing_email_events_lead_time ON marketing.email_events(lead_id, event_at DESC);
  CREATE INDEX IX_marketing_email_events_message_time ON marketing.email_events(message_id, event_at DESC);
  CREATE INDEX IX_marketing_email_events_service_type_time ON marketing.email_events(service_id, event_type, event_at DESC);
END;
GO

IF OBJECT_ID(N'marketing.email_unsubscribes', N'U') IS NULL
BEGIN
  CREATE TABLE marketing.email_unsubscribes (
    unsubscribe_id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_marketing_email_unsubscribes PRIMARY KEY,
    lead_id BIGINT NULL,
    email NVARCHAR(320) NOT NULL,
    normalized_email AS LOWER(LTRIM(RTRIM(email))) PERSISTED,
    service_id INT NULL,
    unsubscribed_at DATETIME2(3) NOT NULL CONSTRAINT DF_marketing_email_unsubscribes_unsubscribed_at DEFAULT SYSUTCDATETIME(),
    reason NVARCHAR(500) NULL,
    source NVARCHAR(80) NULL,
    CONSTRAINT FK_marketing_email_unsubscribes_lead FOREIGN KEY (lead_id) REFERENCES marketing.leads(lead_id),
    CONSTRAINT FK_marketing_email_unsubscribes_service FOREIGN KEY (service_id) REFERENCES marketing.services(service_id)
  );

  CREATE UNIQUE INDEX UX_marketing_email_unsubscribes_email_service
    ON marketing.email_unsubscribes(normalized_email, service_id)
    WHERE service_id IS NOT NULL;
  CREATE UNIQUE INDEX UX_marketing_email_unsubscribes_email_global
    ON marketing.email_unsubscribes(normalized_email)
    WHERE service_id IS NULL;
END;
GO

IF OBJECT_ID(N'marketing.email_sequences', N'U') IS NULL
BEGIN
  CREATE TABLE marketing.email_sequences (
    sequence_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_marketing_email_sequences PRIMARY KEY,
    sequence_key NVARCHAR(120) NOT NULL,
    service_id INT NULL,
    sequence_name NVARCHAR(240) NOT NULL,
    is_active BIT NOT NULL CONSTRAINT DF_marketing_email_sequences_is_active DEFAULT 1,
    created_at DATETIME2(3) NOT NULL CONSTRAINT DF_marketing_email_sequences_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(3) NOT NULL CONSTRAINT DF_marketing_email_sequences_updated_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_marketing_email_sequences_sequence_key UNIQUE (sequence_key),
    CONSTRAINT FK_marketing_email_sequences_service FOREIGN KEY (service_id) REFERENCES marketing.services(service_id)
  );
END;
GO

IF OBJECT_ID(N'marketing.email_sequence_steps', N'U') IS NULL
BEGIN
  CREATE TABLE marketing.email_sequence_steps (
    sequence_step_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_marketing_email_sequence_steps PRIMARY KEY,
    sequence_id INT NOT NULL,
    template_id INT NOT NULL,
    step_number INT NOT NULL,
    delay_minutes INT NOT NULL CONSTRAINT DF_marketing_email_sequence_steps_delay_minutes DEFAULT 0,
    is_active BIT NOT NULL CONSTRAINT DF_marketing_email_sequence_steps_is_active DEFAULT 1,
    CONSTRAINT FK_marketing_email_sequence_steps_sequence FOREIGN KEY (sequence_id) REFERENCES marketing.email_sequences(sequence_id),
    CONSTRAINT FK_marketing_email_sequence_steps_template FOREIGN KEY (template_id) REFERENCES marketing.email_templates(template_id),
    CONSTRAINT UQ_marketing_email_sequence_steps_sequence_step UNIQUE (sequence_id, step_number),
    CONSTRAINT CK_marketing_email_sequence_steps_delay CHECK (delay_minutes >= 0)
  );
END;
GO

IF OBJECT_ID(N'marketing.lead_sequence_enrollments', N'U') IS NULL
BEGIN
  CREATE TABLE marketing.lead_sequence_enrollments (
    sequence_enrollment_id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_marketing_lead_sequence_enrollments PRIMARY KEY,
    lead_id BIGINT NOT NULL,
    sequence_id INT NOT NULL,
    service_id INT NULL,
    status NVARCHAR(40) NOT NULL CONSTRAINT DF_marketing_lead_sequence_enrollments_status DEFAULT N'active',
    trigger_event_id BIGINT NULL,
    current_step_number INT NOT NULL CONSTRAINT DF_marketing_lead_sequence_enrollments_current_step_number DEFAULT 0,
    next_send_at DATETIME2(3) NULL,
    started_at DATETIME2(3) NOT NULL CONSTRAINT DF_marketing_lead_sequence_enrollments_started_at DEFAULT SYSUTCDATETIME(),
    completed_at DATETIME2(3) NULL,
    stopped_at DATETIME2(3) NULL,
    stop_reason NVARCHAR(500) NULL,
    CONSTRAINT FK_marketing_lead_sequence_enrollments_lead FOREIGN KEY (lead_id) REFERENCES marketing.leads(lead_id),
    CONSTRAINT FK_marketing_lead_sequence_enrollments_sequence FOREIGN KEY (sequence_id) REFERENCES marketing.email_sequences(sequence_id),
    CONSTRAINT FK_marketing_lead_sequence_enrollments_service FOREIGN KEY (service_id) REFERENCES marketing.services(service_id),
    CONSTRAINT FK_marketing_lead_sequence_enrollments_trigger_event FOREIGN KEY (trigger_event_id) REFERENCES marketing.email_events(event_id),
    CONSTRAINT CK_marketing_lead_sequence_enrollments_status CHECK (status IN (N'active', N'paused', N'completed', N'stopped', N'unsubscribed', N'bounced'))
  );

  CREATE UNIQUE INDEX UX_marketing_lead_sequence_enrollments_active
    ON marketing.lead_sequence_enrollments(lead_id, sequence_id)
    WHERE status IN (N'active', N'paused');
  CREATE INDEX IX_marketing_lead_sequence_enrollments_next_send ON marketing.lead_sequence_enrollments(status, next_send_at);
END;
GO

IF OBJECT_ID(N'marketing.v_lead_service_engagement', N'V') IS NULL
BEGIN
  EXEC(N'
    CREATE VIEW marketing.v_lead_service_engagement
    AS
    SELECT
      l.lead_id,
      l.email,
      l.business_name,
      l.city_name,
      s.service_key,
      s.service_name,
      COUNT(CASE WHEN ee.event_type = N''sent'' THEN 1 END) AS sent_count,
      COUNT(CASE WHEN ee.event_type = N''open'' THEN 1 END) AS open_count,
      COUNT(CASE WHEN ee.event_type = N''click'' THEN 1 END) AS click_count,
      MAX(CASE WHEN ee.event_type = N''click'' THEN ee.event_at END) AS last_clicked_at,
      MAX(ee.event_at) AS last_event_at,
      COALESCE(lsi.interest_score, 0) AS interest_score
    FROM marketing.leads l
    LEFT JOIN marketing.email_events ee ON ee.lead_id = l.lead_id
    LEFT JOIN marketing.services s ON s.service_id = COALESCE(ee.service_id, (
      SELECT TOP 1 lsi2.service_id
      FROM marketing.lead_service_interests lsi2
      WHERE lsi2.lead_id = l.lead_id
      ORDER BY lsi2.interest_score DESC, lsi2.last_detected_at DESC
    ))
    LEFT JOIN marketing.lead_service_interests lsi ON lsi.lead_id = l.lead_id AND lsi.service_id = s.service_id
    GROUP BY l.lead_id, l.email, l.business_name, l.city_name, s.service_key, s.service_name, lsi.interest_score;
  ');
END;
GO
