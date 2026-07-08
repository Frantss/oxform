import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowRight, Boxes, Code2, Workflow } from 'lucide-react';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  return (
    <HomeLayout {...baseOptions()}>
      <main className='mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col justify-center px-6 py-14'>
        <section className='max-w-3xl'>
          <p className='mb-4 text-sm font-medium text-fd-muted-foreground'>Framework-agnostic forms</p>
          <h1 className='mb-5 text-4xl font-semibold tracking-normal text-fd-foreground sm:text-6xl'>Oxform</h1>
          <p className='mb-8 max-w-2xl text-lg leading-8 text-fd-muted-foreground'>
            A lean form library with typed fields, validation, array helpers, and React bindings built on a small public
            surface.
          </p>
          <div className='flex flex-wrap gap-3'>
            <Link
              to='/docs/$'
              params={{ _splat: 'react' }}
              className='inline-flex items-center gap-2 rounded-md bg-fd-primary px-4 py-2 text-sm font-medium text-fd-primary-foreground'
            >
              Read the docs
              <ArrowRight className='size-4' />
            </Link>
            <Link
              to='/docs/$'
              params={{ _splat: 'react/api' }}
              className='inline-flex items-center gap-2 rounded-md border border-fd-border px-4 py-2 text-sm font-medium text-fd-foreground'
            >
              API reference
            </Link>
          </div>
        </section>

        <section className='mt-14 grid gap-4 md:grid-cols-3'>
          <Feature title='Typed forms' icon={<Code2 className='size-5' />}>
            Infer field names, values, and issue levels from the form model users already define.
          </Feature>
          <Feature title='Small primitives' icon={<Workflow className='size-5' />}>
            Use core APIs directly or compose React hooks and components around your UI system.
          </Feature>
          <Feature title='Array fields' icon={<Boxes className='size-5' />}>
            Manage ordered, nested collections without losing field status or validation state.
          </Feature>
        </section>
      </main>
    </HomeLayout>
  );
}

function Feature({ children, icon, title }: { children: React.ReactNode; icon: React.ReactNode; title: string }) {
  return (
    <article className='rounded-lg border border-fd-border bg-fd-card p-5'>
      <div className='mb-4 text-fd-muted-foreground'>{icon}</div>
      <h2 className='mb-2 text-base font-semibold text-fd-foreground'>{title}</h2>
      <p className='text-sm leading-6 text-fd-muted-foreground'>{children}</p>
    </article>
  );
}
