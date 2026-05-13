import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreatePage } from './CreatePage.js';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

describe('CreatePage', () => {
  it('T-W1 renders 2 option inputs by default', () => {
    render(<CreatePage onCreated={() => {}} />);
    expect(screen.getByLabelText('option-0')).toBeInTheDocument();
    expect(screen.getByLabelText('option-1')).toBeInTheDocument();
    expect(screen.queryByLabelText('option-2')).not.toBeInTheDocument();
  });

  it('T-W2 add-option button stops at 10', async () => {
    const user = userEvent.setup();
    render(<CreatePage onCreated={() => {}} />);
    const addBtn = screen.getByRole('button', { name: /加候选项/ });
    for (let i = 0; i < 8; i++) {
      await user.click(addBtn);
    }
    expect(screen.getByLabelText('option-9')).toBeInTheDocument();
    expect(addBtn).toBeDisabled();
  });

  it('T-W3 empty title → shows error, no fetch call', async () => {
    const user = userEvent.setup();
    render(<CreatePage onCreated={() => {}} />);
    await user.click(screen.getByRole('button', { name: /创建投票/ }));
    expect(screen.getByRole('alert')).toHaveTextContent(/标题/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('T-W4 successful submit calls onCreated with returned id', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'abc1234567' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const onCreated = vi.fn();
    const user = userEvent.setup();
    render(<CreatePage onCreated={onCreated} />);
    await user.type(screen.getByLabelText('title'), '中饭吃啥');
    await user.type(screen.getByLabelText('option-0'), '麻辣烫');
    await user.type(screen.getByLabelText('option-1'), '沙县');
    await user.click(screen.getByRole('button', { name: /创建投票/ }));

    await vi.waitFor(() => expect(onCreated).toHaveBeenCalledWith('abc1234567'));
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('T-TPL1 lunch template prefills title + 4 options', async () => {
    const user = userEvent.setup();
    render(<CreatePage onCreated={() => {}} />);
    await user.click(screen.getByLabelText('template-lunch'));
    expect((screen.getByLabelText('title') as HTMLInputElement).value).toBe('今天中饭吃啥？');
    expect((screen.getByLabelText('option-0') as HTMLInputElement).value).toBe('麻辣烫');
    expect((screen.getByLabelText('option-3') as HTMLInputElement).value).toBe('自带便当');
  });

  it('T-TPL2 travel template prefills title + 4 destinations', async () => {
    const user = userEvent.setup();
    render(<CreatePage onCreated={() => {}} />);
    await user.click(screen.getByLabelText('template-travel'));
    expect((screen.getByLabelText('title') as HTMLInputElement).value).toBe('下次团建去哪？');
    expect((screen.getByLabelText('option-0') as HTMLInputElement).value).toBe('杭州');
  });

  it('T-TPL3 template buttons are type=button (no form submit)', () => {
    render(<CreatePage onCreated={() => {}} />);
    expect(screen.getByLabelText('template-lunch')).toHaveAttribute('type', 'button');
    expect(screen.getByLabelText('template-travel')).toHaveAttribute('type', 'button');
  });

  it('T-TPL4 prefilled fields remain editable', async () => {
    const user = userEvent.setup();
    render(<CreatePage onCreated={() => {}} />);
    await user.click(screen.getByLabelText('template-lunch'));
    const titleInput = screen.getByLabelText('title') as HTMLInputElement;
    await user.clear(titleInput);
    await user.type(titleInput, '改了的标题');
    expect(titleInput.value).toBe('改了的标题');
  });
});
