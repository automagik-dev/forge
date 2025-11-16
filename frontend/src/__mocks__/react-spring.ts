import { vi } from 'vitest';

export const useSpring = vi.fn((config) => {
  const getValue = () => (typeof config === 'function' ? config() : config);
  const values = getValue();

  // Create animated values with 'to' method for transform chains
  const animatedValue = {
    get: vi.fn(() => 0),
    to: vi.fn((fn) => (typeof fn === 'function' ? fn(0) : 0)),
  };

  const result: any = {};
  Object.keys(values).forEach(key => {
    result[key] = animatedValue;
  });

  return [
    result,
    {
      start: vi.fn((newValues) => {
        Object.assign(result, newValues);
      }),
      stop: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
    },
  ];
});

export const animated = {
  div: 'div',
  button: 'button',
  span: 'span',
  input: 'input',
  textarea: 'textarea',
  select: 'select',
  form: 'form',
  p: 'p',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  section: 'section',
  article: 'article',
  nav: 'nav',
  header: 'header',
  footer: 'footer',
  main: 'main',
  aside: 'aside',
};

export const config = {
  default: { tension: 170, friction: 26 },
  gentle: { tension: 120, friction: 14 },
  wobbly: { tension: 180, friction: 12 },
  stiff: { tension: 210, friction: 20 },
  slow: { tension: 280, friction: 60 },
  molasses: { tension: 280, friction: 120 },
};
