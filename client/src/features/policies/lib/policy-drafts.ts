export type PolicyDraft = {
    title: string;
    summary: string;
    reviewItems: string[];
    sections: { id: string; title: string; paragraphs: string[] }[];
};

export const policyLinks = [
    { href: "/privacy", title: "Privacy Policy" },
    { href: "/terms", title: "Terms of Service" },
    { href: "/refund-cancellation", title: "Refund & Cancellation" },
    { href: "/cookies", title: "Cookie Policy" },
];

export const privacyDraft: PolicyDraft = {
    title: "Privacy Policy",
    summary: "A draft explanation of the information used to support your rental journey on EstateHub.",
    reviewItems: ["Legal name and address of the website operator", "Privacy contact email and applicable jurisdiction", "Lawful grounds, retention periods, hosting locations and international transfers", "Request procedures and applicable privacy rights"],
    sections: [
        { id: "information", title: "1. Information used by the service", paragraphs: ["EstateHub processes account and contact details, rental listings and photographs, favorites, applications, messages, lease information and payment or settlement records supplied through the service. Passwords are stored as hashes rather than plain text.", "Manager agreement setup can include a legal name, title, agreement notes and an encrypted signature image. Signature encryption and decryption run in the browser using the passphrase entered for those actions."] },
        { id: "purposes", title: "2. How information is used", paragraphs: ["The current application uses information to authenticate accounts, display rental listings, manage applications and leases, exchange messages and track payment confirmations or disputes. Preferences saved on your device support theme and reduced-motion choices.", "A final policy must identify the legal grounds for each purpose and distinguish required information from optional information."] },
        { id: "sharing", title: "3. Sharing and external services", paragraphs: ["Relevant rental information is made available to the tenant and manager involved in the application, conversation or tenancy, subject to the application's access controls.", "The current implementation uses Cloudinary for property images and Mapbox for maps. Browser geolocation runs when you request it. If browser location is unavailable, you may separately choose an approximate location lookup that sends your IP address to ipapi.co. Declining browser location does not start this lookup.", "The operator must confirm the complete provider list, contractual arrangements, hosting locations and any transfer safeguards before publication."] },
        { id: "storage", title: "4. Storage and security", paragraphs: ["Application records are stored on the server. The access token and account summary stay in memory while the page is open; an HTTP-only refresh-token cookie is set by the authentication server. Theme and reduced-motion choices can remain in browser storage. The offline cache contains only a public connection notice, not application pages or API records.", "The operator must set documented retention and deletion periods. This draft does not promise a particular retention period or absolute security."] },
        { id: "choices", title: "5. Your choices and requests", paragraphs: ["You can manage available account settings, sign out, change browser storage permissions and decline browser location permission. Clearing site storage can remove saved preferences and sign you out.", "The operator must provide a working privacy contact and a procedure for information, correction, deletion and other requests that apply in the relevant jurisdiction. No request deadline or eligibility rule is established by this draft."] },
        { id: "updates", title: "6. Publication and updates", paragraphs: ["This document is a draft for owner review. The operator's identity, contact details, effective date and applicable legal requirements must be completed before it is published as an operative policy."] },
    ],
};

export const termsDraft: PolicyDraft = {
    title: "Terms of Service / Terms & Conditions",
    summary: "Proposed terms for accounts, listings, applications, communication and tenancy management.",
    reviewItems: ["Contracting entity, address and support email", "Eligibility rules and service territories", "Applicable law, dispute process and liability provisions", "Fees, suspension procedures and effective date"],
    sections: [
        { id: "service", title: "1. The EstateHub service", paragraphs: ["EstateHub provides tools for browsing rentals, managing listings and applications, communicating, preparing lease documents and recording settlement activity. Property-specific conditions and signed agreements must be reviewed by the parties involved.", "Submitting an application or viewing a listing does not by itself confirm a tenancy. Availability and application status may change as managers process requests."] },
        { id: "accounts", title: "2. Accounts and responsibilities", paragraphs: ["Proposed account requirements: provide accurate information, keep login credentials private and use only accounts or properties you are authorized to manage. The operator must confirm age, eligibility and verification rules before adopting these terms."] },
        { id: "conduct", title: "3. Listings, messages and acceptable use", paragraphs: ["Proposed acceptable-use rules prohibit fraudulent listings, impersonation, harassment, unlawful content, unauthorized access and interference with the service. Users should upload photographs and other materials only when they have permission to use them.", "The operator must establish reporting, moderation, suspension and appeal procedures before these rules become operative."] },
        { id: "agreements", title: "4. Applications and lease documents", paragraphs: ["Check property details, quotations, dates, payment instructions and agreement text before confirming an action. Generated draft lease PDFs require review by the parties; this website does not establish their legal validity in every jurisdiction.", "Manager signature setup uses an encrypted signature image. Keep the signature passphrase secure and inspect documents before sharing or signing them."] },
        { id: "payments", title: "5. Payments and cancellation", paragraphs: ["Cash is handed directly between Tenant and Manager. A payment status shown in the application does not replace independent verification that cash was received. EstateHub does not collect, hold or return it.", "Refund eligibility, deadlines and cancellation consequences depend on the parties' applicable agreements. Refer to the Refund & Cancellation Policy for details."] },
        { id: "availability", title: "6. Availability and changes", paragraphs: ["The website may temporarily display maintenance or offline notices. Network-dependent actions are paused when the browser reports that it is offline. Reconnection does not mean a pending transaction completed; check its status before retrying.", "The final terms must specify service commitments, notices of material changes, liability limits and dispute arrangements where applicable."] },
        { id: "status", title: "7. Draft status", paragraphs: ["These proposed terms are not presented as an already adopted contract. The operator must review, complete and approve them, set an effective date and decide how acceptance will be recorded before publication."] },
    ],
};

