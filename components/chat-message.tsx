/**
 * Chat Message Component
 *
 * Renders individual messages with:
 * - Avatar (user/assistant)
 * - Markdown formatting
 * - Code syntax highlighting
 * - Smart response visualization (charts, tables)
 */

'use client';

import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { User, Bot } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ResponseVisualizer } from '@/components/response-visualizer';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export function ChatMessage({ role, content, isStreaming = false }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div className="group w-full">
      <div className="flex gap-4 py-6 px-4 max-w-3xl mx-auto">
        {/* Avatar - always on left */}
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className={cn(
            isUser ? 'bg-primary/10' : 'bg-muted'
          )}>
            {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>

        {/* Message content - no background, clean text */}
        <div className="flex-1 min-w-0">
          {isUser ? (
            // Simple rendering for user messages
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{content}</p>
          ) : (
            // Rich markdown rendering for assistant messages
            <div className="space-y-4">
              {/* Smart visualization first */}
              <ResponseVisualizer content={content} />

              {/* Markdown content */}
              <div className="prose prose-[15px] dark:prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code(props) {
                      const { node, inline, className, children, ...rest } = props as any;
                      const match = /language-(\w+)/.exec(className || '');
                      const language = match ? match[1] : '';

                      return !inline && language ? (
                        <SyntaxHighlighter
                          {...rest}
                          style={vscDarkPlus}
                          language={language}
                          PreTag="div"
                          className="rounded-lg !mt-3 !mb-3"
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code
                          className={cn(
                            'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs',
                            className
                          )}
                          {...rest}
                        >
                          {children}
                        </code>
                      );
                    },
                    pre({ children }) {
                      return <>{children}</>;
                    },
                    p({ children }) {
                      return <p className="mb-4 last:mb-0 leading-relaxed text-[15px]">{children}</p>;
                    },
                    ul({ children }) {
                      return <ul className="my-3 ml-6 list-disc space-y-2">{children}</ul>;
                    },
                    ol({ children }) {
                      return <ol className="my-3 ml-6 list-decimal space-y-2">{children}</ol>;
                    },
                    li({ children }) {
                      return <li className="leading-relaxed">{children}</li>;
                    },
                    h1({ children }) {
                      return <h1 className="mt-6 mb-3 text-2xl font-bold">{children}</h1>;
                    },
                    h2({ children }) {
                      return <h2 className="mt-5 mb-3 text-xl font-semibold">{children}</h2>;
                    },
                    h3({ children }) {
                      return <h3 className="mt-4 mb-2 text-lg font-semibold">{children}</h3>;
                    },
                    blockquote({ children }) {
                      return (
                        <blockquote className="mt-3 mb-3 border-l-2 border-muted-foreground/30 pl-4 italic text-muted-foreground">
                          {children}
                        </blockquote>
                      );
                    },
                    a({ href, children }) {
                      return (
                        <a
                          href={href}
                          className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors font-medium"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {children}
                        </a>
                      );
                    },
                    strong({ children }) {
                      return <strong className="font-semibold">{children}</strong>;
                    },
                  }}
                >
                  {content}
                </ReactMarkdown>
                {isStreaming && (
                  <span className="inline-block w-1.5 h-5 ml-1 bg-foreground/60 animate-pulse" />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
