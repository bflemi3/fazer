import fs from "node:fs";
import path from "node:path";
import type { Components } from "react-markdown";
import Markdown from "react-markdown";
import { BackButton } from "./back-button";

const components: Components = {
  h1: (props) => (
    <h1 className="text-2xl font-semibold tracking-tight" {...props} />
  ),
  h2: (props) => (
    <h2
      className="mt-10 border-b border-border pb-2 text-lg font-medium text-muted-foreground first:mt-0"
      {...props}
    />
  ),
  h3: (props) => (
    <h3 className="mt-6 text-base font-medium" {...props} />
  ),
  p: (props) => <p className="mt-4 text-sm leading-relaxed" {...props} />,
  ul: (props) => <ul className="mt-4 list-disc space-y-1.5 pl-6" {...props} />,
  ol: (props) => (
    <ol className="mt-4 list-decimal space-y-1.5 pl-6" {...props} />
  ),
  li: (props) => <li className="text-sm leading-relaxed" {...props} />,
  a: (props) => (
    <a
      className="font-medium underline underline-offset-4 hover:text-muted-foreground"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  strong: (props) => <strong className="font-semibold" {...props} />,
  em: (props) => <em className="italic" {...props} />,
  code: (props) => (
    <code
      className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs"
      {...props}
    />
  ),
  hr: () => <hr className="my-8 border-border" />,
  blockquote: (props) => (
    <blockquote
      className="mt-4 border-l-2 border-border pl-4 text-sm italic text-muted-foreground"
      {...props}
    />
  ),
};

export default function ChangelogPage() {
  const filePath = path.join(process.cwd(), "CHANGELOG.md");
  const content = fs.readFileSync(filePath, "utf-8");

  return (
    <main className="px-4 pt-4 pb-8">
      <BackButton />
      <article className="mt-6">
        <Markdown components={components}>{content}</Markdown>
      </article>
    </main>
  );
}
