import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

// Each test starts from an empty origin so persisted state can't leak between
// cases and make failures order-dependent.
beforeEach(() => {
  localStorage.clear();
});
