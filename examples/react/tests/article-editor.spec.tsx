import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { ArticleEditor } from '../src/examples/article-editor';
import { setup } from './setup';

const article = { title: 'Notes', body: 'First text.' };

describe('ArticleEditor', () => {
  it('advises on a long title, and still publishes it', async () => {
    await using screen = await setup(<ArticleEditor article={article} />);
    await userEvent.fill(screen.getByRole('textbox', { name: 'Title' }), 'Notes on the analytical engine, and on what it could compute one day');
    await expect.element(screen.getByText('Search results cut a title over 60 characters.')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Publish' }));

    await expect.element(screen.getByText('Unsaved changes')).not.toBeInTheDocument();
  });

  it('shows unsaved changes, and discards to the last published text', async () => {
    await using screen = await setup(<ArticleEditor article={article} />);
    const body = screen.getByRole('textbox', { name: 'Body' });
    await userEvent.fill(body, 'Published text.');
    await expect.element(screen.getByText('Unsaved changes')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Publish' }));
    await expect.element(screen.getByText('Unsaved changes')).not.toBeInTheDocument();
    await userEvent.fill(body, 'Edited after publishing.');
    await userEvent.click(screen.getByRole('button', { name: 'Discard' }));

    await expect.element(body).toHaveValue('Published text.');
  });

  it('saves a draft once the writer stops typing', async () => {
    await using screen = await setup(<ArticleEditor article={article} />);
    await userEvent.fill(screen.getByRole('textbox', { name: 'Body' }), 'A draft.');
    await expect.element(screen.getByRole('status')).toHaveTextContent('Draft not saved');

    await expect.element(screen.getByRole('status'), { timeout: 3000 }).toHaveTextContent('Draft saved');
  });
});
