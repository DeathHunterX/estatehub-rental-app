import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

const policies = [
    { href: "/privacy", title: "Privacy Policy" },
    { href: "/terms", title: "Terms of Service" },
    { href: "/refund-cancellation", title: "Refund & Cancellation Policy" },
    { href: "/cookies", title: "Cookie Policy" },
];

const headingId = (value: string): string => value
    .toLowerCase()
    .replace(/[`*_]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");

const inlinePattern = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`|\*([^*]+)\*|\n/g;

function inline(value: string): ReactNode[] {
    const parts: ReactNode[] = [];
    let start = 0;
    for (const match of value.matchAll(inlinePattern)) {
        const index = match.index;
        if (index > start) parts.push(value.slice(start, index));
        if (match[0] === "\n") parts.push(<br key={index} />);
        else if (match[1] !== undefined) {
            const href = match[2];
            if (!/^(#|\/|https:\/\/|mailto:)/.test(href)) throw new Error("Unsupported policy link: " + href);
            parts.push(<a key={index} href={href} className="text-primary underline underline-offset-4 hover:text-primary/80">{inline(match[1])}</a>);
        } else if (match[3] !== undefined) parts.push(<strong key={index} className="font-semibold text-foreground">{inline(match[3])}</strong>);
        else if (match[4] !== undefined) parts.push(<code key={index} className="rounded bg-muted px-1 py-0.5 text-xs">{match[4]}</code>);
        else if (match[5] !== undefined) parts.push(<em key={index}>{inline(match[5])}</em>);
        start = index + match[0].length;
    }
    if (start < value.length) parts.push(value.slice(start));
    return parts;
}

const cells = (row: string) => row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
const isTableRule = (row: string) => /^\|?\s*:?-{3,}:?(\s*\|\s*:?-{3,}:?)*\s*\|?$/.test(row);
const isBlockStart = (line: string) => /^(#{1,6}\s|---+\s*$|\|\s*|\d+\.\s|-\s)/.test(line);

function markdownBlocks(markdown: string): ReactNode[] {
    const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
    const blocks: ReactNode[] = [];
    for (let i = 0; i < lines.length;) {
        const line = lines[i];
        if (!line.trim()) { i++; continue; }
        const heading = /^(#{1,6})\s+(.+)$/.exec(line);
        if (heading) {
            const level = heading[1].length;
            const title = heading[2].trim();
            const id = headingId(title);
            const className = level === 1 ? "text-3xl font-semibold tracking-tight sm:text-4xl" : level === 2 ? "mt-10 scroll-mt-24 border-t border-border pt-8 text-xl font-semibold sm:text-2xl" : "mt-6 scroll-mt-24 text-lg font-semibold";
            if (level === 1) blocks.push(<h1 key={i} id={id} className={className}>{inline(title)}</h1>);
            else if (level === 2) blocks.push(<h2 key={i} id={id} className={className}>{inline(title)}</h2>);
            else blocks.push(<h3 key={i} id={id} className={className}>{inline(title)}</h3>);
            i++; continue;
        }
        if (/^---+\s*$/.test(line)) { blocks.push(<hr key={i} className="my-8 border-border" />); i++; continue; }
        if (line.startsWith("|") && lines[i + 1] && isTableRule(lines[i + 1])) {
            const start = i;
            const headers = cells(line);
            i += 2;
            const rows: string[][] = [];
            while (i < lines.length && lines[i].startsWith("|")) rows.push(cells(lines[i++]));
            blocks.push(<div key={start} className="my-6 max-w-full overflow-x-auto rounded-xl border border-border" role="region" aria-label="Policy table" tabIndex={0}>
                <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
                    <thead className="bg-muted/70"><tr>{headers.map((cell, index) => <th key={index} scope="col" className="border-b border-border px-4 py-3 align-top font-semibold">{inline(cell)}</th>)}</tr></thead>
                    <tbody>{rows.map((row, rowIndex) => <tr key={rowIndex} className="border-b border-border last:border-b-0">{row.map((cell, cellIndex) => <td key={cellIndex} className="px-4 py-3 align-top leading-6 text-muted-foreground">{inline(cell)}</td>)}</tr>)}</tbody>
                </table>
            </div>);
            continue;
        }
        const ordered = /^\d+\.\s/.test(line);
        const unordered = /^-\s/.test(line);
        if (ordered || unordered) {
            const start = i;
            const items: string[] = [];
            const pattern = ordered ? /^\d+\.\s+(.+)$/ : /^-\s+(.+)$/;
            while (i < lines.length && pattern.test(lines[i])) items.push(pattern.exec(lines[i++])![1]);
            const content = items.map((item, index) => <li key={index} className="pl-1 leading-7">{inline(item)}</li>);
            blocks.push(ordered
                ? <ol key={start} className="my-4 list-decimal space-y-1 pl-6 text-sm text-muted-foreground">{content}</ol>
                : <ul key={start} className="my-4 list-disc space-y-1 pl-6 text-sm text-muted-foreground">{content}</ul>);
            continue;
        }
        const paragraph: string[] = [];
        const start = i;
        while (i < lines.length && lines[i].trim() && (i === start || !isBlockStart(lines[i]))) paragraph.push(lines[i++]);
        const text = paragraph.map((part, index) => part.endsWith("  ") && index < paragraph.length - 1 ? part.trimEnd() + "\n" : part.trim() + (index < paragraph.length - 1 ? " " : "")).join("");
        blocks.push(<p key={start} className="my-4 text-sm leading-7 text-muted-foreground sm:text-base">{inline(text)}</p>);
    }
    return blocks;
}

export default function PolicyDocument({ markdown }: { markdown: string }) {
    const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
    const contentsAt = lines.findIndex((line) => line === "## Contents");
    const bodyAt = lines.findIndex((line, index) => index > contentsAt && /^## 1\.\s/.test(line));
    if (contentsAt < 0 || bodyAt < 0) throw new Error("Policy is missing its contents or first section");
    const introduction = lines.slice(0, contentsAt).join("\n");
    const contents = lines.slice(contentsAt, bodyAt).join("\n");
    const body = lines.slice(bodyAt).join("\n");
    return <main className="min-h-screen bg-background px-5 py-10 text-foreground sm:px-8 sm:py-16">
        <div className="mx-auto min-w-0 max-w-5xl">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Back to home</Link>
            <header className="mt-8 border-b border-border pb-8">{markdownBlocks(introduction)}</header>
            <div className="mt-10 grid min-w-0 gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
                <nav aria-label="On this page" className="min-w-0 self-start lg:sticky lg:top-24 [&>h2]:mt-0 [&>h2]:border-0 [&>h2]:pt-0 [&>h2]:text-base">{markdownBlocks(contents)}</nav>
                <article className="min-w-0 break-words">{markdownBlocks(body)}</article>
            </div>
            <nav aria-label="Other policies" className="mt-12 flex flex-wrap gap-x-6 gap-y-3 border-t border-border pt-7 text-sm">{policies.map((link) => <Link key={link.href} href={link.href} className="text-muted-foreground hover:text-foreground">{link.title}</Link>)}</nav>
        </div>
    </main>;
}
