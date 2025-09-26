import { format, parseISO } from 'date-fns';
import {
  TMDBMovie,
  TMDBTVShow,
  TMDBPerson,
  TMDBImageSize,
  TMDBGenre,
  TMDBImageConfig,
} from '@/types/tmdb';

export class TMDBUtils {
  /**
   * Build image URL with specified size
   */
  static buildImageUrl(path: string | null, size: TMDBImageSize = 'w500'): string | null {
    if (!path) return null;

    const baseUrl = 'https://image.tmdb.org/t/p';
    return `${baseUrl}/${size}${path}`;
  }

  /**
   * Build poster URL with specified size
   */
  static buildPosterUrl(path: string | null, size: TMDBImageSize = 'w500'): string | null {
    return this.buildImageUrl(path, size);
  }

  /**
   * Build backdrop URL with specified size
   */
  static buildBackdropUrl(path: string | null, size: TMDBImageSize = 'w780'): string | null {
    return this.buildImageUrl(path, size);
  }

  /**
   * Build profile (actor) image URL with specified size
   */
  static buildProfileUrl(path: string | null, size: TMDBImageSize = 'w185'): string | null {
    return this.buildImageUrl(path, size);
  }

  /**
   * Build logo URL with specified size
   */
  static buildLogoUrl(path: string | null, size: TMDBImageSize = 'w500'): string | null {
    return this.buildImageUrl(path, size);
  }

  /**
   * Build still image URL with specified size
   */
  static buildStillUrl(path: string | null, size: TMDBImageSize = 'w500'): string | null {
    return this.buildImageUrl(path, size);
  }

  /**
   * Format release date for display
   */
  static formatReleaseDate(dateString: string | null, formatString: string = 'MMM d, yyyy'): string | null {
    if (!dateString) return null;

    try {
      const date = parseISO(dateString);
      return format(date, formatString);
    } catch {
      return dateString;
    }
  }

  /**
   * Format runtime from minutes to hours and minutes
   */
  static formatRuntime(minutes: number | null): string | null {
    if (!minutes) return null;

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
      return `${mins}m`;
    }

    if (mins === 0) {
      return `${hours}h`;
    }

