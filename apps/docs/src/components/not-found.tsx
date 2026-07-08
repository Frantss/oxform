import { Link } from '@tanstack/react-router';

export function NotFound() {
  return (
    <main className='mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-16'>
      <p className='mb-3 text-sm font-medium text-fd-muted-foreground'>404</p>
      <h1 className='mb-4 text-3xl font-semibold tracking-normal text-fd-foreground'>Page not found</h1>
      <p className='mb-8 text-fd-muted-foreground'>The documentation page you requested does not exist yet.</p>
      <Link
        to='/docs/$'
        params={{ _splat: 'react' }}
        className='w-fit rounded-md bg-fd-primary px-4 py-2 text-sm font-medium text-fd-primary-foreground'
      >
        Open docs
      </Link>
    </main>
  );
}
