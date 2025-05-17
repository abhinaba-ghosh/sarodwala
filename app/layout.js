// app/layout.js
import { initializeDatabase } from '@/lib/initDatabase';
import './globals.css';

export const metadata = {
  title: 'RiyazTime - Sarod Classes with Dr. Rajeeb Chakraborty',
  description: 'Book personalized Sarod classes with Dr. Rajeeb Chakraborty',
};

// Initialize database on server side
if (typeof window === 'undefined') {
  initializeDatabase()
    .then((initialized) => {
      if (initialized) {
        console.log('Database initialized');
      }
    })
    .catch((error) => {
      console.error('Failed to initialize database:', error);
    });
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}