    return `${hours}h ${mins}m`;
  }

  /**
   * Format vote average as percentage
   */
  static formatVoteAverage(voteAverage: number): string {
    return `${Math.round(voteAverage * 10)}%`;
  }

  /**
   * Format vote average with decimal places
   */
  static formatVoteAverageDecimal(voteAverage: number, decimals: number = 1): string {
    return voteAverage.toFixed(decimals);
  }

  /**
   * Format large numbers with commas
   */
  static formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(num);
  }

  /**
   * Format currency amount
   */
  static formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  }

  /**
   * Get genre names from genre IDs
   */
  static getGenreNames(genreIds: number[], genres: TMDBGenre[]): string[] {
    return genreIds.map(id => {
      const genre = genres.find(g => g.id === id);
      return genre ? genre.name : 'Unknown';
    });
  }

  /**
   * Get genre IDs from genre names
   */
  static getGenreIds(genreNames: string[], genres: TMDBGenre[]): number[] {
    return genreNames.map(name => {
      const genre = genres.find(g => g.name.toLowerCase() === name.toLowerCase());
      return genre ? genre.id : 0;
    }).filter(id => id > 0);
  }

  /**
   * Truncate text to specified length
   */
  static truncateText(text: string, maxLength: number, suffix: string = '...'): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
  }

  /**
   * Get YouTube video URL from video key
   */
  static getYouTubeUrl(key: string): string {
    return `https://www.youtube.com/watch?v=${key}`;
  }

  /**
   * Get YouTube thumbnail URL from video key
   */
  static getYouTubeThumbnail(key: string, quality: 'default' | 'mqdefault' | 'hqdefault' | 'sddefault' | 'maxresdefault' = 'hqdefault'): string {
    return `https://img.youtube.com/vi/${key}/${quality}.jpg`;
  }

  /**
   * Check if a movie/TV show is for adults only
   */
  static isAdultContent(adult: boolean): boolean {
    return adult;
  }

  /**
   * Get media type display name
   */
  static getMediaTypeDisplayName(mediaType: 'movie' | 'tv' | 'person'): string {
    switch (mediaType) {
      case 'movie':
        return 'Movie';
      case 'tv':
        return 'TV Show';
      case 'person':
        return 'Person';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get status display name for movies/TV shows
   */
  static getStatusDisplayName(status: string): string {
    switch (status.toLowerCase()) {
      case 'released':
        return 'Released';
      case 'in production':
        return 'In Production';
      case 'post production':
        return 'Post Production';
      case 'planned':
        return 'Planned';
      case 'canceled':
        return 'Canceled';
      case 'returning series':
        return 'Returning Series';
      case 'pilot':
        return 'Pilot';
      case 'ended':
        return 'Ended';
      default:
        return status;
    }
  }

  /**
   * Get age rating display name
   */
  static getAgeRating(rating: string): string {
    switch (rating) {
      case 'G':
        return 'General Audience';
      case 'PG':
        return 'Parental Guidance';
      case 'PG-13':
        return 'Parents Strongly Cautioned';
      case 'R':
        return 'Restricted';
      case 'NC-17':
        return 'Adults Only';
      case 'TV-Y':
        return 'All Children';
      case 'TV-Y7':
        return 'Children 7+';
      case 'TV-G':
        return 'General Audience';
      case 'TV-PG':
        return 'Parental Guidance';
      case 'TV-14':
        return 'Parents Strongly Cautioned';
      case 'TV-MA':
        return 'Mature Audience';
      default:
        return rating;
    }
  }

  /**
   * Calculate age from birth date
   */
  static calculateAge(birthDate: string | null): number | null {
    if (!birthDate) return null;

    try {
      const birth = parseISO(birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }

      return age;
    } catch {
      return null;
    }
  }

  /**
   * Get person's age at death or current age
   */
  static getPersonAge(birthDate: string | null, deathDate: string | null): string | null {
    if (!birthDate) return null;

    const age = this.calculateAge(birthDate);
    if (!age) return null;

    if (deathDate) {
      const deathAge = this.calculateAge(deathDate);
      if (deathAge) {
        return `${deathAge} (deceased)`;
      }
    }

    return `${age}`;
  }

  /**
   * Get department display name
   */
  static getDepartmentDisplayName(department: string): string {
    switch (department.toLowerCase()) {
      case 'directing':
        return 'Directing';
      case 'production':
        return 'Production';
      case 'writing':
        return 'Writing';
      case 'camera':
        return 'Camera';
      case 'editing':
        return 'Editing';
      case 'sound':
        return 'Sound';
      case 'art':
        return 'Art';
      case 'costume & make-up':
        return 'Costume & Make-up';
      case 'visual effects':
        return 'Visual Effects';
      case 'lighting':
        return 'Lighting';
      case 'crew':
        return 'Crew';
      case 'acting':
        return 'Acting';
      default:
        return department;
    }
  }

  /**
   * Get job display name
   */
  static getJobDisplayName(job: string): string {
    switch (job.toLowerCase()) {
      case 'director':
        return 'Director';
      case 'producer':
        return 'Producer';
      case 'writer':
        return 'Writer';
      case 'screenplay':
        return 'Screenplay';
      case 'story':
        return 'Story';
      case 'cinematographer':
        return 'Cinematographer';
      case 'editor':
        return 'Editor';
      case 'composer':
        return 'Composer';
      case 'production design':
        return 'Production Design';
      case 'costume design':
        return 'Costume Design';
      case 'makeup artist':
        return 'Makeup Artist';
      case 'visual effects supervisor':
        return 'Visual Effects Supervisor';
      case 'actor':
        return 'Actor';
      case 'actress':
        return 'Actress';
      default:
        return job;
    }
  }

  /**
   * Get video type display name
   */
  static getVideoTypeDisplayName(type: string): string {
    switch (type.toLowerCase()) {
      case 'trailer':
        return 'Trailer';
      case 'teaser':
        return 'Teaser';
      case 'clip':
        return 'Clip';
      case 'behind the scenes':
        return 'Behind the Scenes';
      case 'bloopers':
        return 'Bloopers';
      case 'featurette':
        return 'Featurette';
      default:
        return type;
    }
  }

  /**
   * Check if a date is in the future
   */
  static isFutureDate(dateString: string): boolean {
    try {
      const date = parseISO(dateString);
      return date > new Date();
    } catch {
      return false;
    }
  }

  /**
   * Check if a date is in the past
   */
  static isPastDate(dateString: string): boolean {
    try {
      const date = parseISO(dateString);
      return date < new Date();
    } catch {
      return false;
    }
  }

  /**
   * Get relative time string (e.g., "2 days ago", "in 3 weeks")
   */
  static getRelativeTime(dateString: string): string {
    try {
      const date = parseISO(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      const intervals = [
        { label: 'year', seconds: 31536000 },
        { label: 'month', seconds: 2592000 },
        { label: 'week', seconds: 604800 },
        { label: 'day', seconds: 86400 },
        { label: 'hour', seconds: 3600 },
        { label: 'minute', seconds: 60 },
        { label: 'second', seconds: 1 },
      ];

      for (const interval of intervals) {
        const count = Math.floor(diffInSeconds / interval.seconds);
        if (count >= 1) {
          return count === 1
            ? `1 ${interval.label} ago`
            : `${count} ${interval.label}s ago`;
        }
      }

      return 'just now';
    } catch {
      return dateString;
    }
  }

  /**
   * Validate TMDB image configuration
   */
  static validateImageConfig(config: TMDBImageConfig): boolean {
    return !!(
      config.base_url &&
      config.secure_base_url &&
      config.backdrop_sizes.length > 0 &&
      config.poster_sizes.length > 0 &&
      config.profile_sizes.length > 0
    );
  }

  /**
   * Get available image sizes for a specific type
   */
  static getAvailableImageSizes(config: TMDBImageConfig, type: 'poster' | 'backdrop' | 'profile' | 'logo' | 'still'): string[] {
    switch (type) {
      case 'poster':
        return config.poster_sizes;
      case 'backdrop':
        return config.backdrop_sizes;
      case 'profile':
        return config.profile_sizes;
      case 'logo':
        return config.logo_sizes;
      case 'still':
        return config.still_sizes;
      default:
        return config.poster_sizes;
    }
  }

  /**
   * Get the best available image size for a given width
   */
  static getBestImageSize(availableSizes: string[], targetWidth: number): string {
    // Filter out 'original' and convert sizes to numbers
    const numericSizes = availableSizes
      .filter(size => size !== 'original')
      .map(size => parseInt(size.substring(1))) // Remove 'w' prefix
      .sort((a, b) => a - b);

    // Find the smallest size that's >= target width
    const bestSize = numericSizes.find(size => size >= targetWidth);

    if (bestSize) {
      return `w${bestSize}`;
    }

    // If no size is large enough, return the largest available
    const largestSize = numericSizes[numericSizes.length - 1];
    return largestSize ? `w${largestSize}` : 'original';
  }
}

// Export singleton instance
export const tmdbUtils = new TMDBUtils();