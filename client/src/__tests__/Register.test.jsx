import { render, screen } from '@testing-library/react';
import Register from '../pages/Register';

test('renders register form', () => {
  render(<Register />);
  expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
});
