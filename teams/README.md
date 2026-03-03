# Parslee Dashboard Teams App

This directory contains the Microsoft Teams app manifest for the Parslee AI Employee Dashboard static tab.

## Manifest Structure

- `manifest.json` - Teams app configuration following v1.16 schema
- `color.png` - 192x192px app icon (full color)
- `outline.png` - 32x32px app icon (monochrome outline)

## Deployment Instructions

### 1. Prepare Icons

Create two PNG icons:

**color.png** (192x192px):
- Full-color app icon representing Parslee branding
- Used in Teams app catalog and installation dialogs
- Recommended: Use Parslee logo with white/transparent background

**outline.png** (32x32px):
- Monochrome outline icon (single color + transparency)
- Used in Teams left rail and tab headers
- Must be high-contrast for visibility in light/dark themes

### 2. Configure Domain

Replace the `{{DOMAIN}}` placeholder with your actual deployment domain:

```bash
# For production
sed 's/{{DOMAIN}}/parslee-aie-api.azurewebsites.net/g' manifest.json > manifest-prod.json

# For staging
sed 's/{{DOMAIN}}/parslee-aie-api-staging.azurewebsites.net/g' manifest.json > manifest-staging.json

# For local development
sed 's/{{DOMAIN}}/localhost:5000/g' manifest.json > manifest-local.json
```

Or manually edit `manifest.json` and replace both occurrences:
- Line 26: `"contentUrl": "https://{{DOMAIN}}/dashboard"`
- Line 31: `"validDomains": ["{{DOMAIN}}"]`

### 3. Package the App

Create a ZIP archive containing all three files:

```bash
cd /Users/mliotta/git/m365branch/src/Parslee.M365.Dashboard.Web/teams
zip -r ../parslee-dashboard.zip manifest.json color.png outline.png
```

The package will be created at: `/Users/mliotta/git/m365branch/src/Parslee.M365.Dashboard.Web/parslee-dashboard.zip`

### 4. Upload to Teams Admin Center

**Option A: Organization-Wide Deployment (Admin)**

1. Go to [Teams Admin Center](https://admin.teams.microsoft.com)
2. Navigate to **Teams apps** → **Manage apps**
3. Click **Upload new app** → **Upload**
4. Select `parslee-dashboard.zip`
5. Review app details and click **Publish**
6. Set app availability:
   - **Available to** → Select specific users/groups or entire organization
   - **App permission policy** → Allow custom apps

**Option B: Personal Sideloading (Developers)**

1. Open Microsoft Teams desktop/web client
2. Click **Apps** in left sidebar
3. Click **Manage your apps** (bottom left)
4. Click **Upload an app** → **Upload a custom app**
5. Select `parslee-dashboard.zip`
6. Teams will validate and install the app

### 5. Add Tab to Channel

1. Navigate to the **Parslee AI General** channel
2. Click the **+** icon in the tab bar
3. Search for **Parslee Dashboard**
4. Click **Add**
5. Configure tab settings (if prompted)
6. Click **Save**

The dashboard will now be accessible as a static tab in the channel.

## Configuration Reference

### Static Tab Settings

- **Entity ID**: `parslee-dashboard` (unique identifier)
- **Name**: Dashboard (displayed in tab bar)
- **Content URL**: `https://{{DOMAIN}}/dashboard` (dashboard endpoint)
- **Scopes**: `team` (channel-wide tab, not personal)

### Permissions

- **identity**: Required for SSO and organization context extraction
- **messageTeamMembers**: Required for potential future messaging integrations

### Valid Domains

The `validDomains` array restricts where tab content can be loaded from. This prevents:
- Content injection attacks
- Unauthorized third-party content
- Cross-origin security issues

Ensure your API domain is added to this list before deployment.

## Troubleshooting

### "Invalid manifest" error

- Verify JSON syntax with `cat manifest.json | jq .`
- Check schema version matches (`manifestVersion: "1.16"`)
- Ensure all required fields are present

### "Domain not allowed" error

- Verify `{{DOMAIN}}` was replaced with actual domain
- Check domain matches exactly (no trailing slashes)
- Ensure domain is added to `validDomains` array

### Dashboard not loading in tab

- Verify API is running and accessible at `/dashboard`
- Check browser console for CORS errors
- Ensure domain is HTTPS (Teams requires secure connections)
- Verify Teams app has `identity` permission enabled

### Icons not displaying

- Verify PNG files are exactly 192x192 (color) and 32x32 (outline)
- Check file names match manifest: `color.png` and `outline.png`
- Ensure icons are included in ZIP package
- Rebuild package after adding/updating icons

## Security Considerations

### Content Security Policy

The dashboard endpoint at `/dashboard` should include appropriate CSP headers:

```http
Content-Security-Policy: frame-ancestors teams.microsoft.com *.teams.microsoft.com
```

This prevents the dashboard from being embedded outside of Teams.

### Authentication

The dashboard uses organization context from the Teams tab:
- Teams provides user identity via SSO token
- Organization ID extracted from Teams context or route parameters
- No separate authentication required for tab users

### HTTPS Requirement

Teams requires all tab content to be served over HTTPS:
- Production: Azure App Service provides automatic HTTPS
- Local development: Use ngrok or similar tunneling service

## Versioning

When updating the app:

1. Increment `version` in `manifest.json` (e.g., `1.0.0` → `1.0.1`)
2. Rebuild the ZIP package
3. Upload new version to Teams Admin Center
4. Teams will prompt users to update the app

## References

- [Teams Manifest Schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Static Tabs Documentation](https://learn.microsoft.com/en-us/microsoftteams/platform/tabs/what-are-tabs)
- [Teams App Submission](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/deploy-and-publish/apps-upload)
