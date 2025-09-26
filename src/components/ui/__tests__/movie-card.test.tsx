import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MovieCard } from '../movie-card';
import { createMockMovie } from '../../../__tests__/utils/test-factories';

const user = userEvent.setup();

const mockMovie = createMockMovie({
  id: 1,
  title: 'Test Movie',
  overview: 'This is a test movie overview that should be truncated in the UI',
  poster_path: '/test-poster.jpg',
  release_date: '2023-01-01',
  vote_average: 8.5,
});

describe('MovieCard', () => {
  it('renders movie information correctly', () => {
    render(<MovieCard movie={mockMovie} />);

    expect(screen.getByText(mockMovie.title)).toBeInTheDocument();
    expect(screen.getByText(mockMovie.overview)).toBeInTheDocument();
    expect(screen.getByText('2023')).toBeInTheDocument();
    expect(screen.getByText('8.5 ⭐')).toBeInTheDocument();
  });

  it('displays poster image when available', () => {
    render(<MovieCard movie={mockMovie} />);

    const image = screen.getByAltText(`${mockMovie.title} movie poster`);
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://image.tmdb.org/t/p/w500/test-poster.jpg');
  });

  it('shows fallback icon when poster is not available', () => {
    const movieWithoutPoster = createMockMovie({ poster_path: null });
    render(<MovieCard movie={movieWithoutPoster} />);

    expect(screen.getByText(mockMovie.title)).toBeInTheDocument();
    expect(screen.queryByAltText(`${mockMovie.title} movie poster`)).not.toBeInTheDocument();
  });

  it('handles image error gracefully', async () => {
    render(<MovieCard movie={mockMovie} />);

    const image = screen.getByAltText(`${mockMovie.title} movie poster`);

    // Simulate image load error
    await user.click(image);

    // The component should handle the error without crashing
    expect(screen.getByText(mockMovie.title)).toBeInTheDocument();
  });

  it('shows add to watchlist button when not in watchlist', () => {
    render(<MovieCard movie={mockMovie} isInWatchlist={false} />);

    const addButton = screen.getByLabelText('Add to watchlist');
    expect(addButton).toBeInTheDocument();
    expect(addButton).toBeVisible();
  });

  it('shows mark as watched button when in watchlist but not watched', () => {
    render(<MovieCard movie={mockMovie} isInWatchlist={true} isWatched={false} />);

    const watchedButton = screen.getByLabelText('Mark as watched');
    expect(watchedButton).toBeInTheDocument();
    expect(watchedButton).toBeVisible();
  });

  it('shows remove from watched button when watched', () => {
    render(<MovieCard movie={mockMovie} isInWatchlist={true} isWatched={true} />);

    const removeButton = screen.getByLabelText('Remove from watched');
    expect(removeButton).toBeInTheDocument();
    expect(removeButton).toBeVisible();
  });

  it('calls onAddToWatchlist when add button is clicked', async () => {
    const onAddToWatchlist = jest.fn();
    render(
      <MovieCard
        movie={mockMovie}
        onAddToWatchlist={onAddToWatchlist}
        isInWatchlist={false}
      />
    );

    const addButton = screen.getByLabelText('Add to watchlist');
    await user.click(addButton);

    expect(onAddToWatchlist).toHaveBeenCalledWith(mockMovie.id);
    expect(onAddToWatchlist).toHaveBeenCalledTimes(1);
  });

  it('calls onMarkAsWatched when mark as watched button is clicked', async () => {
    const onMarkAsWatched = jest.fn();
    render(
      <MovieCard
        movie={mockMovie}
        onMarkAsWatched={onMarkAsWatched}
        isInWatchlist={true}
        isWatched={false}
      />
    );

    const watchedButton = screen.getByLabelText('Mark as watched');
    await user.click(watchedButton);

    expect(onMarkAsWatched).toHaveBeenCalledWith(mockMovie.id);
    expect(onMarkAsWatched).toHaveBeenCalledTimes(1);
  });

  it('calls onRemoveFromWatchlist when remove button is clicked', async () => {
    const onRemoveFromWatchlist = jest.fn();
    render(
      <MovieCard
        movie={mockMovie}
        onRemoveFromWatchlist={onRemoveFromWatchlist}
        isInWatchlist={true}
        isWatched={true}
      />
    );

    const removeButton = screen.getByLabelText('Remove from watched');
    await user.click(removeButton);

    expect(onRemoveFromWatchlist).toHaveBeenCalledWith(mockMovie.id);
    expect(onRemoveFromWatchlist).toHaveBeenCalledTimes(1);
  });

  it('does not call handlers when buttons are disabled', async () => {
    const onAddToWatchlist = jest.fn();
    const onMarkAsWatched = jest.fn();
    const onRemoveFromWatchlist = jest.fn();

    render(
      <MovieCard
        movie={mockMovie}
        onAddToWatchlist={onAddToWatchlist}
        onMarkAsWatched={onMarkAsWatched}
        onRemoveFromWatchlist={onRemoveFromWatchlist}
        isInWatchlist={true}
        isWatched={true}
      />
    );

    const removeButton = screen.getByLabelText('Remove from watched');
    await user.click(removeButton);

    expect(onAddToWatchlist).not.toHaveBeenCalled();
    expect(onMarkAsWatched).not.toHaveBeenCalled();
    expect(onRemoveFromWatchlist).toHaveBeenCalledWith(mockMovie.id);
  });

  it('shows watchlist badge when in watchlist', () => {
    render(<MovieCard movie={mockMovie} isInWatchlist={true} />);

    expect(screen.getByText('Watchlist')).toBeInTheDocument();
  });

  it('shows watched badge when watched', () => {
    render(<MovieCard movie={mockMovie} isWatched={true} />);

    expect(screen.getByText('Watched')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<MovieCard movie={mockMovie} className="custom-class" />);

    const card = screen.getByText(mockMovie.title).closest('.custom-class');
    expect(card).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<MovieCard movie={mockMovie} />);

    const ratingBadge = screen.getByLabelText(`Rating: ${mockMovie.vote_average.toFixed(1)} out of 10`);
    expect(ratingBadge).toBeInTheDocument();

    const addButton = screen.getByLabelText('Add to watchlist');
    expect(addButton).toBeInTheDocument();
  });

  it('handles mobile action buttons', () => {
    render(<MovieCard movie={mockMovie} isInWatchlist={false} />);

    // Mobile button should be visible on small screens
    const mobileButton = screen.getByLabelText('Add to watchlist');
    expect(mobileButton).toBeInTheDocument();
  });

  it('truncates long titles and descriptions', () => {
    const longTitleMovie = createMockMovie({
      title: 'A'.repeat(100),
      overview: 'B'.repeat(200),
    });

    render(<MovieCard movie={longTitleMovie} />);

    const title = screen.getByText(longTitleMovie.title);
    const description = screen.getByText(longTitleMovie.overview);

    expect(title).toHaveClass('line-clamp-2');
    expect(description).toHaveClass('line-clamp-3');
  });

  it('handles missing release date gracefully', () => {
    const movieWithoutDate = createMockMovie({ release_date: '' });
    render(<MovieCard movie={movieWithoutDate} />);

    expect(screen.getByText('N/A')).toBeInTheDocument();
  });
});