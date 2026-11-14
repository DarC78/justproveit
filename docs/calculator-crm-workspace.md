# Calculator and CRM workspace

The Romanian pension calculator has two in-page tabs: Calculator (initially
active) and CRM. Once a phone is available, the CRM page loads eagerly in a
hidden same-origin iframe at `/admin/crm/?tab=all&phone=<encoded current phone>`.
The existing CRM authorization remains required; no tokens are added to URLs.

Switching tabs hides panels without unmounting the calculator or iframe, so
simulation inputs, results, and CRM navigation survive switching. The CRM view
uses the available page width. A changed contact phone reloads only the CRM
frame for that number. Without a phone, CRM is disabled and no frame is loaded.
The green CRM button beside the contact phone selects the in-page CRM tab.
A separate-window link remains available inside that panel.

The tabs expose tab/tabpanel relationships and support Left/Right/Home/End
keyboard navigation. No native ACD Agent settings or software are changed.
