-- Explicitly requested audience snapshot. No email sending or enrollment.
-- Uses original Wix creation dates, not database import timestamps.
SET NOCOUNT ON;
SET XACT_ABORT ON;
IF OBJECT_ID(N'wix.ozLeadsBanks1910', N'U') IS NOT NULL
    THROW 50000, 'Audience snapshot already exists; it will not be overwritten.', 1;

DECLARE @t uniqueidentifier='11B93F34-CB3D-46F5-8FD9-7B941CBCFE19';
WITH Clients AS (
 SELECT c.Id FROM crm.Contacts c WHERE c.TenantId=@t AND (LOWER(c.Status) LIKE 'client%' OR LOWER(c.Status) IN ('customer','sale','da') OR EXISTS(SELECT 1 FROM crm.ContactServices s WHERE s.TenantId=@t AND s.ContactId=c.Id AND s.Status IN ('active','customer')) OR EXISTS(SELECT 1 FROM crm.ContactLegacyLinks ll JOIN wix.crmLeads12Nov l ON l.Id=ll.LegacyId AND l.TenantId=ll.TenantId WHERE ll.TenantId=@t AND ll.ContactId=c.Id AND ll.LegacyTable='crmLeads12Nov' AND NULLIF(LTRIM(RTRIM(l.isCustomer)),'') IS NOT NULL AND UPPER(LTRIM(RTRIM(l.isCustomer))) NOT IN ('NO','NU','FALSE','0')))
), ClientEmails AS (
 SELECT LOWER(LTRIM(RTRIM(e.Email))) AS email FROM crm.ContactEmails e JOIN Clients c ON c.Id=e.ContactId WHERE e.TenantId=@t
 UNION SELECT LOWER(LTRIM(RTRIM(email))) FROM wix.ozClients WHERE TenantId=@t
 UNION SELECT LOWER(LTRIM(RTRIM(v.email))) FROM wix.crmLeads12Nov l CROSS APPLY (VALUES(l.email),(l.secondaryemail)) v(email) WHERE l.TenantId=@t AND NULLIF(LTRIM(RTRIM(l.isCustomer)),'') IS NOT NULL AND UPPER(LTRIM(RTRIM(l.isCustomer))) NOT IN ('NO','NU','FALSE','0')
), Romanian AS (
 SELECT c.Id FROM crm.Contacts c WHERE c.TenantId=@t AND LOWER(LTRIM(RTRIM(c.Language))) IN ('ro','romanian','romana','română','ro-ro')
), Emails AS (
 SELECT DISTINCT LOWER(LTRIM(RTRIM(e.Email))) AS email,r.Id AS ContactId FROM Romanian r JOIN crm.ContactEmails e ON e.ContactId=r.Id AND e.TenantId=@t WHERE e.Email LIKE '%_@_%._%' AND e.Email NOT LIKE '% %' AND e.Email NOT LIKE '%;%' AND e.Email NOT LIKE '%,%'
), Flags AS (
 SELECT e.email,MAX(CASE WHEN c.Id IS NOT NULL OR ce.email IS NOT NULL THEN 1 ELSE 0 END) AS client,
 MAX(CASE WHEN su.Id IS NOT NULL THEN 1 ELSE 0 END) AS suppressed,
 MAX(CASE WHEN al.Id IS NOT NULL THEN 1 ELSE 0 END) AS optedOut
 FROM Emails e LEFT JOIN Clients c ON c.Id=e.ContactId
 LEFT JOIN ClientEmails ce ON ce.email=e.email
 LEFT JOIN app.EmailSuppressions su ON su.TenantId=@t AND LOWER(LTRIM(RTRIM(su.EmailNormalized)))=e.email
 LEFT JOIN app.Leads al ON al.TenantId=@t AND LOWER(LTRIM(RTRIM(al.Email)))=e.email AND al.MarketingSubscribed=0
 GROUP BY e.email
)

