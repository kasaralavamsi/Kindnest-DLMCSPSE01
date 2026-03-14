import { render, screen } from '@testing-library/react';
import TaskCard from '../components/tasks/TaskCard';

test('renders task card', () => {
  render(<TaskCard task={{ title: 'Test Task', description: 'Test Desc' }} />);
  expect(screen.getByText(/test task/i)).toBeInTheDocument();
});
