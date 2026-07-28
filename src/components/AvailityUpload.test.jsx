import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import AvailityUpload from './AvailityUpload';

afterEach(() => {
  cleanup();
});

describe('AvailityUpload button disabled state', () => {
  it('is disabled when ediContent is null', () => {
    render(<AvailityUpload ediContent={null} />);
    expect(screen.getByText('Upload to Availity')).toBeDisabled();
  });

  it('is disabled when ediContent is undefined', () => {
    render(<AvailityUpload ediContent={undefined} />);
    expect(screen.getByText('Upload to Availity')).toBeDisabled();
  });

  it('is disabled when ediContent is an empty string', () => {
    render(<AvailityUpload ediContent="" />);
    expect(screen.getByText('Upload to Availity')).toBeDisabled();
  });

  it('is enabled when ediContent has actual EDI content', () => {
    render(<AvailityUpload ediContent="ISA*00*...~" />);
    expect(screen.getByText('Upload to Availity')).not.toBeDisabled();
  });
});