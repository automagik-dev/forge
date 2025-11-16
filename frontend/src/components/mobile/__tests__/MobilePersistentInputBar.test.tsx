import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MobilePersistentInputBar } from '../MobilePersistentInputBar';

// Mock dependencies
vi.mock('@capacitor/haptics');
vi.mock('@/lib/platform', () => ({
  Platform: {
    isNative: vi.fn(() => false),
  },
}));

describe('MobilePersistentInputBar', () => {
  const mockOnChange = vi.fn();
  const mockOnSend = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default props', () => {
    render(
      <MobilePersistentInputBar
        value=""
        onChange={mockOnChange}
        onSend={mockOnSend}
      />
    );

    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
    expect(screen.getByLabelText('Start voice input')).toBeInTheDocument();
    expect(screen.getByLabelText('Send message')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(
      <MobilePersistentInputBar
        value=""
        onChange={mockOnChange}
        onSend={mockOnSend}
        placeholder="Custom placeholder"
      />
    );

    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
  });

  it('calls onChange when text is entered', async () => {
    const user = userEvent.setup();
    render(
      <MobilePersistentInputBar
        value=""
        onChange={mockOnChange}
        onSend={mockOnSend}
      />
    );

    const textarea = screen.getByPlaceholderText('Type a message...');
    await user.type(textarea, 'Hello');

    expect(mockOnChange).toHaveBeenCalled();
  });

  it('calls onSend when send button is clicked with non-empty value', () => {
    render(
      <MobilePersistentInputBar
        value="Hello"
        onChange={mockOnChange}
        onSend={mockOnSend}
      />
    );

    const sendButton = screen.getByLabelText('Send message');
    fireEvent.click(sendButton);

    expect(mockOnSend).toHaveBeenCalledTimes(1);
  });

  it('does not call onSend when send button is clicked with empty value', () => {
    render(
      <MobilePersistentInputBar
        value=""
        onChange={mockOnChange}
        onSend={mockOnSend}
      />
    );

    const sendButton = screen.getByLabelText('Send message');
    fireEvent.click(sendButton);

    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('calls onSend when Enter key is pressed', async () => {
    const user = userEvent.setup();
    render(
      <MobilePersistentInputBar
        value="Hello"
        onChange={mockOnChange}
        onSend={mockOnSend}
      />
    );

    const textarea = screen.getByPlaceholderText('Type a message...');
    await user.click(textarea);
    await user.keyboard('{Enter}');

    expect(mockOnSend).toHaveBeenCalled();
  });

  it('does not call onSend when Shift+Enter is pressed', async () => {
    const user = userEvent.setup();
    render(
      <MobilePersistentInputBar
        value="Hello"
        onChange={mockOnChange}
        onSend={mockOnSend}
      />
    );

    const textarea = screen.getByPlaceholderText('Type a message...');
    await user.click(textarea);
    await user.keyboard('{Shift>}{Enter}{/Shift}');

    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('disables input and buttons when disabled prop is true', () => {
    render(
      <MobilePersistentInputBar
        value="Hello"
        onChange={mockOnChange}
        onSend={mockOnSend}
        disabled={true}
      />
    );

    expect(screen.getByPlaceholderText('Type a message...')).toBeDisabled();
    expect(screen.getByLabelText('Start voice input')).toBeDisabled();
    expect(screen.getByLabelText('Send message')).toBeDisabled();
  });

  it('disables send button when isSending is true', () => {
    render(
      <MobilePersistentInputBar
        value="Hello"
        onChange={mockOnChange}
        onSend={mockOnSend}
        isSending={true}
      />
    );

    expect(screen.getByLabelText('Send message')).toBeDisabled();
  });

  it('shows loader icon when isSending is true', () => {
    const { container } = render(
      <MobilePersistentInputBar
        value="Hello"
        onChange={mockOnChange}
        onSend={mockOnSend}
        isSending={true}
      />
    );

    // Loader2 icon has animate-spin class
    const loader = container.querySelector('.animate-spin');
    expect(loader).toBeInTheDocument();
  });

  it('toggles voice recording state when voice button is clicked', () => {
    render(
      <MobilePersistentInputBar
        value=""
        onChange={mockOnChange}
        onSend={mockOnSend}
      />
    );

    const voiceButton = screen.getByLabelText('Start voice input');
    fireEvent.click(voiceButton);

    expect(screen.getByLabelText('Stop recording')).toBeInTheDocument();
    expect(screen.getByText('Recording...')).toBeInTheDocument();
  });

  it('shows recording indicator when voice recording is active', () => {
    render(
      <MobilePersistentInputBar
        value=""
        onChange={mockOnChange}
        onSend={mockOnSend}
      />
    );

    const voiceButton = screen.getByLabelText('Start voice input');
    fireEvent.click(voiceButton);

    const recordingIndicator = screen.getByText('Recording...');
    expect(recordingIndicator).toBeInTheDocument();
  });

  it('does not call onSend when value is only whitespace', () => {
    render(
      <MobilePersistentInputBar
        value="   "
        onChange={mockOnChange}
        onSend={mockOnSend}
      />
    );

    const sendButton = screen.getByLabelText('Send message');
    fireEvent.click(sendButton);

    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('enables send button when value is non-empty', () => {
    render(
      <MobilePersistentInputBar
        value="Hello"
        onChange={mockOnChange}
        onSend={mockOnSend}
      />
    );

    const sendButton = screen.getByLabelText('Send message');
    expect(sendButton).not.toBeDisabled();
  });

  it('disables send button when value is empty', () => {
    render(
      <MobilePersistentInputBar
        value=""
        onChange={mockOnChange}
        onSend={mockOnSend}
      />
    );

    const sendButton = screen.getByLabelText('Send message');
    expect(sendButton).toBeDisabled();
  });

  it('applies custom className', () => {
    const { container } = render(
      <MobilePersistentInputBar
        value=""
        onChange={mockOnChange}
        onSend={mockOnSend}
        className="custom-class"
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('disables voice button while sending', () => {
    render(
      <MobilePersistentInputBar
        value="Hello"
        onChange={mockOnChange}
        onSend={mockOnSend}
        isSending={true}
      />
    );

    const voiceButton = screen.getByLabelText('Start voice input');
    expect(voiceButton).toBeDisabled();
  });
});
