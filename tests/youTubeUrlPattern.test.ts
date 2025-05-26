import { describe, it, expect } from 'vitest';

const youtubeUrlPattern = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[&?].*)?$/;

describe('YouTube URL Pattern', () => {
  it('should match valid YouTube URLs', () => {
    const validUrls = [
      'https://www.youtube.com/watch?v=abcdefghijk',
      'http://youtube.com/watch?v=abcdefghijk',
      'https://youtu.be/abcdefghijk',
      'www.youtube.com/watch?v=abcdefghijk',
      'youtube.com/watch?v=abcdefghijk',
      'https://www.youtube.com/embed/abcdefghijk',
      'https://www.youtube.com/v/abcdefghijk',
    ];

    validUrls.forEach((url) => {
      expect(youtubeUrlPattern.test(url)).toBe(true);
    });
  });

  it('should not match invalid YouTube URLs', () => {
    const invalidUrls = [
      'https://www.youtube.com/',
      'https://www.youtube.com/watch',
      'https://www.youtube.com/watch?v=',
      'https://youtu.be/',
      'https://www.google.com/',
      'https://www.youtube.com/watch?v=short',
      'https://www.youtube.com/watch?v=toolongtoolongtoolong',
    ];

    invalidUrls.forEach((url) => {
      expect(youtubeUrlPattern.test(url)).toBe(false);
    });
  });

  it('should extract the video ID correctly', () => {
    const url = 'https://www.youtube.com/watch?v=abcdefghijk';
    const match = url.match(youtubeUrlPattern);
    expect(match?.[1]).toBe('abcdefghijk');
  });
});