SELECT DISTINCT email,'client' AS kind INTO #FilterEmails FROM ClientEmails WHERE email IS NOT NULL
UNION SELECT DISTINCT email,'existing' FROM Flags WHERE client=0 AND suppressed=0 AND optedOut=0
UNION SELECT DISTINCT LOWER(LTRIM(RTRIM(EmailNormalized))),'suppressed' FROM app.EmailSuppressions WHERE TenantId=@t
UNION SELECT DISTINCT LOWER(LTRIM(RTRIM(Email))),'optout' FROM app.Leads WHERE TenantId=@t AND MarketingSubscribed=0;

WITH Oz AS (
 SELECT LOWER(LTRIM(RTRIM(email))) AS email, MIN(WixCreatedDateUtc) AS OriginalCreatedAtUtc
 FROM wix.ozLeads WHERE TenantId=@t AND WixCreatedDateUtc<'20260401'
 AND NULLIF(LTRIM(RTRIM(language)),'') IS NULL
 AND email LIKE '%_@_%._%' AND email NOT LIKE '% %' AND email NOT LIKE '%;%' AND email NOT LIKE '%,%'
 GROUP BY LOWER(LTRIM(RTRIM(email)))
), OFlags AS (
 SELECT o.email,o.OriginalCreatedAtUtc,
 MAX(CASE WHEN f.kind='client' THEN 1 ELSE 0 END) AS client,
 MAX(CASE WHEN f.kind='suppressed' THEN 1 ELSE 0 END) AS suppressed,
 MAX(CASE WHEN f.kind='optout' THEN 1 ELSE 0 END) AS optedOut,
 MAX(CASE WHEN f.kind='existing' THEN 1 ELSE 0 END) AS overlap
 FROM Oz o LEFT JOIN #FilterEmails f ON f.email=o.email GROUP BY o.email,o.OriginalCreatedAtUtc
)
SELECT email,CONVERT(nvarchar(64),'ozLeads_unknown_language_before_20260401') AS AudienceSegment,
 CONVERT(nvarchar(30),NULL) AS Language,OriginalCreatedAtUtc AS OzLeadCreatedAtUtc INTO #Snapshot
 FROM OFlags WHERE client=0 AND suppressed=0 AND optedOut=0 AND overlap=0
UNION ALL
SELECT DISTINCT email,'romanian','ro',NULL FROM #FilterEmails WHERE kind='existing';

IF EXISTS(SELECT 1 FROM #Snapshot WHERE LEN(email)>320)
 THROW 50001, 'An email exceeds the snapshot column length.', 1;
IF EXISTS(SELECT email FROM #Snapshot GROUP BY email HAVING COUNT(*)>1)
 THROW 50002, 'Duplicate email in snapshot.', 1;

BEGIN TRANSACTION;
CREATE TABLE wix.ozLeadsBanks1910 (
 Email nvarchar(320) NOT NULL PRIMARY KEY,
 TenantId uniqueidentifier NOT NULL,
 AudienceSegment nvarchar(64) NOT NULL,
 Language nvarchar(30) NULL,
 OzLeadCreatedAtUtc datetime2(3) NULL,
 SnapshotCreatedAtUtc datetime2(3) NOT NULL DEFAULT SYSUTCDATETIME()
);
INSERT INTO wix.ozLeadsBanks1910 (Email,TenantId,AudienceSegment,Language,OzLeadCreatedAtUtc)
 SELECT email,@t,AudienceSegment,Language,OzLeadCreatedAtUtc FROM #Snapshot;
IF (SELECT COUNT(*) FROM wix.ozLeadsBanks1910)<>(SELECT COUNT(*) FROM #Snapshot)
 THROW 50003, 'Snapshot row count mismatch.', 1;
COMMIT TRANSACTION;

SELECT AudienceSegment,COUNT(*) AS EmailCount,MIN(SnapshotCreatedAtUtc) AS SnapshotCreatedAtUtc
FROM wix.ozLeadsBanks1910 GROUP BY AudienceSegment;
