import fs from 'fs';
import path from 'path';

const getPublicRoutes = (): string[] => {
  const publicDir = path.join(process.cwd(), 'src/app/(public)');

  try {
    const entries = fs.readdirSync(publicDir, { withFileTypes: true });

    return entries.filter((entry) => entry.isDirectory()).map((entry) => `/${entry.name}`);
  } catch {
    return ['/login', '/register', '/verify-email'];
  }
};

export const isPublicRoute = (pathname: string): boolean => {
  const publicRoutes = getPublicRoutes();

  console.log(publicRoutes);

  return publicRoutes.some((route) => pathname.startsWith(route));
};