export const refundDraft: PolicyDraft = {
    title: "Refund & Cancellation Policy",
    summary: "A draft guide separating application actions from the financial rules still requiring owner approval.",
    reviewItems: ["Refund eligibility for each payment category", "Cancellation windows, fees and exceptions", "Refund method, processing times and responsible party", "Support contact, escalation process and effective date"],
    sections: [
        { id: "scope", title: "1. Scope", paragraphs: ["This draft concerns applications, cancellation requests and settlement records managed through EstateHub. It does not establish a universal refund entitlement, cancellation fee or refund deadline.", "Before paying, tenants and managers should review the written terms for the particular rental, including deposits, rent and any other charges."] },
        { id: "withdrawal", title: "2. Application withdrawal", paragraphs: ["The application offers withdrawal actions where the current application status permits them. Read the confirmation prompt before proceeding. Withdrawing an application does not itself transfer money or establish that a refund has been approved."] },
        { id: "cancellation", title: "3. Cancellation requests", paragraphs: ["Cancellation controls depend on application and payment status. Some confirmation prompts describe irreversible actions; review them carefully before confirming.", "The operator must define which cancellation requests are eligible, who approves them, applicable notice periods and any financial consequences. Those rules are intentionally unresolved in this draft."] },
        { id: "settlement", title: "4. Settlement and disputes", paragraphs: ["EstateHub records cash handover confirmations and disputes. Keep independent evidence such as a signed receipt, and verify the person receiving the cash.", "An in-app cancellation or payment-status update does not return cash. Tenant and Manager must arrange any repayment directly with each other."] },
        { id: "refunds", title: "5. Refund rules awaiting approval", paragraphs: ["Owner approval is required for refundable and non-refundable payment categories, partial refunds, cancellation fees, processing periods, exceptional circumstances and the party responsible for issuing a refund. No figures or timelines have been assumed."] },
        { id: "help", title: "6. Help and evidence", paragraphs: ["For a payment concern, keep the application reference, amount, payment date and relevant confirmation or transaction evidence. Avoid sending passwords, signature passphrases or complete sensitive banking credentials.", "A verified support contact and escalation procedure must be supplied before this policy is finalized."] },
    ],
};

export const cookieDraft: PolicyDraft = {
    title: "Cookie Policy",
    summary: "A draft inventory of cookies, browser storage and the public offline cache used by the current application.",
    reviewItems: ["Operator identity and contact", "Production cookie attributes and retention inventory", "External provider storage and consent requirements", "Effective date and any future analytics or marketing tools"],
    sections: [
        { id: "overview", title: "1. Cookies and browser storage", paragraphs: ["Cookies are small browser-held values that can be sent with matching requests. EstateHub also uses local storage for information and preferences that remain on the device until removed. The current offline feature uses a separate browser cache for one public connection notice."] },
        { id: "authentication", title: "2. Authentication storage", paragraphs: ["The authentication server sets an HTTP-only refreshToken cookie. Its expiry is controlled by server configuration and must be confirmed for production. The access token and account summary stay in memory rather than local storage.", "Signing out clears the in-memory session and the refresh-token cookie. Browser controls can clear remaining site cookies and storage; doing so can require another sign-in."] },
        { id: "preferences", title: "3. Preference storage", paragraphs: ["Theme selection and reduced-motion preference can be stored locally. The application no longer saves sidebar, search-view or map-view preferences persistently; older values are cleared on startup."] },
        { id: "offline", title: "4. Offline cache", paragraphs: ["A service worker stores /offline.html so a connection notice can be opened after the site has been visited online. It does not store authenticated pages, messages, payment records or API responses. Clearing site data removes this offline notice too."] },
        { id: "external", title: "5. External services", paragraphs: ["Map and image requests use external services, including Mapbox and Cloudinary. The operator must confirm any cookies or storage introduced by production providers, hosting or future integrations.", "No analytics or advertising integration was identified in the reviewed application source. This is not a guarantee about future deployment settings; the production inventory must be verified before publication."] },
        { id: "controls", title: "6. Your controls", paragraphs: ["Your browser lets you inspect, block or delete cookies and other site data. Some controls can affect login, saved preferences and offline access. Location permission is managed separately through the browser.", "The operator must determine which storage requires consent or other controls in the applicable jurisdiction before publishing this draft as a final policy."] },
    ],
};
