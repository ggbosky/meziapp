import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});

// jsdom neimplementuje posun stránky; aplikace ho volá při změně trasy.
window.scrollTo = () => {};
