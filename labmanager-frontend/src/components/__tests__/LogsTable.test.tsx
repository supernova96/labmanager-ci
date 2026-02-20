
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LogsTable from '../LogsTable';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../services/api';

// Mock the API module
vi.mock('../../services/api');

const mockLogs = [
    {
        id: 1,
        timestamp: '2023-10-27T10:00:00',
        level: 'INFO',
        category: 'AUTH',
        message: 'User login successful',
        username: 'admin'
    },
    {
        id: 2,
        timestamp: '2023-10-27T10:05:00',
        level: 'WARN',
        category: 'SYSTEM',
        message: 'High memory usage',
        username: 'system'
    },
    {
        id: 3,
        timestamp: '2023-10-27T10:10:00',
        level: 'ERROR',
        category: 'DB',
        message: 'Connection failed',
        username: 'system'
    }
];

describe('LogsTable', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // 1. Initial Render (Loading State) - Hard to catch with async wait, but we can check if fetch is called
    it('calls api to fetch logs on mount', async () => {
        (api.get as any).mockResolvedValue({ data: [] });
        render(<LogsTable />);
        expect(api.get).toHaveBeenCalledWith('/logs');
    });

    // 2. Render Logs List
    it('renders logs list successfully', async () => {
        (api.get as any).mockResolvedValue({ data: mockLogs });
        render(<LogsTable />);

        await waitFor(() => {
            expect(screen.getByText('User login successful')).toBeInTheDocument();
            expect(screen.getByText('High memory usage')).toBeInTheDocument();
            expect(screen.getByText('Connection failed')).toBeInTheDocument();
        });
    });

    // 3. Error Handling
    it('handles api error gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        (api.get as any).mockRejectedValue(new Error('Network error'));
        render(<LogsTable />);

        await waitFor(() => {
            expect(api.get).toHaveBeenCalled();
        });
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    // 4. Filter by Message
    it('filters logs by message', async () => {
        (api.get as any).mockResolvedValue({ data: mockLogs });
        render(<LogsTable />);

        await waitFor(() => screen.getByText('User login successful'));

        const searchInput = screen.getByPlaceholderText('Buscar logs...');
        fireEvent.change(searchInput, { target: { value: 'memory' } });

        expect(screen.queryByText('User login successful')).not.toBeInTheDocument();
        expect(screen.getByText('High memory usage')).toBeInTheDocument();
    });

    // 5. Filter by Username
    it('filters logs by username', async () => {
        (api.get as any).mockResolvedValue({ data: mockLogs });
        render(<LogsTable />);

        await waitFor(() => screen.getByText('User login successful'));

        const searchInput = screen.getByPlaceholderText('Buscar logs...');
        fireEvent.change(searchInput, { target: { value: 'admin' } });

        expect(screen.getByText('User login successful')).toBeInTheDocument();
        expect(screen.queryByText('High memory usage')).not.toBeInTheDocument();
    });

    // 6. Filter by Category
    it('filters logs by category', async () => {
        (api.get as any).mockResolvedValue({ data: mockLogs });
        render(<LogsTable />);

        await waitFor(() => screen.getByText('User login successful'));

        const searchInput = screen.getByPlaceholderText('Buscar logs...');
        fireEvent.change(searchInput, { target: { value: 'DB' } });

        expect(screen.getByText('Connection failed')).toBeInTheDocument();
        expect(screen.queryByText('User login successful')).not.toBeInTheDocument();
    });

    // 7. Refresh Button
    it('reloads logs when refresh button is clicked', async () => {
        (api.get as any).mockResolvedValue({ data: mockLogs });
        render(<LogsTable />);

        await waitFor(() => screen.getByText('User login successful'));

        const refreshButton = screen.getByTitle('Recargar');
        fireEvent.click(refreshButton);

        expect(api.get).toHaveBeenCalledTimes(2);
    });

    // 8. Empty State
    it('shows empty state message when no logs found', async () => {
        (api.get as any).mockResolvedValue({ data: [] });
        render(<LogsTable />);

        await waitFor(() => {
            expect(screen.getByText('No se encontraron registros')).toBeInTheDocument();
        });
    });

    // 9. Info Badge
    it('renders INFO badge correctly', async () => {
        (api.get as any).mockResolvedValue({ data: [mockLogs[0]] });
        render(<LogsTable />);

        await waitFor(() => {
            const badge = screen.getByText('INFO');
            expect(badge).toHaveClass('bg-green-100');
            expect(badge).toHaveClass('text-green-800');
        });
    });

    // 10. Error Badge
    it('renders ERROR badge correctly', async () => {
        (api.get as any).mockResolvedValue({ data: [mockLogs[2]] });
        render(<LogsTable />);

        await waitFor(() => {
            const badge = screen.getByText('ERROR');
            expect(badge).toHaveClass('bg-red-100');
            expect(badge).toHaveClass('text-red-800');
        });
    });

    // 11. Warn Badge
    it('renders WARN badge correctly', async () => {
        (api.get as any).mockResolvedValue({ data: [mockLogs[1]] });
        render(<LogsTable />);

        await waitFor(() => {
            const badge = screen.getByText('WARN');
            expect(badge).toHaveClass('bg-yellow-100');
            expect(badge).toHaveClass('text-yellow-800');
        });
    });
});
