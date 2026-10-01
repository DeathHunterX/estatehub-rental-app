import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, type PDFFont, type PDFPage, rgb } from "pdf-lib";

export type AgreementDraft = {
    leaseId: number;
    propertyName: string;
    address: string;
    tenantName: string;
    tenantEmail: string;
    tenantPhone?: string;
    managerName: string;
    managerTitle: string;
    startDate: Date | string;
    endDate: Date | string;
    rent: number;
    deposit: number;
    notes: string;
    signatureDataUrl?: string;
};

type PdfFonts = { latin: Uint8Array; vietnamese: Uint8Array };
const ink = rgb(0.12, 0.13, 0.17);
const muted = rgb(0.39, 0.41, 0.46);
const coral = rgb(0.72, 0.22, 0.29);
const money = (amount: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
const date = (value: Date | string) => new Date(value).toLocaleDateString("en-GB", { timeZone: "UTC" });

export async function generateLeaseAgreementPdf(draft: AgreementDraft, fontBytes: PdfFonts): Promise<Uint8Array> {
    const document = await PDFDocument.create();
    document.registerFontkit(fontkit);
    document.setTitle(`Lease agreement draft EH-${draft.leaseId}`);
    document.setAuthor("EstateHub");
    document.setSubject("Draft rental agreement for review by both parties");
    const latin = await document.embedFont(fontBytes.latin);
    const vietnamese = await document.embedFont(fontBytes.vietnamese);
    const latinChars = new Set(latin.getCharacterSet());
    const vietnameseChars = new Set(vietnamese.getCharacterSet());
    // Select a font per glyph so mixed Latin/Vietnamese names remain readable in one line.
    const fontFor = (character: string): [PDFFont, string] => {
        const point = character.codePointAt(0) ?? 63;
        if (latinChars.has(point)) return [latin, character];
        if (vietnameseChars.has(point)) return [vietnamese, character];
        return [latin, "?"];
    };
    const margin = 48;
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    let page: PDFPage = document.addPage([pageWidth, pageHeight]);
    let y = pageHeight - 55;
    const newPage = () => { page = document.addPage([pageWidth, pageHeight]); y = pageHeight - 55; };
    const ensureRoom = (height: number) => { if (y - height < 76) newPage(); };
    // Wrap at token boundaries, then fall back to glyph wrapping for words wider than a page.
    const write = (value: string, options: { size?: number; color?: ReturnType<typeof rgb>; gap?: number; maxWidth?: number } = {}) => {
        const size = options.size ?? 10;
        const lineHeight = size * 1.65;
        const maxX = margin + (options.maxWidth ?? pageWidth - margin * 2);
        let x = margin;
        ensureRoom(lineHeight);
        const nextLine = () => { x = margin; y -= lineHeight; ensureRoom(lineHeight); };
        const lines = value.normalize("NFC").split("\n");
        lines.forEach((line, lineIndex) => {
            if (lineIndex > 0) nextLine();
            for (const token of line.split(/(\s+)/u)) {
                const tokenWidth = [...token].reduce((total, character) => {
                    const [font, glyph] = fontFor(character);
                    return total + font.widthOfTextAtSize(glyph, size);
                }, 0);
                if (x > margin && x + tokenWidth > maxX) nextLine();
                if (x === margin && /^\s+$/u.test(token)) continue;
                for (const character of token) {
                    const [font, glyph] = fontFor(character);
                    const width = font.widthOfTextAtSize(glyph, size);
                    if (x + width > maxX) nextLine();
                    if (glyph !== " " || x > margin) page.drawText(glyph, { x, y, size, font, color: options.color ?? ink });
                    x += width;
                }
            }
        });
        y -= lineHeight + (options.gap ?? 0);
    };
    const heading = (title: string) => { ensureRoom(55); y -= 9; write(title, { size: 12, color: coral, gap: 4 }); };

    page.drawRectangle({ x: 0, y: pageHeight - 9, width: pageWidth, height: 9, color: coral });
    write("ESTATEHUB  /  RENTAL AGREEMENT DRAFT", { size: 17, color: coral, gap: 7 });
    write(`Reference EH-LEASE-${draft.leaseId}  |  Prepared ${date(new Date())}`, { size: 9, color: muted, gap: 11 });
    write("This document records proposed terms for review. It is not a completed or cryptographically signed contract.", { size: 9, color: muted, gap: 9 });

    heading("1. Parties and property");
    write(`Property: ${draft.propertyName}`);
    write(`Full address: ${draft.address || "Address to be confirmed"}`);
    write(`Tenant: ${draft.tenantName}  |  ${draft.tenantEmail}${draft.tenantPhone ? `  |  ${draft.tenantPhone}` : ""}`);
    write(`Manager / owner representative: ${draft.managerName || "Name to be confirmed"}${draft.managerTitle ? ` (${draft.managerTitle})` : ""}`);

    heading("2. Term and payment details");
    write(`Lease begins: ${date(draft.startDate)}     Lease ends: ${date(draft.endDate)}`);
    write(`Monthly rent: ${money(draft.rent)}     Security deposit: ${money(draft.deposit)}`);
    write("Rent due day: To be agreed     Payment: Cash directly between Tenant and Manager", { size: 9 });
    write("Deposit return conditions and deductions: To be agreed after a move-in inspection.", { size: 9 });

    heading("3. Occupancy and property condition");
    write("The tenant and manager should record permitted occupants, the move-in condition, included furnishings, and key handover before final execution.", { size: 9 });
    write("Utilities, routine maintenance, repair responsibility, and access notice: To be agreed in writing.", { size: 9 });

    heading("4. Renewal, early end, and handover");
    write("Notice period, renewal terms, early termination, final inspection, and return of keys: To be agreed by both parties.", { size: 9 });

    heading("5. Additional terms supplied by the manager");
    write(draft.notes.trim() || "No additional terms have been supplied.", { size: 10 });

    ensureRoom(195);
    heading("6. Signatures and review");
    write("Manager / owner representative", { size: 9, color: muted });
    if (draft.signatureDataUrl) {
        const image = draft.signatureDataUrl.startsWith("data:image/png")
            ? await document.embedPng(draft.signatureDataUrl)
            : await document.embedJpg(draft.signatureDataUrl);
        const dimensions = image.scaleToFit(185, 54);
        page.drawImage(image, { x: margin, y: y - 58, width: dimensions.width, height: dimensions.height });
    }
    y -= 62;
    write(draft.managerName || "________________________", { size: 10 });
    write("Tenant signature: ________________________    Date: ______________", { size: 10 });
    write("An uploaded signature image is a visual mark only. Identity verification, tenant consent, and final execution require a separate signing process.", { size: 8, color: muted });

    document.getPages().forEach((item, index) => {
        item.drawRectangle({ x: margin, y: 58, width: pageWidth - margin * 2, height: 0.5, color: rgb(0.82, 0.83, 0.85) });
        item.drawText(`EstateHub agreement draft  |  EH-LEASE-${draft.leaseId}  |  Page ${index + 1} of ${document.getPages().length}`, { x: margin, y: 43, size: 8, font: latin, color: muted });
    });
    return document.save();
}

export async function downloadLeaseAgreementPdf(draft: AgreementDraft): Promise<void> {
    const [latinResponse, vietnameseResponse] = await Promise.all([
        fetch("/fonts/noto-sans-latin.ttf"), fetch("/fonts/noto-sans-vietnamese.ttf"),
    ]);
    if (!latinResponse.ok || !vietnameseResponse.ok) throw new Error("Agreement font files could not be loaded.");
    const bytes = await generateLeaseAgreementPdf(draft, {
        latin: new Uint8Array(await latinResponse.arrayBuffer()),
        vietnamese: new Uint8Array(await vietnameseResponse.arrayBuffer()),
    });
    const blob = new Blob([Uint8Array.from(bytes)], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `estatehub-lease-${draft.leaseId}-agreement-draft.pdf`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
