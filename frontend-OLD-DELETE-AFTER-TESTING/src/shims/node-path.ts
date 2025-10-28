const normalizeSegments = (segments: string[]): string[] => {
  const parts: string[] = [];

  for (const segment of segments) {
    if (!segment || segment === '.') {
      continue;
    }
    if (segment === '..') {
      parts.pop();
      continue;
    }
    parts.push(segment);
  }

  return parts;
};

const toSegments = (input: string) => input.split(/[\\/]+/).filter(Boolean);

const join = (...segments: string[]): string => normalizeSegments(segments.flatMap(toSegments)).join('/') || '.';

const resolve = (...segments: string[]): string => {
  const resolved = normalizeSegments(segments.flatMap(toSegments));
  return `/${resolved.join('/')}`;
};

const dirname = (input: string): string => {
  const parts = toSegments(input);
  parts.pop();
  return parts.length ? `/${parts.join('/')}` : '/';
};

const basename = (input: string): string => {
  const parts = toSegments(input);
  return parts.pop() ?? '';
};

const normalize = (input: string): string => normalizeSegments(toSegments(input)).join('/') || '.';

const pathStub = {
  sep: '/',
  delimiter: ':',
  join,
  resolve,
  dirname,
  basename,
  normalize,
};

export default pathStub;
export { join, resolve, dirname, basename, normalize };
