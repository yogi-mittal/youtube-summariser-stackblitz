'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { YoutubeIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function Home() {
  const [url, setUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const generateSummary = async () => {
    const youtubeUrlPattern = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=([a-zA-Z0-9_]+)|youtu\.be\/([a-zA-Z\d_]+))(?:&.*)?$/gm;
    if (!url) {
      setError('Please enter a YouTube URL');
      return;
    }
    if (!youtubeUrlPattern.test(url)) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setSummary('');

      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const text = decoder.decode(value);
        setSummary((prev) => prev + text);
      }
    } catch (err) {
      setError('Failed to generate summary. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center space-y-8">
          <div className="flex items-center space-x-2">
            <YoutubeIcon className="h-8 w-8 text-destructive" />
            <h1 className="text-4xl font-bold">YouTube Summarizer</h1>
          </div>
          
          <p className="text-muted-foreground text-center max-w-xl">
            Get instant AI-powered summaries of any YouTube video. Simply paste the URL below and let our advanced algorithms do the rest.
          </p>

          <Card className="w-full max-w-2xl p-6">
            <div className="flex flex-col space-y-4">
              <div className="flex space-x-2">
                <Input
                  type="url"
                  placeholder="Paste YouTube URL here..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={generateSummary}
                  disabled={isLoading}
                >
                  {isLoading ? 'Generating...' : 'Generate Summary'}
                </Button>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              {summary && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h2 className="text-xl font-semibold mb-2">Summary</h2>
                  <div className="prose">
                    <ReactMarkdown>{summary}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}