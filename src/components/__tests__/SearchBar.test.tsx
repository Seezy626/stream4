import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from '../SearchBar';

/// <reference types="@testing-library/jest-dom" />

const user = userEvent.setup();

describe('SearchBar', () => {
  const mockOnSearch = jest.fn();

  beforeEach(() => {
    mockOnSearch.mockClear();
  });

  it('renders with default placeholder', () => {
    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText('Search for movies...');
    expect(input).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    const customPlaceholder = 'Search for TV shows...';
    render(<SearchBar onSearch={mockOnSearch} placeholder={customPlaceholder} />);

    const input = screen.getByPlaceholderText(customPlaceholder);
    expect(input).toBeInTheDocument();
  });

  it('renders search button', () => {
    render(<SearchBar onSearch={mockOnSearch} />);

    const searchButton = screen.getByRole('button', { name: /search/i });
    expect(searchButton).toBeInTheDocument();
    expect(searchButton).toHaveTextContent('Search');
  });

  it('shows responsive button text', () => {
    render(<SearchBar onSearch={mockOnSearch} />);

    const searchButton = screen.getByRole('button', { name: /search/i });

    // On larger screens, should show "Search"
    expect(searchButton).toHaveTextContent('Search');

    // On smaller screens, should show "Go" (this would be tested with CSS media queries)
    // For unit tests, we test the structure
    expect(screen.getByText('Go')).toBeInTheDocument();
  });

  it('calls onSearch when form is submitted', async () => {
    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText('Search for movies...');
    const searchButton = screen.getByRole('button', { name: /search/i });

    await user.type(input, 'test query');
    await user.click(searchButton);

    expect(mockOnSearch).toHaveBeenCalledWith('test query');
    expect(mockOnSearch).toHaveBeenCalledTimes(1);
  });

  it('calls onSearch when form is submitted with Enter key', async () => {
    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText('Search for movies...');

    await user.type(input, 'test query{enter}');

    expect(mockOnSearch).toHaveBeenCalledWith('test query');
    expect(mockOnSearch).toHaveBeenCalledTimes(1);
  });

  it('trims whitespace from search query', async () => {
    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText('Search for movies...');
    const searchButton = screen.getByRole('button', { name: /search/i });

    await user.type(input, '  test query  ');
    await user.click(searchButton);

    expect(mockOnSearch).toHaveBeenCalledWith('test query');
  });

  it('does not call onSearch when query is empty', async () => {
    render(<SearchBar onSearch={mockOnSearch} />);

    const searchButton = screen.getByRole('button', { name: /search/i });
    await user.click(searchButton);

    expect(mockOnSearch).not.toHaveBeenCalled();
  });

  it('does not call onSearch when query is only whitespace', async () => {
    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText('Search for movies...');
    const searchButton = screen.getByRole('button', { name: /search/i });

    await user.type(input, '   ');
    await user.click(searchButton);

    expect(mockOnSearch).not.toHaveBeenCalled();
  });

  it('disables search button when query is empty', () => {
    render(<SearchBar onSearch={mockOnSearch} />);

    const searchButton = screen.getByRole('button', { name: /search/i });
    expect(searchButton).toBeDisabled();
  });

  it('enables search button when query has content', async () => {
    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText('Search for movies...');
    const searchButton = screen.getByRole('button', { name: /search/i });

    await user.type(input, 'test');

    expect(searchButton).not.toBeDisabled();
  });

  it('shows clear button when there is query text', async () => {
    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText('Search for movies...');

    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();

    await user.type(input, 'test query');

    const clearButton = screen.getByLabelText('Clear search');
    expect(clearButton).toBeInTheDocument();
  });

  it('clears query when clear button is clicked', async () => {
    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText('Search for movies...');

    await user.type(input, 'test query');
    expect(input).toHaveValue('test query');

    const clearButton = screen.getByLabelText('Clear search');
    await user.click(clearButton);

    expect(input).toHaveValue('');
    expect(clearButton).not.toBeInTheDocument();
  });

  it('handles focus and blur states', async () => {
    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText('Search for movies...');

    // Focus state
    await user.click(input);
    expect(input).toHaveClass('ring-2', 'ring-primary/20');

    // Blur state
    await user.click(document.body);
    expect(input).not.toHaveClass('ring-2', 'ring-primary/20');
  });

  it('applies custom className', () => {
    render(<SearchBar onSearch={mockOnSearch} className="custom-class" />);

    const form = screen.getByRole('textbox').closest('form');
    expect(form).toHaveClass('custom-class');
  });

  it('has proper accessibility attributes', () => {
    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByLabelText('Search for movies');
    expect(input).toBeInTheDocument();

    const searchButton = screen.getByRole('button', { name: /search/i });
    expect(searchButton).toBeInTheDocument();

    const clearButton = screen.queryByLabelText('Clear search');
    expect(clearButton).not.toBeInTheDocument(); // Should not exist initially when there's no text
  });

  it('handles rapid typing and clearing', async () => {
    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText('Search for movies...');

    // Type rapidly
    await user.type(input, 'rapid typing test');

    expect(input).toHaveValue('rapid typing test');

    // Clear rapidly
    const clearButton = screen.getByLabelText('Clear search');
    await user.click(clearButton);

    expect(input).toHaveValue('');
    expect(clearButton).not.toBeInTheDocument();
  });

  it('maintains search button disabled state after clearing', async () => {
    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText('Search for movies...');
    const searchButton = screen.getByRole('button', { name: /search/i });

    await user.type(input, 'test');
    expect(searchButton).not.toBeDisabled();

    const clearButton = screen.getByLabelText('Clear search');
    await user.click(clearButton);
    expect(searchButton).toBeDisabled();
  });
});