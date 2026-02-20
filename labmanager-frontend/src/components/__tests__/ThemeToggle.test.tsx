import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ThemeToggle from '../ThemeToggle';
import { ThemeProvider } from '../../context/ThemeContext';
import { describe, it, expect } from 'vitest';

// Helper to render with context
const renderWithTheme = (component: React.ReactNode) => {
    return render(
        <ThemeProvider>
            {component}
        </ThemeProvider>
    );
};

describe('ThemeToggle', () => {
    it('renders the toggle button', () => {
        renderWithTheme(<ThemeToggle />);
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
    });

    it('toggles theme on click', () => {
        renderWithTheme(<ThemeToggle />);
        const button = screen.getByRole('button');

        // Check initial state (default is dark, shows Sun icon)
        expect(button).toHaveAttribute('title', 'Cambiar a Modo Claro');

        // Click to toggle
        fireEvent.click(button);

        // Check new state (should be light, showing Moon icon)
        expect(button).toHaveAttribute('title', 'Cambiar a Modo Oscuro');

        // Click back
        fireEvent.click(button);
        expect(button).toHaveAttribute('title', 'Cambiar a Modo Claro');
    });
});
