import { render, screen } from '@testing-library/react';
import App from '../App';

test('renders Kindnest landing page', () => {
  render(<App />);
  expect(screen.getByText(/kindnest/i)).toBeInTheDocument();
});
